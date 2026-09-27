import type { Locale, Portfolio } from "@/lib/content/schema";
import { LOCALE_LABELS } from "@/lib/content/schema";
import { initials, primaryEmail, siteSections } from "@/lib/content/derive";
import { t, UI } from "@/lib/content/i18n";
import { CommandPalette, type PaletteItem } from "./CommandPalette";
import { ContactBlock } from "./ContactBlock";
import { Hero } from "./Hero";
import { SecretMode } from "./SecretMode";
import { SectionRenderer, sectionAnchor } from "./Sections";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export interface PortfolioViewProps {
  portfolio: Portfolio;
  locale: Locale;
  /** "/en" or "/en/v/game-dev" — where this view lives. */
  basePath: string;
  resumeHref: string;
  localeHrefs: Partial<Record<Locale, string>>;
}

/**
 * The whole public portfolio page. Pure (no server-only APIs), so the Studio's live preview
 * renders exactly the same component with draft content.
 */
export function PortfolioView({ portfolio, locale, basePath, resumeHref, localeHrefs }: PortfolioViewProps) {
  const ui = UI[locale];
  const sections = siteSections(portfolio);
  const name = t(portfolio.profile.name, locale);
  const email = primaryEmail(portfolio);
  const homeHref = basePath.split("/v/")[0] || "/";

  const nav = sections
    .filter((s) => s.kind !== "text" && s.kind !== "timeline")
    .slice(0, 4)
    .map((s) => ({ href: `#${sectionAnchor(s)}`, label: t(s.title, locale) }));
  nav.push({ href: "#contact", label: ui.contact });

  const palette: PaletteItem[] = [
    ...sections.map((s) => ({ id: `s-${s.id}`, group: ui.goTo, label: t(s.title, locale), href: `#${sectionAnchor(s)}` })),
    { id: "contact", group: ui.goTo, label: ui.contact, href: "#contact" },
    ...sections
      .filter((s) => s.kind === "projects" || s.kind === "experience")
      .flatMap((s) =>
        s.items.map((item) => ({
          id: `e-${item.id}`,
          group: t(s.title, locale),
          label: t(item.title, locale),
          hint: t(item.subtitle, locale),
          href: `#${item.id}`,
        })),
      ),
    { id: "resume", group: ui.actions, label: ui.openResume, href: resumeHref, icon: "resume" },
    { id: "theme", group: ui.actions, label: ui.toggleTheme, action: "theme", icon: "theme" },
    ...(email ? [{ id: "copy", group: ui.actions, label: ui.copyEmail, hint: email, action: "copy" as const, payload: email, icon: "mail" as const }] : []),
    ...(portfolio.theme.secrets ? [{ id: "arcade", group: ui.actions, label: ui.arcade, action: "arcade" as const, icon: "arcade" as const }] : []),
    ...(Object.entries(localeHrefs) as [Locale, string][])
      .filter(([code]) => code !== locale)
      .map(([code, href]) => ({ id: `l-${code}`, group: ui.language, label: LOCALE_LABELS[code].native, hint: LOCALE_LABELS[code].short, href, icon: "lang" as const })),
  ];

  return (
    <div className="grain crt relative min-h-screen overflow-x-clip">
      <SiteHeader
        name={name}
        initials={initials(t(portfolio.profile.name, "en") || name)}
        locale={locale}
        homeHref={homeHref}
        resumeHref={resumeHref}
        nav={nav}
        localeHrefs={localeHrefs}
        labels={{
          resume: ui.resume,
          menu: ui.menu,
          close: ui.close,
          toggleTheme: ui.toggleTheme,
          switchLanguage: ui.switchLanguage,
          skipToContent: ui.skipToContent,
          search: ui.search,
        }}
      />
      <main id="main" className="relative z-[1]">
        <Hero portfolio={portfolio} locale={locale} resumeHref={resumeHref} email={email} />
        {sections.map((section, index) => (
          <SectionRenderer
            key={section.id}
            section={section}
            index={index + 1}
            locale={locale}
            portfolio={portfolio}
            allSections={sections}
            basePath={basePath.split("/v/")[0]}
          />
        ))}
        <ContactBlock portfolio={portfolio} locale={locale} email={email} />
      </main>
      <SiteFooter portfolio={portfolio} locale={locale} />
      <CommandPalette items={palette} placeholder={ui.commandHint} empty={ui.noMatches} />
      <SecretMode enabled={portfolio.theme.secrets} title={ui.achievement} onText={ui.secretFound} offText={ui.secretLeft} />
    </div>
  );
}
