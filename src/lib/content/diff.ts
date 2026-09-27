import type { Entry, Portfolio } from "./schema";

/** A human-readable changelog between the published (last committed) content and the draft. */
export interface Change {
  kind: "added" | "removed" | "changed" | "moved";
  scope: "profile" | "section" | "entry" | "theme" | "settings" | "variants";
  id: string;
  label: string;
  fields?: string[];
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function changedKeys<T extends object>(a: T, b: T, ignore: string[] = []): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((k) => !ignore.includes(k) && !same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

const titleOf = (entry: Entry) => entry.title.en || entry.title.uz || entry.title.ru || entry.id;

export function diffPortfolio(before: Portfolio | null, after: Portfolio): Change[] {
  if (!before) return [{ kind: "added", scope: "profile", id: "all", label: "First publish of the whole portfolio" }];
  const changes: Change[] = [];

  const profileFields = changedKeys(before.profile, after.profile);
  if (profileFields.length) changes.push({ kind: "changed", scope: "profile", id: "profile", label: "Profile", fields: profileFields });
  if (!same(before.theme, after.theme)) changes.push({ kind: "changed", scope: "theme", id: "theme", label: "Theme", fields: changedKeys(before.theme, after.theme) });
  if (!same(before.settings, after.settings))
    changes.push({ kind: "changed", scope: "settings", id: "settings", label: "Settings", fields: changedKeys(before.settings, after.settings) });
  if (!same(before.variants, after.variants)) changes.push({ kind: "changed", scope: "variants", id: "variants", label: "Variants" });

  const beforeSections = new Map(before.sections.map((s) => [s.id, s]));
  const afterSections = new Map(after.sections.map((s) => [s.id, s]));
  for (const section of after.sections) {
    const old = beforeSections.get(section.id);
    if (!old) {
      changes.push({ kind: "added", scope: "section", id: section.id, label: section.title.en || section.id });
      continue;
    }
    const fields = changedKeys(old, section, ["items"]);
    if (fields.length) changes.push({ kind: "changed", scope: "section", id: section.id, label: section.title.en || section.id, fields });
  }
  for (const section of before.sections)
    if (!afterSections.has(section.id)) changes.push({ kind: "removed", scope: "section", id: section.id, label: section.title.en || section.id });
  const commonOrder = (list: Portfolio["sections"], other: Map<string, unknown>) => list.map((s) => s.id).filter((id) => other.has(id));
  if (!same(commonOrder(before.sections, afterSections), commonOrder(after.sections, beforeSections)))
    changes.push({ kind: "moved", scope: "section", id: "order", label: "Section order" });

  const index = (p: Portfolio) => {
    const map = new Map<string, { entry: Entry; sectionId: string; position: number }>();
    for (const s of p.sections) s.items.forEach((entry, position) => map.set(entry.id, { entry, sectionId: s.id, position }));
    return map;
  };
  const a = index(before);
  const b = index(after);
  for (const [id, now] of b) {
    const was = a.get(id);
    if (!was) {
      changes.push({ kind: "added", scope: "entry", id, label: titleOf(now.entry) });
      continue;
    }
    const fields = changedKeys(was.entry, now.entry);
    if (fields.length) changes.push({ kind: "changed", scope: "entry", id, label: titleOf(now.entry), fields });
    else if (was.sectionId !== now.sectionId) changes.push({ kind: "moved", scope: "entry", id, label: titleOf(now.entry) });
  }
  for (const [id, was] of a) if (!b.has(id)) changes.push({ kind: "removed", scope: "entry", id, label: titleOf(was.entry) });
  return changes;
}

/** "content: update Senior UGTA, add ITC Internship (+2 more)" */
export function commitMessage(changes: Change[]): string {
  if (!changes.length) return "content: update portfolio";
  if (changes.length === 1 && changes[0].id === "all") return "content: first publish of the portfolio";
  const verb = { added: "add", removed: "remove", changed: "update", moved: "reorder" };
  const parts = changes.slice(0, 3).map((c) => `${verb[c.kind]} ${c.label}`);
  const rest = changes.length - parts.length;
  return `content: ${parts.join(", ")}${rest > 0 ? ` (+${rest} more)` : ""}`;
}
