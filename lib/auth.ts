import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get, run, type Role, type User } from "./db";

/**
 * Stateless HMAC-signed cookies. No `sessions` table lookup, so logins survive
 * Vercel's per-instance /tmp filesystem (where a SQLite sessions row cannot).
 *
 * Cookie format: `<userId>.<role>.<expiryUnix>.<base64url(hmac)>`
 */
const COOKIE = "session";
const TTL_DAYS = 7;
const SECRET =
  process.env.AUTH_SECRET ||
  // Dev / preview fallback. For real production ALWAYS set AUTH_SECRET.
  "digitalinov-demo-insecure-secret-set-AUTH_SECRET-in-prod";

const b64 = (b: Buffer) => b.toString("base64url");
const sign = (payload: string) =>
  b64(crypto.createHmac("sha256", SECRET).update(payload).digest());
const timingSafeEq = (a: string, b: string) => {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

export async function createSession(userId: number, role: Role) {
  const exp = Math.floor(Date.now() / 1000) + TTL_DAYS * 86400;
  const payload = `${userId}.${role}.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_DAYS * 86400,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [uid, role, exp, sig] = parts;
  const payload = `${uid}.${role}.${exp}`;
  if (!timingSafeEq(sig, sign(payload))) return null;
  if (Number(exp) * 1000 < Date.now()) return null;
  return (
    get<User>(
      `SELECT id, name, email, role, school, grade, referral_code, referred_by, active, created_at
       FROM users WHERE id = ? AND active = 1`,
      Number(uid),
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
  const row = get<{ id: number; role: Role; password_hash: string; active: number }>(
    "SELECT id, role, password_hash, active FROM users WHERE email = ?",
    email,
  );
  const ok = bcrypt.compareSync(
    password,
    // Constant-time dummy keeps timing uniform for unknown emails.
    row?.password_hash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali",
  );
  return row && ok && row.active ? row : null;
};

export const hashPassword = (p: string) => bcrypt.hashSync(p, 10);

// Call sites that still expect this (none should by design, but harmless).
export const _runOnLogout = (uid: number) => run("SELECT 1 WHERE 1 = ? AND 1 = ?", 0, uid);
