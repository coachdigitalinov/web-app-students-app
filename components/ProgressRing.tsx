export function ProgressRing({ percent, label = "complete" }: { percent: number; label?: string }) {
  const p = Math.max(0, Math.min(100, percent));
  const r = 68, c = 2 * Math.PI * r;
  const off = c - (p / 100) * c;
  return (
    <div className="ring-wrap">
      <svg className="ring" viewBox="0 0 180 180" role="img" aria-label={`${p}% ${label}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4262ff" />
            <stop offset="100%" stopColor="#7f6cff" />
          </linearGradient>
        </defs>
        <circle className="track" cx="90" cy="90" r={r} fill="none" strokeWidth="14" />
        <circle className="bar-fg" cx="90" cy="90" r={r} fill="none" strokeWidth="14"
          strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 90 90)" />
        <text className="label" x="90" y="88" textAnchor="middle" dominantBaseline="middle">{p}%</text>
        <text className="sub" x="90" y="110" textAnchor="middle">{label}</text>
      </svg>
    </div>
  );
}
