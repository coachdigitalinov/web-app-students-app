import { addWorksheet, deleteWorksheet } from "@/app/actions/admin";
import { I } from "@/components/Icons";
import { Flash, Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const rows = all<{ id: number; title: string; subject: string; description: string | null; grade: string | null; created_at: string }>(
    "SELECT id, title, subject, description, grade, created_at FROM worksheets ORDER BY created_at DESC",
  );
  const subjects = Array.from(new Set(rows.map((r) => r.subject)));
  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Worksheets</h1>
          <p className="lede">{rows.length} total · {subjects.length} subjects.</p>
        </div>
        <a href="#add" className="btn"><I.upload width={14} height={14} /> Upload</a>
      </div>
      <Flash searchParams={searchParams} />

      <div className="card">
        <div className="hdr"><h2>Library</h2></div>
        {rows.length ? (
          <div className="list">
            {rows.map((w) => (
              <div key={w.id} className="row">
                <div className="ico v2"><I.book width={18} height={18} /></div>
                <div className="meta">
                  <b>{w.title}</b>
                  <small>
                    {w.subject} · {w.grade ? `Grade ${w.grade}` : "All grades"} · uploaded {fmtDate(w.created_at)}
                    {w.description ? ` · ${w.description}` : ""}
                  </small>
                </div>
                <a href={`/files/worksheet/${w.id}`} target="_blank" className="btn subtle small">Open</a>
                <form action={deleteWorksheet} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={w.id} />
                  <button className="btn danger small">Delete</button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="big"><I.book width={22} height={22} /></div>
            <h3>No worksheets yet</h3>
            <p>Upload PDFs or images for students to revise with.</p>
          </div>
        )}
      </div>

      <form action={addWorksheet} id="add" className="card">
        <div className="hdr"><h2>Upload a worksheet</h2></div>
        <div className="fields">
          <div><label>Title</label><input name="title" required /></div>
          <div><label>Subject</label><input name="subject" required list="subjects" />
            <datalist id="subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist></div>
          <div><label>Grade (blank = all)</label><input name="grade" placeholder="e.g. 10" /></div>
          <div><label>File — PDF or image (max 15 MB)</label>
            <input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Description (optional)</label>
          <textarea name="description" placeholder="A short note that appears next to the worksheet title." />
        </div>
        <button className="btn">Upload</button>
      </form>
    </Shell>
  );
}
