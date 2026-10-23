import Link from "next/link";
import { ActivityChart } from "@/components/ActivityChart";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { Shell, StatusBadge } from "@/components/Shell";
import { TrendChart } from "@/components/TrendChart";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { revenueTrend, submissionsTrend, topStudents } from "@/lib/admin-stats";
import { fmtDate, fmtDateTime, pct } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("admin");

  const n = (sql: string) => get<{ n: number }>(sql)!.n;
  const students = n("SELECT COUNT(*) n FROM users WHERE role='student' AND active=1");
  const teachers = n("SELECT COUNT(*) n FROM users WHERE role='teacher' AND active=1");
  const awaiting = n("SELECT COUNT(*) n FROM attempts WHERE status='submitted'");
  const corrected = n("SELECT COUNT(*) n FROM attempts WHERE status='corrected'");
  const paidTotal = get<{ s: number | null }>("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='paid'")!.s ?? 0;
  const pendingTotal = get<{ s: number | null }>("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='pending'")!.s ?? 0;

  const recent = all<{ id: number; student: string; test: string; subject: string; submitted_at: string; status: string; marks: number | null; total: number; late: number }>(
    `SELECT a.id, u.name student, t.title test, t.subject, a.submitted_at, a.status, a.marks, t.total_marks total, a.late
     FROM attempts a JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id
     WHERE a.status != 'in_progress' ORDER BY COALESCE(a.corrected_at, a.submitted_at) DESC LIMIT 6`,
  );
  const teacherRows = all<{ id: number; name: string; pending: number; corrected: number; referred: number }>(
    `SELECT u.id, u.name,
       (SELECT COUNT(*) FROM attempts a WHERE a.assigned_teacher_id = u.id AND a.status='submitted') pending,
       (SELECT COUNT(*) FROM attempts a WHERE a.corrected_by = u.id) corrected,
       (SELECT COUNT(*) FROM users s WHERE s.referred_by = u.id) referred
     FROM users u WHERE u.role='teacher' AND u.active=1 ORDER BY u.name LIMIT 5`,
  );
  const top = topStudents(5);
  const submissions = submissionsTrend();
  const revenue = revenueTrend();

  const tileIcons = [I.users, I.inbox, I.check, I.money] as const;
  const tiles = [
    { label: "Active students", value: students, link: "/admin/students", sub: `${teachers} teachers`, cls: "" },
    { label: "Awaiting correction", value: awaiting, link: "/admin/submissions?status=submitted", sub: `${corrected} corrected`, cls: "v2" },
    { label: "Corrected", value: corrected, link: "/admin/submissions?status=corrected", sub: "lifetime", cls: "v3" },
    { label: "Pending payouts", value: `₹${pendingTotal.toLocaleString()}`, link: "/admin/referrals", sub: `₹${paidTotal.toLocaleString()} paid`, cls: "" },
  ];

  return (
    <Shell user={user}>
      <section className="tiles stagger">
        {tiles.map((t, i) => {
          const Icon = tileIcons[i];
          return (
            <div key={t.label} className={`tile ${t.cls}`} style={{ animationDelay: `${i * 70}ms` }}>
              <div className="deco" />
              <div className="ico"><Icon width={22} height={22} /></div>
              <div className="num">{t.value}</div>
              <div className="lbl">{t.label}</div>
              <Link className="link" href={t.link}>{t.sub} <I.arrow width={12} height={12} /></Link>
            </div>
          );
        })}
      </section>

      <div className="cols-eq fadein">
        <div className="card">
          <div className="hdr">
            <h2>Submissions last 6 months</h2>
            <span className="badge progress">Trend</span>
          </div>
          <TrendChart data={submissions} color="#4262ff" />
        </div>
        <div className="card">
          <div className="hdr">
            <h2>Revenue (paid)</h2>
            <span className="badge good">+ growth</span>
          </div>
          <TrendChart data={revenue} color="#15a05a" />
        </div>
      </div>

      <div className="cols fadein">
        <div className="card">
          <div className="hdr">
            <h2>Recent submissions</h2>
            <Link href="/admin/submissions">View all →</Link>
          </div>
          {recent.length ? (
            <div className="tablewrap"><table>
              <thead><tr><th>Student</th><th>Test</th><th>When</th><th>Marks</th><th>Status</th><th /></tr></thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="rowfade">
                    <td><span className="cell-user"><Avatar name={r.student} size="sm" /><span>{r.student}<small>{r.subject}</small></span></span></td>
                    <td>{r.test}</td>
                    <td className="muted">{fmtDateTime(r.submitted_at)}</td>
                    <td>{r.marks !== null ? `${r.marks} / ${r.total}` : <span className="muted">—</span>}</td>
                    <td><StatusBadge status={r.status} late={r.late} /></td>
                    <td style={{ textAlign: "right" }}><Link href={`/correct/${r.id}`} className="muted"><I.arrow width={16} height={16} /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : <p className="muted">No submissions yet.</p>}
        </div>

        <aside>
          <div className="card">
            <div className="hdr">
              <h2>Top students</h2>
              <Link href="/admin/students">All →</Link>
            </div>
            <div className="list">
              {top.length ? top.map((s, i) => (
                <Link key={s.id} href={`/students/${s.id}`} className="row" style={{ color: "inherit", textDecoration: "none" }}>
                  <div className="ico" style={{ background: "transparent", padding: 0 }}><Avatar name={s.name} /></div>
                  <div className="meta">
                    <b>{s.name}</b>
                    <small>Grade {s.grade ?? "—"} · {s.count} tests</small>
                  </div>
                  <span className="badge good">{s.avg}%</span>
                </Link>
              )) : <p className="muted">No corrected tests yet.</p>}
            </div>
          </div>

          <div className="card">
            <div className="hdr">
              <h2>Teachers</h2>
              <Link href="/admin/teachers">Manage →</Link>
            </div>
            <div className="list">
              {teacherRows.map((t) => (
                <div key={t.id} className="row">
                  <div className="ico" style={{ background: "transparent", padding: 0 }}><Avatar name={t.name} /></div>
                  <div className="meta">
                    <b>{t.name}</b>
                    <small>{t.referred} referrals · {t.corrected} corrections</small>
                  </div>
                  {t.pending > 0 ? <span className="badge pending">{t.pending} to do</span> : <span className="badge good">clear</span>}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
