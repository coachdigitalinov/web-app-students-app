import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/actions/auth";
import type { Role, User } from "@/lib/db";

const NAV: Record<Role, [string, string][]> = {
  admin: [
    ["/admin", "Dashboard"], ["/admin/students", "Students"], ["/admin/teachers", "Teachers"],
    ["/admin/worksheets", "Worksheets"], ["/admin/tests", "Tests"], ["/admin/submissions", "Submissions"],
    ["/admin/referrals", "Referrals & payments"],
  ],
  teacher: [
    ["/teacher", "Dashboard"], ["/teacher/submissions", "Answer sheets"], ["/teacher/students", "Students"],
    ["/teacher/referrals", "Referrals"],
  ],
  student: [
    ["/student", "Dashboard"], ["/student/worksheets", "Worksheets"], ["/student/tests", "Tests"],
    ["/student/results", "Results"], ["/student/progress", "Progress"],
  ],
};

export function Shell({ user, children }: { user: User; children: ReactNode }) {
  return (
    <div className="shell">
      <nav className="side">
        <div className="brand">Digital Inov</div>
        {NAV[user.role].map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
        <div className="who">
          {user.name}<br />{user.role}
          <form action={logout}><button className="btn ghost small" style={{ marginTop: 8 }}>Log out</button></form>
        </div>
      </nav>
      <main className="main">{children}</main>
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
  <div className="stat"><b>{value}</b><span>{label}</span></div>
);

export const StatusBadge = ({ status, late }: { status: string; late?: number }) => (
  <>
    <span className={`badge ${status === "corrected" ? "good" : status === "submitted" ? "warn" : ""}`}>{status.replace("_", " ")}</span>
    {late ? <span className="badge bad" style={{ marginLeft: 4 }}>late</span> : null}
  </>
);
