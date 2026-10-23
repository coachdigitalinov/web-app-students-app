import Link from "next/link";
import { Shell, Stat } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";

export default async function Page() {
  const user = await requireUser("teacher");
  const n = (sql: string) => get<{ n: number }>(sql, user.id)!.n;
  return (
    <Shell user={user}>
      <h1>Welcome, {user.name}</h1>
      <div className="grid">
        <Stat label="Sheets to correct" value={n("SELECT COUNT(*) n FROM attempts WHERE assigned_teacher_id=? AND status='submitted'")} />
        <Stat label="Corrected by you" value={n("SELECT COUNT(*) n FROM attempts WHERE corrected_by=?")} />
        <Stat label="Students referred" value={n("SELECT COUNT(*) n FROM users WHERE referred_by=?")} />
      </div>
      <div className="card"><Link href="/teacher/submissions">Go to answer sheets →</Link></div>
    </Shell>
  );
}
