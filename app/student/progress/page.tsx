import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { progressStatus, studentResults, weakAreas } from "@/lib/progress";
import { fmtDate } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("student");
  const results = studentResults(user.id);
  const status = progressStatus(results);
  const weak = weakAreas(user.id);
  return (
    <Shell user={user}>
      <h1>My progress</h1>
      <div className="card"><h2>Trend</h2><p className={status.tone}>{status.label}</p>
        {results.map((r, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><span>{r.name} <span className="muted">({r.kind === "school" ? "school test" : "platform"} · {r.subject} · {fmtDate(r.date)})</span></span><b>{r.percent}%</b></div>
            <div className="bar" role="img" aria-label={`${r.percent} percent`}><i style={{ width: `${r.percent}%` }} /></div>
          </div>
        ))}
        {!results.length && <p className="muted">Results will appear after your first test is corrected.</p>}
      </div>
      <div className="card"><h2>Weak areas to focus on</h2>
        {weak.length ? <ul>{weak.map((w) => <li key={w.area}>{w.area} <span className="muted">— flagged {w.count}×</span></li>)}</ul> : <p className="muted">None flagged yet.</p>}
      </div>
    </Shell>
  );
}
