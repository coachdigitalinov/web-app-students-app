import { addTest, togglePublish } from "@/app/actions/admin";
import { I } from "@/components/Icons";
import { Flash, Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const tests = all<{ id: number; title: string; subject: string; grade: string | null; total_marks: number; duration_minutes: number; published: number; attempts: number; created_at: string }>(
    `SELECT t.id, t.title, t.subject, t.grade, t.total_marks, t.duration_minutes, t.published, t.created_at,
       (SELECT COUNT(*) FROM attempts a WHERE a.test_id = t.id) attempts FROM tests t ORDER BY t.created_at DESC`,
  );
  const published = get<{ n: number }>("SELECT COUNT(*) n FROM tests WHERE published=1")!.n;

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Tests</h1>
          <p className="lede">{tests.length} total · {published} published.</p>
        </div>
        <a href="#add" className="btn"><I.test width={14} height={14} /> New test</a>
      </div>
      <Flash searchParams={searchParams} />

      <div className="card">
        <div className="hdr"><h2>Library</h2></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Test</th><th>Subject</th><th>Grade</th><th>Marks</th><th>Time</th><th>Attempts</th><th>Status</th><th /></tr></thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="rowfade">
                  <td>
                    <b>{t.title}</b>
                    <small style={{ display: "block", color: "var(--muted)", fontSize: 11.5 }}>Added {fmtDate(t.created_at)}</small>
                  </td>
                  <td className="muted">{t.subject}</td>
                  <td>{t.grade ? <span className="badge progress">Grade {t.grade}</span> : <span className="badge">All</span>}</td>
                  <td>{t.total_marks}</td>
                  <td>{t.duration_minutes} min</td>
                  <td>{t.attempts}</td>
                  <td>{t.published ? <span className="badge good">Published</span> : <span className="badge">Draft</span>}</td>
                  <td style={{ textAlign: "right", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <a href={`/files/paper/${t.id}`} target="_blank" className="btn subtle small">Paper</a>
                    <form action={togglePublish} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="published" value={t.published ? 0 : 1} />
                      <button className={`btn small ${t.published ? "subtle" : ""}`}>{t.published ? "Unpublish" : "Publish"}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!tests.length && (
                <tr><td colSpan={8}>
                  <div className="empty"><div className="big"><I.test width={22} height={22} /></div>
                    <h3>No tests yet</h3><p>Create your first test below.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form action={addTest} id="add" className="card">
        <div className="hdr"><h2>Create a timed test</h2></div>
        <div className="fields">
          <div><label>Title</label><input name="title" required /></div>
          <div><label>Subject</label><input name="subject" required /></div>
          <div><label>Total marks</label><input name="total_marks" type="number" min="1" required /></div>
          <div><label>Duration (minutes)</label><input name="duration_minutes" type="number" min="1" max="600" required /></div>
          <div><label>Grade (blank = all)</label><input name="grade" placeholder="e.g. 10" /></div>
          <div><label>Question paper (PDF/image)</label><input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Instructions for students</label>
          <textarea name="instructions" placeholder="Shown on the test start page." />
        </div>
        <label className="row-flex" style={{ marginBottom: 14 }}>
          <input type="checkbox" name="published" /> Publish immediately
        </label>
        <button className="btn">Create test</button>
      </form>
    </Shell>
  );
}
