import { Shell, Stat } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("teacher");
  const students = all<{ name: string; created_at: string }>("SELECT name, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC", user.id);
  const pay = all<{ amount: number; status: string; note: string | null; created_at: string; paid_at: string | null; student: string | null }>(
    "SELECT p.amount, p.status, p.note, p.created_at, p.paid_at, s.name student FROM payments p LEFT JOIN users s ON s.id = p.student_id WHERE p.teacher_id = ? ORDER BY p.created_at DESC", user.id);
  const sum = (st: string) => pay.filter((p) => p.status === st).reduce((a, p) => a + p.amount, 0);
  return (
    <Shell user={user}>
      <h1>Referrals</h1>
      <div className="card">Share your code with students when they register: <b style={{ fontSize: 20 }}><code>{user.referral_code}</code></b></div>
      <div className="grid"><Stat label="Referred students" value={students.length} /><Stat label="Pending" value={sum("pending")} /><Stat label="Paid" value={sum("paid")} /></div>
      <div className="card tablewrap"><h2>Payments</h2><table>
        <thead><tr><th>Date</th><th>Student</th><th>Amount</th><th>Note</th><th>Status</th></tr></thead>
        <tbody>{pay.map((p, i) => <tr key={i}><td>{fmtDate(p.created_at)}</td><td>{p.student ?? "—"}</td><td>{p.amount}</td><td>{p.note ?? ""}</td><td>{p.status === "paid" ? `Paid ${fmtDate(p.paid_at)}` : "Pending"}</td></tr>)}
        {!pay.length && <tr><td colSpan={5} className="muted">No entries yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
