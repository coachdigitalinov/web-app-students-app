import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addSchoolTest } from "@/app/actions/staff";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { ProgressRing } from "@/components/ProgressRing";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { canViewStudent } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { all, get, type User } from "@/lib/db";
import { progressStatus, studentResults } from "@/lib/progress";
import { fmtDate, pct } from "@/lib/util";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin", "teacher");
  const sid = Number((await params).id);
  if (!canViewStudent(user, sid)) redirect("/");
  const s = get<User & { teacher: string | null }>(
    "SELECT s.*, t.name teacher FROM users s LEFT JOIN users t ON t.id = s.referred_by WHERE s.id = ? AND s.role = 'student'", sid,
  );
  if (!s) notFound();
  const results = studentResults(sid);
  const platform = results.filter((r) => r.kind === "platform");
  const status = progressStatus(results);
  const avg = platform.length ? Math.round(platform.reduce((a, r) => a + r.percent, 0) / platform.length) : 0;
  const attempts = all<{ id: number; title: string; subject: string; status: string; late: number; marks: number | null; total_marks: number; corrected_at: string | null }>(
    `SELECT a.id, t.title, t.subject, a.status, a.late, a.marks, t.total_marks, a.corrected_at
     FROM attempts a JOIN tests t ON t.id = a.test_id
     WHERE a.student_id = ? ${user.role === "teacher" ? "AND a.assigned_teacher_id = ?" : ""}
     ORDER BY a.started_at DESC`,
    sid, ...(user.role === "teacher" ? [user.id] : []),
  );
  const school = all<{ name: string; subject: string; marks: number; total: number; taken_on: string }>(
    "SELECT name, subject, marks, total, taken_on FROM school_tests WHERE student_id = ? ORDER BY taken_on DESC", sid,
  );

  return (
    <Shell user={user}>
      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={s.name} size="lg" />
          <div>
            <h1 style={{ marginBottom: 4 }}>{s.name}</h1>
            <p className="lede" style={{ margin: 0 }}>
              {s.email} · Grade {s.grade ?? "—"} · {s.school ?? "No school"} · Referred by {s.teacher ?? "—"}
            </p>
          </div>
        </div>
        <Link href={`/report/${s.id}`} className="btn ghost"><I.trend width={14} height={14} /> Open report</Link>
      </div>
      <Flash searchParams={searchParams} />

      <div className="cols-eq">
        <div className="card">
          <div className="hdr"><h2>Overall</h2><span className={`badge ${status.tone === "good" ? "good" : status.tone === "bad" ? "bad" : "progress"}`}>{status.label}</span></div>
          <ProgressRing percent={avg} label={`${platform.length} tests`} />
        </div>
        <div className="card">
          <div className="hdr"><h2>Add a school result</h2></div>
          <form action={addSchoolTest}>
            <input type="hidden" name="student_id" value={s.id} />
            <div className="fields">
              <div><label>Test name</label><input name="name" required /></div>
              <div><label>Subject</label><input name="subject" required /></div>
              <div><label>Marks</label><input name="marks" type="number" min="0" step="any" required /></div>
              <div><label>Out of</label><input name="total" type="number" min="1" step="any" required /></div>
              <div><label>Date</label><input name="taken_on" type="date" required /></div>
            </div>
            <button className="btn">Add result</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="hdr"><h2>Platform tests</h2></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Test</th><th>Status</th><th>Marks</th><th>Score</th><th /></tr></thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} className="rowfade">
                  <td><b>{a.title}</b><small className="muted" style={{ display: "block", fontSize: 11.5 }}>{a.subject}</small></td>
                  <td><StatusBadge status={a.status} late={a.late} /></td>
                  <td>{a.marks !== null ? `${a.marks} / ${a.total_marks}` : <span className="muted">—</span>}</td>
                  <td>{a.marks !== null ? <span className="badge good">{pct(a.marks, a.total_marks)}%</span> : <span className="muted">—</span>}</td>
                  <td style={{ textAlign: "right" }}>
                    {a.status !== "in_progress" && <Link href={`/correct/${a.id}`} className="btn ghost small">Open</Link>}
                  </td>
                </tr>
              ))}
              {!attempts.length && (
                <tr><td colSpan={5}><div className="empty"><div className="big"><I.test width={22} height={22} /></div>
                  <h3>No attempts yet</h3></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="hdr"><h2>School-test history</h2></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Score</th><th>Date</th></tr></thead>
            <tbody>
              {school.map((t, i) => (
                <tr key={i} className="rowfade">
                  <td><b>{t.name}</b></td>
                  <td className="muted">{t.subject}</td>
                  <td>{t.marks} / {t.total}</td>
                  <td><span className="badge good">{pct(t.marks, t.total)}%</span></td>
                  <td className="muted">{fmtDate(t.taken_on)}</td>
                </tr>
              ))}
              {!school.length && (
                <tr><td colSpan={5}><div className="empty"><div className="big"><I.teacher width={22} height={22} /></div>
                  <h3>No school results</h3><p>Use the form above to add some.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
