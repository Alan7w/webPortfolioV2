"use client";

import { runCoach, translationStats, type Issue, type LinkResult } from "@/lib/content/coach";
import { allTags } from "@/lib/content/derive";
import type { Portfolio } from "@/lib/content/schema";
import { useStudio } from "./store";

/* Derived data is memoized on object identity (immer gives us new references only on change). */

let coachCache: { doc: Portfolio; links: Record<string, LinkResult>; issues: Issue[] } | null = null;
export function issuesFor(doc: Portfolio, links: Record<string, LinkResult>): Issue[] {
  if (coachCache && coachCache.doc === doc && coachCache.links === links) return coachCache.issues;
  const issues = runCoach(doc, { links });
  coachCache = { doc, links, issues };
  return issues;
}

let statsCache: { doc: Portfolio; stats: ReturnType<typeof translationStats> } | null = null;
export function statsFor(doc: Portfolio) {
  if (statsCache?.doc === doc) return statsCache.stats;
  const stats = translationStats(doc);
  statsCache = { doc, stats };
  return stats;
}

let tagsCache: { sections: Portfolio["sections"]; tags: string[] } | null = null;
export function tagsFor(doc: Portfolio) {
  if (tagsCache?.sections === doc.sections) return tagsCache.tags;
  const tags = allTags(doc);
  tagsCache = { sections: doc.sections, tags };
  return tags;
}

export function useIssues(): Issue[] {
  const doc = useStudio((s) => s.doc);
  const links = useStudio((s) => s.links);
  return doc ? issuesFor(doc, links) : [];
}

/** 0–100, weighted by severity. Open review items from the vault count too. */
export function healthScore(issues: Issue[], openReview: number) {
  const penalty = issues.reduce((n, i) => n + (i.severity === "error" ? 6 : i.severity === "warn" ? 2 : 0.25), 0) + openReview;
  return Math.max(0, Math.round(100 - penalty));
}
