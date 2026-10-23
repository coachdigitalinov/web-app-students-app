import Link from "next/link";
import { assignCorrector } from "@/app/actions/admin";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDateTime } from "@/lib/util";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string; status?: string }> }) {
  const user = await requireUser("admin");
  const { status } = await searchParams;
  const filter = ["submitted", "corrected", "in_progress"].includes(status ?? "") ? status! : null;
  const rows = all<{ id: number; student: string; test: string; status: string; late: number; submitted_at: string | null; teacher_id: number | null; marks: number | null; total: number }>(
    `SELECT a.id, u.name student, t.title test, a.status, a.late, a.submitted_at, a.assigned_teacher_id teacher_id, a.marks, t.total_marks total
     FROM attempts a JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id
     ${filter ? "WHERE a.status = ?" : ""} ORDER BY a.started_at DESC LIMIT 200`, ...(filter ? [filter] : []));
  const teachers = all<{ id: number; name: string }>("SELECT id, name FROM users WHERE role='teacher' AND active=1 ORDER BY name");
  return (
    <Shell user={user}>
      <h1>Submissions</h1>
      <Flash searchParams={searchParams} />
      <p className="row noprint">Filter: <Link href="/admin/submissions">All</Link> <Link href="?status=submitted">Awaiting correction</Link> <Link href="?status=corrected">Corrected</Link> <Link href="?status=in_progress">In progress</Link></p>
      <div className="card tablewrap"><table>
        <thead><tr><th>Student</th><th>Test</th><th>Submitted</th><th>Status</th><th>Marks</th><th>Assigned to</th><th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td>{r.student}</td><td>{r.test}</td><td>{fmtDateTime(r.submitted_at)}</td>
            <td><StatusBadge status={r.status} late={r.late} /></td><td>{r.marks ?? "—"} / {r.total}</td>
            <td>{r.status === "in_progress" ? "—" : (
              <form action={assignCorrector} className="row">
                <input type="hidden" name="id" value={r.id} />
                <select name="teacher_id" defaultValue={r.teacher_id ?? ""} style={{ width: 150 }}>
                  <option value="">Admin only</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select><button className="btn ghost small">Assign</button>
              </form>)}</td>
            <td>{r.status !== "in_progress" && <Link href={`/correct/${r.id}`}>{r.status === "corrected" ? "Review" : "Correct"}</Link>}</td></tr>
        ))}
        {!rows.length && <tr><td colSpan={7} className="muted">Nothing here.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
