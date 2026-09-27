"use client";

import { FileText, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LOCALE_LABELS, type Locale } from "@/lib/content/schema";
import { openPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderProps {
  name: string;
  initials: string;
  locale: Locale;
  homeHref: string;
  resumeHref: string;
  nav: { href: string; label: string }[];
  localeHrefs: Partial<Record<Locale, string>>;
  labels: { resume: string; menu: string; close: string; toggleTheme: string; switchLanguage: string; skipToContent: string; search: string };
}

function LocaleLinks({ locale, localeHrefs, label }: { locale: Locale; localeHrefs: HeaderProps["localeHrefs"]; label: string }) {
  const entries = Object.entries(localeHrefs) as [Locale, string][];
  if (entries.length < 2) return null;
  return (
    <nav aria-label={label} className="flex items-center rounded-chip border border-line p-0.5">
      {entries.map(([code, href]) => (
        <a
          key={code}
          href={href}
          hrefLang={code}
          lang={code}
          aria-current={code === locale ? "true" : undefined}
          title={LOCALE_LABELS[code].native}
          className={`rounded-chip px-2 py-1 font-mono text-[0.7rem] font-medium transition ${
            code === locale ? "bg-ink text-bg" : "text-ink-3 hover:text-ink"
          }`}
        >
          {LOCALE_LABELS[code].short}
        </a>
      ))}
    </nav>
  );
}

export function SiteHeader({ name, initials, locale, homeHref, resumeHref, nav, localeHrefs, labels }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[90] rounded-chip bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {labels.skipToContent}
      </a>
      <header
        className={`no-print fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled || open ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <a href={homeHref} className="group flex items-center gap-3" aria-label={name}>
            <span className="flex size-9 items-center justify-center rounded-[calc(var(--radius-card-value)*0.6)] bg-ink font-display text-sm text-bg transition group-hover:bg-accent group-hover:text-accent-ink">
              {initials}
            </span>
            <span className={`hidden text-sm font-semibold text-ink transition-opacity sm:block ${scrolled ? "opacity-100" : "opacity-0"}`}>
              {name}
            </span>
          </a>

          <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="whitespace-nowrap rounded-chip px-3 py-1.5 text-sm text-ink-2 transition hover:bg-sunken hover:text-ink">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-2">
            <button
              type="button"
              onClick={openPalette}
              aria-label={labels.search}
              title={`${labels.search} (⌘K)`}
              className="inline-flex size-9 items-center justify-center rounded-chip text-ink-2 transition hover:bg-sunken hover:text-ink"
            >
              <Search size={17} strokeWidth={1.8} />
            </button>
            <ThemeToggle label={labels.toggleTheme} />
            <div className="hidden sm:block">
              <LocaleLinks locale={locale} localeHrefs={localeHrefs} label={labels.switchLanguage} />
            </div>
            <a
              href={resumeHref}
              className="ml-1 hidden items-center gap-2 rounded-chip bg-ink px-4 py-2 text-sm font-medium text-bg transition hover:bg-accent hover:text-accent-ink sm:inline-flex"
            >
              <FileText size={15} aria-hidden />
              {labels.resume}
            </a>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? labels.close : labels.menu}
              className="inline-flex size-9 items-center justify-center rounded-chip text-ink lg:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-menu" className="border-t border-line px-5 pb-6 pt-3 lg:hidden">
            <nav aria-label="Sections" className="grid gap-1">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 font-display text-xl text-ink hover:bg-sunken"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
              <LocaleLinks locale={locale} localeHrefs={localeHrefs} label={labels.switchLanguage} />
              <a href={resumeHref} className="inline-flex items-center gap-2 rounded-chip bg-ink px-4 py-2 text-sm font-medium text-bg">
                <FileText size={15} aria-hidden />
                {labels.resume}
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
