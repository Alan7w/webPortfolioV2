/**
 * The single source of truth for everything the portfolio renders.
 *
 * Design rules:
 *  - Every human-readable string is a `LString` ({ en, uz, ru }) so any field can be translated.
 *    A plain string is accepted too and treated as English, which keeps hand-editing easy.
 *  - Every list item carries a stable `id` so the Studio can reorder, link and review it.
 *  - Unknown or missing fields fall back to defaults, so older content files keep working
 *    as the schema grows (bump `schemaVersion` and add a migration in `migrate.ts` for breaking changes).
 */
import { z } from "zod";

export const LOCALES = ["en", "uz", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, { short: string; native: string; english: string }> = {
  en: { short: "EN", native: "English", english: "English" },
  uz: { short: "UZ", native: "O‘zbekcha", english: "Uzbek" },
  ru: { short: "RU", native: "Русский", english: "Russian" },
};

const str = z.string().default("");
const bool = (value: boolean) => z.boolean().default(value);

export const LString = z
  .preprocess(
    (value) => (typeof value === "string" ? { en: value } : (value ?? {})),
    z.object({
      en: z.string().optional(),
      uz: z.string().optional(),
      ru: z.string().optional(),
    }),
  )
  .default(() => ({}));
export type LString = z.infer<typeof LString>;

export const LinkSchema = z.object({
  id: z.string(),
  label: LString,
  url: str,
  /** Drives the icon and the label fallback. */
  kind: z.enum(["live", "code", "video", "article", "download", "other"]).default("other"),
});
export type Link = z.infer<typeof LinkSchema>;

export const FactSchema = z.object({
  id: z.string(),
  label: LString,
  value: LString,
});
export type Fact = z.infer<typeof FactSchema>;

export const BulletSchema = z.object({
  id: z.string(),
  text: LString,
});
export type Bullet = z.infer<typeof BulletSchema>;

/**
 * One generic entry shape for every section kind. The section's kind decides which
 * fields the Studio shows and how the site renders them (see `kinds.ts`).
 */
export const EntrySchema = z.object({
  id: z.string(),
  /** Role · degree · project name · award · skill group · language. */
  title: LString,
  /** Organization · school · issuer · proficiency. */
  subtitle: LString,
  url: str,
  location: LString,
  /** "YYYY", "YYYY-MM" or "YYYY-MM-DD". */
  start: str,
  /** Same formats as `start`, or "present". Empty = single date / no end. */
  end: str,
  /** Free-form category: employment type, project category, award type… */
  type: str,
  summary: LString,
  /** Long-form Markdown (case study). Projects with a body get their own page. */
  body: LString,
  bullets: z.array(BulletSchema).default([]),
  /** Skills/technologies. Shared names link entries to the Skills section as evidence. */
  tags: z.array(z.string()).default([]),
  links: z.array(LinkSchema).default([]),
  /** Arbitrary label/value pairs (GPA, team size, coursework…) so new data never needs a code change. */
  facts: z.array(FactSchema).default([]),
  image: str,
  imageAlt: LString,
  featured: bool(false),
  /** Hidden everywhere (kept as a draft). */
  hidden: bool(false),
  /** Shown on the website but left out of the one-page résumé. */
  hideOnResume: bool(false),
});
export type Entry = z.infer<typeof EntrySchema>;

export const SECTION_KINDS = [
  "experience",
  "education",
  "projects",
  "skills",
  "awards",
  "languages",
  "text",
  "timeline",
  "custom",
] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const SectionSchema = z.object({
  id: z.string(),
  kind: z.enum(SECTION_KINDS),
  title: LString,
  /** Optional paragraph under the heading (Markdown). For `text` sections this is the content. */
  intro: LString,
  hidden: bool(false),
  hideOnResume: bool(false),
  layout: z.enum(["auto", "list", "grid", "compact"]).default("auto"),
  items: z.array(EntrySchema).default([]),
});
export type Section = z.infer<typeof SectionSchema>;

export const CONTACT_KINDS = [
  "email",
  "phone",
  "website",
  "github",
  "linkedin",
  "telegram",
  "x",
  "itch",
  "location",
  "other",
] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export const ContactSchema = z.object({
  id: z.string(),
  kind: z.enum(CONTACT_KINDS).default("other"),
  label: LString,
  /** What is displayed, e.g. "armain319@gmail.com" or "@ras1x7". */
  value: str,
  /** Where it links; derived from kind + value when empty. */
  url: str,
  onSite: bool(true),
  onResume: bool(true),
});
export type Contact = z.infer<typeof ContactSchema>;

export const HighlightSchema = z.object({
  id: z.string(),
  value: LString,
  label: LString,
});
export type Highlight = z.infer<typeof HighlightSchema>;

export const ProfileSchema = z.object({
  name: LString,
  headline: LString,
  summary: LString,
  location: LString,
  avatar: str,
  avatarAlt: LString,
  status: z
    .object({
      enabled: bool(false),
      text: LString,
    })
    .prefault({}),
  contacts: z.array(ContactSchema).default([]),
  highlights: z.array(HighlightSchema).default([]),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const THEME_PRESETS = ["editorial", "midnight", "arcade", "terminal"] as const;
export type ThemePreset = (typeof THEME_PRESETS)[number];

export const ThemeSchema = z.object({
  preset: z.enum(THEME_PRESETS).default("editorial"),
  accent: z.string().default("#2f5bea"),
  mode: z.enum(["system", "light", "dark"]).default("system"),
  radius: z.enum(["sharp", "soft", "round"]).default("soft"),
  motion: bool(true),
  /** Konami code → arcade mode. */
  secrets: bool(true),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const SettingsSchema = z.object({
  /** Public URL, used for canonical links, sitemap, OG images and the résumé QR code. */
  siteUrl: str,
  defaultLocale: z.enum(LOCALES).default("en"),
  locales: z.array(z.enum(LOCALES)).default(["en", "uz", "ru"]),
  seo: z
    .object({
      title: LString,
      description: LString,
    })
    .prefault({}),
  resume: z
    .object({
      paper: z.enum(["a4", "letter"]).default("a4"),
      showPhoto: bool(false),
      showQr: bool(true),
      showSummary: bool(true),
      /** Section ids in résumé order. Empty = same order as the website. */
      order: z.array(z.string()).default([]),
    })
    .prefault({}),
  footer: LString,
  showLastUpdated: bool(true),
  /** Link to this site's source code, shown in the footer ("Built with my own Portfolio Studio"). */
  sourceUrl: str,
});
export type Settings = z.infer<typeof SettingsSchema>;

/** A named, shareable tailoring of the same content (e.g. "Game Developer", "Software Engineer"). */
export const VariantSchema = z.object({
  id: z.string(),
  slug: z.string(),
  label: str,
  headline: LString,
  summary: LString,
  /** Section or entry ids hidden in this variant. */
  hidden: z.array(z.string()).default([]),
  /** Skills to float to the top of skill groups. */
  emphasize: z.array(z.string()).default([]),
});
export type Variant = z.infer<typeof VariantSchema>;

export const PortfolioSchema = z.object({
  $schema: z.string().optional(),
  meta: z
    .object({
      schemaVersion: z.number().default(1),
      updatedAt: str,
    })
    .prefault({}),
  profile: ProfileSchema.prefault({}),
  sections: z.array(SectionSchema).default([]),
  variants: z.array(VariantSchema).default([]),
  theme: ThemeSchema.prefault({}),
  settings: SettingsSchema.prefault({}),
});
export type Portfolio = z.infer<typeof PortfolioSchema>;

/* ───────────────────────────── Private vault ───────────────────────────── */

export const ReviewItemSchema = z.object({
  id: z.string(),
  title: str,
  detail: str,
  /** Entry, section or field this is about (for "Jump to"). */
  targetId: str,
  severity: z.enum(["info", "warn", "error"]).default("info"),
  status: z.enum(["open", "resolved", "dismissed"]).default("open"),
  source: str,
});
export type ReviewItem = z.infer<typeof ReviewItemSchema>;

export const ObyWorkSchema = z.object({ id: z.string(), period: str, text: str });
export const ObyRelativeSchema = z.object({
  id: z.string(),
  relation: str,
  fullName: str,
  birth: str,
  work: str,
  address: str,
});
export const ObyExtraSchema = z.object({ id: z.string(), label: str, value: str });

export const ObyektivkaSchema = z.object({
  /** Script used for the printed labels. Field values are printed as typed. */
  script: z.enum(["cyrl", "latn"]).default("cyrl"),
  photo: str,
  fullName: str,
  currentPositionDate: str,
  currentPosition: str,
  birthDate: str,
  birthPlace: str,
  nationality: str,
  party: str,
  education: str,
  graduated: str,
  specialty: str,
  degree: str,
  academicTitle: str,
  languages: str,
  stateAwards: str,
  electedBodies: str,
  extra: z.array(ObyExtraSchema).default([]),
  work: z.array(ObyWorkSchema).default([]),
  relativesTitle: str,
  relatives: z.array(ObyRelativeSchema).default([]),
});
export type Obyektivka = z.infer<typeof ObyektivkaSchema>;

export const PrivateSchema = z.object({
  schemaVersion: z.number().default(1),
  /** Contacts that only appear on résumés printed from the Studio (never on the public web). */
  contacts: z.array(ContactSchema).default([]),
  /** Private notes per entry/section id. */
  notes: z.record(z.string(), z.string()).default({}),
  review: z.array(ReviewItemSchema).default([]),
  obyektivka: ObyektivkaSchema.prefault({}),
});
export type PrivateVault = z.infer<typeof PrivateSchema>;

export function parsePortfolio(input: unknown): Portfolio {
  return PortfolioSchema.parse(input);
}

export function parsePrivate(input: unknown): PrivateVault {
  return PrivateSchema.parse(input ?? {});
}
