import Link from "next/link";
import { assignCorrector } from "@/app/actions/admin";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { fmtDateTime } from "@/lib/util";

const FILTERS = [
  { k: "", label: "All" },
  { k: "submitted", label: "Awaiting" },
  { k: "corrected", label: "Corrected" },
  { k: "in_progress", label: "In progress" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string; status?: string }> }) {
  const user = await requireUser("admin");
  const { status } = await searchParams;
  const filter = ["submitted", "corrected", "in_progress"].includes(status ?? "") ? status! : null;
  const rows = all<{
    id: number; student: string; test: string; subject: string; status: string; late: number;
    submitted_at: string | null; teacher_id: number | null; marks: number | null; total: number;
  }>(
    `SELECT a.id, u.name student, t.title test, t.subject, a.status, a.late, a.submitted_at,
       a.assigned_teacher_id teacher_id, a.marks, t.total_marks total
     FROM attempts a JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id
     ${filter ? "WHERE a.status = ?" : ""} ORDER BY a.started_at DESC LIMIT 200`,
    ...(filter ? [filter] : []),
  );
  const teachers = all<{ id: number; name: string }>("SELECT id, name FROM users WHERE role='teacher' AND active=1 ORDER BY name");
  const counts: Record<string, number> = {
    "": get<{ n: number }>("SELECT COUNT(*) n FROM attempts")!.n,
    submitted: get<{ n: number }>("SELECT COUNT(*) n FROM attempts WHERE status='submitted'")!.n,
    corrected: get<{ n: number }>("SELECT COUNT(*) n FROM attempts WHERE status='corrected'")!.n,
    in_progress: get<{ n: number }>("SELECT COUNT(*) n FROM attempts WHERE status='in_progress'")!.n,
  };

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Submissions</h1>
          <p className="lede">Review, assign and track every answer sheet.</p>
        </div>
        <div className="tabs noprint">
          {FILTERS.map((f) => (
            <Link key={f.k} href={f.k ? `?status=${f.k}` : "?"} className={filter === f.k || (!filter && !f.k) ? "active" : ""}>
              {f.label} <span className="muted" style={{ marginLeft: 4 }}>{counts[f.k]}</span>
            </Link>
          ))}
        </div>
      </div>
      <Flash searchParams={searchParams} />

      <div className="card">
        <div className="tablewrap">
          <table>
            <thead><tr><th>Student</th><th>Test</th><th>Submitted</th><th>Status</th><th>Marks</th><th>Assigned</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="rowfade">
                  <td>
                    <span className="cell-user">
                      <Avatar name={r.student} size="sm" />
                      <span><b>{r.student}</b><small>{r.subject}</small></span>
                    </span>
                  </td>
                  <td>{r.test}</td>
                  <td className="muted">{fmtDateTime(r.submitted_at)}</td>
                  <td><StatusBadge status={r.status} late={r.late} /></td>
                  <td>{r.marks !== null ? <b>{r.marks} / {r.total}</b> : <span className="muted">—</span>}</td>
                  <td>
                    {r.status === "in_progress" ? <span className="muted">—</span> : (
                      <form action={assignCorrector} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="hidden" name="id" value={r.id} />
                        <select name="teacher_id" defaultValue={r.teacher_id ?? ""} style={{ width: 150 }}>
                          <option value="">Admin only</option>
                          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button className="btn subtle small">Save</button>
                      </form>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.status !== "in_progress" && (
                      <Link href={`/correct/${r.id}`} className="btn ghost small">
                        {r.status === "corrected" ? "Review" : "Correct"}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={7}>
                  <div className="empty">
                    <div className="big"><I.inbox width={22} height={22} /></div>
                    <h3>Nothing to show</h3>
                    <p>No submissions match this filter.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
