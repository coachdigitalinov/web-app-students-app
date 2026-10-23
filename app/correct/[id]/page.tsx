import { notFound, redirect } from "next/navigation";
import { saveCorrection } from "@/app/actions/staff";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";
import { Flash, Shell, StatusBadge } from "@/components/Shell";
import { Viewer } from "@/components/Viewer";
import { canCorrect } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { all, get, type Attempt } from "@/lib/db";
import { fmtDateTime, pct } from "@/lib/util";

type Row = Attempt & { student: string; test: string; subject: string; total_marks: number };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const a = get<Row>(
    `SELECT a.*, u.name student, t.title test, t.subject, t.total_marks
     FROM attempts a JOIN users u ON u.id = a.student_id JOIN tests t ON t.id = a.test_id WHERE a.id = ?`,
    Number(id),
  );
  if (!a || a.status === "in_progress") notFound();

  const editable = canCorrect(user, a);
  const isOwner = user.role === "student" && a.student_id === user.id;
  const isAssigned = user.role === "teacher" && a.assigned_teacher_id === user.id;
  if (!editable && !isAssigned && !(isOwner && a.status === "corrected")) redirect("/");

  const files = all<{ id: number; mime: string; original_name: string }>(
    "SELECT id, mime, original_name FROM attempt_files WHERE attempt_id = ?", a.id,
  );
  const percent = a.marks !== null ? pct(a.marks, a.total_marks) : null;

  return (
    <Shell user={user}>
      <div className="page-head">
        <div>
          <h1>{a.test}</h1>
          <p className="lede">
            <span className="cell-user" style={{ display: "inline-flex", verticalAlign: "middle" }}>
              <Avatar name={a.student} size="sm" /> <b style={{ marginLeft: 8 }}>{a.student}</b>
            </span>
            &nbsp;· {a.subject} · out of {a.total_marks} · submitted {fmtDateTime(a.submitted_at)}
            &nbsp;<StatusBadge status={a.status} late={a.late} />
          </p>
        </div>
      </div>
      <Flash searchParams={searchParams} />

      <div className="cols">
        {!isOwner && (
          <div className="card">
            <div className="hdr"><h2>Answer sheet</h2><span className="muted" style={{ fontSize: 12 }}>{files.length} file{files.length !== 1 ? "s" : ""}</span></div>
            {files.map((f) => <Viewer key={f.id} src={`/files/answer/${f.id}`} mime={f.mime} title={f.original_name} />)}
            {!files.length && <p className="muted">No files uploaded.</p>}
          </div>
        )}
        {isOwner && a.status === "corrected" && (
          <div className="card">
            <div className="hdr"><h2>Your score</h2></div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 44, fontWeight: 700 }}>{a.marks}</span>
              <span className="muted">/ {a.total_marks} marks</span>
              <span className="badge good" style={{ marginLeft: "auto" }}>{percent}%</span>
            </div>
            <div className="bar" style={{ marginTop: 14 }}><i style={{ width: `${percent}%` }} /></div>

            {a.mistakes && <><h2 style={{ marginTop: 20 }}>Mistakes</h2><div className="panel" style={{ whiteSpace: "pre-wrap", color: "var(--ink)" }}>{a.mistakes}</div></>}
            {a.weak_areas && <p style={{ marginTop: 14 }}><b>Weak areas:</b> {a.weak_areas}</p>}
            {a.feedback && <><h2 style={{ marginTop: 10 }}>Teacher feedback</h2><div className="panel" style={{ whiteSpace: "pre-wrap", color: "var(--ink)" }}>{a.feedback}</div></>}
            {a.suggestions && <><h2 style={{ marginTop: 14 }}>How to improve</h2><div className="panel" style={{ whiteSpace: "pre-wrap", color: "var(--ink)" }}>{a.suggestions}</div></>}
          </div>
        )}

        <aside>
          {editable ? (
            <form action={saveCorrection} className="card">
              <div className="hdr"><h2>{a.status === "corrected" ? "Update correction" : "Mark this sheet"}</h2></div>
              <input type="hidden" name="id" value={a.id} />
              <div style={{ marginBottom: 14 }}>
                <label>Marks (0 – {a.total_marks})</label>
                <input name="marks" type="number" step="any" min="0" max={a.total_marks} defaultValue={a.marks ?? ""} required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label>Mistakes (one per line, e.g. &quot;Q4 – sign error&quot;)</label>
                <textarea name="mistakes" defaultValue={a.mistakes ?? ""} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label>Weak areas / topics (comma separated)</label>
                <input name="weak_areas" defaultValue={a.weak_areas ?? ""} placeholder="Algebra, Fractions" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label>Feedback for the student</label>
                <textarea name="feedback" defaultValue={a.feedback ?? ""} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label>Improvement suggestions</label>
                <textarea name="suggestions" defaultValue={a.suggestions ?? ""} />
              </div>
              <button className="btn" style={{ width: "100%" }}>
                <I.check width={14} height={14} /> Save correction
              </button>
            </form>
          ) : a.status === "corrected" && !isOwner ? (
            <div className="card">
              <div className="hdr"><h2>Current correction</h2></div>
              <p><b style={{ fontSize: 24 }}>{a.marks} / {a.total_marks}</b> <span className="badge good">{percent}%</span></p>
              {a.feedback && <p className="muted" style={{ fontSize: 13 }}>{a.feedback}</p>}
            </div>
          ) : null}
        </aside>
      </div>
    </Shell>
  );
}
