import type { Locale, Portfolio } from "@/lib/content/schema";
import { formatDate } from "@/lib/content/dates";
import { t, UI } from "@/lib/content/i18n";

export function SiteFooter({ portfolio, locale }: { portfolio: Portfolio; locale: Locale }) {
  const ui = UI[locale];
  const { settings, meta, profile } = portfolio;
  const updated = meta.updatedAt ? formatDate(meta.updatedAt.slice(0, 10), locale) : "";
  const year = meta.updatedAt ? meta.updatedAt.slice(0, 4) : "";
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-ink-3 sm:px-8 md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {t(profile.name, locale)}. {t(settings.footer, locale)}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {settings.showLastUpdated && updated && (
            <span>
              {ui.lastUpdated}: <time dateTime={meta.updatedAt}>{updated}</time>
            </span>
          )}
          {settings.sourceUrl && (
            <a href={settings.sourceUrl} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-4 hover:text-ink">
              {ui.builtWith}
            </a>
          )}
          <span className="hidden items-center gap-1 md:inline-flex">
            <kbd className="rounded border border-line px-1.5 font-mono text-[0.68rem]">⌘K</kbd>
          </span>
        </p>
      </div>
    </footer>
  );
}
