import { get, type User } from "./db";

export function canViewStudent(user: User, studentId: number) {
  if (user.role === "admin") return true;
  if (user.role === "student") return user.id === studentId;
  return !!get(
    `SELECT 1 FROM users WHERE id = ? AND referred_by = ?
     UNION SELECT 1 FROM attempts WHERE student_id = ? AND assigned_teacher_id = ?`,
    studentId, user.id, studentId, user.id,
  );
}

export function canCorrect(user: User, attempt: { assigned_teacher_id: number | null }) {
  return user.role === "admin" || (user.role === "teacher" && attempt.assigned_teacher_id === user.id);
}

/** Tests/worksheets with a grade are only for students of that grade. */
export const visibleToGrade = (itemGrade: string | null, studentGrade: string | null) =>
  !itemGrade || itemGrade === studentGrade;
