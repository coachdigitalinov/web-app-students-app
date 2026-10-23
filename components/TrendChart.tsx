// Smooth line + area chart with an entry animation. Used for admin overview.
export function TrendChart({ data, color = "#4262ff", height = 180 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  const w = 440, h = height, padL = 32, padR = 12, padT = 14, padB = 24;
  const iw = w - padL - padR, ih = h - padT - padB;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? iw / (data.length - 1) : iw;
  const x = (i: number) => padL + step * i;
  const y = (v: number) => padT + ih - (v / max) * ih;

  // Catmull–Rom-ish smoothing between points.
  const path = data
    .map((d, i, a) => {
      if (i === 0) return `M${x(i)},${y(d.value)}`;
      const px = x(i - 1), py = y(a[i - 1].value);
      const cx = x(i), cy = y(d.value);
      const mx = (px + cx) / 2;
      return `C${mx},${py} ${mx},${cy} ${cx},${cy}`;
    })
    .join(" ");
  const area = `${path} L${x(data.length - 1)},${padT + ih} L${x(0)},${padT + ih} Z`;
  const grad = `trendGrad-${color.replace(/[^a-z0-9]/gi, "")}`;
  const yLabels = [0, Math.round(max / 2), max];

  return (
    <svg className="chart trend" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Trend">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map((v, i) => (
        <g key={i}>
          <line className="grid" x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} />
          <text className="baraxis" x={padL - 6} y={y(v) + 3} textAnchor="end">{v}</text>
        </g>
      ))}
      <path d={area} fill={`url(#${grad})`} className="trend-fill" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="trend-line" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.5" fill="#fff" stroke={color} strokeWidth="2" className="trend-dot" style={{ animationDelay: `${i * 60}ms` }} />
          <text className="baraxis" x={x(i)} y={h - 6} textAnchor="middle">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}
