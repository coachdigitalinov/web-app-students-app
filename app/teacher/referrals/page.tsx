import { I } from "@/components/Icons";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDate } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("teacher");
  const students = all<{ name: string; created_at: string }>(
    "SELECT name, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC", user.id,
  );
  const pay = all<{ amount: number; status: string; note: string | null; created_at: string; paid_at: string | null; student: string | null }>(
    `SELECT p.amount, p.status, p.note, p.created_at, p.paid_at, s.name student
     FROM payments p LEFT JOIN users s ON s.id = p.student_id
     WHERE p.teacher_id = ? ORDER BY p.created_at DESC`, user.id,
  );
  const sum = (st: string) => pay.filter((p) => p.status === st).reduce((a, p) => a + p.amount, 0);

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>Referrals</h1>
          <p className="lede">Your referral code and payment history.</p>
        </div>
      </div>

      <div className="cols">
        <div>
          <div className="card">
            <div className="hdr"><h2>Your referral code</h2></div>
            <div style={{ padding: "14px 0" }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>
                <code className="badge" style={{ fontSize: 22, padding: "6px 14px" }}>{user.referral_code ?? "—"}</code>
              </div>
              <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: 13 }}>
                Students who sign up with this code are counted as yours.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="hdr"><h2>Payment history</h2></div>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Date</th><th>Student</th><th>Amount</th><th>Note</th><th>Status</th></tr></thead>
                <tbody>
                  {pay.map((p, i) => (
                    <tr key={i} className="rowfade">
                      <td className="muted">{fmtDate(p.created_at)}</td>
                      <td>{p.student ?? "—"}</td>
                      <td><b>₹{p.amount.toLocaleString()}</b></td>
                      <td className="muted">{p.note ?? ""}</td>
                      <td>{p.status === "paid"
                        ? <span className="badge good">Paid {fmtDate(p.paid_at)}</span>
                        : <span className="badge pending">Pending</span>}</td>
                    </tr>
                  ))}
                  {!pay.length && (
                    <tr><td colSpan={5}>
                      <div className="empty"><div className="big"><I.money width={22} height={22} /></div>
                        <h3>No payments yet</h3></div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside>
          <div className="tiles" style={{ gridTemplateColumns: "1fr" }}>
            <div className="tile v4"><div className="deco" />
              <div className="ico"><I.users width={22} height={22} /></div>
              <div className="num">{students.length}</div><div className="lbl">Referred students</div>
            </div>
            <div className="tile v2"><div className="deco" />
              <div className="ico"><I.money width={22} height={22} /></div>
              <div className="num">₹{sum("pending").toLocaleString()}</div><div className="lbl">Pending</div>
            </div>
            <div className="tile"><div className="deco" />
              <div className="ico"><I.check width={22} height={22} /></div>
              <div className="num">₹{sum("paid").toLocaleString()}</div><div className="lbl">Paid</div>
            </div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
