import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get, run, type Role, type User } from "./db";

const COOKIE = "session";
const DAYS = 7;
const hash = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + DAYS * 86400_000);
  run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", hash(token), userId, expires.toISOString());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", hash(token));
  jar.delete(COOKIE);
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return (
    get<User>(
      `SELECT u.id,u.name,u.email,u.role,u.school,u.grade,u.referral_code,u.referred_by,u.active,u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
      hash(token),
      new Date().toISOString(),
    ) ?? null
  );
}

export const homeFor = (role: Role) => `/${role}`;

export async function requireUser(...roles: Role[]): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

export const verifyLogin = (email: string, password: string) => {
  const row = get<{ id: number; password_hash: string; active: number }>(
    "SELECT id, password_hash, active FROM users WHERE email = ?",
    email,
  );
  // Compare against a dummy hash when the user is unknown to keep timing similar.
  const ok = bcrypt.compareSync(password, row?.password_hash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali");
  return row && ok && row.active ? row.id : null;
};

export const hashPassword = (p: string) => bcrypt.hashSync(p, 10);
