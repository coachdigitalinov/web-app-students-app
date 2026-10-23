import Link from "next/link";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { Viewer } from "@/components/Viewer";

export default async function Page({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const user = await requireUser("student");
  const { open } = await searchParams;
  const rows = all<{ id: number; title: string; subject: string; description: string | null; mime: string }>(
    "SELECT id, title, subject, description, mime FROM worksheets WHERE grade IS NULL OR grade = ? ORDER BY subject, title", user.grade);
  const current = rows.find((r) => String(r.id) === open);
  return (
    <Shell user={user}>
      <h1>Worksheets</h1>
      {current && (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}><h2>{current.title}</h2><Link className="btn ghost small" href="/student/worksheets">Close</Link></div>
          <Viewer src={`/files/worksheet/${current.id}`} mime={current.mime} title={current.title} />
          <p className="muted">Read-only material for your own revision. Please do not share it.</p>
        </div>
      )}
      <div className="card tablewrap"><table>
        <thead><tr><th>Title</th><th>Subject</th><th>About</th></tr></thead>
        <tbody>{rows.map((w) => <tr key={w.id}><td><Link href={`?open=${w.id}`}>{w.title}</Link></td><td>{w.subject}</td><td>{w.description ?? ""}</td></tr>)}
        {!rows.length && <tr><td colSpan={3} className="muted">No worksheets assigned yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
