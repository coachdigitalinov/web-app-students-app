import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import { get, type Role, type User } from "@/lib/db";
import { Avatar } from "@/components/Avatar";
import { I } from "@/components/Icons";

type NavItem = { href: string; label: string; icon: keyof typeof I };

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Overview", icon: "grid" },
    { href: "/admin/students", label: "Students", icon: "users" },
    { href: "/admin/teachers", label: "Teachers", icon: "teacher" },
    { href: "/admin/worksheets", label: "Worksheets", icon: "book" },
    { href: "/admin/tests", label: "Tests", icon: "test" },
    { href: "/admin/submissions", label: "Submissions", icon: "inbox" },
    { href: "/admin/referrals", label: "Referrals", icon: "money" },
  ],
  teacher: [
    { href: "/teacher", label: "Overview", icon: "grid" },
    { href: "/teacher/submissions", label: "Answer sheets", icon: "inbox" },
    { href: "/teacher/students", label: "Students", icon: "users" },
    { href: "/teacher/referrals", label: "Referrals", icon: "tag" },
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: "grid" },
    { href: "/student/worksheets", label: "Worksheets", icon: "book" },
    { href: "/student/tests", label: "Tests", icon: "test" },
    { href: "/student/results", label: "Results", icon: "check" },
    { href: "/student/progress", label: "Progress", icon: "trend" },
  ],
};

async function activeHref() {
  // Next sets x-invoke-path for the current route; fall back to referer.
  const h = await headers();
  return h.get("x-invoke-path") ?? h.get("x-matched-path") ?? "";
}

function roleTitle(r: Role) {
  return r === "admin" ? "Administrator" : r === "teacher" ? "Teacher" : "Student";
}

export async function Shell({ user, children, topbar }: { user: User; children: ReactNode; topbar?: ReactNode }) {
  const current = await activeHref();
  const items = NAV[user.role];
  const unread =
    user.role === "student"
      ? get<{ n: number }>(
          "SELECT COUNT(*) n FROM attempts WHERE student_id = ? AND status = 'corrected' AND corrected_at > ?",
          user.id,
          new Date(Date.now() - 7 * 86400_000).toISOString(),
        )!.n
      : user.role === "teacher"
        ? get<{ n: number }>(
            "SELECT COUNT(*) n FROM attempts WHERE assigned_teacher_id = ? AND status = 'submitted'",
            user.id,
          )!.n
        : get<{ n: number }>("SELECT COUNT(*) n FROM attempts WHERE status = 'submitted'")!.n;

  return (
    <div className="shell">
      <nav className="side" aria-label="Primary">
        <div className="brand">
          <span className="logo"><I.logo /></span>
          Digital Inov
        </div>
        {items.map((it) => {
          const Icon = I[it.icon];
          const active = current === it.href || (it.href !== `/${user.role}` && current.startsWith(it.href));
          return (
            <Link key={it.href} href={it.href} className={`nav${active ? " active" : ""}`}>
              <Icon className="icon" />
              {it.label}
            </Link>
          );
        })}
        <div className="section">Account</div>
        <form action={logout} style={{ margin: 0 }}>
          <button type="submit" className="nav" style={{ background: "transparent", border: 0, color: "inherit", width: "100%", textAlign: "left", cursor: "pointer", font: "inherit", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
            <I.logout className="icon" /> Log out
          </button>
        </form>
      </nav>
      <main className="main">
        <div className="topbar noprint">
          <div>
            {topbar ?? (
              <h2 className="greet">
                Welcome back, <b>{user.name.split(" ")[0]}!</b>
                <small>{roleTitle(user.role)} · {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</small>
              </h2>
            )}
          </div>
          <div className="toolbar">
            <div className="search">
              <I.search />
              <input placeholder="Search…" aria-label="Search" />
            </div>
            <Link href={user.role === "student" ? "/student/results" : user.role === "teacher" ? "/teacher/submissions" : "/admin/submissions"} className="iconbtn" aria-label="Notifications">
              <I.bell />
              {unread > 0 && <span className="dot">{unread > 9 ? "9+" : unread}</span>}
            </Link>
            <div className="me">
              <Avatar name={user.name} />
              <div className="who">
                {user.name}
                <small>{roleTitle(user.role)}</small>
              </div>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

export async function Flash({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  if (error) return <div className="flash error" role="alert">{error}</div>;
  if (ok) return <div className="flash ok">{ok}</div>;
  return null;
}

export const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="card" style={{ marginBottom: 0 }}>
    <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    <div className="muted" style={{ fontSize: 12.5 }}>{label}</div>
  </div>
);

export const StatusBadge = ({ status, late }: { status: string; late?: number }) => {
  const cls = status === "corrected" ? "done" : status === "submitted" ? "pending" : "progress";
  const label = status === "in_progress" ? "In Progress" : status === "submitted" ? "Awaiting review" : "Corrected";
  return (
    <>
      <span className={`badge ${cls}`}>{label}</span>
      {late ? <span className="badge bad" style={{ marginLeft: 4 }}>late</span> : null}
    </>
  );
};
