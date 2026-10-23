import Link from "next/link";
import { Shell, Stat } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { fmtDateTime } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("admin");
  const c = (sql: string) => get<{ n: number }>(sql)!.n;
  const recent = all<{ id: number; student: string; test: string; submitted_at: string; status: string }>(
    `SELECT a.id, u.name student, t.title test, a.submitted_at, a.status FROM attempts a
     JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id
     WHERE a.status != 'in_progress' ORDER BY a.submitted_at DESC LIMIT 8`);
  return (
    <Shell user={user}>
      <h1>Admin dashboard</h1>
      <div className="grid">
        <Stat label="Students" value={c("SELECT COUNT(*) n FROM users WHERE role='student' AND active=1")} />
        <Stat label="Teachers" value={c("SELECT COUNT(*) n FROM users WHERE role='teacher' AND active=1")} />
        <Stat label="Awaiting correction" value={c("SELECT COUNT(*) n FROM attempts WHERE status='submitted'")} />
        <Stat label="Unassigned sheets" value={c("SELECT COUNT(*) n FROM attempts WHERE status='submitted' AND assigned_teacher_id IS NULL")} />
        <Stat label="Pending payments" value={c("SELECT COUNT(*) n FROM payments WHERE status='pending'")} />
      </div>
      <div className="card">
        <h2>Recent submissions</h2>
        <div className="tablewrap"><table>
          <thead><tr><th>Student</th><th>Test</th><th>Submitted</th><th>Status</th><th /></tr></thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id}><td>{r.student}</td><td>{r.test}</td><td>{fmtDateTime(r.submitted_at)}</td><td>{r.status}</td>
                <td><Link href={`/correct/${r.id}`}>Open</Link></td></tr>
            ))}
            {!recent.length && <tr><td colSpan={5} className="muted">No submissions yet.</td></tr>}
          </tbody>
        </table></div>
      </div>
    </Shell>
  );
}
