import type { Metadata } from "next";
import "./globals.css";
import { InvaderCover } from "@/components/site/InvaderCover";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "404 — Level not found",
};

/** Unmatched URLs (e.g. /xx/whatever) — rendered without any layout. */
export default function GlobalNotFound() {
  return (
    <html lang="en" data-theme="editorial" data-mode="light" className={fontVariables}>
      <body>
        <main className="grain flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <div className="w-56 overflow-hidden rounded-card border border-line">
            <InvaderCover seed="404-not-found" className="block aspect-[16/10] w-full" />
          </div>
          <div>
            <p className="label text-accent-text">404</p>
            <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">This level doesn’t exist (yet).</h1>
            <p className="mt-3 text-ink-2">Bu sahifa topilmadi · Страница не найдена</p>
          </div>
          <nav className="flex gap-2">
            {["en", "uz", "ru"].map((l) => (
              <a key={l} href={`/${l}`} className="rounded-chip border border-line px-4 py-2 font-mono text-sm text-ink hover:border-ink">
                {l.toUpperCase()}
              </a>
            ))}
          </nav>
        </main>
      </body>
    </html>
  );
}
