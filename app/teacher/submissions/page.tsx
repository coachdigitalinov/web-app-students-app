import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { Shell, StatusBadge } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDateTime } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("teacher");
  const rows = all<{ id: number; student: string; test: string; subject: string; status: string; late: number; submitted_at: string; marks: number | null; total: number }>(
    `SELECT a.id, u.name student, t.title test, t.subject, a.status, a.late, a.submitted_at, a.marks, t.total_marks total
     FROM attempts a JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id
     WHERE a.assigned_teacher_id = ? AND a.status != 'in_progress'
     ORDER BY (a.status='submitted') DESC, a.submitted_at DESC`, user.id,
  );
  const todo = rows.filter((r) => r.status === "submitted").length;
  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Answer sheets</h1>
          <p className="lede">{todo} awaiting correction · {rows.length - todo} corrected.</p>
        </div>
      </div>
      <div className="card">
        <div className="tablewrap">
          <table>
            <thead><tr><th>Student</th><th>Test</th><th>Submitted</th><th>Status</th><th>Marks</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="rowfade">
                  <td><span className="cell-user"><Avatar name={r.student} size="sm" /><span><b>{r.student}</b><small>{r.subject}</small></span></span></td>
                  <td>{r.test}</td>
                  <td className="muted">{fmtDateTime(r.submitted_at)}</td>
                  <td><StatusBadge status={r.status} late={r.late} /></td>
                  <td>{r.marks !== null ? <b>{r.marks} / {r.total}</b> : <span className="muted">—</span>}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/correct/${r.id}`} className="btn ghost small">
                      {r.status === "corrected" ? "Review" : "Correct"}
                    </Link>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={6}>
                  <div className="empty"><div className="big"><I.check width={22} height={22} /></div>
                    <h3>All caught up</h3><p>No answer sheets are waiting on you.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
