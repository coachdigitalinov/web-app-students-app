import { addWorksheet, deleteWorksheet } from "@/app/actions/admin";
import { Flash, Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const rows = all<{ id: number; title: string; subject: string; grade: string | null; created_at: string }>(
    "SELECT id, title, subject, grade, created_at FROM worksheets ORDER BY created_at DESC");
  return (
    <Shell user={user}>
      <h1>Worksheets</h1>
      <Flash searchParams={searchParams} />
      <form action={addWorksheet} className="card">
        <h2>Upload worksheet</h2>
        <div className="fields">
          <div><label>Title</label><input name="title" required /></div>
          <div><label>Subject</label><input name="subject" required /></div>
          <div><label>Grade (blank = all students)</label><input name="grade" /></div>
          <div><label>File (PDF or image, max 15 MB)</label><input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></div>
        </div>
        <div style={{ marginBottom: 12 }}><label>Description</label><textarea name="description" /></div>
        <button className="btn">Upload</button>
      </form>
      <div className="card tablewrap"><table>
        <thead><tr><th>Title</th><th>Subject</th><th>Grade</th><th>Added</th><th /></tr></thead>
        <tbody>{rows.map((w) => (
          <tr key={w.id}><td><a href={`/files/worksheet/${w.id}`} target="_blank">{w.title}</a></td><td>{w.subject}</td><td>{w.grade ?? "All"}</td><td>{fmtDate(w.created_at)}</td>
            <td><form action={deleteWorksheet}><input type="hidden" name="id" value={w.id} /><button className="btn danger small">Delete</button></form></td></tr>
        ))}
        {!rows.length && <tr><td colSpan={5} className="muted">No worksheets yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
