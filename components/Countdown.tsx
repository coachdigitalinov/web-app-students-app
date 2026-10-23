"use client";
import { useEffect, useState } from "react";

const Icon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6M5 5l-2 2" />
  </svg>
);

export function Countdown({ deadline }: { deadline: string }) {
  const end = Date.parse(deadline);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.floor((end - Date.now()) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [end]);
  if (left === null) return <div className="timer"><Icon /><div><div className="time">—:—</div><div className="label">Loading timer…</div></div></div>;
  if (left <= 0) {
    return (
      <div className="timer bad" role="timer">
        <Icon />
        <div><div className="time">0:00</div><div className="label">Time&apos;s up — upload now (will be marked late)</div></div>
      </div>
    );
  }
  const h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  const cls = left < 60 ? "bad" : left < 300 ? "warn" : "";
  return (
    <div className={`timer ${cls}`} role="timer" aria-live="polite">
      <Icon />
      <div>
        <div className="time">{h ? `${h}:` : ""}{p(m)}:{p(s)}</div>
        <div className="label">time remaining</div>
      </div>
    </div>
  );
}
