import { all } from "./db";

function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short" });
}

/** Submissions-per-month trend across the last six months. */
export function submissionsTrend() {
  const out: { label: string; value: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const n = all<{ n: number }>(
      "SELECT COUNT(*) n FROM attempts WHERE submitted_at >= ? AND submitted_at < ?",
      d.toISOString(), next.toISOString(),
    )[0]?.n ?? 0;
    out.push({ label: monthLabel(d), value: n });
  }
  return out;
}

/** Revenue (paid payments) per month. */
export function revenueTrend() {
  const out: { label: string; value: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const n = all<{ s: number | null }>(
      "SELECT SUM(amount) s FROM payments WHERE status='paid' AND paid_at >= ? AND paid_at < ?",
      d.toISOString(), next.toISOString(),
    )[0]?.s ?? 0;
    out.push({ label: monthLabel(d), value: Math.round(n ?? 0) });
  }
  return out;
}

/** Top students by average corrected percentage. */
export function topStudents(limit = 5) {
  return all<{ id: number; name: string; grade: string | null; school: string | null; avg: number; count: number }>(
    `SELECT u.id, u.name, u.grade, u.school,
       ROUND(AVG(a.marks * 100.0 / t.total_marks), 1) avg,
       COUNT(a.id) count
     FROM users u JOIN attempts a ON a.student_id = u.id
     JOIN tests t ON t.id = a.test_id
     WHERE u.role = 'student' AND a.status = 'corrected'
     GROUP BY u.id HAVING count >= 1
     ORDER BY avg DESC LIMIT ?`, limit,
  );
}
