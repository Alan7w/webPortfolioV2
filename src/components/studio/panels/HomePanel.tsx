"use client";

import { ArrowRight, CloudUpload, ExternalLink, FileText, IdCard, Languages, ListChecks, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { LOCALE_LABELS, type Locale } from "@/lib/content/schema";
import { t } from "@/lib/content/i18n";
import { go, jumpTo, useStudio } from "@/lib/studio/store";
import { healthScore, statsFor, useIssues } from "@/lib/studio/derived";
import { Badge, Card, cx, PanelHeader, SectionTitle } from "../ui";
import { fetchGitStatus, usePublishedDiff, type GitStatus } from "./PublishPanel";

const SHORTCUTS: [string, string][] = [
  ["⌘ K", "Jump to anything"],
  ["⌘ S", "Save now"],
  ["⌘ Z / ⇧⌘ Z", "Undo / redo"],
  ["⌘ \\", "Toggle preview"],
];

export function HomePanel() {
  const doc = useStudio((s) => s.doc)!;
  const vault = useStudio((s) => s.vault);
  const issues = useIssues();
  const [git, setGit] = useState<GitStatus | null>(null);
  const changes = usePublishedDiff(git, doc);

  useEffect(() => {
    fetchGitStatus().then(setGit, () => setGit({ isRepo: false }));
  }, []);

  const openReview = (vault?.review ?? []).filter((r) => r.status === "open");
  const score = healthScore(issues, openReview.length);
  const stats = statsFor(doc);
  const first = (t(doc.profile.name, "en") || "there").split(" ")[0];
  const next = [
    ...openReview.filter((r) => r.severity === "error").map((r) => ({ id: r.id, title: r.title, target: r.targetId || "coach", tone: "bad" as const })),
    ...issues.filter((i) => i.severity === "error").map((i) => ({ id: i.id, title: i.title, target: i.targetId, tone: "bad" as const })),
    ...openReview.filter((r) => r.severity === "warn").map((r) => ({ id: r.id, title: r.title, target: r.targetId || "coach", tone: "warn" as const })),
    ...issues.filter((i) => i.severity === "warn").map((i) => ({ id: i.id, title: i.title, target: i.targetId, tone: "warn" as const })),
  ].slice(0, 7);
  const locale: Locale = doc.settings.defaultLocale;

  const tile = "group flex flex-col gap-1 rounded-xl border border-line bg-elev p-4 text-left transition hover:border-line-strong";

  return (
    <div>
      <PanelHeader
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={`Salom, ${first}.`}
        description="Everything on your website, résumé and Obyektivka comes from what you edit here. Changes save automatically; publish when you're happy."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button type="button" className={tile} onClick={() => go({ type: "coach" })}>
          <span className="flex items-center justify-between text-xs text-ink-3">
            Health <Sparkles size={14} />
          </span>
          <span className={cx("font-display text-4xl", score >= 85 ? "text-ok" : score >= 60 ? "text-warn" : "text-bad")}>{score}</span>
          <span className="text-xs text-ink-3">{issues.length} coach notes</span>
        </button>
        <button type="button" className={tile} onClick={() => go({ type: "coach" })}>
          <span className="flex items-center justify-between text-xs text-ink-3">
            To review <ListChecks size={14} />
          </span>
          <span className="font-display text-4xl text-ink">{openReview.length}</span>
          <span className="text-xs text-ink-3">items from your documents</span>
        </button>
        <div className={tile}>
          <span className="flex items-center justify-between text-xs text-ink-3">
            Translations <Languages size={14} />
          </span>
          {(["uz", "ru"] as const).map((l) => {
            const pct = stats[l].total ? Math.round((stats[l].done / stats[l].total) * 100) : 100;
            return (
              <button key={l} type="button" onClick={() => useStudio.setState({ editLocale: l })} className="mt-1 text-left" title={`Edit in ${LOCALE_LABELS[l].english}`}>
                <span className="flex justify-between text-xs text-ink-2">
                  <span>{LOCALE_LABELS[l].english}</span>
                  <span className="font-mono">{pct}%</span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-sunken">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" className={tile} onClick={() => go({ type: "publish" })}>
          <span className="flex items-center justify-between text-xs text-ink-3">
            Unpublished <CloudUpload size={14} />
          </span>
          <span className="font-display text-4xl text-ink">{git ? (git.isRepo ? changes.length : "—") : "…"}</span>
          <span className="text-xs text-ink-3">{git?.last ? `last publish ${new Date(git.last.date).toLocaleDateString()}` : "never published"}</span>
        </button>
      </div>

      <SectionTitle>Next up</SectionTitle>
      {next.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-elev">
          {next.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => (item.target === "coach" ? go({ type: "coach" }) : jumpTo(item.target))} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken/60">
                <Badge tone={item.tone}>{item.tone === "bad" ? "fix" : "improve"}</Badge>
                <span className="flex-1 truncate text-sm text-ink">{item.title}</span>
                <ArrowRight size={14} className="text-ink-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="p-6 text-center text-sm text-ink-2">Nothing urgent. Maybe add a new project? 🚀</Card>
      )}

      <SectionTitle>Shortcuts</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <a href={`/${locale}`} target="_blank" rel="noreferrer" className={tile}>
          <ExternalLink size={16} className="text-accent-text" />
          <span className="text-sm font-medium text-ink">Open website</span>
          <span className="text-xs text-ink-3">Your saved draft, as visitors will see it</span>
        </a>
        <a href={`/${locale}/resume`} target="_blank" rel="noreferrer" className={tile}>
          <FileText size={16} className="text-accent-text" />
          <span className="text-sm font-medium text-ink">Open résumé</span>
          <span className="text-xs text-ink-3">Public version (no phone number)</span>
        </a>
        <button type="button" className={tile} onClick={() => go({ type: "obyektivka" })}>
          <IdCard size={16} className="text-accent-text" />
          <span className="text-sm font-medium text-ink">Obyektivka</span>
          <span className="text-xs text-ink-3">Print the Uzbek official format</span>
        </button>
        {doc.sections
          .filter((s) => s.kind === "projects" || s.kind === "experience")
          .slice(0, 3)
          .map((s) => (
            <button key={s.id} type="button" className={tile} onClick={() => go({ type: "section", sectionId: s.id })}>
              <Plus size={16} className="text-accent-text" />
              <span className="text-sm font-medium text-ink">{t(s.title, "en")}</span>
              <span className="text-xs text-ink-3">{s.items.length} entries</span>
            </button>
          ))}
      </div>

      <SectionTitle>Keyboard</SectionTitle>
      <Card className="grid gap-2 p-4 sm:grid-cols-2">
        {SHORTCUTS.map(([keys, label]) => (
          <p key={keys} className="flex items-center justify-between gap-3 text-sm text-ink-2">
            {label}
            <kbd className="rounded border border-line bg-bg px-1.5 py-0.5 font-mono text-[0.7rem] text-ink">{keys}</kbd>
          </p>
        ))}
      </Card>
    </div>
  );
}
