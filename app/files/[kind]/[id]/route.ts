import { NextResponse } from "next/server";
import { visibleToGrade } from "@/lib/access";
import { getUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { readStored } from "@/lib/files";

type Meta = { file_path: string; mime: string };

export async function GET(_: Request, ctx: { params: Promise<{ kind: string; id: string }> }) {
  const user = await getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { kind, id } = await ctx.params;
  const n = Number(id);
  let meta: Meta | undefined;
  let allowed = false;

  if (kind === "worksheet") {
    const w = get<Meta & { grade: string | null }>("SELECT file_path, mime, grade FROM worksheets WHERE id = ?", n);
    meta = w;
    allowed = !!w && (user.role !== "student" || visibleToGrade(w.grade, user.grade));
  } else if (kind === "paper") {
    const t = get<{ file_path: string; mime: string; grade: string | null; published: number }>(
      "SELECT paper_path file_path, paper_mime mime, grade, published FROM tests WHERE id = ?", n);
    meta = t;
    // Students only see the paper once they have started the attempt.
    allowed = !!t && (user.role !== "student" ||
      (!!t.published && visibleToGrade(t.grade, user.grade) && !!get("SELECT 1 FROM attempts WHERE test_id = ? AND student_id = ?", n, user.id)));
  } else if (kind === "answer") {
    const f = get<Meta & { student_id: number; assigned_teacher_id: number | null }>(
      `SELECT f.file_path, f.mime, a.student_id, a.assigned_teacher_id FROM attempt_files f
       JOIN attempts a ON a.id = f.attempt_id WHERE f.id = ?`, n);
    meta = f;
    allowed = !!f && (user.role === "admin" || f.student_id === user.id ||
      (user.role === "teacher" && f.assigned_teacher_id === user.id));
  }
  if (!meta || !allowed) return new NextResponse("Not found", { status: 404 });

  const body = await readStored(meta.file_path);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": meta.mime,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
