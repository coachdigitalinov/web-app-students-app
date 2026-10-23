import Link from "next/link";
import { I } from "@/components/Icons";
import { Shell } from "@/components/Shell";
import { Viewer } from "@/components/Viewer";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page({ searchParams }: { searchParams: Promise<{ open?: string; subject?: string }> }) {
  const user = await requireUser("student");
  const { open, subject } = await searchParams;
  const rows = all<{ id: number; title: string; subject: string; description: string | null; mime: string; created_at: string }>(
    `SELECT id, title, subject, description, mime, created_at FROM worksheets
     WHERE (grade IS NULL OR grade = ?) ${subject ? "AND subject = ?" : ""}
     ORDER BY subject, title`,
    user.grade, ...(subject ? [subject] : []),
  );
  const subjects = Array.from(new Set(all<{ subject: string }>("SELECT DISTINCT subject FROM worksheets").map((r) => r.subject)));
  const current = rows.find((r) => String(r.id) === open);

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Worksheets</h1>
          <p className="lede">{rows.length} available for Grade {user.grade ?? "all"}.</p>
        </div>
        <div className="tabs noprint">
          <Link href="/student/worksheets" className={!subject ? "active" : ""}>All</Link>
          {subjects.map((s) => (
            <Link key={s} href={`?subject=${encodeURIComponent(s)}`} className={subject === s ? "active" : ""}>{s}</Link>
          ))}
        </div>
      </div>

      {current && (
        <div className="card fadein">
          <div className="hdr">
            <h2>{current.title} <span className="muted" style={{ fontWeight: 400 }}>· {current.subject}</span></h2>
            <Link className="btn subtle small" href={subject ? `?subject=${encodeURIComponent(subject)}` : "/student/worksheets"}>Close</Link>
          </div>
          <Viewer src={`/files/worksheet/${current.id}`} mime={current.mime} title={current.title} />
          <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
            Read-only material for your own revision. Please don&apos;t share it.
          </p>
        </div>
      )}

      <div className="card">
        {rows.length ? (
          <div className="list">
            {rows.map((w, i) => (
              <Link key={w.id} href={`?open=${w.id}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`}
                className="row" style={{ color: "inherit", textDecoration: "none" }}>
                <div className={`ico ${i % 3 === 1 ? "v2" : i % 3 === 2 ? "v3" : ""}`}><I.book width={18} height={18} /></div>
                <div className="meta">
                  <b>{w.title}</b>
                  <small>{w.subject} · added {fmtDate(w.created_at)}{w.description ? ` · ${w.description}` : ""}</small>
                </div>
                <I.arrow width={16} height={16} className="arrow" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="big"><I.book width={22} height={22} /></div>
            <h3>No worksheets yet</h3>
            <p>Your teacher hasn&apos;t published anything for your grade.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
