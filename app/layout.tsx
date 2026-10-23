import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: { default: "Digital Inov", template: "%s · Digital Inov" },
  description: "Education performance and testing platform",
};

// Applies the saved theme before paint to avoid a light/dark flash.
// Only values 'light' or 'dark' are accepted; anything else falls back to the
// explicit 'light' default (we don't follow the OS automatically).
const THEME_INIT = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    document.documentElement.dataset.theme = (t === 'dark' ? 'dark' : 'light');
  } catch(e) { document.documentElement.dataset.theme = 'light'; }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
