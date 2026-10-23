"use client";
import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";

export function AuthForm({ action, mode }: { action: (s: FormState, f: FormData) => Promise<FormState>; mode: "login" | "register" }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const reg = mode === "register";
  return (
    <div className="center">
      <form action={formAction} className="card narrow">
        <h1>{reg ? "Create student account" : "Log in"}</h1>
        {state?.error && <div className="flash error" role="alert">{state.error}</div>}
        {reg && (
          <div style={{ marginBottom: 12 }}><label htmlFor="name">Full name</label><input id="name" name="name" required autoComplete="name" /></div>
        )}
        <div style={{ marginBottom: 12 }}><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={reg ? 8 : undefined} autoComplete={reg ? "new-password" : "current-password"} />
        </div>
        {reg && (
          <div className="fields">
            <div><label htmlFor="school">School</label><input id="school" name="school" /></div>
            <div><label htmlFor="grade">Grade / class</label><input id="grade" name="grade" placeholder="e.g. 10" /></div>
            <div><label htmlFor="referral">Teacher referral code (optional)</label><input id="referral" name="referral" /></div>
          </div>
        )}
        <button className="btn" disabled={pending} style={{ width: "100%" }}>{pending ? "Please wait…" : reg ? "Register" : "Log in"}</button>
        <p className="muted" style={{ textAlign: "center", marginBottom: 0 }}>
          {reg ? <>Already registered? <Link href="/login">Log in</Link></> : <>New student? <Link href="/register">Create an account</Link></>}
        </p>
      </form>
    </div>
  );
}
