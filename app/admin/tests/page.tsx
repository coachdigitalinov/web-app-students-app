import { addTest, togglePublish } from "@/app/actions/admin";
import { Flash, Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const tests = all<{ id: number; title: string; subject: string; grade: string | null; total_marks: number; duration_minutes: number; published: number; attempts: number }>(
    `SELECT t.id, t.title, t.subject, t.grade, t.total_marks, t.duration_minutes, t.published,
       (SELECT COUNT(*) FROM attempts a WHERE a.test_id = t.id) attempts FROM tests t ORDER BY t.created_at DESC`);
  return (
    <Shell user={user}>
      <h1>Tests</h1>
      <Flash searchParams={searchParams} />
      <form action={addTest} className="card">
        <h2>Create timed test</h2>
        <div className="fields">
          <div><label>Title</label><input name="title" required /></div>
          <div><label>Subject</label><input name="subject" required /></div>
          <div><label>Total marks</label><input name="total_marks" type="number" min="1" required /></div>
          <div><label>Duration (minutes)</label><input name="duration_minutes" type="number" min="1" max="600" required /></div>
          <div><label>Grade (blank = all)</label><input name="grade" /></div>
          <div><label>Question paper (PDF/image)</label><input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></div>
        </div>
        <div style={{ marginBottom: 12 }}><label>Instructions</label><textarea name="instructions" /></div>
        <label className="row" style={{ marginBottom: 12 }}><input type="checkbox" name="published" style={{ width: "auto" }} /> Publish immediately</label>
        <button className="btn">Create test</button>
      </form>
      <div className="card tablewrap"><table>
        <thead><tr><th>Test</th><th>Subject</th><th>Grade</th><th>Marks</th><th>Time</th><th>Attempts</th><th /></tr></thead>
        <tbody>{tests.map((t) => (
          <tr key={t.id}><td><a href={`/files/paper/${t.id}`} target="_blank">{t.title}</a></td><td>{t.subject}</td><td>{t.grade ?? "All"}</td>
            <td>{t.total_marks}</td><td>{t.duration_minutes} min</td><td>{t.attempts}</td>
            <td><form action={togglePublish}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="published" value={t.published ? 0 : 1} />
              <button className={`btn small ${t.published ? "ghost" : ""}`}>{t.published ? "Unpublish" : "Publish"}</button></form></td></tr>
        ))}
        {!tests.length && <tr><td colSpan={7} className="muted">No tests yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
