"use client";
import { useEffect, useState } from "react";

export function Countdown({ deadline }: { deadline: string }) {
  const end = Date.parse(deadline);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.floor((end - Date.now()) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [end]);
  if (left === null) return <div className="timer">Loading timer…</div>;
  if (left <= 0) return <div className="timer bad" role="timer">Time is up — upload your answer sheet now (it will be marked late).</div>;
  const h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return <div className={`timer ${left < 300 ? "warn" : ""}`} role="timer">⏱ {h ? `${h}:` : ""}{p(m)}:{p(s)} remaining</div>;
}
