import type { Metadata } from "next";
import "../../globals.css";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = { title: "Portfolio Studio", robots: { index: false, follow: false } };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="editorial" data-mode="light" className={fontVariables} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
