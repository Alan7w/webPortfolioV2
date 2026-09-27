"use client";

import {
  AlignLeft,
  ArrowLeftRight,
  Award,
  Briefcase,
  CloudUpload,
  Code2,
  Eye,
  EyeOff,
  GraduationCap,
  IdCard,
  Languages,
  Layers,
  LayoutDashboard,
  LayoutList,
  Lock,
  Palette,
  Plus,
  Route,
  Settings,
  Sparkles,
  User,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { SectionSchema, type SectionKind } from "@/lib/content/schema";
import { SECTION_TEMPLATES } from "@/lib/content/kinds";
import { DEFAULT_SECTION_TITLES, t } from "@/lib/content/i18n";
import { uid } from "@/lib/content/derive";
import { go, update, useStudio, type Panel } from "@/lib/studio/store";
import { useIssues } from "@/lib/studio/derived";
import { cx } from "./ui";
import { DragHandle, SortableList } from "./fields";

export const KIND_ICONS: Record<SectionKind, typeof Briefcase> = {
  experience: Briefcase,
  education: GraduationCap,
  projects: Code2,
  skills: Wrench,
  awards: Award,
  languages: Languages,
  text: AlignLeft,
  timeline: Route,
  custom: LayoutList,
};

function NavItem({ panel, icon: Icon, label, badge }: { panel: Panel; icon: typeof User; label: string; badge?: { n: number; tone: "bad" | "warn" | "neutral" } }) {
  const current = useStudio((s) => s.panel);
  const active = current.type === panel.type && (panel.type !== "section" || (current.type === "section" && current.sectionId === panel.sectionId));
  return (
    <button
      type="button"
      onClick={() => go(panel)}
      aria-current={active ? "page" : undefined}
      className={cx("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition", active ? "bg-elev font-medium text-ink shadow-sm ring-1 ring-line" : "text-ink-2 hover:bg-elev/60 hover:text-ink")}
    >
      <Icon size={15} className={active ? "text-accent" : "text-ink-3"} />
      <span className="flex-1 truncate text-left">{label}</span>
      {badge && badge.n > 0 && (
        <span className={cx("rounded-full px-1.5 text-[0.65rem] font-semibold leading-4", badge.tone === "bad" ? "bg-bad text-white" : badge.tone === "warn" ? "bg-warn/20 text-warn" : "bg-sunken text-ink-3")}>
          {badge.n}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const doc = useStudio((s) => s.doc)!;
  const panel = useStudio((s) => s.panel);
  const openReview = useStudio((s) => s.vault?.review.filter((r) => r.status === "open").length ?? 0);
  const issues = useIssues();
  const [adding, setAdding] = useState(false);
  const errors = issues.filter((i) => i.severity === "error").length;
  const warns = issues.filter((i) => i.severity === "warn").length;

  const addSection = (key: string, kind: SectionKind) => {
    const section = SectionSchema.parse({ id: uid("sec"), kind, title: DEFAULT_SECTION_TITLES[key] ?? DEFAULT_SECTION_TITLES[kind] });
    update((d) => void d.sections.push(section));
    go({ type: "section", sectionId: section.id });
    setAdding(false);
  };

  return (
    <nav aria-label="Studio" className="flex h-full flex-col gap-5 overflow-y-auto border-r border-line bg-sunken/60 px-3 py-4">
      <div className="space-y-0.5">
        <NavItem panel={{ type: "home" }} icon={LayoutDashboard} label="Overview" />
        <NavItem panel={{ type: "profile" }} icon={User} label="Profile" />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between px-2.5">
          <p className="label text-[0.6rem] text-ink-3">Sections</p>
          <button type="button" onClick={() => setAdding((v) => !v)} className="rounded p-0.5 text-ink-3 hover:bg-elev hover:text-ink" aria-label="Add section" aria-expanded={adding}>
            <Plus size={14} />
          </button>
        </div>
        {adding && (
          <div className="mb-2 grid gap-0.5 rounded-lg border border-line bg-elev p-1.5 shadow-sm">
            {SECTION_TEMPLATES.map((tpl) => {
              const Icon = KIND_ICONS[tpl.kind];
              return (
                <button key={tpl.key} type="button" onClick={() => addSection(tpl.key, tpl.kind)} className="flex items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sunken">
                  <Icon size={14} className="mt-0.5 text-ink-3" />
                  <span>
                    <span className="block text-sm text-ink">{tpl.label}</span>
                    <span className="block text-[0.7rem] text-ink-3">{tpl.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <SortableList
          className="!space-y-0.5"
          items={doc.sections}
          onReorder={(sections) => update((d) => void (d.sections = sections))}
          render={(section, _i, controls) => {
            const Icon = KIND_ICONS[section.kind];
            const active = panel.type === "section" && panel.sectionId === section.id;
            return (
              <div className={cx("group flex items-center rounded-lg transition", active ? "bg-elev shadow-sm ring-1 ring-line" : "hover:bg-elev/60")}>
                <span className="opacity-0 transition group-hover:opacity-100">
                  <DragHandle controls={controls} label="Drag to reorder sections" />
                </span>
                <button type="button" onClick={() => go({ type: "section", sectionId: section.id })} className={cx("flex min-w-0 flex-1 items-center gap-2 py-1.5 text-sm", section.hidden && "opacity-50")}>
                  <Icon size={14} className={active ? "text-accent" : "text-ink-3"} />
                  <span className={cx("flex-1 truncate text-left", active ? "font-medium text-ink" : "text-ink-2")}>{t(section.title, "en") || "Untitled"}</span>
                  {section.items.length > 0 && <span className="font-mono text-[0.65rem] text-ink-3">{section.items.length}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => update((d) => void (d.sections.find((s) => s.id === section.id)!.hidden = !section.hidden))}
                  className={cx("mr-1 rounded p-1 text-ink-3 hover:text-ink", !section.hidden && "opacity-0 group-hover:opacity-100")}
                  aria-label={section.hidden ? "Show section" : "Hide section"}
                  title={section.hidden ? "Hidden — click to show" : "Hide section"}
                >
                  {section.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            );
          }}
        />
      </div>

      <div className="space-y-0.5">
        <p className="label mb-1.5 px-2.5 text-[0.6rem] text-ink-3">Make it great</p>
        <NavItem panel={{ type: "coach" }} icon={Sparkles} label="Coach" badge={{ n: errors + openReview, tone: errors ? "bad" : openReview ? "warn" : "neutral" }} />
        <NavItem panel={{ type: "variants" }} icon={Layers} label="Variants" badge={{ n: doc.variants.length, tone: "neutral" }} />
        <NavItem panel={{ type: "theme" }} icon={Palette} label="Theme" />
      </div>

      <div className="space-y-0.5">
        <p className="label mb-1.5 px-2.5 text-[0.6rem] text-ink-3">Private</p>
        <NavItem panel={{ type: "vault" }} icon={Lock} label="Vault" />
        <NavItem panel={{ type: "obyektivka" }} icon={IdCard} label="Obyektivka" />
      </div>

      <div className="space-y-0.5">
        <p className="label mb-1.5 px-2.5 text-[0.6rem] text-ink-3">Ship</p>
        <NavItem panel={{ type: "publish" }} icon={CloudUpload} label="Publish" />
        <NavItem panel={{ type: "data" }} icon={ArrowLeftRight} label="Import & export" />
        <NavItem panel={{ type: "settings" }} icon={Settings} label="Settings" />
      </div>

      <p className="mt-auto px-2.5 text-[0.68rem] leading-relaxed text-ink-3">
        {warns} suggestions to improve · saved to <code className="font-mono">content/</code>
      </p>
    </nav>
  );
}
