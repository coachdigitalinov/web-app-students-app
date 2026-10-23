import { all } from "./db";

/** Count of attempts (started OR submitted) per weekday for the current ISO week. */
export function weeklyActivity(studentId: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const from = monday.toISOString();
  const rows = all<{ day: string }>(
    `SELECT substr(started_at, 1, 10) day FROM attempts WHERE student_id = ? AND started_at >= ?
     UNION ALL
     SELECT substr(submitted_at, 1, 10) day FROM attempts WHERE student_id = ? AND submitted_at >= ?`,
    studentId, from, studentId, from,
  );
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.day, (counts.get(r.day) ?? 0) + 1);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, value: counts.get(d.toISOString().slice(0, 10)) ?? 0 };
  });
}

/** ISO dates (YYYY-MM-DD) when a student has a published, not-yet-started test — a quick calendar marker. */
export function upcomingTestDays(studentId: number, grade: string | null): Set<string> {
  const rows = all<{ day: string }>(
    `SELECT substr(created_at, 1, 10) day FROM tests
     WHERE published = 1 AND (grade IS NULL OR grade = ?)
     AND NOT EXISTS (SELECT 1 FROM attempts a WHERE a.test_id = tests.id AND a.student_id = ?)`,
    grade, studentId,
  );
  return new Set(rows.map((r) => r.day));
}
