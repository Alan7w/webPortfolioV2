import type { Contact, ContactKind, Entry, Locale, Portfolio, Section } from "./schema";
import { EntrySchema, PortfolioSchema, SectionSchema } from "./schema";
import { contactHref, uid } from "./derive";
import { t, DEFAULT_SECTION_TITLES } from "./i18n";
import { isPresent } from "./dates";

/**
 * JSON Resume (https://jsonresume.org) is an open standard many tools read and write —
 * exporting keeps your data portable; importing lets you bring content from other builders.
 */

const plain = (text: string) =>
  text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

const endDate = (end: string) => (isPresent(end) ? undefined : end || undefined);
const NETWORKS: Partial<Record<ContactKind, string>> = { github: "GitHub", linkedin: "LinkedIn", telegram: "Telegram", x: "X", itch: "itch.io", website: "Website" };

export function toJsonResume(portfolio: Portfolio, locale: Locale) {
  const L = (value: Parameters<typeof t>[0]) => plain(t(value, locale));
  const visible = portfolio.sections.filter((s) => !s.hidden).map((s) => ({ ...s, items: s.items.filter((i) => !i.hidden) }));
  const of = (kind: Section["kind"]) => visible.filter((s) => s.kind === kind).flatMap((s) => s.items);
  const email = portfolio.profile.contacts.find((c) => c.kind === "email")?.value;
  const phone = portfolio.profile.contacts.find((c) => c.kind === "phone")?.value;
  const fact = (entry: Entry, label: RegExp) => entry.facts.find((f) => label.test(f.label.en ?? ""));
  const awardsAndCerts = of("awards");
  const isCert = (e: Entry) => /certif|course/i.test(e.type);

  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: L(portfolio.profile.name),
      label: L(portfolio.profile.headline),
      image: portfolio.profile.avatar && portfolio.settings.siteUrl ? new URL(portfolio.profile.avatar, portfolio.settings.siteUrl).toString() : undefined,
      email,
      phone,
      url: portfolio.settings.siteUrl || undefined,
      summary: L(portfolio.profile.summary),
      location: { address: L(portfolio.profile.location) },
      profiles: portfolio.profile.contacts
        .filter((c) => NETWORKS[c.kind])
        .map((c) => ({ network: NETWORKS[c.kind], username: c.value.replace(/^@/, "").split("/").pop(), url: contactHref(c) })),
    },
    work: [...of("experience"), ...of("custom")].map((e) => ({
      name: L(e.subtitle),
      position: L(e.title),
      url: e.url || undefined,
      location: L(e.location) || undefined,
      startDate: e.start || undefined,
      endDate: endDate(e.end),
      summary: L(e.summary) || undefined,
      highlights: e.bullets.map((b) => L(b.text)).filter(Boolean),
    })),
    education: of("education").map((e) => ({
      institution: L(e.subtitle),
      url: e.url || undefined,
      area: fact(e, /major|field|minor/i) ? L(fact(e, /major|field|minor/i)!.value) : undefined,
      studyType: L(e.title),
      startDate: e.start || undefined,
      endDate: endDate(e.end),
      score: fact(e, /gpa|grade|score/i) ? L(fact(e, /gpa|grade|score/i)!.value) : undefined,
      courses: fact(e, /course/i) ? L(fact(e, /course/i)!.value).split(/,\s*/) : undefined,
    })),
    awards: awardsAndCerts.filter((e) => !isCert(e)).map((e) => ({ title: L(e.title), date: e.start || undefined, awarder: L(e.subtitle), summary: L(e.summary) || undefined })),
    certificates: awardsAndCerts.filter(isCert).map((e) => ({ name: L(e.title), date: e.start || undefined, issuer: L(e.subtitle), url: e.url || undefined })),
    skills: of("skills").map((e) => ({ name: L(e.title), keywords: e.tags })),
    languages: of("languages").map((e) => ({ language: L(e.title), fluency: L(e.subtitle) })),
    projects: of("projects").map((e) => ({
      name: L(e.title),
      description: L(e.summary) || undefined,
      highlights: e.bullets.map((b) => L(b.text)).filter(Boolean),
      keywords: e.tags,
      startDate: e.start || undefined,
      endDate: endDate(e.end),
      url: e.links.find((l) => l.url)?.url,
      roles: L(e.subtitle) ? [L(e.subtitle)] : undefined,
      type: e.type || undefined,
    })),
    meta: { version: "v1.0.0", lastModified: portfolio.meta.updatedAt || undefined, canonical: portfolio.settings.siteUrl || undefined },
  };
}

/* ─────────────────────────────── import ─────────────────────────────── */

type Json = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
const date = (v: unknown) => {
  const m = /^(\d{4})(-\d{2})?(-\d{2})?/.exec(s(v));
  return m ? m[0] : "";
};

function entry(fields: Partial<Record<keyof Entry, unknown>>): Entry {
  return EntrySchema.parse({ id: uid("e"), ...fields });
}

function bullets(list: unknown) {
  return arr(list as unknown[]).length
    ? (list as unknown[]).map((text) => ({ id: uid("b"), text: { en: s(text) } }))
    : [];
}

function section(kind: Section["kind"], items: Entry[], key: string = kind): Section | null {
  if (!items.length) return null;
  return SectionSchema.parse({ id: uid("sec"), kind, title: DEFAULT_SECTION_TITLES[key] ?? DEFAULT_SECTION_TITLES[kind], items });
}

/** Convert a JSON Resume document into sections (English). */
export function fromJsonResume(input: unknown): { profile: Partial<Portfolio["profile"]>; sections: Section[] } {
  const doc = (input ?? {}) as Json;
  const basics = (doc.basics ?? {}) as Json;
  const contacts: Contact[] = [];
  const addContact = (kind: ContactKind, value: string, url = "") =>
    value && contacts.push({ id: uid("c"), kind, value, url, label: {}, onSite: kind !== "phone", onResume: true });
  addContact("email", s(basics.email));
  addContact("phone", s(basics.phone));
  addContact("website", s(basics.url), s(basics.url));
  for (const p of arr(basics.profiles)) {
    const network = s(p.network).toLowerCase();
    const kind: ContactKind = (["github", "linkedin", "telegram", "x"] as const).find((k) => network.includes(k)) ?? (network.includes("twitter") ? "x" : "website");
    addContact(kind, s(p.username) || s(p.url), s(p.url));
  }
  const location = (basics.location ?? {}) as Json;

  const work = arr(doc.work).map((w) =>
    entry({
      title: s(w.position),
      subtitle: s(w.name) || s(w.company),
      url: s(w.url),
      location: s(w.location),
      start: date(w.startDate),
      end: w.endDate ? date(w.endDate) : w.startDate ? "present" : "",
      summary: s(w.summary),
      bullets: bullets(w.highlights),
    }),
  );
  const volunteer = arr(doc.volunteer).map((w) =>
    entry({ title: s(w.position), subtitle: s(w.organization), url: s(w.url), start: date(w.startDate), end: date(w.endDate), summary: s(w.summary), bullets: bullets(w.highlights), type: "Volunteer" }),
  );
  const education = arr(doc.education).map((e) =>
    entry({
      title: [s(e.studyType), s(e.area)].filter(Boolean).join(" in "),
      subtitle: s(e.institution),
      url: s(e.url),
      start: date(e.startDate),
      end: date(e.endDate),
      facts: [
        ...(s(e.score) ? [{ id: uid("f"), label: { en: "GPA" }, value: { en: s(e.score) } }] : []),
        ...(arr(e.courses).length ? [{ id: uid("f"), label: { en: "Relevant coursework" }, value: { en: (e.courses as unknown[]).map(s).join(", ") } }] : []),
      ],
    }),
  );
  const awards = [
    ...arr(doc.awards).map((a) => entry({ title: s(a.title), subtitle: s(a.awarder), start: date(a.date), summary: s(a.summary), type: "Award" })),
    ...arr(doc.certificates).map((c) => entry({ title: s(c.name), subtitle: s(c.issuer), start: date(c.date), url: s(c.url), type: "Certification" })),
  ];
  const skills = arr(doc.skills).map((k) => entry({ title: s(k.name), tags: arr(k.keywords).length ? (k.keywords as unknown[]).map(s) : [] }));
  const languages = arr(doc.languages).map((l) => entry({ title: s(l.language), subtitle: s(l.fluency) }));
  const projects = arr(doc.projects).map((p) =>
    entry({
      title: s(p.name),
      summary: s(p.description),
      bullets: bullets(p.highlights),
      tags: arr(p.keywords).length ? (p.keywords as unknown[]).map(s) : [],
      start: date(p.startDate),
      end: date(p.endDate),
      type: s(p.type),
      links: s(p.url) ? [{ id: uid("l"), label: {}, url: s(p.url), kind: "live" }] : [],
    }),
  );

  return {
    profile: {
      name: { en: s(basics.name) },
      headline: { en: s(basics.label) },
      summary: { en: s(basics.summary) },
      location: { en: [s(location.city), s(location.region), s(location.countryCode)].filter(Boolean).join(", ") || s(location.address) },
      avatar: s(basics.image),
      contacts,
    },
    sections: [
      section("experience", work),
      section("projects", projects),
      section("education", education),
      section("skills", skills),
      section("awards", awards),
      section("languages", languages),
      section("experience", volunteer, "volunteering"),
    ].filter((x): x is Section => x !== null),
  };
}

/** Build a complete portfolio from a JSON Resume (used for "Replace everything"). */
export function portfolioFromJsonResume(input: unknown, current: Portfolio): Portfolio {
  const { profile, sections } = fromJsonResume(input);
  return PortfolioSchema.parse({ ...current, profile: { ...current.profile, ...profile, highlights: [] }, sections, variants: [] });
}
