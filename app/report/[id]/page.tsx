import { notFound, redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { PrintButton } from "@/components/PrintButton";
import { ProgressRing } from "@/components/ProgressRing";
import { Shell } from "@/components/Shell";
import { canViewStudent } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { all, get, type User } from "@/lib/db";
import { progressStatus, studentResults, weakAreas } from "@/lib/progress";
import { fmtDate, pct } from "@/lib/util";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const sid = Number((await params).id);
  if (!canViewStudent(user, sid)) redirect("/");
  const s = get<User>("SELECT * FROM users WHERE id = ? AND role = 'student'", sid);
  if (!s) notFound();
  const corrected = all<{ test: string; subject: string; marks: number; total: number; mistakes: string | null; feedback: string | null; suggestions: string | null; corrected_at: string }>(
    `SELECT t.title test, t.subject, a.marks, t.total_marks total, a.mistakes, a.feedback, a.suggestions, a.corrected_at
     FROM attempts a JOIN tests t ON t.id = a.test_id
     WHERE a.student_id = ? AND a.status='corrected' ORDER BY a.corrected_at DESC`, sid,
  );
  const results = studentResults(sid);
  const school = results.filter((r) => r.kind === "school");
  const platform = results.filter((r) => r.kind === "platform");
  const status = progressStatus(results);
  const weak = weakAreas(sid);
  const avg = platform.length ? Math.round(platform.reduce((a, r) => a + r.percent, 0) / platform.length) : 0;

  return (
    <Shell user={user}>
      <div className="page-head">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={s.name} size="lg" />
          <div>
            <h1 style={{ marginBottom: 4 }}>{s.name}</h1>
            <p className="lede" style={{ margin: 0 }}>
              Grade {s.grade ?? "—"} · {s.school ?? "No school"} · Report generated {fmtDate(new Date().toISOString())}
            </p>
          </div>
        </div>
        <PrintButton />
      </div>

      <div className="cols-eq">
        <div className="card">
          <div className="hdr"><h2>Overall</h2></div>
          <ProgressRing percent={avg} label={`${platform.length} tests · ${status.label.toLowerCase()}`} />
        </div>
        <div className="card">
          <div className="hdr"><h2>Weak areas</h2></div>
          {weak.length ? (
            <div className="chips">{weak.map((w) => <span key={w.area} className="chip-fil"><I.tag width={12} height={12} /> {w.area} ×{w.count}</span>)}</div>
          ) : <p className="muted">None flagged.</p>}
        </div>
      </div>

      <div className="card">
        <div className="hdr"><h2>Corrected tests</h2></div>
        {corrected.length ? corrected.map((c, i) => (
          <div key={i} style={{ padding: "14px 0", borderTop: i ? "1px solid var(--line)" : 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{c.test}</h2>
              <span className="badge progress">{c.subject}</span>
              <span style={{ marginLeft: "auto" }}><b>{c.marks} / {c.total}</b> <span className="badge good">{pct(c.marks, c.total)}%</span></span>
            </div>
            <small className="muted" style={{ display: "block", marginTop: 4 }}>{fmtDate(c.corrected_at)}</small>
            {c.mistakes && <><h2 style={{ marginTop: 12, fontSize: 13 }}>Mistakes</h2><p style={{ whiteSpace: "pre-wrap", margin: "4px 0", fontSize: 13 }}>{c.mistakes}</p></>}
            {c.feedback && <p style={{ fontSize: 13, margin: "6px 0" }}><b>Teacher feedback:</b> {c.feedback}</p>}
            {c.suggestions && <p style={{ fontSize: 13, margin: "6px 0" }}><b>Improvement:</b> {c.suggestions}</p>}
          </div>
        )) : <div className="empty"><div className="big"><I.check width={22} height={22} /></div><h3>No corrected tests yet</h3></div>}
      </div>

      <div className="card">
        <div className="hdr"><h2>School-test performance</h2></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Score</th><th>Date</th></tr></thead>
            <tbody>
              {school.map((r, i) => (
                <tr key={i} className="rowfade">
                  <td><b>{r.name}</b></td>
                  <td className="muted">{r.subject}</td>
                  <td>{r.marks} / {r.total}</td>
                  <td><span className="badge good">{r.percent}%</span></td>
                  <td className="muted">{fmtDate(r.date)}</td>
                </tr>
              ))}
              {!school.length && <tr><td colSpan={5}><div className="empty" style={{ padding: 20 }}><p>None recorded.</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
