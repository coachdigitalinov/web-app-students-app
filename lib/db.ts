import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

// Vercel functions have a read-only filesystem except /tmp, which is ephemeral (see README).
const ROOT = process.env.VERCEL ? "/tmp" : process.cwd();
export const DATA_DIR = path.join(ROOT, "data");
export const STORAGE_DIR = path.join(ROOT, "storage");

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  const db = new Database(path.join(DATA_DIR, "app.db"));
  db.pragma("busy_timeout = 5000");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('referral_fee', '500')").run();

  // Bootstrap the first admin so a fresh install can log in.
  const { n } = db.prepare("SELECT COUNT(*) n FROM users").get() as { n: number };
  if (n === 0) {
    const email = process.env.ADMIN_EMAIL ?? "admin@digitalinov.local";
    const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
    db.prepare("INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')").run(
      "Administrator",
      email,
      bcrypt.hashSync(password, 10),
    );
  }
  return db;
}

const g = globalThis as unknown as { __db?: Database.Database };
export const db = (g.__db ??= open());

export const all = <T>(sql: string, ...p: unknown[]) => db.prepare(sql).all(...p) as T[];
export const get = <T>(sql: string, ...p: unknown[]) => db.prepare(sql).get(...p) as T | undefined;
export const run = (sql: string, ...p: unknown[]) => db.prepare(sql).run(...p);

export type Role = "admin" | "teacher" | "student";
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  school: string | null;
  grade: string | null;
  referral_code: string | null;
  referred_by: number | null;
  active: number;
  created_at: string;
}
export interface Attempt {
  id: number;
  test_id: number;
  student_id: number;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  late: number;
  status: "in_progress" | "submitted" | "corrected";
  assigned_teacher_id: number | null;
  corrected_by: number | null;
  corrected_at: string | null;
  marks: number | null;
  mistakes: string | null;
  weak_areas: string | null;
  feedback: string | null;
  suggestions: string | null;
}
export interface Test {
  id: number;
  title: string;
  subject: string;
  instructions: string | null;
  total_marks: number;
  duration_minutes: number;
  grade: string | null;
  paper_path: string;
  paper_mime: string;
  published: number;
}
