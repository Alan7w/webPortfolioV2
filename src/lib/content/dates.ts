import type { Locale } from "./schema";
import { UI } from "./i18n";

/**
 * Dates are stored as partial ISO strings ("2023", "2023-08", "2023-08-15") or "present".
 * Everything here is pure so the site, résumé, Studio and Coach format dates identically.
 */

const MONTHS: Record<Locale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["янв.", "февр.", "март", "апр.", "май", "июнь", "июль", "авг.", "сент.", "окт.", "нояб.", "дек."],
};

export interface ParsedDate {
  year: number;
  month?: number; // 1–12
  day?: number;
}

export function parseDate(value: string | undefined): ParsedDate | null {
  if (!value) return null;
  const match = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : undefined;
  const day = match[3] ? Number(match[3]) : undefined;
  if (month !== undefined && (month < 1 || month > 12)) return null;
  return { year, month, day };
}

export const isPresent = (value: string | undefined) => value?.trim().toLowerCase() === "present";

export function isValidDateValue(value: string | undefined): boolean {
  if (!value) return true;
  return isPresent(value) || parseDate(value) !== null;
}

/** Comparable number (YYYYMM). Missing month counts as January for starts, December for ends. */
export function dateKey(value: string | undefined, edge: "start" | "end" = "start", now = new Date()): number {
  if (isPresent(value)) return now.getFullYear() * 100 + now.getMonth() + 1;
  const parsed = parseDate(value);
  if (!parsed) return 0;
  return parsed.year * 100 + (parsed.month ?? (edge === "start" ? 1 : 12));
}

export function formatDate(value: string | undefined, locale: Locale): string {
  if (!value) return "";
  if (isPresent(value)) return UI[locale].present;
  const parsed = parseDate(value);
  if (!parsed) return value;
  if (!parsed.month) return String(parsed.year);
  const month = MONTHS[locale][parsed.month - 1];
  if (parsed.day) return `${parsed.day} ${month} ${parsed.year}`;
  return `${month} ${parsed.year}`;
}

export function formatRange(start: string | undefined, end: string | undefined, locale: Locale): string {
  const a = formatDate(start, locale);
  const b = formatDate(end, locale);
  if (a && b) {
    if (a === b) return a;
    // Collapse "2022 – 2022" style duplicates and keep ranges readable.
    return `${a} – ${b}`;
  }
  return a || b;
}

/** Whole months between two dates (inclusive of the start month). */
export function monthsBetween(start: string | undefined, end: string | undefined, now = new Date()): number | null {
  const s = parseDate(start);
  if (!s || !s.month) return null;
  let e: ParsedDate | null;
  if (isPresent(end)) e = { year: now.getFullYear(), month: now.getMonth() + 1 };
  else e = parseDate(end);
  if (!e || !e.month) return null;
  const months = (e.year - s.year) * 12 + (e.month - s.month) + 1;
  return months > 0 ? months : null;
}

export function formatDuration(start: string | undefined, end: string | undefined, locale: Locale, now = new Date()) {
  const months = monthsBetween(start, end, now);
  if (!months) return "";
  const ui = UI[locale];
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? ui.yr(years) : "", rest ? ui.mo(rest) : ""].filter(Boolean).join(" ");
}

export function yearOf(value: string | undefined, now = new Date()): number | null {
  if (isPresent(value)) return now.getFullYear();
  return parseDate(value)?.year ?? null;
}
