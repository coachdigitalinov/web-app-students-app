import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate, pct } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("student");
  const rows = all<{ id: number; title: string; subject: string; marks: number; total_marks: number; corrected_at: string; feedback: string | null }>(
    `SELECT a.id, t.title, t.subject, a.marks, t.total_marks, a.corrected_at, a.feedback FROM attempts a JOIN tests t ON t.id = a.test_id
     WHERE a.student_id = ? AND a.status='corrected' ORDER BY a.corrected_at DESC`, user.id);
  return (
    <Shell user={user}>
      <h1>Results</h1>
      <p className="noprint"><Link href={`/report/${user.id}`}>Open full report</Link></p>
      <div className="card tablewrap"><table>
        <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>%</th><th>Corrected</th><th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td>{r.title}</td><td>{r.subject}</td><td>{r.marks} / {r.total_marks}</td><td>{pct(r.marks, r.total_marks)}%</td><td>{fmtDate(r.corrected_at)}</td>
            <td><Link href={`/correct/${r.id}`}>Feedback</Link></td></tr>
        ))}
        {!rows.length && <tr><td colSpan={6} className="muted">No corrected tests yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
