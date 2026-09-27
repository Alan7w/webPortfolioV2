import QRCode from "qrcode";
import type { Locale, Portfolio } from "@/lib/content/schema";
import { applyVariant, findVariant } from "@/lib/content/derive";
import { UI } from "@/lib/content/i18n";
import { localeHrefs, paths, resolveSiteUrl } from "@/lib/content/seo";
import { ResumeDocument } from "./ResumeDocument";
import { ResumeShell } from "./ResumeShell";

export async function qrFor(url: string) {
  return QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#111111ff", light: "#ffffff00" } });
}

/** Shared by /[locale]/resume and /[locale]/resume/[variant]. */
export async function ResumePage({ base, locale, variantSlug }: { base: Portfolio; locale: Locale; variantSlug?: string }) {
  const ui = UI[locale];
  const variant = findVariant(base, variantSlug);
  const siteUrl = resolveSiteUrl(base);
  const varied = applyVariant(base, variant);
  const portfolio = { ...varied, settings: { ...varied.settings, siteUrl } };
  const settings = portfolio.settings;
  const qrUrl = siteUrl ? new URL(paths.home(locale, variant?.slug), siteUrl).toString() : "";
  const qrSvg = qrUrl ? await qrFor(qrUrl) : undefined;

  const variantLinks = [
    { href: paths.resume(locale), label: ui.standard, active: !variant },
    ...base.variants.map((v) => ({ href: paths.resume(locale, v.slug), label: v.label || v.slug, active: v.id === variant?.id })),
  ];

  return (
    <ResumeShell
      locale={locale}
      backHref={paths.home(locale, variant?.slug)}
      localeHrefs={localeHrefs(base, (l) => paths.resume(l, variant?.slug))}
      variantLinks={variantLinks}
      defaults={{ paper: settings.resume.paper, photo: settings.resume.showPhoto, qr: settings.resume.showQr }}
      hasQr={Boolean(qrSvg)}
      labels={{
        back: ui.backToPortfolio,
        print: ui.printPdf,
        paper: ui.paper,
        photo: ui.photo,
        qr: ui.qr,
        fits: ui.fitsOnePage,
        pages: ui.pages("{n}"),
        variant: ui.variant,
      }}
    >
      <ResumeDocument portfolio={portfolio} locale={locale} qrSvg={qrSvg} qrUrl={qrUrl} />
    </ResumeShell>
  );
}
