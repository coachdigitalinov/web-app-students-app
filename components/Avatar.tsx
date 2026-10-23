// Deterministic avatar colors from a name — no external image service.
const PALETTE = [
  ["#4262ff", "#7f6cff"],
  ["#30b7a6", "#5bd4a0"],
  ["#ff8a52", "#ff5f6d"],
  ["#7f6cff", "#d073ff"],
  ["#15a05a", "#4bd1a1"],
  ["#d08a1a", "#ffb94e"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const [a, b] = PALETTE[hash(name) % PALETTE.length];
  return (
    <span
      className={`avatar${size === "sm" ? " sm" : size === "lg" ? " lg" : ""}`}
      style={{ background: `linear-gradient(140deg, ${a}, ${b})` }}
      aria-hidden
    >
      {initials(name).toUpperCase()}
    </span>
  );
}
