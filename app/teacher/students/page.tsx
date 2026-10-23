import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";

export default async function Page() {
  const user = await requireUser("teacher");
  const rows = all<{ id: number; name: string; grade: string | null; school: string | null; referred: number }>(
    `SELECT s.id, s.name, s.grade, s.school, (s.referred_by = ?) referred FROM users s
     WHERE s.role='student' AND (s.referred_by = ? OR EXISTS (SELECT 1 FROM attempts a WHERE a.student_id = s.id AND a.assigned_teacher_id = ?))
     ORDER BY s.name`, user.id, user.id, user.id);
  return (
    <Shell user={user}>
      <h1>My students</h1>
      <div className="card tablewrap"><table>
        <thead><tr><th>Name</th><th>Grade</th><th>School</th><th>Relation</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td><Link href={`/students/${r.id}`}>{r.name}</Link></td><td>{r.grade ?? "—"}</td><td>{r.school ?? "—"}</td><td>{r.referred ? "Referred by you" : "Assigned work"}</td></tr>
        ))}
        {!rows.length && <tr><td colSpan={4} className="muted">No students yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
