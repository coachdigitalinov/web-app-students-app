"use server";
import { redirect } from "next/navigation";
import { createSession, destroySession, hashPassword, homeFor, verifyLogin } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { str } from "@/lib/util";

export type FormState = { error?: string } | undefined;

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const row = verifyLogin(str(f, "email").toLowerCase(), String(f.get("password") ?? ""));
  if (!row) return { error: "Invalid email or password." };
  await createSession(row.id, row.role);
  redirect(homeFor(row.role));
}

export async function register(_: FormState, f: FormData): Promise<FormState> {
  const name = str(f, "name"), email = str(f, "email").toLowerCase(), password = String(f.get("password") ?? "");
  const code = str(f, "referral").toUpperCase();
  if (!name || !email.includes("@")) return { error: "Enter your name and a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (get("SELECT 1 FROM users WHERE email = ?", email)) return { error: "That email is already registered." };
  let teacher: { id: number } | undefined;
  if (code) {
    teacher = get<{ id: number }>("SELECT id FROM users WHERE referral_code = ? AND role = 'teacher' AND active = 1", code);
    if (!teacher) return { error: "Referral code not recognised. Leave it blank if you don't have one." };
  }
  const r = run(
    "INSERT INTO users (name, email, password_hash, role, school, grade, referred_by) VALUES (?, ?, ?, 'student', ?, ?, ?)",
    name, email, hashPassword(password), str(f, "school") || null, str(f, "grade") || null, teacher?.id ?? null,
  );
  if (teacher) {
    const fee = Number(get<{ value: string }>("SELECT value FROM settings WHERE key='referral_fee'")?.value ?? 0);
    run("INSERT INTO payments (teacher_id, student_id, amount, note) VALUES (?, ?, ?, 'Referral fee')", teacher.id, r.lastInsertRowid, fee);
  }
  await createSession(Number(r.lastInsertRowid), "student");
  redirect("/student");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
