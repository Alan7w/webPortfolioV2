import type { Entry, Locale, LString, Portfolio, Section } from "./schema";
import { LOCALES } from "./schema";
import { dateKey, isPresent, isValidDateValue, parseDate } from "./dates";
import { normalizeSkill, skillEvidence, visibleItems } from "./derive";

/**
 * The Coach lints portfolio content like code. Every rule is a pure function of the data,
 * so it runs live in the Studio as you type.
 */

export type Severity = "error" | "warn" | "info";
export type Category = "content" | "links" | "translation" | "resume" | "profile" | "consistency" | "data";

export interface Issue {
  id: string;
  severity: Severity;
  category: Category;
  /** Entry id, section id, "profile", "settings", "theme"… */
  targetId: string;
  sectionId?: string;
  title: string;
  detail?: string;
}

export interface LinkResult {
  ok: boolean;
  status: number;
  error?: string;
}

const WEAK_START =
  /^(helped|help|did|do|assisted|assist|worked on|work on|was responsible|responsible for|participated in|involved in|tasked with|handled|made|got|tried|duties included|various)\b/i;
const STRONG_VERBS = "Built, Led, Designed, Implemented, Mentored, Launched, Improved, Automated, Analyzed, Organized";
const TEMP_HOSTS = /(devtunnels\.ms|ngrok|trycloudflare\.com|localhost|127\.0\.0\.1|0\.0\.0\.0|\.local\b|:\d{4,5}\/?$)/i;

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);

/** Short proper names ("MiniStore", "Shroomhold Siege", "GPA", "3.77") don't need translating. */
export function needsTranslation(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  if (!/\p{L}/u.test(text)) return false;
  const list = words(text.replace(/[·|,()—–-]/g, " "));
  if (list.length <= 3 && list.every((w) => !/\p{Ll}/u.test(w[0] ?? "") || /^\p{Lu}/u.test(w))) return false;
  return true;
}

interface LField {
  value: LString;
  label: string;
}

function entryFields(entry: Entry): LField[] {
  return [
    { value: entry.title, label: "title" },
    { value: entry.subtitle, label: "subtitle" },
    { value: entry.location, label: "location" },
    { value: entry.summary, label: "summary" },
    { value: entry.body, label: "case study" },
    ...entry.bullets.map((b, i) => ({ value: b.text, label: `bullet ${i + 1}` })),
    ...entry.facts.flatMap((f) => [
      { value: f.label, label: "fact label" },
      { value: f.value, label: "fact value" },
    ]),
    ...entry.links.map((l) => ({ value: l.label, label: "link label" })),
  ];
}

export function missingTranslations(fields: LField[], locale: Locale): string[] {
  return fields.filter((f) => needsTranslation(f.value.en) && !f.value[locale]?.trim()).map((f) => f.label);
}

/** Translation completeness per locale across everything visible (for the top-bar meters). */
export function translationStats(portfolio: Portfolio): Record<Locale, { total: number; done: number }> {
  const fields: LField[] = [];
  const p = portfolio.profile;
  fields.push(
    { value: p.headline, label: "" },
    { value: p.summary, label: "" },
    { value: p.location, label: "" },
    { value: p.status.text, label: "" },
    ...p.highlights.flatMap((h) => [
      { value: h.label, label: "" },
      { value: h.value, label: "" },
    ]),
  );
  for (const section of portfolio.sections) {
    if (section.hidden) continue;
    fields.push({ value: section.title, label: "" }, { value: section.intro, label: "" });
    for (const item of visibleItems(section, "site")) fields.push(...entryFields(item));
  }
  const relevant = fields.filter((f) => needsTranslation(f.value.en));
  const stats = {} as Record<Locale, { total: number; done: number }>;
  for (const locale of LOCALES) {
    stats[locale] = { total: relevant.length, done: relevant.filter((f) => f.value[locale]?.trim()).length };
  }
  return stats;
}

function estimateResumeLines(portfolio: Portfolio): number {
  const perLine = 105;
  const lines = (text: string) => Math.max(1, Math.ceil(text.length / perLine));
  let total = 6;
  if (portfolio.settings.resume.showSummary && portfolio.profile.summary.en) total += lines(portfolio.profile.summary.en);
  for (const section of portfolio.sections) {
    if (section.hidden || section.hideOnResume || section.kind === "text" || section.kind === "timeline") continue;
    const items = visibleItems(section, "resume");
    if (!items.length) continue;
    total += 2.2;
    if (section.kind === "languages") {
      total += 1;
      continue;
    }
    for (const item of items) {
      if (section.kind === "skills") {
        total += lines(`${item.title.en}: ${item.tags.join(", ")}`);
        continue;
      }
      total += section.kind === "awards" ? 1 : 1.5;
      const bullets = section.kind === "projects" ? item.bullets.slice(0, 2) : item.bullets;
      for (const bullet of bullets) total += lines(bullet.text.en ?? "");
      if (section.kind === "projects" && !bullets.length && item.summary.en) total += lines(item.summary.en);
      if (section.kind === "projects" && item.tags.length) total += 1;
      if (section.kind === "education") total += item.facts.reduce((n, f) => n + (f.value.en ? lines(f.value.en) * 0.6 : 0), 0);
    }
  }
  return total;
}

export function runCoach(portfolio: Portfolio, options: { now?: Date; links?: Record<string, LinkResult> } = {}): Issue[] {
  const now = options.now ?? new Date();
  const issues: Issue[] = [];
  const push = (issue: Omit<Issue, "id">) => issues.push({ ...issue, id: `${issue.category}:${issue.targetId}:${issue.title}` });
  const profile = portfolio.profile;
  const locales = portfolio.settings.locales.filter((l) => l !== "en");

  /* ── Profile ─────────────────────────────────────────── */
  if (!profile.name.en?.trim()) push({ severity: "error", category: "profile", targetId: "profile", title: "Your name is empty" });
  if (!profile.headline.en?.trim()) push({ severity: "warn", category: "profile", targetId: "profile", title: "Add a headline (the role you want to be hired for)" });
  if (!profile.contacts.some((c) => c.kind === "email" && c.value.trim()))
    push({ severity: "error", category: "profile", targetId: "profile", title: "No email address", detail: "Recruiters need one obvious way to reach you." });
  if (!profile.contacts.some((c) => c.kind === "linkedin"))
    push({ severity: "info", category: "profile", targetId: "profile", title: "No LinkedIn profile", detail: "Many recruiters look for it first." });
  if (!profile.avatar) push({ severity: "info", category: "profile", targetId: "profile", title: "No portrait photo" });
  const summaryWords = words(profile.summary.en ?? "").length;
  if (summaryWords > 70)
    push({ severity: "info", category: "profile", targetId: "profile", title: `Summary is ${summaryWords} words`, detail: "Aim for 30–60 words; the hero should read in one breath." });
  if (!portfolio.settings.siteUrl.trim())
    push({ severity: "info", category: "profile", targetId: "settings", title: "Site URL not set", detail: "Needed for the résumé QR code and link previews (Vercel URL is used automatically after deploy)." });

  /* ── Data integrity ──────────────────────────────────── */
  const seen = new Map<string, number>();
  for (const section of portfolio.sections) {
    seen.set(section.id, (seen.get(section.id) ?? 0) + 1);
    for (const item of section.items) seen.set(item.id, (seen.get(item.id) ?? 0) + 1);
  }
  for (const [id, count] of seen) if (count > 1) push({ severity: "error", category: "data", targetId: id, title: `Duplicate id “${id}”`, detail: "Rename one of them; ids must be unique." });
  for (const variant of portfolio.variants) {
    const stale = variant.hidden.filter((id) => !seen.has(id));
    if (stale.length)
      push({ severity: "info", category: "data", targetId: "variants", title: `Variant “${variant.label}” hides ${stale.length} deleted item(s)`, detail: stale.join(", ") });
  }

  /* ── Entries ─────────────────────────────────────────── */
  const tagSpellings = new Map<string, Set<string>>();
  for (const section of portfolio.sections) {
    if (section.hidden) continue;
    for (const item of section.items) {
      for (const tag of item.tags) {
        const key = tag.toLowerCase().replace(/[^\p{L}\p{N}#+]/gu, "");
        tagSpellings.set(key, new Set([...(tagSpellings.get(key) ?? []), tag]));
      }
      if (item.hidden) continue;
      lintEntry(section, item);
    }
    if (section.kind !== "text" && section.kind !== "timeline" && section.items.length === 0)
      push({ severity: "info", category: "content", targetId: section.id, sectionId: section.id, title: `“${section.title.en}” is empty`, detail: "Add an entry or hide the section." });
    if (section.kind === "text" && !section.intro.en?.trim())
      push({ severity: "warn", category: "content", targetId: section.id, sectionId: section.id, title: `Text block “${section.title.en}” has no text` });
    for (const locale of locales) {
      if (needsTranslation(section.title.en) && !section.title[locale]?.trim())
        push({ severity: "info", category: "translation", targetId: section.id, sectionId: section.id, title: `Section title not translated (${locale.toUpperCase()})` });
    }
  }

  function lintEntry(section: Section, item: Entry) {
    const base = { targetId: item.id, sectionId: section.id };
    const name = item.title.en || item.title.uz || item.title.ru || "Untitled";
    const dated = section.kind === "experience" || section.kind === "education";

    if (!name.trim() || name === "Untitled") push({ ...base, severity: "warn", category: "content", title: "Entry has no title" });

    // Dates
    for (const [field, value] of [
      ["start", item.start],
      ["end", item.end],
    ] as const) {
      if (!isValidDateValue(value))
        push({ ...base, severity: "error", category: "content", title: `${name}: invalid ${field} date “${value}”`, detail: "Use YYYY, YYYY-MM or YYYY-MM-DD (or “present”)." });
    }
    if (item.start && item.end && !isPresent(item.end) && dateKey(item.end, "end") < dateKey(item.start, "start"))
      push({ ...base, severity: "error", category: "content", title: `${name}: ends before it starts` });
    if (dated && !item.start) push({ ...base, severity: "warn", category: "content", title: `${name}: no start date` });
    if (section.kind === "awards" && !item.start && !item.end)
      push({ ...base, severity: "info", category: "content", title: `${name}: no date`, detail: "Dated items also appear on the Journey timeline." });
    const startDate = parseDate(item.start);
    if (startDate && startDate.year > now.getFullYear() + 1)
      push({ ...base, severity: "warn", category: "content", title: `${name}: start date is in the future` });
    if (section.kind === "experience" && isPresent(item.end))
      push({ ...base, severity: "info", category: "content", title: `${name}: marked as current`, detail: "Double-check it's still true before sending your résumé." });

    // Substance
    const bullets = item.bullets.map((b) => b.text.en ?? "").filter((b) => b.trim());
    if (section.kind === "experience" && !bullets.length && !item.summary.en?.trim())
      push({ ...base, severity: "warn", category: "content", title: `${name}: no description`, detail: "Add 2–4 bullets about what you did and what changed because of it." });
    for (const bullet of bullets) {
      const weak = WEAK_START.exec(bullet);
      if (weak)
        push({
          ...base,
          severity: "warn",
          category: "content",
          title: `${name}: weak opening “${weak[0]}…”`,
          detail: `“${bullet.slice(0, 80)}${bullet.length > 80 ? "…" : ""}” — lead with an action verb (${STRONG_VERBS}).`,
        });
      if (bullet.length > 200) push({ ...base, severity: "info", category: "resume", title: `${name}: a bullet is ${bullet.length} characters`, detail: "Keep bullets under ~2 lines." });
      if (/^\s*I\s/.test(bullet)) push({ ...base, severity: "info", category: "resume", title: `${name}: bullet starts with “I”`, detail: "Résumé bullets usually drop the pronoun." });
    }
    if ((section.kind === "experience" || section.kind === "projects") && bullets.length >= 2 && !bullets.some((b) => /\d/.test(b)))
      push({
        ...base,
        severity: "info",
        category: "content",
        title: `${name}: no numbers`,
        detail: "Quantify something — students helped, companies researched, users, % faster, team size.",
      });

    // Projects
    if (section.kind === "projects") {
      if (!item.links.some((l) => l.url.trim()))
        push({ ...base, severity: "warn", category: "links", title: `${name}: no links`, detail: "Add a live demo, video or source link — proof beats description." });
      if (!item.tags.length) push({ ...base, severity: "info", category: "content", title: `${name}: no tech stack tags` });
      if (item.featured && !item.image) push({ ...base, severity: "info", category: "content", title: `${name}: featured without a screenshot`, detail: "A real screenshot or GIF makes featured work pop." });
    }

    // Links
    const urls = [...item.links.map((l) => l.url), item.url].filter(Boolean);
    for (const url of urls) {
      if (!/^https?:\/\//i.test(url)) push({ ...base, severity: "warn", category: "links", title: `${name}: link isn't a full URL`, detail: url });
      else if (TEMP_HOSTS.test(url)) push({ ...base, severity: "error", category: "links", title: `${name}: temporary link`, detail: `${url} — tunnels and localhost links stop working. Deploy it (e.g. Vercel) and update.` });
      const result = options.links?.[url];
      if (result && !result.ok)
        push({ ...base, severity: "error", category: "links", title: `${name}: broken link (${result.status || result.error})`, detail: url });
    }
    for (const link of item.links) if (!link.url.trim()) push({ ...base, severity: "warn", category: "links", title: `${name}: empty link` });

    // Translations
    const missing = locales.map((locale) => ({ locale, fields: missingTranslations(entryFields(item), locale) })).filter((m) => m.fields.length);
    if (missing.length)
      push({
        ...base,
        severity: "info",
        category: "translation",
        title: `${name}: missing ${missing.map((m) => m.locale.toUpperCase()).join(" & ")} translation`,
        detail: missing.map((m) => `${m.locale.toUpperCase()}: ${m.fields.join(", ")}`).join(" · "),
      });
  }

  /* ── Consistency ─────────────────────────────────────── */
  for (const spellings of tagSpellings.values()) {
    if (spellings.size > 1)
      push({ severity: "warn", category: "consistency", targetId: "sec-skills", title: `Same skill spelled ${spellings.size} ways`, detail: [...spellings].join(" · ") });
  }
  const evidence = skillEvidence(portfolio.sections.filter((s) => !s.hidden).map((s) => ({ ...s, items: visibleItems(s, "site") })));
  for (const section of portfolio.sections.filter((s) => s.kind === "skills" && !s.hidden)) {
    const unproven = section.items.flatMap((g) => g.tags).filter((tag) => !evidence.has(normalizeSkill(tag)));
    if (unproven.length)
      push({
        severity: "info",
        category: "consistency",
        targetId: section.id,
        sectionId: section.id,
        title: `${unproven.length} skill${unproven.length === 1 ? "" : "s"} with no evidence`,
        detail: `${unproven.join(", ")} — tag an entry that used it, so visitors can click through to proof (or drop it).`,
      });
  }

  /* ── Résumé ──────────────────────────────────────────── */
  const pages = estimateResumeLines(portfolio) / 55;
  if (pages > 1.05)
    push({
      severity: "warn",
      category: "resume",
      targetId: "resume",
      title: `Résumé is about ${pages.toFixed(1)} pages`,
      detail: "Early-career résumés should fit on one page. Use “Hide on résumé” on older or weaker entries, or trim bullets.",
    });

  const order: Record<Severity, number> = { error: 0, warn: 1, info: 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Every http(s) URL in the portfolio, for the link checker. */
export function collectUrls(portfolio: Portfolio): string[] {
  const urls = new Set<string>();
  for (const c of portfolio.profile.contacts) if (c.url.startsWith("http")) urls.add(c.url);
  for (const s of portfolio.sections)
    for (const item of s.items) {
      if (item.url.startsWith("http")) urls.add(item.url);
      for (const l of item.links) if (l.url.startsWith("http")) urls.add(l.url);
    }
  return [...urls];
}
