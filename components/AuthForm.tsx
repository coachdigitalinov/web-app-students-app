"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions/auth";

const DEMO: { role: string; email: string; password: string }[] = [
  { role: "Admin", email: "admin@demo.local", password: "demo12345" },
  { role: "Teacher", email: "teacher@demo.local", password: "demo12345" },
  { role: "Student", email: "student@demo.local", password: "demo12345" },
];

export function AuthForm({ action, mode }: { action: (s: FormState, f: FormData) => Promise<FormState>; mode: "login" | "register" }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const reg = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const pick = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="center">
      <div className="auth-wrap">
        <div className="auth-brand">
          <div className="logo-xl" aria-hidden>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 7a3 3 0 0 1 3-3h4v16H7a3 3 0 0 1-3-3V7Z" opacity=".9" />
              <path d="M13 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4V4Z" opacity=".6" />
            </svg>
          </div>
          <h2 className="auth-title">Digital Inov</h2>
          <p className="auth-sub">Learn. Practise. Improve. Track every test and worksheet in one place.</p>
          <ul className="auth-feats">
            <li><span className="dot" /> Timed tests with answer-sheet upload</li>
            <li><span className="dot" /> Teacher corrections and feedback</li>
            <li><span className="dot" /> Weak-area tracking and reports</li>
          </ul>
        </div>

        <form action={formAction} className="card narrow auth-form">
          <h1>{reg ? "Create student account" : "Welcome back"}</h1>
          <p className="muted" style={{ marginTop: -8, marginBottom: 16, fontSize: 13 }}>
            {reg ? "Sign up to start taking tests and tracking progress." : "Sign in to continue to your dashboard."}
          </p>
          {state?.error && <div className="flash error" role="alert">{state.error}</div>}

          {reg && (
            <div style={{ marginBottom: 12 }}><label htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" /></div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={reg ? 8 : undefined} autoComplete={reg ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {reg && (
            <div className="fields">
              <div><label htmlFor="school">School</label><input id="school" name="school" /></div>
              <div><label htmlFor="grade">Grade / class</label><input id="grade" name="grade" placeholder="e.g. 10" /></div>
              <div><label htmlFor="referral">Teacher referral code (optional)</label><input id="referral" name="referral" /></div>
            </div>
          )}
          <button className="btn" disabled={pending} style={{ width: "100%", marginTop: 4 }}>
            {pending ? "Please wait…" : reg ? "Create account" : "Log in"}
          </button>

          {!reg && (
            <div className="demo">
              <small className="muted">Try a demo account — one click fills it in:</small>
              <div className="demo-chips">
                {DEMO.map((d) => (
                  <button key={d.role} type="button" className="chip" onClick={() => pick(d.email, d.password)}>
                    <span className="chip-role">{d.role}</span>
                    <span className="chip-mail">{d.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="muted" style={{ textAlign: "center", marginBottom: 0, marginTop: 14, fontSize: 13 }}>
            {reg ? <>Already registered? <Link href="/login">Log in</Link></> : <>New student? <Link href="/register">Create an account</Link></>}
          </p>
        </form>
      </div>
    </div>
  );
}
