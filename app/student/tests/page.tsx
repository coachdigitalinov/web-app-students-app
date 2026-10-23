import Link from "next/link";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("student");
  const rows = all<{ id: number; title: string; subject: string; total_marks: number; duration_minutes: number; status: string | null; late: number | null }>(
    `SELECT t.id, t.title, t.subject, t.total_marks, t.duration_minutes, a.status, a.late FROM tests t
     LEFT JOIN attempts a ON a.test_id = t.id AND a.student_id = ?
     WHERE t.published = 1 AND (t.grade IS NULL OR t.grade = ?) ORDER BY t.created_at DESC`, user.id, user.grade);
  return (
    <Shell user={user}>
      <h1>Tests</h1>
      <Flash searchParams={searchParams} />
      <div className="card tablewrap"><table>
        <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Time</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map((t) => (
          <tr key={t.id}><td>{t.title}</td><td>{t.subject}</td><td>{t.total_marks}</td><td>{t.duration_minutes} min</td>
            <td>{t.status ? <StatusBadge status={t.status} late={t.late ?? 0} /> : <span className="muted">not started</span>}</td>
            <td><Link href={`/student/tests/${t.id}`}>{!t.status ? "Open" : t.status === "in_progress" ? "Continue" : "View"}</Link></td></tr>
        ))}
        {!rows.length && <tr><td colSpan={6} className="muted">No tests published for you yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
