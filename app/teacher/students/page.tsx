import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";

export default async function Page() {
  const user = await requireUser("teacher");
  const rows = all<{ id: number; name: string; grade: string | null; school: string | null; referred: number; corrected: number }>(
    `SELECT s.id, s.name, s.grade, s.school, (s.referred_by = ?) referred,
       (SELECT COUNT(*) FROM attempts a WHERE a.student_id = s.id AND a.status='corrected') corrected
     FROM users s
     WHERE s.role='student'
     AND (s.referred_by = ? OR EXISTS (SELECT 1 FROM attempts a WHERE a.student_id = s.id AND a.assigned_teacher_id = ?))
     ORDER BY s.name`, user.id, user.id, user.id,
  );
  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>My students</h1>
          <p className="lede">{rows.length} total · students you referred or correct for.</p>
        </div>
      </div>
      <div className="card">
        {rows.length ? (
          <div className="list">
            {rows.map((r) => (
              <Link key={r.id} href={`/students/${r.id}`} className="row" style={{ color: "inherit", textDecoration: "none" }}>
                <div className="ico" style={{ background: "transparent", padding: 0 }}><Avatar name={r.name} /></div>
                <div className="meta">
                  <b>{r.name}</b>
                  <small>Grade {r.grade ?? "—"} · {r.school ?? "No school"} · {r.corrected} corrected</small>
                </div>
                <span className="badge progress">{r.referred ? "Your referral" : "Assigned"}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="big"><I.users width={22} height={22} /></div>
            <h3>No students yet</h3>
            <p>Share your referral code so students can register under you.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
