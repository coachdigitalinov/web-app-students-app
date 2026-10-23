import { all } from "./db";
import { pct, splitList } from "./util";

export interface ResultRow {
  kind: "platform" | "school";
  name: string;
  subject: string;
  marks: number;
  total: number;
  date: string;
  percent: number;
}

export function studentResults(studentId: number): ResultRow[] {
  const platform = all<{ name: string; subject: string; marks: number; total: number; date: string }>(
    `SELECT t.title name, t.subject, a.marks, t.total_marks total, a.corrected_at date
     FROM attempts a JOIN tests t ON t.id = a.test_id
     WHERE a.student_id = ? AND a.status = 'corrected'`,
    studentId,
  ).map((r) => ({ ...r, kind: "platform" as const }));
  const school = all<{ name: string; subject: string; marks: number; total: number; date: string }>(
    "SELECT name, subject, marks, total, taken_on date FROM school_tests WHERE student_id = ?",
    studentId,
  ).map((r) => ({ ...r, kind: "school" as const }));
  return [...platform, ...school]
    .map((r) => ({ ...r, percent: pct(r.marks, r.total) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Compares the latest three platform results with the three before them. */
export function progressStatus(rows: ResultRow[]) {
  const p = rows.filter((r) => r.kind === "platform").map((r) => r.percent);
  if (p.length < 2) return { label: "Not enough data yet", tone: "muted" as const };
  const recent = p.slice(-3);
  const earlier = p.slice(-6, -3);
  const base = earlier.length ? avg(earlier) : p[0];
  const diff = avg(recent) - base;
  if (diff >= 3) return { label: `Improving (+${Math.round(diff)} pts)`, tone: "good" as const };
  if (diff <= -3) return { label: `Needs attention (${Math.round(diff)} pts)`, tone: "bad" as const };
  return { label: "Steady", tone: "muted" as const };
}

export function weakAreas(studentId: number) {
  const counts = new Map<string, number>();
  for (const r of all<{ weak_areas: string | null }>(
    "SELECT weak_areas FROM attempts WHERE student_id = ? AND status = 'corrected'",
    studentId,
  ))
    for (const w of splitList(r.weak_areas)) counts.set(w.toLowerCase(), (counts.get(w.toLowerCase()) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([area, count]) => ({ area, count }));
}
