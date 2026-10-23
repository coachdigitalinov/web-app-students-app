import Link from "next/link";
import { I } from "@/components/Icons";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate, pct } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("student");
  const rows = all<{ id: number; title: string; subject: string; marks: number; total_marks: number; corrected_at: string; feedback: string | null }>(
    `SELECT a.id, t.title, t.subject, a.marks, t.total_marks, a.corrected_at, a.feedback
     FROM attempts a JOIN tests t ON t.id = a.test_id
     WHERE a.student_id = ? AND a.status='corrected' ORDER BY a.corrected_at DESC`, user.id,
  );
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + pct(r.marks, r.total_marks), 0) / rows.length) : 0;
  const best = rows.length ? Math.max(...rows.map((r) => pct(r.marks, r.total_marks))) : 0;

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Results</h1>
          <p className="lede">{rows.length} corrected · {avg}% average · {best}% best score.</p>
        </div>
        <Link href={`/report/${user.id}`} className="btn ghost noprint">
          <I.trend width={14} height={14} /> Open full report
        </Link>
      </div>

      <div className="card">
        <div className="hdr"><h2>All corrected tests</h2></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Score</th><th>Corrected</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => {
                const p = pct(r.marks, r.total_marks);
                return (
                  <tr key={r.id} className="rowfade">
                    <td><b>{r.title}</b></td>
                    <td className="muted">{r.subject}</td>
                    <td>{r.marks} / {r.total_marks}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 160 }}>
                        <div className="bar" style={{ flex: 1 }}><i style={{ width: `${p}%` }} /></div>
                        <b style={{ fontVariantNumeric: "tabular-nums" }}>{p}%</b>
                      </div>
                    </td>
                    <td className="muted">{fmtDate(r.corrected_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/correct/${r.id}`} className="btn ghost small">Feedback</Link>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={6}>
                  <div className="empty"><div className="big"><I.check width={22} height={22} /></div>
                    <h3>No results yet</h3><p>Take and submit a test — once your teacher corrects it, it will appear here.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
