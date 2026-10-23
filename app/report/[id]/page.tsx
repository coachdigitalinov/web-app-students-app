import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
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
     FROM attempts a JOIN tests t ON t.id = a.test_id WHERE a.student_id = ? AND a.status='corrected' ORDER BY a.corrected_at DESC`, sid);
  const school = studentResults(sid).filter((r) => r.kind === "school");
  const status = progressStatus(studentResults(sid));
  const weak = weakAreas(sid);
  return (
    <Shell user={user}>
      <div className="row" style={{ justifyContent: "space-between" }}><h1>Performance report — {s.name}</h1><PrintButton /></div>
      <p className="muted">Grade {s.grade ?? "—"} · {s.school ?? ""} · Generated {fmtDate(new Date().toISOString())} · Progress: <b className={status.tone}>{status.label}</b></p>
      {corrected.map((c, i) => (
        <div className="card" key={i} style={{ breakInside: "avoid" }}>
          <h2>{c.test} <span className="muted">({c.subject})</span></h2>
          <p><b>{c.marks} / {c.total}</b> ({pct(c.marks, c.total)}%) · {fmtDate(c.corrected_at)}</p>
          {c.mistakes && <p><b>Mistakes:</b></p>}{c.mistakes && <p style={{ whiteSpace: "pre-wrap" }}>{c.mistakes}</p>}
          {c.feedback && <p><b>Teacher comments:</b> {c.feedback}</p>}
          {c.suggestions && <p><b>Improvement suggestions:</b> {c.suggestions}</p>}
        </div>
      ))}
      {!corrected.length && <div className="card muted">No corrected tests yet.</div>}
      <div className="card"><h2>Weak areas</h2>{weak.length ? weak.map((w) => `${w.area} (${w.count}×)`).join(", ") : <span className="muted">None flagged.</span>}</div>
      <div className="card tablewrap"><h2>School-test performance</h2><table>
        <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>%</th><th>Date</th></tr></thead>
        <tbody>{school.map((r, i) => <tr key={i}><td>{r.name}</td><td>{r.subject}</td><td>{r.marks} / {r.total}</td><td>{r.percent}%</td><td>{fmtDate(r.date)}</td></tr>)}
        {!school.length && <tr><td colSpan={5} className="muted">None recorded.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
