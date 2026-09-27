"use client";

import { ArrowLeft, Check, Printer, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LOCALE_LABELS, type Locale } from "@/lib/content/schema";

const PAGE_PX = { a4: (297 / 25.4) * 96, letter: 11 * 96 };

export interface ResumeShellProps {
  children: ReactNode;
  locale: Locale;
  backHref?: string;
  localeHrefs?: Partial<Record<Locale, string>>;
  variantLinks?: { href: string; label: string; active: boolean }[];
  defaults: { paper: "a4" | "letter"; photo: boolean; qr: boolean };
  hasQr: boolean;
  labels: {
    back: string;
    print: string;
    paper: string;
    photo: string;
    qr: string;
    fits: string;
    pages: string;
    variant: string;
  };
  /** In the Studio preview the toolbar is replaced by the Studio's own controls. */
  bare?: boolean;
}

/**
 * Wraps the printable résumé with a screen-only toolbar (paper size, photo, QR, print) and a
 * live "does it fit on one page?" meter with page-break guides.
 */
export function ResumeShell({ children, locale, backHref, localeHrefs, variantLinks, defaults, hasQr, labels, bare }: ResumeShellProps) {
  // Viewer overrides on top of the owner's defaults (so Studio setting changes still flow through).
  const [paperOverride, setPaper] = useState<"a4" | "letter" | null>(null);
  const [photoOverride, setPhoto] = useState<boolean | null>(null);
  const [qrOverride, setQr] = useState<boolean | null>(null);
  const paper = paperOverride ?? defaults.paper;
  const photo = photoOverride ?? defaults.photo;
  const qr = qrOverride ?? defaults.qr;
  const [pages, setPages] = useState(1);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const doc = stage.current?.querySelector<HTMLElement>(".resume-doc > div");
    if (!doc) return;
    const measure = () => setPages(doc.scrollHeight / PAGE_PX[paper]);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(doc);
    return () => observer.disconnect();
  }, [paper, photo, qr, children]);

  const fits = pages <= 1.01;
  const toggle = "inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-xs font-medium transition";
  const on = "border-ink bg-ink text-bg";
  const off = "border-line text-ink-2 hover:border-line-strong";

  return (
    <div className="resume-shell paper-stage min-h-screen pb-16" data-paper={paper} data-photo={photo ? "on" : "off"} data-qr={qr ? "on" : "off"}>
      <style>{`
        @page { size: ${paper === "a4" ? "A4" : "letter"}; margin: 11mm 0; }
        @media print { .resume-doc > div { padding-top: 0 !important; padding-bottom: 0 !important; } }
        .resume-shell[data-paper="a4"] .paper { width: 210mm; min-height: 297mm; }
        .resume-shell[data-paper="letter"] .paper { width: 8.5in; min-height: 11in; }
        .resume-shell[data-photo="off"] .resume-photo { display: none; }
        .resume-shell[data-qr="off"] .resume-qr { display: none; }
      `}</style>

      {!bare && (
        <div className="no-print sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
            {backHref && (
              <a href={backHref} className="mr-2 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
                <ArrowLeft size={15} aria-hidden />
                {labels.back}
              </a>
            )}
            {localeHrefs && Object.keys(localeHrefs).length > 1 && (
              <nav className="flex rounded-chip border border-line p-0.5" aria-label="Language">
                {(Object.entries(localeHrefs) as [Locale, string][]).map(([code, href]) => (
                  <a
                    key={code}
                    href={href}
                    aria-current={code === locale ? "true" : undefined}
                    className={`rounded-chip px-2 py-1 font-mono text-[0.7rem] ${code === locale ? "bg-ink text-bg" : "text-ink-3 hover:text-ink"}`}
                  >
                    {LOCALE_LABELS[code].short}
                  </a>
                ))}
              </nav>
            )}
            {variantLinks && variantLinks.length > 1 && (
              <label className="inline-flex items-center gap-2 text-xs text-ink-3">
                <span className="sr-only sm:not-sr-only">{labels.variant}</span>
                <select
                  value={variantLinks.find((v) => v.active)?.href}
                  onChange={(event) => (window.location.href = event.target.value)}
                  className="rounded-chip border border-line bg-elev px-2.5 py-1.5 text-xs text-ink"
                >
                  {variantLinks.map((v) => (
                    <option key={v.href} value={v.href}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <span className="hidden text-xs text-ink-3 sm:inline">{labels.paper}</span>
              <button type="button" className={`${toggle} ${paper === "a4" ? on : off}`} onClick={() => setPaper("a4")} aria-pressed={paper === "a4"}>
                A4
              </button>
              <button type="button" className={`${toggle} ${paper === "letter" ? on : off}`} onClick={() => setPaper("letter")} aria-pressed={paper === "letter"}>
                Letter
              </button>
              <button type="button" className={`${toggle} ${photo ? on : off}`} onClick={() => setPhoto(!photo)} aria-pressed={photo}>
                {labels.photo}
              </button>
              {hasQr && (
                <button type="button" className={`${toggle} ${qr ? on : off}`} onClick={() => setQr(!qr)} aria-pressed={qr}>
                  {labels.qr}
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-chip bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
              >
                <Printer size={15} aria-hidden />
                {labels.print}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="no-print mx-auto flex max-w-5xl justify-center px-4 pt-5">
        <p
          className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1 text-xs font-medium ${
            fits ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"
          }`}
        >
          {fits ? <Check size={13} aria-hidden /> : <TriangleAlert size={13} aria-hidden />}
          {fits ? labels.fits : labels.pages.replace("{n}", pages.toFixed(1))}
        </p>
      </div>

      <div ref={stage} className="relative overflow-x-auto px-4 pt-5 print:overflow-visible print:p-0">
        <div className="relative mx-auto w-fit">
          {children}
          {Array.from({ length: Math.max(0, Math.ceil(pages) - 1) }, (_, i) => (
            <div
              key={i}
              aria-hidden
              className="paper-page-sep no-print pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-bad/50"
              style={{ top: `${(i + 1) * PAGE_PX[paper]}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
