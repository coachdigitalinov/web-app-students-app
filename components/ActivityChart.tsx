// Weekly bar chart (Mon–Sun). The tallest bar is highlighted.
export function ActivityChart({ data }: { data: { label: string; value: number }[] }) {
  const w = 440, h = 180, padL = 28, padR = 10, padT = 12, padB = 26;
  const iw = w - padL - padR, ih = h - padT - padB;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = iw / data.length * 0.55;
  const step = iw / data.length;
  const peakIdx = data.indexOf(data.reduce((a, b) => (a.value >= b.value ? a : b)));
  const y = (v: number) => padT + ih - (v / max) * ih;
  const yLabels = [0, Math.round(max / 2), max];

  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Weekly activity">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4262ff" />
          <stop offset="100%" stopColor="#7f6cff" />
        </linearGradient>
      </defs>
      {yLabels.map((v, i) => (
        <g key={i}>
          <line className="grid" x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} />
          <text className="baraxis" x={padL - 6} y={y(v) + 3} textAnchor="end">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padL + step * i + (step - bw) / 2;
        const by = y(d.value);
        return (
          <g key={d.label}>
            <rect className={`barv ${i === peakIdx ? "hi" : ""}`} x={x} y={by}
              width={bw} height={padT + ih - by} rx="5" />
            {i === peakIdx && <circle className="bardot" cx={x + bw / 2} cy={by} r="4" />}
            <text className="baraxis" x={x + bw / 2} y={h - 8} textAnchor="middle">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
