import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { ProgressRing } from "@/components/ProgressRing";
import { Shell, StatusBadge } from "@/components/Shell";
import { TrendChart } from "@/components/TrendChart";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { fmtDateTime } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("teacher");

  const n = (sql: string) => get<{ n: number }>(sql, user.id)!.n;
  const pending = n("SELECT COUNT(*) n FROM attempts WHERE assigned_teacher_id=? AND status='submitted'");
  const correctedAll = n("SELECT COUNT(*) n FROM attempts WHERE corrected_by=?");
  const referred = n("SELECT COUNT(*) n FROM users WHERE referred_by=?");

  const paid = get<{ s: number | null }>("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE teacher_id=? AND status='paid'", user.id)!.s ?? 0;
  const pendingPay = get<{ s: number | null }>("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE teacher_id=? AND status='pending'", user.id)!.s ?? 0;

  // 7-day correction throughput.
  const trend: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const c = get<{ n: number }>(
      "SELECT COUNT(*) n FROM attempts WHERE corrected_by=? AND corrected_at>=? AND corrected_at<?",
      user.id, d.toISOString(), next.toISOString(),
    )!.n;
    trend.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2), value: c });
  }
  const todo = all<{ id: number; student: string; test: string; subject: string; submitted_at: string; late: number }>(
    `SELECT a.id, u.name student, t.title test, t.subject, a.submitted_at, a.late
     FROM attempts a JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id
     WHERE a.assigned_teacher_id = ? AND a.status='submitted' ORDER BY a.submitted_at ASC LIMIT 6`,
    user.id,
  );
  const students = all<{ id: number; name: string; grade: string | null; avg: number; count: number }>(
    `SELECT u.id, u.name, u.grade,
       ROUND(AVG(a.marks * 100.0 / t.total_marks), 1) avg,
       COUNT(a.id) count
     FROM users u LEFT JOIN attempts a ON a.student_id = u.id AND a.status='corrected'
     LEFT JOIN tests t ON t.id = a.test_id
     WHERE u.role='student' AND (u.referred_by = ? OR EXISTS (SELECT 1 FROM attempts z WHERE z.student_id = u.id AND z.assigned_teacher_id = ?))
     GROUP BY u.id ORDER BY u.name LIMIT 6`,
    user.id, user.id,
  );

  const avg = Math.round(trend.reduce((s, d) => s + d.value, 0));
  const classAvg = students.length
    ? Math.round(students.filter((s) => s.avg).reduce((a, b) => a + (b.avg ?? 0), 0) / Math.max(1, students.filter((s) => s.avg).length))
    : 0;

  const tiles = [
    { label: "To correct", value: pending, link: "/teacher/submissions", sub: `${correctedAll} corrected all-time`, cls: "" },
    { label: "Referred students", value: referred, link: "/teacher/referrals", sub: `Code ${user.referral_code ?? "—"}`, cls: "v2" },
    { label: "Pending payout", value: `₹${pendingPay.toLocaleString()}`, link: "/teacher/referrals", sub: `₹${paid.toLocaleString()} paid`, cls: "v3" },
  ];
  const tileIcons = [I.inbox, I.tag, I.money] as const;

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

      <div className="cols fadein">
        <div>
          <div className="card">
            <div className="hdr">
              <h2>Needs your attention</h2>
              <Link href="/teacher/submissions">All →</Link>
            </div>
            {todo.length ? (
              <div className="tablewrap"><table>
                <thead><tr><th>Student</th><th>Test</th><th>Submitted</th><th /></tr></thead>
                <tbody>{todo.map((r) => (
                  <tr key={r.id} className="rowfade">
                    <td><span className="cell-user"><Avatar name={r.student} size="sm" /><span>{r.student}<small>{r.subject}</small></span></span></td>
                    <td>{r.test}</td>
                    <td className="muted">{fmtDateTime(r.submitted_at)} {r.late ? <span className="badge bad">late</span> : null}</td>
                    <td style={{ textAlign: "right" }}><Link href={`/correct/${r.id}`} className="btn ghost small">Correct</Link></td>
                  </tr>
                ))}</tbody>
              </table></div>
            ) : <p className="muted">All caught up — nothing waiting on you.</p>}
          </div>

          <div className="card">
            <div className="hdr">
              <h2>Your students</h2>
              <Link href="/teacher/students">All →</Link>
            </div>
            <div className="list">
              {students.length ? students.map((s) => (
                <Link key={s.id} href={`/students/${s.id}`} className="row" style={{ color: "inherit", textDecoration: "none" }}>
                  <div className="ico" style={{ background: "transparent", padding: 0 }}><Avatar name={s.name} /></div>
                  <div className="meta">
                    <b>{s.name}</b>
                    <small>Grade {s.grade ?? "—"} · {s.count || 0} corrected</small>
                  </div>
                  {s.avg ? <span className="badge good">{s.avg}%</span> : <span className="badge">—</span>}
                </Link>
              )) : <p className="muted">You have no students yet.</p>}
            </div>
          </div>
        </div>

        <aside>
          <div className="card">
            <div className="hdr">
              <h2>Class average</h2>
              <span className="muted" style={{ fontSize: 12 }}>Corrected only</span>
            </div>
            <ProgressRing percent={classAvg} label={`${students.length} students`} />
          </div>

          <div className="card">
            <div className="hdr">
              <h2>This week</h2>
              <span className="badge progress">{avg} corrections</span>
            </div>
            <TrendChart data={trend} color="#7f6cff" height={160} />
          </div>
        </aside>
      </div>
    </Shell>
  );
}
