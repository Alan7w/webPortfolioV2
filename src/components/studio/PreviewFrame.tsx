"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { ObyektivkaDocument } from "@/components/obyektivka/ObyektivkaDocument";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { ResumeShell } from "@/components/resume/ResumeShell";
import { PortfolioView } from "@/components/site/PortfolioView";
import { applyVariant, findVariant } from "@/lib/content/derive";
import { isLocale, UI } from "@/lib/content/i18n";
import { ContactSchema, ObyektivkaSchema, PortfolioSchema, type Contact, type Locale, type Obyektivka, type Portfolio } from "@/lib/content/schema";
import { themeAttributes } from "@/lib/content/theme";
import type { PreviewMessage } from "./PreviewPane";

interface State {
  doc: Portfolio;
  locale: Locale;
  page: PreviewMessage["page"];
  variant: string;
  contacts: Contact[];
  oby: Obyektivka | null;
}

/** Runs inside the preview iframe: renders whatever draft the Studio sends. */
export function PreviewFrame() {
  const [state, setState] = useState<State | null>(null);
  const [qrCache, setQrCache] = useState<{ url: string; svg: string } | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type === "studio:render") {
        const parsed = PortfolioSchema.safeParse(data.doc);
        if (!parsed.success) return;
        setState({
          doc: parsed.data,
          locale: isLocale(data.locale) ? data.locale : "en",
          page: data.page,
          variant: data.variant ?? "",
          contacts: (data.privateContacts ?? []).map((c: unknown) => ContactSchema.parse(c)),
          oby: data.obyektivka ? ObyektivkaSchema.parse(data.obyektivka) : null,
        });
      } else if (data?.type === "studio:focus" && typeof data.id === "string") {
        const el = document.getElementById(data.id);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.animate([{ boxShadow: "0 0 0 3px var(--accent)" }, { boxShadow: "0 0 0 3px transparent" }], { duration: 1400, easing: "ease-out" });
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "studio:ready" }, window.location.origin);

    // Keep the preview inside the preview: in-page anchors work, other links open in a new tab.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (href.startsWith("#")) return;
      event.preventDefault();
      if (/^(https?:|mailto:|tel:)/.test(href)) window.open(href, "_blank", "noopener");
    };
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  // Theme → <html>, exactly like the public layout does.
  useEffect(() => {
    if (!state) return;
    const root = document.documentElement;
    const attrs = themeAttributes(state.doc.theme);
    root.setAttribute("data-theme", attrs["data-theme"]);
    root.setAttribute("data-radius", attrs["data-radius"]);
    root.setAttribute("data-motion", attrs["data-motion"]);
    for (const [k, v] of Object.entries(attrs.style)) root.style.setProperty(k, String(v));
    const mode = state.doc.theme.mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : state.doc.theme.mode;
    root.setAttribute("data-mode", state.page === "site" ? mode : "light");
    root.lang = state.locale;
  }, [state]);

  const siteUrl = state?.doc.settings.siteUrl ?? "";
  useEffect(() => {
    if (!siteUrl) return;
    QRCode.toString(siteUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111111ff", light: "#ffffff00" } }).then(
      (svg) => setQrCache({ url: siteUrl, svg }),
      () => setQrCache(null),
    );
  }, [siteUrl]);
  const qr = siteUrl && qrCache?.url === siteUrl ? qrCache.svg : undefined;

  if (!state) return <div className="flex min-h-screen items-center justify-center text-sm text-ink-3">Waiting for the Studio…</div>;

  const { doc, locale, page, variant, contacts, oby } = state;
  const ui = UI[locale];
  const portfolio = applyVariant(doc, findVariant(doc, variant));

  if (page === "obyektivka") {
    if (!oby) return <p className="p-8 text-sm text-ink-3">No Obyektivka data in the vault yet.</p>;
    return (
      <div className="paper-stage min-h-screen py-6 print:py-0">
        <ObyektivkaDocument oby={oby} photoSrc={oby.photo ? `/api/studio/private-file?name=${encodeURIComponent(oby.photo)}` : undefined} />
      </div>
    );
  }

  if (page === "resume") {
    const settings = portfolio.settings.resume;
    return (
      <ResumeShell
        bare
        locale={locale}
        defaults={{ paper: settings.paper, photo: settings.showPhoto, qr: settings.showQr }}
        hasQr={Boolean(qr)}
        labels={{ back: "", print: ui.printPdf, paper: ui.paper, photo: ui.photo, qr: ui.qr, fits: ui.fitsOnePage, pages: ui.pages("{n}"), variant: ui.variant }}
      >
        <ResumeDocument portfolio={portfolio} locale={locale} extraContacts={contacts} qrSvg={settings.showQr ? qr : undefined} qrUrl={siteUrl} />
      </ResumeShell>
    );
  }

  return (
    <PortfolioView
      portfolio={portfolio}
      locale={locale}
      basePath={`/${locale}`}
      resumeHref="#"
      localeHrefs={Object.fromEntries(doc.settings.locales.map((l) => [l, "#"]))}
    />
  );
}
