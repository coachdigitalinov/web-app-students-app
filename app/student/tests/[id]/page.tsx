import { notFound } from "next/navigation";
import { startTest, submitAnswers } from "@/app/actions/student";
import { Countdown } from "@/components/Countdown";
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
      <h1>{t.title}</h1>
      <Flash searchParams={searchParams} />
      <p className="muted">{t.subject} · {t.total_marks} marks · {t.duration_minutes} minutes</p>
      {!a && (
        <form action={startTest} className="card">
          <input type="hidden" name="test_id" value={t.id} />
          {t.instructions && <p style={{ whiteSpace: "pre-wrap" }}>{t.instructions}</p>}
          <p>The timer starts as soon as you press <b>Start</b> and cannot be paused. You will be able to see the question paper, then upload your written answer sheet.</p>
          <button className="btn">Start test</button>
        </form>
      )}
      {a?.status === "in_progress" && (
        <>
          <Countdown deadline={a.deadline_at} />
          <div className="card"><Viewer src={`/files/paper/${t.id}`} mime={t.paper_mime} title={t.title} /></div>
          <form action={submitAnswers} className="card">
            <h2>Upload your answer sheet</h2>
            <input type="hidden" name="test_id" value={t.id} />
            <label htmlFor="files">PDF or photos (up to 10 files, 15 MB each)</label>
            <input id="files" name="files" type="file" multiple required accept="application/pdf,image/jpeg,image/png,image/webp" style={{ marginBottom: 12 }} />
            <button className="btn">Submit for correction</button>
            <p className="muted">You can submit once. Uploads after the deadline are accepted for a short period but flagged as late.</p>
          </form>
        </>
      )}
      {a && a.status !== "in_progress" && (
        <div className="card">
          <p><StatusBadge status={a.status} late={a.late} /> Submitted {fmtDateTime(a.submitted_at)}</p>
          {a.status === "corrected"
            ? <p>Marks: <b>{a.marks} / {t.total_marks}</b>. See the full breakdown in <a href="/student/results">Results</a>.</p>
            : <p className="muted">Your answer sheet is waiting to be corrected.</p>}
        </div>
      )}
    </Shell>
  );
}
