import { locale as rootLocale } from "next/root-params";
import { InvaderCover } from "@/components/site/InvaderCover";
import { isLocale, UI } from "@/lib/content/i18n";

export default async function NotFound() {
  const raw = await rootLocale();
  const locale = raw && isLocale(raw) ? raw : "en";
  const ui = UI[locale];
  return (
    <main className="grain flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="w-56 overflow-hidden rounded-card border border-line">
        <InvaderCover seed="404-not-found" className="block aspect-[16/10] w-full" />
      </div>
      <div>
        <p className="label text-accent-text">404</p>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{ui.notFoundTitle}</h1>
        <p className="mt-3 text-ink-2">{ui.notFoundBody}</p>
      </div>
      <a href={`/${locale}`} className="rounded-chip bg-ink px-5 py-2.5 text-sm font-medium text-bg hover:bg-accent hover:text-accent-ink">
        {ui.home}
      </a>
    </main>
  );
}
