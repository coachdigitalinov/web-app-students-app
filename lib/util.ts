import { redirect } from "next/navigation";

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
export const pct = (marks: number, total: number) => (total > 0 ? Math.round((marks / total) * 100) : 0);

export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export const num = (f: FormData, k: string) => Number(f.get(k));
export const optional = (f: FormData, k: string) => str(f, k) || null;

/** Redirect back to `to` with a flash message. */
export function flash(to: string, kind: "error" | "ok", msg: string): never {
  const u = new URL(to, "http://x");
  u.searchParams.set(kind, msg);
  redirect(u.pathname + u.search);
}

export const splitList = (s: string | null) =>
  (s ?? "").split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
