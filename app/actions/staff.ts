"use server";
import { revalidatePath } from "next/cache";
import { canCorrect, canViewStudent } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { get, run, type Attempt } from "@/lib/db";
import { flash, num, optional, str } from "@/lib/util";

export async function saveCorrection(f: FormData) {
  const user = await requireUser("admin", "teacher");
  const id = num(f, "id");
  const back = `/correct/${id}`;
  const a = get<Attempt & { total_marks: number }>(
    "SELECT a.*, t.total_marks FROM attempts a JOIN tests t ON t.id = a.test_id WHERE a.id = ?", id);
  if (!a || !canCorrect(user, a) || a.status === "in_progress") flash("/", "error", "You cannot correct this submission.");
  const marks = num(f, "marks");
  if (!Number.isFinite(marks) || marks < 0 || marks > a.total_marks) flash(back, "error", `Marks must be between 0 and ${a.total_marks}.`);
  run(`UPDATE attempts SET marks=?, mistakes=?, weak_areas=?, feedback=?, suggestions=?, status='corrected',
       corrected_by=?, corrected_at=?, assigned_teacher_id=COALESCE(assigned_teacher_id, ?) WHERE id=?`,
    marks, optional(f, "mistakes"), optional(f, "weak_areas"), optional(f, "feedback"), optional(f, "suggestions"),
    user.id, new Date().toISOString(), user.role === "teacher" ? user.id : null, id);
  revalidatePath("/", "layout");
  flash(back, "ok", "Correction saved and report updated.");
}

export async function addSchoolTest(f: FormData) {
  const user = await requireUser("admin", "teacher");
  const sid = num(f, "student_id");
  const back = `/students/${sid}`;
  if (!canViewStudent(user, sid)) flash("/", "error", "Not allowed.");
  const marks = num(f, "marks"), total = num(f, "total");
  if (!str(f, "name") || !str(f, "subject") || !(total > 0) || !(marks >= 0) || marks > total || !str(f, "taken_on"))
    flash(back, "error", "Fill in all fields; marks must be between 0 and the total.");
  run("INSERT INTO school_tests (student_id, name, subject, marks, total, taken_on, added_by) VALUES (?,?,?,?,?,?,?)",
    sid, str(f, "name"), str(f, "subject"), marks, total, str(f, "taken_on"), user.id);
  revalidatePath(back);
  flash(back, "ok", "School test added.");
}
