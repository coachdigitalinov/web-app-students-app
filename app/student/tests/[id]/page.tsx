import { notFound } from "next/navigation";
import { startTest, submitAnswers } from "@/app/actions/student";
import { Countdown } from "@/components/Countdown";
import { I } from "@/components/Icons";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { Viewer } from "@/components/Viewer";
import { visibleToGrade } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { get, type Attempt, type Test } from "@/lib/db";
import { fmtDateTime } from "@/lib/util";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("student");
  const { id } = await params;
  const t = get<Test>("SELECT * FROM tests WHERE id = ? AND published = 1", Number(id));
  if (!t || !visibleToGrade(t.grade, user.grade)) notFound();
  const a = get<Attempt>("SELECT * FROM attempts WHERE test_id = ? AND student_id = ?", t.id, user.id);

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>{t.title}</h1>
          <p className="lede">
            <span className="badge progress">{t.subject}</span> &nbsp;
            <span className="badge">{t.total_marks} marks</span> &nbsp;
            <span className="badge">{t.duration_minutes} min</span>
            {a && <>&nbsp;<StatusBadge status={a.status} late={a.late} /></>}
          </p>
        </div>
      </div>
      <Flash searchParams={searchParams} />

      {!a && (
        <div className="card fadein">
          <div className="hdr"><h2>Before you start</h2></div>
          {t.instructions && <div className="panel" style={{ marginBottom: 14, whiteSpace: "pre-wrap", color: "var(--ink)" }}>{t.instructions}</div>}
          <ul style={{ paddingLeft: 18, margin: "0 0 16px", color: "var(--ink-soft)" }}>
            <li>The timer starts the moment you press <b>Start test</b> — it cannot be paused.</li>
            <li>Write your answers on paper, then upload scans or photos.</li>
            <li>One submission per test. Late uploads are accepted within 10 minutes but flagged.</li>
          </ul>
          <form action={startTest}>
            <input type="hidden" name="test_id" value={t.id} />
            <button className="btn">Start test</button>
          </form>
        </div>
      )}

      {a?.status === "in_progress" && (
        <>
          <Countdown deadline={a.deadline_at} />
          <div className="cols fadein">
            <div className="card">
              <div className="hdr"><h2>Question paper</h2></div>
              <Viewer src={`/files/paper/${t.id}`} mime={t.paper_mime} title={t.title} />
            </div>
            <aside>
              <form action={submitAnswers} className="card">
                <div className="hdr"><h2>Upload your answers</h2></div>
                <input type="hidden" name="test_id" value={t.id} />
                <label htmlFor="files">PDF or photos (up to 10 files, 15 MB each)</label>
                <input id="files" name="files" type="file" multiple required accept="application/pdf,image/jpeg,image/png,image/webp" style={{ marginBottom: 14 }} />
                <button className="btn" style={{ width: "100%" }}>Submit for correction</button>
                <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                  You can submit once. Uploads after the deadline are accepted for a short period but flagged as late.
                </p>
              </form>
              <div className="card">
                <div className="hdr"><h2>Tips</h2></div>
                <ul style={{ paddingLeft: 18, margin: 0, color: "var(--ink-soft)", fontSize: 13 }}>
                  <li>Number each question clearly.</li>
                  <li>Scan each page separately for clarity.</li>
                  <li>Check your work before submitting.</li>
                </ul>
              </div>
            </aside>
          </div>
        </>
      )}

      {a && a.status !== "in_progress" && (
        <div className="card fadein">
          <div className="hdr">
            <h2>Your submission</h2>
            <span className="muted" style={{ fontSize: 12 }}>Submitted {fmtDateTime(a.submitted_at)}</span>
          </div>
          {a.status === "corrected" ? (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 36, fontWeight: 700 }}>{a.marks}</span>
                <span className="muted">/ {t.total_marks} marks</span>
                <span className="badge good">Corrected</span>
              </div>
              <p className="muted" style={{ marginTop: 0 }}>
                See the full breakdown including feedback and mistakes on your <a href="/student/results">Results</a> page.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="empty" style={{ padding: 0, textAlign: "left" }}>
                <h3 style={{ marginBottom: 2 }}>Waiting for correction</h3>
                <p style={{ margin: 0 }}>Your teacher will review your sheet soon.</p>
              </div>
              <I.check width={60} height={60} style={{ color: "var(--good)", opacity: .3, marginLeft: "auto" }} />
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
