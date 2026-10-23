import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: { default: "Digital Inov", template: "%s · Digital Inov" }, description: "Education performance and testing platform" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
