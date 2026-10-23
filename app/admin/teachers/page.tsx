import { addTeacher, setActive } from "@/app/actions/admin";
import { Flash, Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const teachers = all<{ id: number; name: string; email: string; school: string | null; referral_code: string; active: number; referred: number; pending: number }>(
    `SELECT t.id, t.name, t.email, t.school, t.referral_code, t.active,
       (SELECT COUNT(*) FROM users s WHERE s.referred_by = t.id) referred,
       (SELECT COUNT(*) FROM attempts a WHERE a.assigned_teacher_id = t.id AND a.status='submitted') pending
     FROM users t WHERE t.role='teacher' ORDER BY t.name`);
  return (
    <Shell user={user}>
      <h1>Teachers</h1>
      <Flash searchParams={searchParams} />
      <form action={addTeacher} className="card">
        <h2>Add teacher</h2>
        <div className="fields">
          <div><label>Name</label><input name="name" required /></div>
          <div><label>Email</label><input name="email" type="email" required /></div>
          <div><label>Temporary password</label><input name="password" minLength={8} required /></div>
          <div><label>School</label><input name="school" /></div>
        </div>
        <button className="btn">Add teacher</button>
      </form>
      <div className="card tablewrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Referral code</th><th>Referred</th><th>To correct</th><th /></tr></thead>
        <tbody>{teachers.map((t) => (
          <tr key={t.id}><td>{t.name} {!t.active && <span className="badge bad">disabled</span>}</td><td>{t.email}</td>
            <td><code>{t.referral_code}</code></td><td>{t.referred}</td><td>{t.pending}</td>
            <td><form action={setActive}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="active" value={t.active ? 0 : 1} />
              <button className="btn ghost small">{t.active ? "Disable" : "Enable"}</button></form></td></tr>
        ))}</tbody>
      </table></div>
    </Shell>
  );
}
