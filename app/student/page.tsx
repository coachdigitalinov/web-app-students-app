import Link from "next/link";
import { Shell, Stat } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { progressStatus, studentResults } from "@/lib/progress";

export default async function Page() {
  const user = await requireUser("student");
  const available = get<{ n: number }>(
    `SELECT COUNT(*) n FROM tests t WHERE published = 1 AND (grade IS NULL OR grade = ?)
     AND NOT EXISTS (SELECT 1 FROM attempts a WHERE a.test_id = t.id AND a.student_id = ?)`, user.grade, user.id)!.n;
  const waiting = get<{ n: number }>("SELECT COUNT(*) n FROM attempts WHERE student_id = ? AND status = 'submitted'", user.id)!.n;
  const results = studentResults(user.id);
  const status = progressStatus(results);
  return (
    <Shell user={user}>
      <h1>Hello, {user.name}</h1>
      <div className="grid">
        <Stat label="Tests available" value={available} />
        <Stat label="Awaiting correction" value={waiting} />
        <Stat label="Tests corrected" value={results.filter((r) => r.kind === "platform").length} />
      </div>
      <div className="card"><h2>Progress</h2><span className={status.tone}>{status.label}</span> · <Link href="/student/progress">View details</Link></div>
      <div className="card row"><Link className="btn" href="/student/tests">Take a test</Link><Link className="btn ghost" href="/student/worksheets">Revise with worksheets</Link></div>
    </Shell>
  );
}
