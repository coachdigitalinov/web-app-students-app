"use server";
import { revalidatePath } from "next/cache";
import { visibleToGrade } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { get, run, type Attempt, type Test } from "@/lib/db";
import { saveUpload } from "@/lib/files";
import { flash, num } from "@/lib/util";

const GRACE_MS = 10 * 60_000; // uploads are accepted (flagged late) this long after the deadline

export async function startTest(f: FormData) {
  const user = await requireUser("student");
  const t = get<Test>("SELECT * FROM tests WHERE id = ? AND published = 1", num(f, "test_id"));
  if (!t || !visibleToGrade(t.grade, user.grade)) flash("/student/tests", "error", "Test not available.");
  if (!get("SELECT 1 FROM attempts WHERE test_id = ? AND student_id = ?", t.id, user.id)) {
    const now = Date.now();
    run("INSERT INTO attempts (test_id, student_id, started_at, deadline_at) VALUES (?,?,?,?)",
      t.id, user.id, new Date(now).toISOString(), new Date(now + t.duration_minutes * 60_000).toISOString());
  }
  flash(`/student/tests/${t.id}`, "ok", "Test started. The timer is running.");
}

export async function submitAnswers(f: FormData) {
  const user = await requireUser("student");
  const testId = num(f, "test_id");
  const back = `/student/tests/${testId}`;
  const a = get<Attempt>("SELECT * FROM attempts WHERE test_id = ? AND student_id = ?", testId, user.id);
  if (!a || a.status !== "in_progress") flash(back, "error", "This test is not open for submission.");
  const now = Date.now();
  const deadline = Date.parse(a.deadline_at);
  if (now > deadline + GRACE_MS) flash(back, "error", "The submission window has closed. Contact your teacher.");
  const files = f.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
  if (!files.length) flash(back, "error", "Attach at least one file.");
  if (files.length > 10) flash(back, "error", "Upload at most 10 files.");
  const saved = [];
  try { for (const file of files) saved.push(await saveUpload(file, `answers/${a.id}`)); }
  catch (e) { flash(back, "error", (e as Error).message); }
  for (const s of saved) run("INSERT INTO attempt_files (attempt_id, file_path, mime, original_name) VALUES (?,?,?,?)", a.id, s.path, s.mime, s.name);
  run("UPDATE attempts SET status='submitted', submitted_at=?, late=? WHERE id=?",
    new Date(now).toISOString(), now > deadline ? 1 : 0, a.id);
  revalidatePath("/", "layout");
  flash("/student/tests", "ok", "Answer sheet submitted for correction.");
}
