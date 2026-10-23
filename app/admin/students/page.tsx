import Link from "next/link";
import { addStudent, setActive } from "@/app/actions/admin";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { Flash, Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const students = all<{
    id: number; name: string; email: string; grade: string | null; school: string | null;
    active: number; created_at: string; teacher: string | null; attempts: number; corrected: number;
  }>(
    `SELECT s.id, s.name, s.email, s.grade, s.school, s.active, s.created_at, t.name teacher,
       (SELECT COUNT(*) FROM attempts a WHERE a.student_id = s.id) attempts,
       (SELECT COUNT(*) FROM attempts a WHERE a.student_id = s.id AND a.status='corrected') corrected
     FROM users s LEFT JOIN users t ON t.id = s.referred_by
     WHERE s.role='student' ORDER BY s.created_at DESC`,
  );
  const teachers = all<{ id: number; name: string }>(
    "SELECT id, name FROM users WHERE role='teacher' AND active=1 ORDER BY name",
  );

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Students</h1>
          <p className="lede">{students.length} total · manage accounts, grades and referrals.</p>
        </div>
        <a href="#add" className="btn"><I.upload width={14} height={14} /> Add student</a>
      </div>
      <Flash searchParams={searchParams} />

      <div className="card">
        <div className="hdr">
          <h2>All students</h2>
          <span className="muted" style={{ fontSize: 12 }}>Click a name to open their profile</span>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Student</th><th>Grade</th><th>School</th><th>Referred by</th><th>Progress</th><th>Joined</th><th /></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="rowfade">
                  <td>
                    <Link href={`/students/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <span className="cell-user">
                        <Avatar name={s.name} />
                        <span><b>{s.name}</b> {!s.active && <span className="badge bad">disabled</span>}
                          <small>{s.email}</small></span>
                      </span>
                    </Link>
                  </td>
                  <td>{s.grade ? <span className="badge progress">Grade {s.grade}</span> : <span className="muted">—</span>}</td>
                  <td className="muted">{s.school ?? "—"}</td>
                  <td className="muted">{s.teacher ?? "—"}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 110 }}>
                      <span style={{ fontSize: 12 }}>{s.corrected} / {s.attempts} corrected</span>
                      <div className="bar"><i style={{ width: `${s.attempts ? (s.corrected / s.attempts) * 100 : 0}%` }} /></div>
                    </div>
                  </td>
                  <td className="muted">{fmtDate(s.created_at)}</td>
                  <td style={{ textAlign: "right" }}>
                    <form action={setActive} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="active" value={s.active ? 0 : 1} />
                      <button className="btn subtle small">{s.active ? "Disable" : "Enable"}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!students.length && (
                <tr><td colSpan={7}>
                  <div className="empty"><div className="big"><I.users width={22} height={22} /></div>
                    <h3>No students yet</h3><p>Add your first student with the form below.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form action={addStudent} id="add" className="card">
        <div className="hdr"><h2>Add a student</h2><span className="muted" style={{ fontSize: 12 }}>Account is created immediately with the temporary password you set.</span></div>
        <div className="fields">
          <div><label>Full name</label><input name="name" required /></div>
          <div><label>Email</label><input name="email" type="email" required /></div>
          <div><label>Temporary password</label><input name="password" minLength={8} required /></div>
          <div><label>School</label><input name="school" /></div>
          <div><label>Grade</label><input name="grade" placeholder="e.g. 10" /></div>
          <div><label>Referred by</label>
            <select name="referred_by"><option value="">— none —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select></div>
        </div>
        <button className="btn">Add student</button>
      </form>
    </Shell>
  );
}
