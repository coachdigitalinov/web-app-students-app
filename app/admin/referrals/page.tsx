import { addPayment, markPaid, setReferralFee } from "@/app/actions/admin";
import { Flash, Shell, Stat } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("admin");
  const fee = get<{ value: string }>("SELECT value FROM settings WHERE key='referral_fee'")?.value ?? "0";
  const teachers = all<{ id: number; name: string; referral_code: string; referred: number; pending: number; paid: number }>(
    `SELECT t.id, t.name, t.referral_code,
       (SELECT COUNT(*) FROM users s WHERE s.referred_by = t.id) referred,
       COALESCE((SELECT SUM(amount) FROM payments p WHERE p.teacher_id = t.id AND p.status='pending'),0) pending,
       COALESCE((SELECT SUM(amount) FROM payments p WHERE p.teacher_id = t.id AND p.status='paid'),0) paid
     FROM users t WHERE t.role='teacher' ORDER BY t.name`);
  const payments = all<{ id: number; teacher: string; student: string | null; amount: number; note: string | null; status: string; created_at: string; paid_at: string | null }>(
    `SELECT p.id, t.name teacher, s.name student, p.amount, p.note, p.status, p.created_at, p.paid_at
     FROM payments p JOIN users t ON t.id = p.teacher_id LEFT JOIN users s ON s.id = p.student_id ORDER BY p.created_at DESC LIMIT 200`);
  const totalPending = teachers.reduce((a, t) => a + t.pending, 0);
  return (
    <Shell user={user}>
      <h1>Referrals &amp; payments</h1>
      <Flash searchParams={searchParams} />
      <div className="grid">
        <Stat label="Total referred students" value={teachers.reduce((a, t) => a + t.referred, 0)} />
        <Stat label="Pending payout" value={totalPending} />
        <Stat label="Paid out" value={teachers.reduce((a, t) => a + t.paid, 0)} />
      </div>
      <div className="card row">
        <form action={setReferralFee} className="row">
          <div><label>Default fee per referred student</label><input name="fee" type="number" min="0" step="any" defaultValue={fee} /></div>
          <button className="btn small" style={{ alignSelf: "end" }}>Save</button>
        </form>
        <span className="muted">A pending entry is created automatically when a student registers with a teacher&apos;s code. Payments are tracked here only; nothing is paid online.</span>
      </div>
      <div className="card tablewrap"><h2>By teacher</h2><table>
        <thead><tr><th>Teacher</th><th>Code</th><th>Referred</th><th>Pending</th><th>Paid</th></tr></thead>
        <tbody>{teachers.map((t) => <tr key={t.id}><td>{t.name}</td><td><code>{t.referral_code}</code></td><td>{t.referred}</td><td>{t.pending}</td><td>{t.paid}</td></tr>)}</tbody>
      </table></div>
      <form action={addPayment} className="card">
        <h2>Add manual entry</h2>
        <div className="fields">
          <div><label>Teacher</label><select name="teacher_id" required>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div><label>Amount</label><input name="amount" type="number" min="0.01" step="any" required /></div>
          <div><label>Note</label><input name="note" /></div>
        </div>
        <button className="btn">Add</button>
      </form>
      <div className="card tablewrap"><h2>Ledger</h2><table>
        <thead><tr><th>Date</th><th>Teacher</th><th>Student</th><th>Amount</th><th>Note</th><th>Status</th></tr></thead>
        <tbody>{payments.map((p) => (
          <tr key={p.id}><td>{fmtDate(p.created_at)}</td><td>{p.teacher}</td><td>{p.student ?? "—"}</td><td>{p.amount}</td><td>{p.note ?? ""}</td>
            <td>{p.status === "paid" ? <span className="good">Paid {fmtDate(p.paid_at)}</span> :
              <form action={markPaid}><input type="hidden" name="id" value={p.id} /><button className="btn ghost small">Mark paid</button></form>}</td></tr>
        ))}
        {!payments.length && <tr><td colSpan={6} className="muted">No entries yet.</td></tr>}</tbody>
      </table></div>
    </Shell>
  );
}
