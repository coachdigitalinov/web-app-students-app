import { I } from "@/components/Icons";
import { ProgressRing } from "@/components/ProgressRing";
import { Shell } from "@/components/Shell";
import { TrendChart } from "@/components/TrendChart";
import { requireUser } from "@/lib/auth";
import { progressStatus, studentResults, weakAreas } from "@/lib/progress";
import { fmtDate } from "@/lib/util";

export default async function Page() {
  const user = await requireUser("student");
  const results = studentResults(user.id);
  const status = progressStatus(results);
  const weak = weakAreas(user.id);
  const platform = results.filter((r) => r.kind === "platform");
  const avg = platform.length ? Math.round(platform.reduce((s, r) => s + r.percent, 0) / platform.length) : 0;
  const trend = platform.slice(-8).map((r, i) => ({ label: `#${platform.length - platform.slice(-8).length + i + 1}`, value: r.percent }));

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>My progress</h1>
          <p className="lede">{status.label} · {platform.length} platform tests · {results.length - platform.length} school tests tracked.</p>
        </div>
      </div>

      <div className="cols-eq">
        <div className="card">
          <div className="hdr"><h2>Score trend</h2><span className="badge progress">Platform</span></div>
          {trend.length >= 2 ? <TrendChart data={trend} color="#4262ff" /> :
            <div className="empty"><div className="big"><I.trend width={22} height={22} /></div>
              <h3>Not enough data yet</h3><p>Take more tests to see your trend.</p></div>}
        </div>
        <div className="card">
          <div className="hdr"><h2>Overall</h2><span className={`badge ${status.tone === "good" ? "good" : status.tone === "bad" ? "bad" : "progress"}`}>{status.label}</span></div>
          <ProgressRing percent={avg} label={platform.length ? `${platform.length} tests` : "no data"} />
        </div>
      </div>

      <div className="cols">
        <div className="card">
          <div className="hdr"><h2>All results</h2></div>
          {results.length ? (
            <div className="list">
              {[...results].reverse().map((r, i) => (
                <div key={i} className="row">
                  <div className={`ico ${r.kind === "school" ? "v2" : ""}`}>
                    {r.kind === "school" ? <I.teacher width={18} height={18} /> : <I.test width={18} height={18} />}
                  </div>
                  <div className="meta">
                    <b>{r.name}</b>
                    <small>{r.kind === "school" ? "School test" : "Platform"} · {r.subject} · {fmtDate(r.date)}</small>
                    <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${r.percent}%` }} /></div>
                  </div>
                  <b style={{ fontVariantNumeric: "tabular-nums" }}>{r.percent}%</b>
                </div>
              ))}
            </div>
          ) : <div className="empty"><div className="big"><I.trend width={22} height={22} /></div>
                <h3>No results yet</h3><p>Submit a test or add a school result.</p></div>}
        </div>

        <aside>
          <div className="card">
            <div className="hdr"><h2>Weak areas</h2></div>
            {weak.length ? (
              <div className="list">
                {weak.map((w) => (
                  <div key={w.area} className="row">
                    <div className="ico v3"><I.tag width={18} height={18} /></div>
                    <div className="meta"><b>{w.area}</b><small>Flagged {w.count}×</small></div>
                  </div>
                ))}
              </div>
            ) : <p className="muted" style={{ margin: 0 }}>None flagged yet. Keep going!</p>}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
