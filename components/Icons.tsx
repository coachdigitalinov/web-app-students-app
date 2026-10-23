import type { SVGProps } from "react";

const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const I = {
  grid: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
  ),
  book: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4Z" /><path d="M4 17a3 3 0 0 1 3-3h12" /></svg>
  ),
  test: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M9 3h6l5 5v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></svg>
  ),
  trend: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M3 17l6-6 4 4 7-8" /><path d="M14 7h6v6" /></svg>
  ),
  upload: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M12 15V4" /><path d="M7 9l5-5 5 5" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
  ),
  users: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><circle cx="9" cy="8" r="4" /><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" /><path d="M16 4a4 4 0 0 1 0 8" /><path d="M22 20c0-2.6-1.8-4.8-4.4-5.6" /></svg>
  ),
  teacher: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M12 3l10 5-10 5L2 8l10-5Z" /><path d="M6 10v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></svg>
  ),
  tag: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M4 12V4h8l9 9-8 8-9-9Z" /><circle cx="8" cy="8" r="1.5" /></svg>
  ),
  money: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 10v4M18 10v4" /></svg>
  ),
  inbox: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M3 13l3-8h12l3 8" /><path d="M3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5h-5l-2 3h-4l-2-3H3Z" /></svg>
  ),
  bell: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M6 9a6 6 0 1 1 12 0v4l2 3H4l2-3V9Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
  ),
  search: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
  ),
  arrow: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M9 6l6 6-6 6" /></svg>
  ),
  check: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M5 12l5 5L20 7" /></svg>
  ),
  chevL: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M15 6l-6 6 6 6" /></svg>
  ),
  chevR: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M9 6l6 6-6 6" /></svg>
  ),
  logout: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="M15 8l4 4-4 4" /><path d="M9 12h10" /></svg>
  ),
  settings: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.2-1.6l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.7-1.6L13 2h-2l-.7 2.9A7 7 0 0 0 7.5 6.5l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .5.1 1.1.2 1.6l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.7 1.6L11 22h2l.7-2.9a7 7 0 0 0 2.8-1.6l2.3 1 2-3.4-2-1.5c.1-.5.2-1.1.2-1.6Z" /></svg>
  ),
  spark: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></svg>
  ),
  logo: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p} width={18} height={18} fill="currentColor" stroke="none"><path d="M4 7a3 3 0 0 1 3-3h4v16H7a3 3 0 0 1-3-3V7Z" opacity=".9" /><path d="M13 4h4a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-4V4Z" opacity=".6" /></svg>
  ),
};
