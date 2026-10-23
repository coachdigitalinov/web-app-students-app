import Link from "next/link";
import { I } from "@/components/Icons";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";

const FILTERS = [
  { k: "", label: "All" },
  { k: "new", label: "New" },
  { k: "in_progress", label: "In progress" },
  { k: "submitted", label: "Submitted" },
  { k: "corrected", label: "Corrected" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string; f?: string }> }) {
  const user = await requireUser("student");
  const { f } = await searchParams;
  const rows = all<{ id: number; title: string; subject: string; total_marks: number; duration_minutes: number; status: string | null; late: number | null; marks: number | null }>(
    `SELECT t.id, t.title, t.subject, t.total_marks, t.duration_minutes, a.status, a.late, a.marks FROM tests t
     LEFT JOIN attempts a ON a.test_id = t.id AND a.student_id = ?
     WHERE t.published = 1 AND (t.grade IS NULL OR t.grade = ?) ORDER BY t.created_at DESC`,
    user.id, user.grade,
  );
  const filtered = rows.filter((r) => {
    if (!f) return true;
    if (f === "new") return !r.status;
    return r.status === f;
  });

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Tests</h1>
          <p className="lede">{rows.length} available · {rows.filter((r) => !r.status).length} not started.</p>
        </div>
        <div className="tabs noprint">
          {FILTERS.map((x) => (
            <Link key={x.k} href={x.k ? `?f=${x.k}` : "?"} className={(!f && !x.k) || f === x.k ? "active" : ""}>
              {x.label}
            </Link>
          ))}
        </div>
      </div>
      <Flash searchParams={searchParams} />

      <div className="card">
        <div className="tablewrap">
          <table>
            <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Time</th><th>Status</th><th /></tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="rowfade">
                  <td><b>{t.title}</b></td>
                  <td className="muted">{t.subject}</td>
                  <td>{t.marks !== null ? <b>{t.marks} / {t.total_marks}</b> : t.total_marks}</td>
                  <td className="muted">{t.duration_minutes} min</td>
                  <td>{t.status ? <StatusBadge status={t.status} late={t.late ?? 0} /> : <span className="badge live">New</span>}</td>
                  <td style={{ textAlign: "right" }}>
                    <Link href={`/student/tests/${t.id}`} className={`btn ${!t.status ? "" : "ghost"} small`}>
                      {!t.status ? "Open" : t.status === "in_progress" ? "Continue" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6}>
                  <div className="empty"><div className="big"><I.test width={22} height={22} /></div>
                    <h3>Nothing here</h3><p>No tests match this filter.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
