import Link from "next/link";
import { addStudent, setActive } from "@/app/actions/admin";
import { Flash, Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const students = all<{ id: number; name: string; email: string; grade: string | null; school: string | null; active: number; created_at: string; teacher: string | null }>(
    `SELECT s.id, s.name, s.email, s.grade, s.school, s.active, s.created_at, t.name teacher
     FROM users s LEFT JOIN users t ON t.id = s.referred_by WHERE s.role='student' ORDER BY s.created_at DESC`);
  const teachers = all<{ id: number; name: string }>("SELECT id, name FROM users WHERE role='teacher' AND active=1 ORDER BY name");
  return (
    <Shell user={user}>
      <h1>Students</h1>
      <Flash searchParams={searchParams} />
      <form action={addStudent} className="card">
        <h2>Add student</h2>
        <div className="fields">
          <div><label>Name</label><input name="name" required /></div>
          <div><label>Email</label><input name="email" type="email" required /></div>
          <div><label>Temporary password</label><input name="password" minLength={8} required /></div>
          <div><label>School</label><input name="school" /></div>
          <div><label>Grade</label><input name="grade" /></div>
          <div><label>Referred by</label>
            <select name="referred_by"><option value="">— none —</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
        </div>
        <button className="btn">Add student</button>
      </form>
      <div className="card tablewrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Grade</th><th>School</th><th>Referred by</th><th>Joined</th><th /></tr></thead>
        <tbody>{students.map((s) => (
          <tr key={s.id}>
            <td><Link href={`/students/${s.id}`}>{s.name}</Link> {!s.active && <span className="badge bad">disabled</span>}</td>
            <td>{s.email}</td><td>{s.grade ?? "—"}</td><td>{s.school ?? "—"}</td><td>{s.teacher ?? "—"}</td><td>{fmtDate(s.created_at)}</td>
            <td><form action={setActive}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="active" value={s.active ? 0 : 1} />
              <button className="btn ghost small">{s.active ? "Disable" : "Enable"}</button></form></td>
          </tr>
        ))}</tbody>
      </table></div>
    </Shell>
  );
}
