"use server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { hashPassword, requireUser } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { removeStored, saveUpload } from "@/lib/files";
import { flash, num, optional, str } from "@/lib/util";

const code = () => "T" + crypto.randomBytes(3).toString("hex").toUpperCase();
const emailTaken = (e: string) => !!get("SELECT 1 FROM users WHERE email = ?", e);

async function createUser(f: FormData, role: "student" | "teacher", back: string) {
  const name = str(f, "name"), email = str(f, "email").toLowerCase(), pw = String(f.get("password") ?? "");
  if (!name || !email.includes("@")) flash(back, "error", "Name and a valid email are required.");
  if (pw.length < 8) flash(back, "error", "Password must be at least 8 characters.");
  if (emailTaken(email)) flash(back, "error", "That email is already in use.");
  run(
    "INSERT INTO users (name, email, password_hash, role, school, grade, referral_code, referred_by) VALUES (?,?,?,?,?,?,?,?)",
    name, email, hashPassword(pw), role, optional(f, "school"), optional(f, "grade"),
    role === "teacher" ? code() : null, role === "student" ? num(f, "referred_by") || null : null,
  );
  revalidatePath(back);
  flash(back, "ok", `${role === "teacher" ? "Teacher" : "Student"} added.`);
}

export async function addStudent(f: FormData) { await requireUser("admin"); await createUser(f, "student", "/admin/students"); }
export async function addTeacher(f: FormData) { await requireUser("admin"); await createUser(f, "teacher", "/admin/teachers"); }

export async function setActive(f: FormData) {
  await requireUser("admin");
  // Sessions are stateless signed cookies, so disabling a user takes effect on
  // their next request (user lookup rejects active = 0) without needing to
  // delete any server-side session row.
  run("UPDATE users SET active = ? WHERE id = ? AND role != 'admin'", num(f, "active"), num(f, "id"));
  revalidatePath("/admin", "layout");
}

export async function resetPassword(f: FormData) {
  await requireUser("admin");
  const pw = String(f.get("password") ?? "");
  if (pw.length < 8) flash(String(f.get("back")), "error", "Password must be at least 8 characters.");
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(pw), num(f, "id"));
  flash(String(f.get("back")), "ok", "Password updated.");
}

export async function addWorksheet(f: FormData) {
  await requireUser("admin");
  const back = "/admin/worksheets";
  const file = f.get("file");
  if (!(file instanceof File) || !str(f, "title") || !str(f, "subject")) flash(back, "error", "Title, subject and a file are required.");
  let saved;
  try { saved = await saveUpload(file as File, "worksheets"); } catch (e) { flash(back, "error", (e as Error).message); }
  run("INSERT INTO worksheets (title, subject, description, grade, file_path, mime) VALUES (?,?,?,?,?,?)",
    str(f, "title"), str(f, "subject"), optional(f, "description"), optional(f, "grade"), saved.path, saved.mime);
  revalidatePath(back);
  flash(back, "ok", "Worksheet uploaded.");
}

export async function deleteWorksheet(f: FormData) {
  await requireUser("admin");
  const w = get<{ file_path: string }>("SELECT file_path FROM worksheets WHERE id = ?", num(f, "id"));
  if (w) { run("DELETE FROM worksheets WHERE id = ?", num(f, "id")); await removeStored(w.file_path); }
  revalidatePath("/admin/worksheets");
}

export async function addTest(f: FormData) {
  await requireUser("admin");
  const back = "/admin/tests";
  const file = f.get("file");
  const total = num(f, "total_marks"), mins = num(f, "duration_minutes");
  if (!(file instanceof File) || !str(f, "title") || !str(f, "subject")) flash(back, "error", "Title, subject and the question paper are required.");
  if (!(total > 0) || !(mins > 0) || mins > 600) flash(back, "error", "Total marks and duration (1–600 min) must be positive numbers.");
  let saved;
  try { saved = await saveUpload(file as File, "papers"); } catch (e) { flash(back, "error", (e as Error).message); }
  run(`INSERT INTO tests (title, subject, instructions, total_marks, duration_minutes, grade, paper_path, paper_mime, published)
       VALUES (?,?,?,?,?,?,?,?,?)`,
    str(f, "title"), str(f, "subject"), optional(f, "instructions"), total, Math.round(mins), optional(f, "grade"),
    saved.path, saved.mime, f.get("published") ? 1 : 0);
  revalidatePath(back);
  flash(back, "ok", "Test created.");
}

export async function togglePublish(f: FormData) {
  await requireUser("admin");
  run("UPDATE tests SET published = ? WHERE id = ?", num(f, "published"), num(f, "id"));
  revalidatePath("/admin/tests");
}

export async function assignCorrector(f: FormData) {
  await requireUser("admin");
  const t = num(f, "teacher_id") || null;
  if (t && !get("SELECT 1 FROM users WHERE id = ? AND role = 'teacher' AND active = 1", t)) flash("/admin/submissions", "error", "Pick a valid teacher.");
  run("UPDATE attempts SET assigned_teacher_id = ? WHERE id = ?", t, num(f, "id"));
  revalidatePath("/admin/submissions");
}

export async function setReferralFee(f: FormData) {
  await requireUser("admin");
  const fee = num(f, "fee");
  if (!(fee >= 0)) flash("/admin/referrals", "error", "Fee must be zero or more.");
  run("INSERT INTO settings (key, value) VALUES ('referral_fee', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", String(fee));
  flash("/admin/referrals", "ok", "Default referral fee updated (applies to new referrals).");
}

export async function addPayment(f: FormData) {
  await requireUser("admin");
  const amount = num(f, "amount");
  if (!get("SELECT 1 FROM users WHERE id = ? AND role='teacher'", num(f, "teacher_id")) || !(amount > 0))
    flash("/admin/referrals", "error", "Choose a teacher and enter a positive amount.");
  run("INSERT INTO payments (teacher_id, amount, note) VALUES (?,?,?)", num(f, "teacher_id"), amount, optional(f, "note"));
  revalidatePath("/admin/referrals");
  flash("/admin/referrals", "ok", "Payment entry added.");
}

export async function markPaid(f: FormData) {
  await requireUser("admin");
  run("UPDATE payments SET status = 'paid', paid_at = ? WHERE id = ?", new Date().toISOString(), num(f, "id"));
  revalidatePath("/admin/referrals");
}
