"use client";

import { ArrowRight, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Entry, Locale, Section } from "@/lib/content/schema";
import { formatRange } from "@/lib/content/dates";
import { t, typeLabel, UI } from "@/lib/content/i18n";
import { Facts, LinksRow, Tags } from "./EntryBits";
import { InvaderCover } from "./InvaderCover";

function Cover({ entry, locale, className }: { entry: Entry; locale: Locale; className: string }) {
  if (entry.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={entry.image}
        alt={t(entry.imageAlt, locale) || t(entry.title, locale)}
        loading="lazy"
        decoding="async"
        className={`${className} object-cover transition duration-500 group-hover:scale-[1.03]`}
      />
    );
  }
  return <InvaderCover seed={entry.id + t(entry.title, "en")} className={`${className} transition duration-500 group-hover:scale-[1.03]`} />;
}

function Meta({ entry, locale }: { entry: Entry; locale: Locale }) {
  const range = formatRange(entry.start, entry.end, locale);
  const type = typeLabel(entry.type, locale);
  if (!range && !type) return null;
  return (
    <p className="label flex flex-wrap items-center gap-x-2 text-[0.64rem] text-ink-3">
      {type && <span className="text-accent-text">{type}</span>}
      {type && range && <span aria-hidden>·</span>}
      {range && <span>{range}</span>}
    </p>
  );
}

function CaseStudyLink({ href, locale }: { href?: string; locale: Locale }) {
  if (!href) return null;
  return (
    <a href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-text">
      {UI[locale].caseStudy}
      <ArrowRight size={15} aria-hidden />
    </a>
  );
}

export function ProjectGrid({
  section,
  locale,
  caseStudies,
}: {
  section: Section;
  locale: Locale;
  /** entry id → case study URL */
  caseStudies: Record<string, string>;
}) {
  const ui = UI[locale];
  const types = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of section.items) if (item.type) seen.set(item.type.toLowerCase(), item.type);
    return [...seen.values()];
  }, [section.items]);
  const [filter, setFilter] = useState<string | null>(null);

  const visible = section.items.filter((item) => !filter || item.type.toLowerCase() === filter.toLowerCase());
  const featured = visible.filter((item) => item.featured);
  const rest = visible.filter((item) => !item.featured);

  return (
    <div>
      {types.length > 1 && (
        <div role="group" aria-label={t(section.title, locale)} className="mb-8 flex flex-wrap gap-2">
          {[null, ...types].map((type) => {
            const active = filter === type;
            const count = type ? section.items.filter((i) => i.type.toLowerCase() === type.toLowerCase()).length : section.items.length;
            return (
              <button
                key={type ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(type)}
                className={`rounded-chip border px-3.5 py-1.5 text-sm transition ${
                  active ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-line-strong hover:text-ink"
                }`}
              >
                {type ? typeLabel(type, locale) : ui.all}
                <span className="ml-1.5 font-mono text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="popLayout" initial={false}>
        {featured.map((item) => (
          <motion.article
            layout
            key={item.id}
            id={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="group mb-6 grid scroll-mt-28 overflow-hidden rounded-card border border-line bg-elev lg:grid-cols-[1.15fr_1fr]"
          >
            <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-sunken lg:aspect-auto lg:min-h-[320px] lg:border-b-0 lg:border-r">
              <Cover entry={item} locale={locale} className="absolute inset-0 size-full" />
              <span className="label absolute left-3 top-3 inline-flex items-center gap-1 rounded-chip bg-bg/85 px-2 py-1 text-[0.6rem] text-ink backdrop-blur">
                <Star size={11} className="fill-accent text-accent" aria-hidden />
                {ui.featured}
              </span>
            </div>
            <div className="flex flex-col gap-4 p-6 sm:p-8">
              <Meta entry={item} locale={locale} />
              <div>
                <h3 className="font-display text-2xl leading-tight text-ink sm:text-[1.75rem]">{t(item.title, locale)}</h3>
                {t(item.subtitle, locale) && <p className="mt-1 text-sm text-ink-3">{t(item.subtitle, locale)}</p>}
              </div>
              {t(item.summary, locale) && <p className="leading-relaxed text-ink-2">{t(item.summary, locale)}</p>}
              {item.bullets.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {item.bullets.slice(0, 3).map((bullet) => (
                    <li key={bullet.id} className="relative pl-4 text-ink-2">
                      <span aria-hidden className="absolute left-0 top-[0.6em] size-1.5 rounded-[1px] bg-accent" />
                      {t(bullet.text, locale)}
                    </li>
                  ))}
                </ul>
              )}
              <Facts entry={item} locale={locale} />
              <Tags tags={item.tags} locale={locale} />
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-2">
                <LinksRow entry={item} locale={locale} />
                <CaseStudyLink href={caseStudies[item.id]} locale={locale} />
              </div>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>

      <ul className="grid gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {rest.map((item) => (
            <motion.li
              layout
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="list-none"
            >
              <article
                id={item.id}
                className="group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-card border border-line bg-elev transition hover:border-line-strong"
              >
                <div className="relative h-28 overflow-hidden border-b border-line bg-sunken">
                  <Cover entry={item} locale={locale} className="absolute inset-0 size-full" />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <Meta entry={item} locale={locale} />
                  <div>
                    <h3 className="text-lg font-semibold leading-snug text-ink">{t(item.title, locale)}</h3>
                    {t(item.subtitle, locale) && <p className="text-sm text-ink-3">{t(item.subtitle, locale)}</p>}
                  </div>
                  {t(item.summary, locale) && <p className="text-sm leading-relaxed text-ink-2">{t(item.summary, locale)}</p>}
                  <Tags tags={item.tags} max={5} locale={locale} />
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                    <LinksRow entry={item} locale={locale} />
                    <CaseStudyLink href={caseStudies[item.id]} locale={locale} />
                  </div>
                </div>
              </article>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
