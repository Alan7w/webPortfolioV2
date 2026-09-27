import { Award, Briefcase, Code2, GraduationCap, Sparkles, Star } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale, Portfolio, Section, SectionKind } from "@/lib/content/schema";
import { caseStudies, skillEvidence, slugify, timelineEvents } from "@/lib/content/derive";
import { formatRange, yearOf } from "@/lib/content/dates";
import { t, typeLabel } from "@/lib/content/i18n";
import { Markdown } from "@/components/shared/Markdown";
import { Bullets, DateBlock, Facts, LinksRow, OrgLine, Tags, TypeBadge } from "./EntryBits";
import { ProjectGrid } from "./ProjectGrid";
import { SkillsBoard, type EvidenceLite } from "./SkillsBoard";

export function sectionAnchor(section: Section) {
  return slugify(section.title.en ?? "") || section.id;
}

export function SectionShell({
  section,
  index,
  locale,
  children,
  wide = false,
}: {
  section: Section;
  index: number;
  locale: Locale;
  children: ReactNode;
  wide?: boolean;
}) {
  const intro = section.kind !== "text" ? t(section.intro, locale) : "";
  return (
    <section id={sectionAnchor(section)} aria-labelledby={`${section.id}-title`} className="relative scroll-mt-20 border-t border-line">
      <div
        className={`mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 ${wide ? "" : "lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-16"}`}
      >
        <header className="self-start lg:sticky lg:top-24">
          <p className="label text-ink-3">
            <span className="text-accent-text">{String(index).padStart(2, "0")}</span>
          </p>
          <h2 id={`${section.id}-title`} className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
            {t(section.title, locale)}
          </h2>
          {intro && <Markdown text={intro} className="prose-md mt-3 max-w-md text-sm" />}
        </header>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function ExperienceList({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <div className="divide-y divide-line">
      {section.items.map((item) => (
        <article key={item.id} id={item.id} className="grid scroll-mt-28 gap-x-10 gap-y-3 py-8 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr]">
          <DateBlock entry={item} locale={locale} />
          <div className="min-w-0 space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold leading-snug text-ink">{t(item.title, locale)}</h3>
                <TypeBadge type={item.type} locale={locale} />
              </div>
              <OrgLine entry={item} locale={locale} />
            </div>
            {t(item.summary, locale) && <Markdown text={t(item.summary, locale)} />}
            <Bullets entry={item} locale={locale} />
            <Facts entry={item} locale={locale} />
            <Tags tags={item.tags} locale={locale} />
            <LinksRow entry={item} locale={locale} />
          </div>
        </article>
      ))}
    </div>
  );
}

function EducationList({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <div className="space-y-5">
      {section.items.map((item) => (
        <article key={item.id} id={item.id} className="scroll-mt-28 rounded-card border border-line bg-elev p-6 sm:p-7">
          <div className="grid gap-x-10 gap-y-3 sm:grid-cols-[150px_1fr]">
            <DateBlock entry={item} locale={locale} showDuration={false} />
            <div className="min-w-0 space-y-4">
              <div>
                <h3 className="font-display text-xl leading-snug text-ink sm:text-2xl">{t(item.title, locale)}</h3>
                <OrgLine entry={item} locale={locale} />
              </div>
              {t(item.summary, locale) && <Markdown text={t(item.summary, locale)} />}
              <Facts entry={item} locale={locale} />
              <Bullets entry={item} locale={locale} />
              <LinksRow entry={item} locale={locale} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function AwardsList({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {section.items.map((item) => {
        const range = formatRange(item.start, item.end, locale);
        return (
          <li key={item.id} id={item.id} className="scroll-mt-28">
            <article
              className={`flex h-full flex-col gap-2 rounded-card border p-5 ${
                item.featured ? "border-accent/50 bg-accent-soft" : "border-line bg-elev"
              }`}
            >
              <p className="label flex items-center gap-2 text-[0.62rem] text-ink-3">
                {item.featured ? <Star size={12} className="fill-accent text-accent" aria-hidden /> : <Award size={12} aria-hidden />}
                {typeLabel(item.type, locale)}
                {range && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">{range}</span>
                  </>
                )}
              </p>
              <h3 className="font-semibold leading-snug text-ink">
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-accent-text">
                    {t(item.title, locale)}
                  </a>
                ) : (
                  t(item.title, locale)
                )}
              </h3>
              {t(item.subtitle, locale) && <p className="text-sm text-ink-2">{t(item.subtitle, locale)}</p>}
              {t(item.summary, locale) && <p className="text-sm leading-relaxed text-ink-3">{t(item.summary, locale)}</p>}
              <LinksRow entry={item} locale={locale} className="mt-auto pt-1" />
            </article>
          </li>
        );
      })}
    </ul>
  );
}

function LanguagesList({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {section.items.map((item) => (
        <li key={item.id} id={item.id} className="rounded-card border border-line bg-elev p-5">
          <p className="font-display text-xl text-ink">{t(item.title, locale)}</p>
          <p className="label mt-1 text-[0.66rem] text-accent-text">{t(item.subtitle, locale)}</p>
          {t(item.summary, locale) && <p className="mt-2 text-sm text-ink-3">{t(item.summary, locale)}</p>}
        </li>
      ))}
    </ul>
  );
}

function CustomList({ section, locale }: { section: Section; locale: Locale }) {
  return (
    <div className="divide-y divide-line">
      {section.items.map((item) => (
        <article key={item.id} id={item.id} className="grid scroll-mt-28 gap-x-10 gap-y-3 py-7 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr]">
          <DateBlock entry={item} locale={locale} showDuration={false} />
          <div className="min-w-0 space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold text-ink">{t(item.title, locale)}</h3>
                <TypeBadge type={item.type} locale={locale} />
              </div>
              <OrgLine entry={item} locale={locale} />
            </div>
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={t(item.imageAlt, locale)} className="max-h-72 rounded-card border border-line object-cover" loading="lazy" />
            )}
            {t(item.summary, locale) && <Markdown text={t(item.summary, locale)} />}
            <Bullets entry={item} locale={locale} />
            <Facts entry={item} locale={locale} />
            <Tags tags={item.tags} locale={locale} />
            <LinksRow entry={item} locale={locale} />
          </div>
        </article>
      ))}
    </div>
  );
}

const TIMELINE_ICON: Partial<Record<SectionKind, typeof Briefcase>> = {
  experience: Briefcase,
  education: GraduationCap,
  projects: Code2,
  awards: Award,
};

function JourneyTimeline({ sections, locale }: { sections: Section[]; locale: Locale }) {
  const events = timelineEvents(sections);
  const years = new Map<number, typeof events>();
  for (const event of events) {
    const year = yearOf(event.start || event.end) ?? 0;
    years.set(year, [...(years.get(year) ?? []), event]);
  }
  return (
    <ol className="relative">
      <span aria-hidden className="absolute bottom-2 left-[5rem] top-2 w-px bg-line sm:left-[6rem]" />
      {[...years.entries()].map(([year, list]) => (
        <li key={year} className="relative grid grid-cols-[3.5rem_1fr] gap-x-6 pb-8 last:pb-0 sm:grid-cols-[4.5rem_1fr]">
          <p className="pt-0.5 text-right font-display text-xl tabular-nums text-ink sm:text-2xl">{year || "—"}</p>
          <ul className="space-y-4">
            {list.map((event) => {
              const Icon = TIMELINE_ICON[event.kind] ?? Sparkles;
              return (
                <li key={event.id} className="relative pl-7">
                  <span
                    aria-hidden
                    className="absolute left-[-0.72rem] top-0.5 flex size-[1.45rem] items-center justify-center rounded-full border border-line bg-bg text-accent-text"
                  >
                    <Icon size={12} />
                  </span>
                  <a href={`#${event.id}`} className="group block">
                    <span className="block font-medium leading-snug text-ink group-hover:text-accent-text">{t(event.title, locale)}</span>
                    <span className="block text-sm text-ink-3">
                      {[t(event.subtitle, locale), formatRange(event.start, event.end, locale)].filter(Boolean).join(" · ")}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function SectionRenderer({
  section,
  index,
  locale,
  portfolio,
  allSections,
  basePath,
}: {
  section: Section;
  index: number;
  locale: Locale;
  portfolio: Portfolio;
  allSections: Section[];
  /** e.g. "/en" — used for case-study links. */
  basePath: string;
}) {
  let body: ReactNode = null;
  switch (section.kind) {
    case "experience":
      body = <ExperienceList section={section} locale={locale} />;
      break;
    case "education":
      body = <EducationList section={section} locale={locale} />;
      break;
    case "projects": {
      const studies: Record<string, string> = {};
      for (const study of caseStudies(portfolio)) studies[study.entry.id] = `${basePath}/projects/${study.slug}`;
      body = <ProjectGrid section={section} locale={locale} caseStudies={studies} />;
      break;
    }
    case "skills": {
      const evidence: Record<string, EvidenceLite[]> = {};
      for (const [key, list] of skillEvidence(allSections)) {
        evidence[key] = list.map(({ entryId, sectionKind, title, subtitle }) => ({ entryId, sectionKind, title, subtitle }));
      }
      body = <SkillsBoard section={section} evidence={evidence} locale={locale} />;
      break;
    }
    case "awards":
      body = <AwardsList section={section} locale={locale} />;
      break;
    case "languages":
      body = <LanguagesList section={section} locale={locale} />;
      break;
    case "text":
      body = <Markdown text={t(section.intro, locale)} className="prose-md max-w-2xl text-lg [&_p]:leading-8" />;
      break;
    case "timeline":
      body = <JourneyTimeline sections={allSections} locale={locale} />;
      break;
    default:
      body = <CustomList section={section} locale={locale} />;
  }
  return (
    <SectionShell section={section} index={index} locale={locale}>
      {body}
    </SectionShell>
  );
}
