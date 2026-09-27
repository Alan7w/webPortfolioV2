"use client";

import { Award, Briefcase, Code2, GraduationCap, Sparkles, X } from "lucide-react";
import { useId, useState } from "react";
import type { LString, Locale, Section, SectionKind } from "@/lib/content/schema";
import { normalizeSkill } from "@/lib/content/derive";
import { t, UI } from "@/lib/content/i18n";

export interface EvidenceLite {
  entryId: string;
  sectionKind: SectionKind;
  title: LString;
  subtitle: LString;
}

const KIND_ICON: Partial<Record<SectionKind, typeof Briefcase>> = {
  experience: Briefcase,
  education: GraduationCap,
  projects: Code2,
  awards: Award,
};

export function SkillsBoard({
  section,
  evidence,
  locale,
}: {
  section: Section;
  evidence: Record<string, EvidenceLite[]>;
  locale: Locale;
}) {
  const ui = UI[locale];
  const [selected, setSelected] = useState<{ group: string; tag: string } | null>(null);
  const baseId = useId();

  return (
    <div className="space-y-9">
      {section.items.map((group) => {
        const open = selected?.group === group.id ? selected.tag : null;
        const openEvidence = open ? (evidence[normalizeSkill(open)] ?? []) : [];
        const panelId = `${baseId}-${group.id}`;
        return (
          <div key={group.id} id={group.id} className="scroll-mt-28">
            <h3 className="label text-ink-3">{t(group.title, locale)}</h3>
            {t(group.summary, locale) && <p className="mt-1 text-sm text-ink-3">{t(group.summary, locale)}</p>}
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.tags.map((tag) => {
                const count = evidence[normalizeSkill(tag)]?.length ?? 0;
                const active = open === tag;
                if (!count) {
                  return (
                    <li key={tag} className="rounded-chip border border-transparent bg-sunken px-3 py-1.5 text-sm text-ink-2">
                      {tag}
                    </li>
                  );
                }
                return (
                  <li key={tag}>
                    <button
                      type="button"
                      aria-expanded={active}
                      aria-controls={panelId}
                      onClick={() => setSelected(active ? null : { group: group.id, tag })}
                      className={`inline-flex items-center gap-1.5 rounded-chip border px-3 py-1.5 text-sm transition ${
                        active
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-line bg-elev text-ink hover:-translate-y-px hover:border-accent"
                      }`}
                    >
                      {tag}
                      <span
                        className={`rounded-full px-1.5 font-mono text-[0.66rem] leading-4 ${active ? "bg-accent-ink/20" : "bg-accent-soft text-accent-text"}`}
                      >
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div id={panelId} aria-live="polite">
              {open && (
                <div className="mt-4 rounded-card border border-line bg-elev p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="flex items-center gap-2 text-sm text-ink-2">
                      <Sparkles size={15} className="text-accent" aria-hidden />
                      <span>
                        {ui.whereUsed} <strong className="text-ink">{open}</strong> · {ui.places(openEvidence.length)}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      aria-label={ui.close}
                      className="-m-1 rounded-chip p-1 text-ink-3 hover:bg-sunken hover:text-ink"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {openEvidence.map((item) => {
                      const Icon = KIND_ICON[item.sectionKind] ?? Sparkles;
                      return (
                        <li key={item.entryId}>
                          <a
                            href={`#${item.entryId}`}
                            className="group flex items-start gap-3 rounded-[calc(var(--radius-card-value)*0.6)] p-2 transition hover:bg-sunken"
                          >
                            <span className="mt-0.5 rounded-md bg-accent-soft p-1.5 text-accent-text">
                              <Icon size={14} aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-ink group-hover:text-accent-text">
                                {t(item.title, locale)}
                              </span>
                              <span className="block truncate text-xs text-ink-3">{t(item.subtitle, locale)}</span>
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
