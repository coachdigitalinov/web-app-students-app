import Link from "next/link";
import { ActivityChart } from "@/components/ActivityChart";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { MiniCalendar } from "@/components/MiniCalendar";
import { ProgressRing } from "@/components/ProgressRing";
import { Shell, StatusBadge } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { progressStatus, studentResults } from "@/lib/progress";
import { weeklyActivity, upcomingTestDays } from "@/lib/activity";
import { fmtDate, pct } from "@/lib/util";

interface EnrolledRow {
  id: number;
  title: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  teacher: string | null;
  status: string | null;
  late: number | null;
}

interface UpcomingRow {
  title: string;
  subject: string;
  duration_minutes: number;
  created_at: string;
}

interface AssignmentRow {
  id: number;
  title: string;
  subject: string;
  deadline_at: string | null;
}

export default async function Page() {
  const user = await requireUser("student");

  // Enrolled courses == tests the student can see
  const enrolled = all<EnrolledRow>(
    `SELECT t.id, t.title, t.subject, t.duration_minutes, t.total_marks,
       (SELECT u.name FROM users u WHERE u.role='admin' LIMIT 1) teacher,
       a.status, a.late
     FROM tests t LEFT JOIN attempts a ON a.test_id = t.id AND a.student_id = ?
     WHERE t.published = 1 AND (t.grade IS NULL OR t.grade = ?) ORDER BY t.created_at DESC LIMIT 6`,
    user.id, user.grade,
  );

  const upcoming = all<UpcomingRow>(
    `SELECT t.title, t.subject, t.duration_minutes, t.created_at FROM tests t
     WHERE t.published = 1 AND (t.grade IS NULL OR t.grade = ?)
     AND NOT EXISTS (SELECT 1 FROM attempts a WHERE a.test_id = t.id AND a.student_id = ?)
     ORDER BY t.created_at DESC LIMIT 3`, user.grade, user.id,
  );

  const assignments = all<AssignmentRow>(
    `SELECT a.id, t.title, t.subject, a.deadline_at FROM attempts a
     JOIN tests t ON t.id = a.test_id
     WHERE a.student_id = ? AND a.status = 'in_progress' ORDER BY a.deadline_at ASC LIMIT 3`,
    user.id,
  );

  const results = studentResults(user.id);
  const platform = results.filter((r) => r.kind === "platform");
  const avgPercent = platform.length ? Math.round(platform.reduce((s, r) => s + r.percent, 0) / platform.length) : 0;
  const status = progressStatus(results);
  const correctedCount = platform.length;
  const worksheetsCount = get<{ n: number }>(
    "SELECT COUNT(*) n FROM worksheets WHERE grade IS NULL OR grade = ?", user.grade,
  )!.n;
  const activity = weeklyActivity(user.id);
  const peak = activity.reduce((a, b) => (a.value >= b.value ? a : b));
  const totalThisWeek = activity.reduce((s, d) => s + d.value, 0);
  const busyDays = upcomingTestDays(user.id, user.grade);

  const tileIcons = [I.book, I.test, I.check] as const;

  return (
    <Shell user={user}>
      {/* ---- Stat tiles ---- */}
      <section className="tiles">
        {[
          { label: "Worksheets", value: worksheetsCount, link: "/student/worksheets", cls: "" },
          { label: "Tests available", value: enrolled.length, link: "/student/tests", cls: "v2" },
          { label: "Tests completed", value: correctedCount, link: "/student/results", cls: "v3" },
        ].map((t, i) => {
          const Icon = tileIcons[i];
          return (
            <div key={t.label} className={`tile ${t.cls}`}>
              <div className="deco" />
              <div className="ico"><Icon width={22} height={22} /></div>
              <div className="num">{t.value}</div>
              <div className="lbl">{t.label}</div>
              <Link className="link" href={t.link}>View details <I.arrow width={12} height={12} /></Link>
            </div>
          );
        })}
      </section>

      <div className="cols">
        <div>
          {/* ---- Enrolled courses table ---- */}
          <div className="card">
            <div className="hdr">
              <h2>Enrolled tests</h2>
              <Link href="/student/tests">View all →</Link>
            </div>
            {enrolled.length ? (
              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Marks</th>
                      <th>Duration</th>
                      <th>Added by</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {enrolled.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <b>{r.title}</b>
                          <small className="muted" style={{ display: "block", fontSize: 11.5 }}>{r.subject}</small>
                        </td>
                        <td>{r.total_marks}</td>
                        <td>{r.duration_minutes} min</td>
                        <td>
                          {r.teacher ? (
                            <span className="cell-user">
                              <Avatar name={r.teacher} size="sm" />
                              <span>{r.teacher}</span>
                            </span>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td>
                          {r.status ? <StatusBadge status={r.status} late={r.late ?? 0} />
                            : <span className="badge live">New</span>}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link href={`/student/tests/${r.id}`} className="muted" aria-label="Open test">
                            <I.arrow width={16} height={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="muted">No tests published for you yet.</p>}
          </div>

          {/* ---- Assignments + Progress ring ---- */}
          <div className="cols-eq">
            <div className="card">
              <div className="hdr">
                <h2>In progress</h2>
                <Link href="/student/tests">View all →</Link>
              </div>
              {assignments.length ? (
                <div className="list">
                  {assignments.map((a, i) => {
                    const cls = ["", "v2", "v3"][i % 3];
                    const Icon = [I.book, I.test, I.upload][i % 3];
                    return (
                      <Link key={a.id} href={`/student/tests/${a.id}`} className="row" style={{ textDecoration: "none", color: "inherit" }}>
                        <div className={`ico ${cls}`}><Icon width={18} height={18} /></div>
                        <div className="meta">
                          <b>{a.title}</b>
                          <small>Deadline {a.deadline_at ? new Date(a.deadline_at).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</small>
                        </div>
                        <I.arrow className="arrow" width={16} height={16} />
                      </Link>
                    );
                  })}
                </div>
              ) : <p className="muted">You have no tests in progress. Start one from the tests page.</p>}
            </div>

            <div className="card">
              <div className="hdr">
                <h2>Overall progress</h2>
                <Link href="/student/progress">Details →</Link>
              </div>
              <ProgressRing percent={avgPercent} label={platform.length ? `${platform.length} tests` : "no data"} />
              <p className="muted" style={{ textAlign: "center", marginTop: 10, fontSize: 12 }}>
                {status.label} — keep working on your weak areas.
              </p>
            </div>
          </div>
        </div>

        <aside>
          {/* ---- Activity sidebar ---- */}
          <div className="card">
            <div style={{ display: "grid", placeItems: "center", padding: "6px 0 14px" }}>
              <Avatar name={user.name} size="lg" />
              <div style={{ marginTop: 10, fontWeight: 600 }}>{user.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>Grade {user.grade ?? "—"}</div>
            </div>
            <div className="hdr">
              <h2>Weekly activity</h2>
              <span className="badge progress">{totalThisWeek} actions</span>
            </div>
            <ActivityChart data={activity} />
            <p className="muted" style={{ fontSize: 11.5, textAlign: "center", margin: "6px 0 0" }}>
              Peak day: <b className="good">{peak.label}</b>
            </p>
          </div>

          {/* ---- Calendar + upcoming ---- */}
          <div className="card">
            <div className="hdr">
              <h2>Calendar</h2>
              <span className="muted" style={{ fontSize: 12 }}>This month</span>
            </div>
            <MiniCalendar busyDays={busyDays} />
            <h2 style={{ marginTop: 16 }}>Upcoming tests</h2>
            {upcoming.length ? (
              <div className="upcoming">
                {upcoming.map((u, i) => (
                  <div key={i} className="u">
                    <div className={`tag ${i % 2 ? "v2" : ""}`}>{fmtDate(u.created_at).slice(0, 6)}</div>
                    <div className="meta">
                      <b>{u.title}</b>
                      <small>{u.subject} · {u.duration_minutes} min</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="muted" style={{ fontSize: 12 }}>Nothing scheduled.</p>}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
