import Link from "next/link";
import { Shell, StatusBadge } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDateTime } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("teacher");
  const rows = all<{ id: number; student: string; test: string; status: string; late: number; submitted_at: string; marks: number | null; total: number }>(
    `SELECT a.id, u.name student, t.title test, a.status, a.late, a.submitted_at, a.marks, t.total_marks total
     FROM attempts a JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id
     WHERE a.assigned_teacher_id = ? AND a.status != 'in_progress'
     ORDER BY (a.status='submitted') DESC, a.submitted_at DESC`, user.id);
  return (
    <Shell user={user}>
      <h1>Assigned answer sheets</h1>
      <div className="card tablewrap"><table>
        <thead><tr><th>Student</th><th>Test</th><th>Submitted</th><th>Status</th><th>Marks</th><th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td>{r.student}</td><td>{r.test}</td><td>{fmtDateTime(r.submitted_at)}</td><td><StatusBadge status={r.status} late={r.late} /></td>
            <td>{r.marks ?? "—"} / {r.total}</td><td><Link href={`/correct/${r.id}`}>{r.status === "corrected" ? "Review" : "Correct"}</Link></td></tr>
        ))}
        {!rows.length && <tr><td colSpan={6} className="muted">Nothing assigned to you yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
