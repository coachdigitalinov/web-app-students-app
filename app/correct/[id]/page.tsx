import { notFound, redirect } from "next/navigation";
import { saveCorrection } from "@/app/actions/staff";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { Viewer } from "@/components/Viewer";
import { canCorrect } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { all, get, type Attempt } from "@/lib/db";
import { fmtDateTime } from "@/lib/util";

type Row = Attempt & { student: string; test: string; subject: string; total_marks: number };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const a = get<Row>(
    `SELECT a.*, u.name student, t.title test, t.subject, t.total_marks FROM attempts a
     JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id WHERE a.id = ?`, Number(id));
  if (!a || a.status === "in_progress") notFound();

  const editable = canCorrect(user, a);
  const isOwner = user.role === "student" && a.student_id === user.id;
  const isAssigned = user.role === "teacher" && a.assigned_teacher_id === user.id;
  if (!editable && !isAssigned && !(isOwner && a.status === "corrected")) redirect("/");

  const files = all<{ id: number; mime: string; original_name: string }>("SELECT id, mime, original_name FROM attempt_files WHERE attempt_id = ?", a.id);
  return (
    <Shell user={user}>
      <h1>{a.test} — {a.student}</h1>
      <Flash searchParams={searchParams} />
      <p className="muted">{a.subject} · out of {a.total_marks} · submitted {fmtDateTime(a.submitted_at)} <StatusBadge status={a.status} late={a.late} /></p>
      {!isOwner && (
        <div className="card">
          <h2>Answer sheet</h2>
          {files.map((f) => <Viewer key={f.id} src={`/files/answer/${f.id}`} mime={f.mime} title={f.original_name} />)}
        </div>
      )}
      {editable ? (
        <form action={saveCorrection} className="card">
          <h2>Correction</h2>
          <input type="hidden" name="id" value={a.id} />
          <div className="fields"><div><label>Marks (0–{a.total_marks})</label><input name="marks" type="number" step="any" min="0" max={a.total_marks} defaultValue={a.marks ?? ""} required /></div></div>
          <div style={{ marginBottom: 12 }}><label>Mistakes (one per line, e.g. “Q4 – sign error in algebra”)</label><textarea name="mistakes" defaultValue={a.mistakes ?? ""} /></div>
          <div style={{ marginBottom: 12 }}><label>Weak areas / topics (comma separated)</label><input name="weak_areas" defaultValue={a.weak_areas ?? ""} /></div>
          <div style={{ marginBottom: 12 }}><label>Feedback for the student</label><textarea name="feedback" defaultValue={a.feedback ?? ""} /></div>
          <div style={{ marginBottom: 12 }}><label>Improvement suggestions</label><textarea name="suggestions" defaultValue={a.suggestions ?? ""} /></div>
          <button className="btn">{a.status === "corrected" ? "Update correction" : "Save correction"}</button>
        </form>
      ) : a.status === "corrected" ? (
        <div className="card">
          <h2>Marks: {a.marks} / {a.total_marks}</h2>
          {a.mistakes && <><h2>Mistakes</h2><p style={{ whiteSpace: "pre-wrap" }}>{a.mistakes}</p></>}
          {a.weak_areas && <p><b>Weak areas:</b> {a.weak_areas}</p>}
          {a.feedback && <><h2>Teacher feedback</h2><p style={{ whiteSpace: "pre-wrap" }}>{a.feedback}</p></>}
          {a.suggestions && <><h2>How to improve</h2><p style={{ whiteSpace: "pre-wrap" }}>{a.suggestions}</p></>}
        </div>
      ) : null}
    </Shell>
  );
}
