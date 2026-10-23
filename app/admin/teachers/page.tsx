import { addTeacher, setActive } from "@/app/actions/admin";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { Flash, Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const teachers = all<{
    id: number; name: string; email: string; school: string | null; referral_code: string;
    active: number; referred: number; pending: number; corrected: number;
  }>(
    `SELECT t.id, t.name, t.email, t.school, t.referral_code, t.active,
       (SELECT COUNT(*) FROM users s WHERE s.referred_by = t.id) referred,
       (SELECT COUNT(*) FROM attempts a WHERE a.assigned_teacher_id = t.id AND a.status='submitted') pending,
       (SELECT COUNT(*) FROM attempts a WHERE a.corrected_by = t.id) corrected
     FROM users t WHERE t.role='teacher' ORDER BY t.name`,
  );
  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Teachers</h1>
          <p className="lede">{teachers.length} active · each has their own referral code.</p>
        </div>
        <a href="#add" className="btn"><I.teacher width={14} height={14} /> Add teacher</a>
      </div>
      <Flash searchParams={searchParams} />

      <div className="card">
        <div className="hdr"><h2>All teachers</h2></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Teacher</th><th>Code</th><th>Referred</th><th>To correct</th><th>Lifetime</th><th /></tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="rowfade">
                  <td>
                    <span className="cell-user">
                      <Avatar name={t.name} />
                      <span><b>{t.name}</b> {!t.active && <span className="badge bad">disabled</span>}
                        <small>{t.email} · {t.school ?? "No school"}</small></span>
                    </span>
                  </td>
                  <td><code className="badge">{t.referral_code}</code></td>
                  <td>{t.referred}</td>
                  <td>{t.pending > 0 ? <span className="badge pending">{t.pending} waiting</span> : <span className="badge good">clear</span>}</td>
                  <td className="muted">{t.corrected} corrections</td>
                  <td style={{ textAlign: "right" }}>
                    <form action={setActive} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="active" value={t.active ? 0 : 1} />
                      <button className="btn subtle small">{t.active ? "Disable" : "Enable"}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!teachers.length && (
                <tr><td colSpan={6}>
                  <div className="empty"><div className="big"><I.teacher width={22} height={22} /></div>
                    <h3>No teachers yet</h3><p>Add your first teacher below to start assigning corrections.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form action={addTeacher} id="add" className="card">
        <div className="hdr"><h2>Add a teacher</h2><span className="muted" style={{ fontSize: 12 }}>A unique referral code is generated automatically.</span></div>
        <div className="fields">
          <div><label>Full name</label><input name="name" required /></div>
          <div><label>Email</label><input name="email" type="email" required /></div>
          <div><label>Temporary password</label><input name="password" minLength={8} required /></div>
          <div><label>School</label><input name="school" /></div>
        </div>
        <button className="btn">Add teacher</button>
      </form>
    </Shell>
  );
}
