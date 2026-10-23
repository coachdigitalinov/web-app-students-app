import { addPayment, markPaid, setReferralFee } from "@/app/actions/admin";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { Flash, Shell } from "@/components/Shell";
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
     FROM users t WHERE t.role='teacher' ORDER BY t.name`,
  );
  const payments = all<{ id: number; teacher: string; student: string | null; amount: number; note: string | null; status: string; created_at: string; paid_at: string | null }>(
    `SELECT p.id, t.name teacher, s.name student, p.amount, p.note, p.status, p.created_at, p.paid_at
     FROM payments p JOIN users t ON t.id = p.teacher_id LEFT JOIN users s ON s.id = p.student_id
     ORDER BY p.created_at DESC LIMIT 200`,
  );
  const totalPending = teachers.reduce((a, t) => a + t.pending, 0);
  const totalPaid = teachers.reduce((a, t) => a + t.paid, 0);
  const totalReferred = teachers.reduce((a, t) => a + t.referred, 0);

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Referrals &amp; payments</h1>
          <p className="lede">Track referred students and payouts to teachers.</p>
        </div>
      </div>
      <Flash searchParams={searchParams} />

      <section className="tiles stagger">
        <div className="tile v4"><div className="deco" />
          <div className="ico"><I.users width={22} height={22} /></div>
          <div className="num">{totalReferred}</div><div className="lbl">Referred students</div>
          <div className="link">across {teachers.length} teachers</div>
        </div>
        <div className="tile v3"><div className="deco" />
          <div className="ico"><I.money width={22} height={22} /></div>
          <div className="num">₹{totalPending.toLocaleString()}</div><div className="lbl">Pending payout</div>
          <div className="link">awaiting mark-paid</div>
        </div>
        <div className="tile"><div className="deco" />
          <div className="ico"><I.check width={22} height={22} /></div>
          <div className="num">₹{totalPaid.toLocaleString()}</div><div className="lbl">Paid out</div>
          <div className="link">all time</div>
        </div>
      </section>

      <div className="cols">
        <div className="card">
          <div className="hdr"><h2>By teacher</h2></div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Teacher</th><th>Code</th><th>Referred</th><th>Pending</th><th>Paid</th></tr></thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="rowfade">
                    <td>
                      <span className="cell-user"><Avatar name={t.name} size="sm" /><span><b>{t.name}</b></span></span>
                    </td>
                    <td><code className="badge">{t.referral_code}</code></td>
                    <td>{t.referred}</td>
                    <td>{t.pending > 0 ? <span className="warn">₹{t.pending.toLocaleString()}</span> : <span className="muted">—</span>}</td>
                    <td>{t.paid > 0 ? <span className="good">₹{t.paid.toLocaleString()}</span> : <span className="muted">—</span>}</td>
                  </tr>
                ))}
                {!teachers.length && (
                  <tr><td colSpan={5}>
                    <div className="empty"><div className="big"><I.teacher width={22} height={22} /></div>
                      <h3>No teachers yet</h3></div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside>
          <form action={setReferralFee} className="card">
            <div className="hdr"><h2>Default fee</h2></div>
            <label>Per new referred student</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input name="fee" type="number" min="0" step="any" defaultValue={fee} />
              <button className="btn small">Save</button>
            </div>
            <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
              Only new referrals use this amount. Existing entries are unchanged.
            </p>
          </form>

          <form action={addPayment} className="card">
            <div className="hdr"><h2>Add manual entry</h2></div>
            <div className="fields">
              <div><label>Teacher</label>
                <select name="teacher_id" required>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label>Amount</label><input name="amount" type="number" min="0.01" step="any" required /></div>
              <div><label>Note</label><input name="note" placeholder="Why this payment?" /></div>
            </div>
            <button className="btn">Add entry</button>
          </form>
        </aside>
      </div>

      <div className="card">
        <div className="hdr"><h2>Ledger</h2><span className="muted" style={{ fontSize: 12 }}>Latest {payments.length}</span></div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Date</th><th>Teacher</th><th>Student</th><th>Amount</th><th>Note</th><th>Status</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="rowfade">
                  <td className="muted">{fmtDate(p.created_at)}</td>
                  <td>{p.teacher}</td>
                  <td className="muted">{p.student ?? "—"}</td>
                  <td><b>₹{p.amount.toLocaleString()}</b></td>
                  <td className="muted">{p.note ?? ""}</td>
                  <td>
                    {p.status === "paid"
                      ? <span className="badge good">Paid {fmtDate(p.paid_at)}</span>
                      : <form action={markPaid} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={p.id} />
                          <button className="btn subtle small">Mark paid</button>
                        </form>}
                  </td>
                </tr>
              ))}
              {!payments.length && (
                <tr><td colSpan={6}>
                  <div className="empty"><div className="big"><I.money width={22} height={22} /></div>
                    <h3>No ledger entries</h3><p>Referrals create entries automatically.</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
