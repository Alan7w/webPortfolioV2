import type { Entry, Locale } from "@/lib/content/schema";
import { formatDuration, formatRange } from "@/lib/content/dates";
import { t, typeLabel, UI } from "@/lib/content/i18n";
import { InlineMarkdown } from "@/components/shared/Markdown";
import { LinkKindIcon } from "@/components/shared/Icons";

export function DateBlock({ entry, locale, showDuration = true }: { entry: Entry; locale: Locale; showDuration?: boolean }) {
  const range = formatRange(entry.start, entry.end, locale);
  if (!range) return null;
  // Durations mislead for seasonal work ("May 2022 – Aug 2024" was three summers, not 2+ years).
  const duration = showDuration && entry.type.toLowerCase() !== "seasonal" ? formatDuration(entry.start, entry.end, locale) : "";
  return (
    <p className="font-mono text-[0.8rem] leading-6 text-ink-3 tabular-nums">
      <span className="text-ink-2">{range}</span>
      {duration && <span className="block text-ink-3 sm:mt-0.5">{duration}</span>}
    </p>
  );
}

export function TypeBadge({ type, locale }: { type: string; locale: Locale }) {
  if (!type) return null;
  return (
    <span className="label inline-flex items-center rounded-chip border border-line px-2 py-0.5 text-[0.62rem] text-ink-3">
      {typeLabel(type, locale)}
    </span>
  );
}

export function Tags({ tags, max, locale, className = "" }: { tags: string[]; max?: number; locale: Locale; className?: string }) {
  if (!tags.length) return null;
  const shown = max ? tags.slice(0, max) : tags;
  const rest = tags.length - shown.length;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {shown.map((tag) => (
        <li key={tag} className="rounded-chip bg-sunken px-2.5 py-1 font-mono text-[0.72rem] leading-none text-ink-2">
          {tag}
        </li>
      ))}
      {rest > 0 && <li className="px-1 py-1 font-mono text-[0.72rem] leading-none text-ink-3">{UI[locale].more(rest)}</li>}
    </ul>
  );
}

export function linkLabel(link: Entry["links"][number], locale: Locale) {
  const custom = t(link.label, locale);
  if (custom) return custom;
  const ui = UI[locale];
  return { live: ui.live, code: ui.code, video: ui.video, article: ui.article, download: ui.download, other: ui.link }[link.kind];
}

export function LinksRow({ entry, locale, className = "" }: { entry: Entry; locale: Locale; className?: string }) {
  const links = entry.links.filter((link) => link.url.trim());
  if (!links.length) return null;
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-accent-text underline-offset-4 hover:underline"
          >
            <LinkKindIcon kind={link.kind} url={link.url} />
            {linkLabel(link, locale)}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Facts({ entry, locale, className = "" }: { entry: Entry; locale: Locale; className?: string }) {
  const facts = entry.facts.filter((fact) => t(fact.value, locale));
  if (!facts.length) return null;
  return (
    <dl className={`grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[max-content_1fr] ${className}`}>
      {facts.map((fact) => (
        <div key={fact.id} className="contents">
          <dt className="label pt-0.5 text-[0.66rem] text-ink-3">{t(fact.label, locale)}</dt>
          <dd className="text-ink-2">{t(fact.value, locale)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Bullets({ entry, locale, className = "" }: { entry: Entry; locale: Locale; className?: string }) {
  const bullets = entry.bullets.map((b) => t(b.text, locale)).filter(Boolean);
  if (!bullets.length) return null;
  return (
    <ul className={`space-y-2 ${className}`}>
      {bullets.map((bullet, i) => (
        <li key={i} className="relative pl-5 leading-relaxed text-ink-2">
          <span aria-hidden className="absolute left-0.5 top-[0.62em] size-[0.4rem] rounded-[1px] bg-accent" />
          <InlineMarkdown text={bullet} />
        </li>
      ))}
    </ul>
  );
}

export function OrgLine({ entry, locale }: { entry: Entry; locale: Locale }) {
  const subtitle = t(entry.subtitle, locale);
  const location = t(entry.location, locale);
  if (!subtitle && !location) return null;
  return (
    <p className="text-ink-2">
      {subtitle &&
        (entry.url ? (
          <a href={entry.url} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-4 hover:decoration-accent">
            {subtitle}
          </a>
        ) : (
          subtitle
        ))}
      {subtitle && location && <span className="text-ink-3"> · </span>}
      {location && <span className="text-ink-3">{location}</span>}
    </p>
  );
}
