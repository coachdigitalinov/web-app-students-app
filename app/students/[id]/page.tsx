import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addSchoolTest } from "@/app/actions/staff";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { canViewStudent } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { all, get, type User } from "@/lib/db";
import { progressStatus, studentResults } from "@/lib/progress";
import { fmtDate } from "@/lib/util";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin", "teacher");
  const sid = Number((await params).id);
  if (!canViewStudent(user, sid)) redirect("/");
  const s = get<User & { teacher: string | null }>(
    "SELECT s.*, t.name teacher FROM users s LEFT JOIN users t ON t.id = s.referred_by WHERE s.id = ? AND s.role = 'student'", sid);
  if (!s) notFound();
  const results = studentResults(sid);
  const status = progressStatus(results);
  const attempts = all<{ id: number; title: string; status: string; late: number; marks: number | null; total_marks: number }>(
    `SELECT a.id, t.title, a.status, a.late, a.marks, t.total_marks FROM attempts a JOIN tests t ON t.id = a.test_id
     WHERE a.student_id = ? ${user.role === "teacher" ? "AND a.assigned_teacher_id = ?" : ""} ORDER BY a.started_at DESC`,
    sid, ...(user.role === "teacher" ? [user.id] : []));
  const school = all<{ name: string; subject: string; marks: number; total: number; taken_on: string }>(
    "SELECT name, subject, marks, total, taken_on FROM school_tests WHERE student_id = ? ORDER BY taken_on DESC", sid);
  return (
    <Shell user={user}>
      <h1>{s.name}</h1>
      <Flash searchParams={searchParams} />
      <div className="card">
        <p>{s.email} · Grade {s.grade ?? "—"} · {s.school ?? "No school set"} · Referred by {s.teacher ?? "—"}</p>
        <p>Progress: <span className={status.tone}>{status.label}</span> · <Link href={`/report/${s.id}`}>Open report</Link></p>
      </div>
      <div className="card tablewrap"><h2>Platform tests</h2><table>
        <thead><tr><th>Test</th><th>Status</th><th>Marks</th><th /></tr></thead>
        <tbody>{attempts.map((a) => (
          <tr key={a.id}><td>{a.title}</td><td><StatusBadge status={a.status} late={a.late} /></td><td>{a.marks ?? "—"} / {a.total_marks}</td>
            <td>{a.status !== "in_progress" && <Link href={`/correct/${a.id}`}>Open</Link>}</td></tr>
        ))}
        {!attempts.length && <tr><td colSpan={4} className="muted">None.</td></tr>}</tbody>
      </table></div>
      <div className="card tablewrap"><h2>School tests</h2><table>
        <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Date</th></tr></thead>
        <tbody>{school.map((t, i) => <tr key={i}><td>{t.name}</td><td>{t.subject}</td><td>{t.marks} / {t.total}</td><td>{fmtDate(t.taken_on)}</td></tr>)}
        {!school.length && <tr><td colSpan={4} className="muted">None recorded.</td></tr>}</tbody>
      </table></div>
      <form action={addSchoolTest} className="card">
        <h2>Add school-test result</h2>
        <input type="hidden" name="student_id" value={s.id} />
        <div className="fields">
          <div><label>Test name</label><input name="name" required /></div>
          <div><label>Subject</label><input name="subject" required /></div>
          <div><label>Marks</label><input name="marks" type="number" min="0" step="any" required /></div>
          <div><label>Out of</label><input name="total" type="number" min="1" step="any" required /></div>
          <div><label>Date</label><input name="taken_on" type="date" required /></div>
        </div>
        <button className="btn">Add</button>
      </form>
    </Shell>
  );
}
