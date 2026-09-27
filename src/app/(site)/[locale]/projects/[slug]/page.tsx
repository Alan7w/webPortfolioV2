import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Facts, LinksRow, Tags } from "@/components/site/EntryBits";
import { InvaderCover } from "@/components/site/InvaderCover";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { Markdown } from "@/components/shared/Markdown";
import { caseStudies } from "@/lib/content/derive";
import { formatRange } from "@/lib/content/dates";
import { t, typeLabel, UI } from "@/lib/content/i18n";
import { getPortfolio } from "@/lib/content/load";
import { LOCALE_LABELS, type Locale } from "@/lib/content/schema";
import { buildMetadata, localeHrefs, paths } from "@/lib/content/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies(getPortfolio()).map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  const portfolio = getPortfolio();
  const study = caseStudies(portfolio).find((s) => s.slug === slug);
  if (!study) return {};
  return buildMetadata(portfolio, locale, {
    build: (l) => paths.project(l, slug),
    title: `${t(study.entry.title, locale)} — ${t(portfolio.profile.name, locale)}`,
    description: t(study.entry.summary, locale),
  });
}

export default async function ProjectPage({ params }: PageProps<"/[locale]/projects/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  const ui = UI[locale];
  const portfolio = getPortfolio();
  const studies = caseStudies(portfolio);
  const index = studies.findIndex((s) => s.slug === slug);
  if (index === -1) notFound();
  const { entry } = studies[index];
  const next = studies.length > 1 ? studies[(index + 1) % studies.length] : null;
  const range = formatRange(entry.start, entry.end, locale);
  const langs = localeHrefs(portfolio, (l) => paths.project(l, slug));

  return (
    <div className="grain crt relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-5 sm:px-8">
          <a href={`${paths.home(locale)}#${entry.id}`} className="inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink">
            <ArrowLeft size={16} aria-hidden />
            {ui.backToPortfolio}
          </a>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle label={ui.toggleTheme} />
            <nav aria-label={ui.switchLanguage} className="flex rounded-chip border border-line p-0.5">
              {(Object.entries(langs) as [Locale, string][]).map(([code, href]) => (
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
          </div>
        </div>
      </header>

      <main className="relative z-[1] mx-auto max-w-4xl px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <p className="label flex flex-wrap gap-x-2 text-ink-3">
          {entry.type && <span className="text-accent-text">{typeLabel(entry.type, locale)}</span>}
          {range && <span>· {range}</span>}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,7vw,4.5rem)] leading-[1] text-ink">{t(entry.title, locale)}</h1>
        {t(entry.subtitle, locale) && <p className="mt-3 text-lg text-ink-3">{t(entry.subtitle, locale)}</p>}
        {t(entry.summary, locale) && <p className="mt-6 max-w-3xl text-xl leading-relaxed text-ink-2">{t(entry.summary, locale)}</p>}
        <LinksRow entry={entry} locale={locale} className="mt-6" />

        <div className="mt-10 aspect-[16/9] overflow-hidden rounded-card border border-line bg-sunken">
          {entry.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.image} alt={t(entry.imageAlt, locale)} className="size-full object-cover" />
          ) : (
            <InvaderCover seed={entry.id + t(entry.title, "en")} className="size-full" />
          )}
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_220px]">
          <article>
            <Markdown text={t(entry.body, locale)} className="prose-md text-[1.05rem]" />
          </article>
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Facts entry={entry} locale={locale} className="!grid-cols-1" />
            {entry.tags.length > 0 && (
              <div>
                <p className="label mb-2 text-[0.64rem] text-ink-3">{ui.skills}</p>
                <Tags tags={entry.tags} locale={locale} />
              </div>
            )}
          </aside>
        </div>

        {next && (
          <a
            href={paths.project(locale, next.slug)}
            className="group mt-20 flex items-center justify-between gap-6 rounded-card border border-line bg-elev p-6 transition hover:border-line-strong"
          >
            <span>
              <span className="label block text-[0.62rem] text-ink-3">{ui.viewProject}</span>
              <span className="mt-1 block font-display text-2xl text-ink">{t(next.entry.title, locale)}</span>
            </span>
            <ArrowRight className="text-ink-3 transition group-hover:translate-x-1 group-hover:text-accent-text" aria-hidden />
          </a>
        )}
      </main>
    </div>
  );
}
