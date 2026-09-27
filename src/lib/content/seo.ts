import type { Metadata } from "next";
import type { Locale, Portfolio } from "./schema";
import { LOCALES } from "./schema";
import { contactHref } from "./derive";
import { t } from "./i18n";

/**
 * The public URL: the owner's setting wins; on Vercel we fall back to the production domain so
 * QR codes, sitemaps and link previews work before a custom domain is configured.
 */
export function resolveSiteUrl(portfolio: Portfolio): string {
  const own = portfolio.settings.siteUrl.trim().replace(/\/$/, "");
  if (own) return own;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "";
}

export function enabledLocales(portfolio: Portfolio): Locale[] {
  const list = portfolio.settings.locales.filter((l) => (LOCALES as readonly string[]).includes(l));
  if (!list.includes(portfolio.settings.defaultLocale)) list.unshift(portfolio.settings.defaultLocale);
  return [...new Set(list)];
}

export const paths = {
  home: (locale: Locale, variant?: string) => (variant ? `/${locale}/v/${variant}` : `/${locale}`),
  resume: (locale: Locale, variant?: string) => (variant ? `/${locale}/resume/${variant}` : `/${locale}/resume`),
  project: (locale: Locale, slug: string) => `/${locale}/projects/${slug}`,
};

export function localeHrefs(portfolio: Portfolio, build: (locale: Locale) => string): Partial<Record<Locale, string>> {
  return Object.fromEntries(enabledLocales(portfolio).map((l) => [l, build(l)]));
}

function stripMd(text: string) {
  return text.replace(/\*\*|__|\*|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export function buildMetadata(
  portfolio: Portfolio,
  locale: Locale,
  options: { build: (locale: Locale) => string; title?: string; description?: string; noindex?: boolean },
): Metadata {
  const name = t(portfolio.profile.name, locale);
  const title = options.title ?? (t(portfolio.settings.seo.title, locale) || `${name} — ${t(portfolio.profile.headline, locale)}`);
  const description =
    options.description ?? stripMd(t(portfolio.settings.seo.description, locale) || t(portfolio.profile.summary, locale)).slice(0, 300);
  const siteUrl = resolveSiteUrl(portfolio);
  const path = options.build(locale);
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title,
    description,
    applicationName: name,
    authors: [{ name }],
    alternates: {
      canonical: path,
      languages: Object.fromEntries([
        ...enabledLocales(portfolio).map((l) => [l, options.build(l)]),
        ["x-default", options.build(portfolio.settings.defaultLocale)],
      ]),
    },
    openGraph: {
      type: "profile",
      title,
      description,
      url: path,
      siteName: name,
      locale: { en: "en_US", uz: "uz_UZ", ru: "ru_RU" }[locale],
    },
    twitter: { card: "summary_large_image", title, description },
    robots: options.noindex ? { index: false, follow: true } : undefined,
  };
}

/** schema.org Person — helps search engines show a rich result for your name. */
export function personJsonLd(portfolio: Portfolio, locale: Locale) {
  const profile = portfolio.profile;
  const siteUrl = resolveSiteUrl(portfolio);
  const email = profile.contacts.find((c) => c.kind === "email" && c.onSite)?.value;
  const sameAs = profile.contacts
    .filter((c) => c.onSite && !["email", "phone", "location"].includes(c.kind))
    .map(contactHref)
    .filter((href) => href.startsWith("http"));
  const schools = portfolio.sections
    .filter((s) => s.kind === "education" && !s.hidden)
    .flatMap((s) => s.items.filter((i) => !i.hidden))
    .map((i) => ({ "@type": "EducationalOrganization", name: t(i.subtitle, "en") || t(i.subtitle, locale) }))
    .filter((org) => org.name);
  const skills = portfolio.sections
    .filter((s) => s.kind === "skills" && !s.hidden)
    .flatMap((s) => s.items.flatMap((i) => i.tags));
  const languages = portfolio.sections
    .filter((s) => s.kind === "languages" && !s.hidden)
    .flatMap((s) => s.items.map((i) => t(i.title, "en")))
    .filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t(profile.name, locale),
    alternateName: [profile.name.en, profile.name.uz, profile.name.ru].filter((n) => n && n !== t(profile.name, locale)),
    jobTitle: t(profile.headline, locale),
    description: stripMd(t(profile.summary, locale)),
    ...(siteUrl ? { url: siteUrl } : {}),
    ...(siteUrl && profile.avatar ? { image: new URL(profile.avatar, siteUrl).toString() } : {}),
    ...(email ? { email: `mailto:${email}` } : {}),
    sameAs,
    alumniOf: schools,
    knowsAbout: skills,
    knowsLanguage: languages,
  };
}

export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
