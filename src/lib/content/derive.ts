import type { Contact, Entry, LString, Portfolio, Section, SectionKind, Variant } from "./schema";
import { dateKey } from "./dates";

/* ─────────────────────────────── ids & slugs ─────────────────────────────── */

export function uid(prefix = ""): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}-${random}` : random;
}

const TRANSLIT: Record<string, string> = { "‘": "", "’": "", "'": "", "ʻ": "", "ʼ": "" };

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[‘’'ʻʼ]/g, (c) => TRANSLIT[c] ?? "")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const normalizeSkill = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

/* ─────────────────────────────── variants ─────────────────────────────── */

export function findVariant(portfolio: Portfolio, slug: string | undefined): Variant | undefined {
  if (!slug) return undefined;
  return portfolio.variants.find((v) => v.slug === slug);
}

/**
 * Returns a copy of the portfolio as seen through a variant: hidden sections/entries removed,
 * headline & summary overridden, emphasized skills floated to the front.
 */
export function applyVariant(portfolio: Portfolio, variant: Variant | undefined): Portfolio {
  if (!variant) return portfolio;
  const hidden = new Set(variant.hidden);
  const emphasized = variant.emphasize.map(normalizeSkill);
  const rank = (skill: string) => {
    const i = emphasized.indexOf(normalizeSkill(skill));
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const pick = (override: LString, base: LString): LString =>
    Object.values(override).some((v) => v?.trim()) ? { ...base, ...stripEmpty(override) } : base;

  return {
    ...portfolio,
    profile: {
      ...portfolio.profile,
      headline: pick(variant.headline, portfolio.profile.headline),
      summary: pick(variant.summary, portfolio.profile.summary),
    },
    sections: portfolio.sections
      .filter((s) => !hidden.has(s.id))
      .map((s) => ({
        ...s,
        items: s.items
          .filter((item) => !hidden.has(item.id))
          .map((item) =>
            s.kind === "skills" && emphasized.length
              ? { ...item, tags: [...item.tags].sort((a, b) => rank(a) - rank(b)) }
              : item,
          ),
      })),
  };
}

function stripEmpty(value: LString): LString {
  const out: LString = {};
  for (const [k, v] of Object.entries(value)) if (v?.trim()) out[k as keyof LString] = v;
  return out;
}

/* ─────────────────────────────── visibility ─────────────────────────────── */

export type Target = "site" | "resume";

export function visibleItems(section: Section, target: Target): Entry[] {
  return section.items.filter((item) => !item.hidden && !(target === "resume" && item.hideOnResume));
}

export function siteSections(portfolio: Portfolio): Section[] {
  return portfolio.sections
    .filter((s) => !s.hidden)
    .map((s) => ({ ...s, items: visibleItems(s, "site") }))
    .filter((s) => !(s.kind !== "text" && s.kind !== "timeline" && s.items.length === 0));
}

export function resumeSections(portfolio: Portfolio): Section[] {
  const order = portfolio.settings.resume.order;
  const sections = portfolio.sections
    .filter((s) => !s.hidden && !s.hideOnResume && s.kind !== "timeline" && s.kind !== "text")
    .map((s) => ({ ...s, items: visibleItems(s, "resume") }))
    .filter((s) => s.items.length > 0);
  if (!order.length) return sections;
  const index = (id: string) => {
    const i = order.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...sections].sort((a, b) => index(a.id) - index(b.id));
}

/* ─────────────────────────────── skills ↔ evidence ─────────────────────────────── */

export interface Evidence {
  entryId: string;
  sectionId: string;
  sectionKind: SectionKind;
  title: LString;
  subtitle: LString;
}

/** Maps every skill name (normalized) to the entries that list it as a tag. */
export function skillEvidence(sections: Section[]): Map<string, Evidence[]> {
  const map = new Map<string, Evidence[]>();
  for (const section of sections) {
    if (section.kind === "skills") continue;
    for (const item of section.items) {
      for (const tag of item.tags) {
        const key = normalizeSkill(tag);
        const list = map.get(key) ?? [];
        list.push({
          entryId: item.id,
          sectionId: section.id,
          sectionKind: section.kind,
          title: item.title,
          subtitle: item.subtitle,
        });
        map.set(key, list);
      }
    }
  }
  return map;
}

export function allTags(portfolio: Portfolio): string[] {
  const seen = new Map<string, string>();
  for (const section of portfolio.sections)
    for (const item of section.items)
      for (const tag of item.tags) if (!seen.has(normalizeSkill(tag))) seen.set(normalizeSkill(tag), tag);
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/* ─────────────────────────────── timeline ─────────────────────────────── */

export interface TimelineEvent {
  id: string;
  sectionId: string;
  kind: SectionKind;
  title: LString;
  subtitle: LString;
  start: string;
  end: string;
  sort: number;
}

/** Every dated, visible entry across the portfolio, newest first. */
export function timelineEvents(sections: Section[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const section of sections) {
    if (section.kind === "skills" || section.kind === "languages") continue;
    for (const item of section.items) {
      if (!item.start && !item.end) continue;
      events.push({
        id: item.id,
        sectionId: section.id,
        kind: section.kind,
        title: item.title,
        subtitle: item.subtitle,
        start: item.start,
        end: item.end,
        sort: dateKey(item.start || item.end, "start"),
      });
    }
  }
  return events.sort((a, b) => b.sort - a.sort);
}

/* ─────────────────────────────── projects ─────────────────────────────── */

export function entrySlug(entry: Entry): string {
  return slugify(entry.title.en || entry.title.uz || entry.title.ru || "") || entry.id;
}

/** Entries that have a long-form body get their own page. */
export function caseStudies(portfolio: Portfolio): { section: Section; entry: Entry; slug: string }[] {
  const out: { section: Section; entry: Entry; slug: string }[] = [];
  for (const section of siteSections(portfolio))
    for (const entry of section.items)
      if (Object.values(entry.body).some((v) => v?.trim())) out.push({ section, entry, slug: entrySlug(entry) });
  return out;
}

/* ─────────────────────────────── contacts ─────────────────────────────── */

export function contactHref(contact: Contact): string {
  if (contact.url) return contact.url;
  const v = contact.value.trim();
  switch (contact.kind) {
    case "email":
      return `mailto:${v}`;
    case "phone":
      return `tel:${v.replace(/[^\d+]/g, "")}`;
    case "telegram":
      return `https://t.me/${v.replace(/^@/, "")}`;
    case "github":
      return v.startsWith("http") ? v : `https://github.com/${v.replace(/^@/, "")}`;
    case "linkedin":
      return v.startsWith("http") ? v : `https://www.linkedin.com/in/${v}`;
    case "x":
      return v.startsWith("http") ? v : `https://x.com/${v.replace(/^@/, "")}`;
    case "location":
      return "";
    default:
      return v.startsWith("http") ? v : v.includes(".") ? `https://${v}` : "";
  }
}

export function primaryEmail(portfolio: Portfolio): string {
  return portfolio.profile.contacts.find((c) => c.kind === "email" && c.onSite)?.value ?? "";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
