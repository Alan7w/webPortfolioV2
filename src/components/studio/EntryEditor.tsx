"use client";

import type { Draft } from "immer";
import { ChevronDown, Copy, Eye, EyeOff, FileX2, Lock, Star, Trash2 } from "lucide-react";
import type { DragControls } from "motion/react";
import { useEffect, useRef } from "react";
import type { Entry, Section } from "@/lib/content/schema";
import { KINDS } from "@/lib/content/kinds";
import { formatRange } from "@/lib/content/dates";
import { t } from "@/lib/content/i18n";
import { uid } from "@/lib/content/derive";
import type { Issue } from "@/lib/content/coach";
import { go, toast, undo, update, updateVault, useStudio, withEntry } from "@/lib/studio/store";
import { Badge, Button, cx, Field, Input, Select, Textarea, Toggle } from "./ui";
import { BulletsEditor, DateField, DragHandle, FactsEditor, ImageField, LinksEditor, LText, TagInput } from "./fields";

export function cloneEntry(entry: Entry): Entry {
  return {
    ...structuredClone(entry),
    id: uid(entry.id.split("-")[0] || "e"),
    title: { ...entry.title, en: `${entry.title.en ?? ""} (copy)` },
    bullets: entry.bullets.map((b) => ({ ...b, id: uid("b") })),
    links: entry.links.map((l) => ({ ...l, id: uid("l") })),
    facts: entry.facts.map((f) => ({ ...f, id: uid("f") })),
  };
}

const SEVERITY_TONE = { error: "bad", warn: "warn", info: "neutral" } as const;

export function EntryEditor({
  section,
  entry,
  open,
  controls,
  issues,
  tagSuggestions,
  sections,
}: {
  section: Section;
  entry: Entry;
  open: boolean;
  controls: DragControls;
  issues: Issue[];
  tagSuggestions: string[];
  sections: Section[];
}) {
  const locale = useStudio((s) => s.editLocale);
  const note = useStudio((s) => s.vault?.notes[entry.id] ?? "");
  const kind = KINDS[section.kind];
  const f = kind.fields;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  const up = (recipe: (e: Draft<Entry>) => void, key?: string) => update((d) => withEntry(d, entry.id, recipe), key ? `${entry.id}:${key}` : undefined);
  const title = t(entry.title, locale) || t(entry.title, "en") || "Untitled";
  const range = formatRange(entry.start, entry.end, "en");
  const worst = issues.find((i) => i.severity === "error") ?? issues.find((i) => i.severity === "warn");

  const toggleOpen = () => go({ type: "section", sectionId: section.id }, open ? null : entry.id);

  return (
    <div ref={ref} className={cx("rounded-xl border bg-elev transition", open ? "border-line-strong shadow-sm" : "border-line", entry.hidden && "opacity-60")}>
      <div className="flex items-center gap-1.5 px-2 py-2">
        <DragHandle controls={controls} />
        <button type="button" onClick={toggleOpen} className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left" aria-expanded={open}>
          {entry.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.image} alt="" className="size-9 shrink-0 rounded-md object-cover" />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-ink">{title}</span>
              {entry.featured && <Star size={12} className="shrink-0 fill-accent text-accent" aria-label="Featured" />}
            </span>
            <span className="block truncate text-xs text-ink-3">{[t(entry.subtitle, locale), range].filter(Boolean).join(" · ") || "—"}</span>
          </span>
          {entry.hideOnResume && (
            <span title="Hidden on résumé" className="text-ink-3">
              <FileX2 size={14} />
            </span>
          )}
          {worst && <Badge tone={SEVERITY_TONE[worst.severity]}>{issues.length}</Badge>}
          <ChevronDown size={16} className={cx("shrink-0 text-ink-3 transition", open && "rotate-180")} />
        </button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={entry.hidden ? "Show on website" : "Hide everywhere"}
          title={entry.hidden ? "Hidden — click to show" : "Visible — click to hide"}
          onClick={() => up((e) => void (e.hidden = !e.hidden))}
        >
          {entry.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
        </Button>
      </div>

      {open && (
        <div className="space-y-5 border-t border-line px-4 pb-5 pt-4 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {f.title && <LText label={f.title} value={entry.title} onChange={(v) => up((e) => void (e.title = v), "title")} />}
            {f.subtitle &&
              (kind.subtitleOptions ? (
                <Field label={f.subtitle}>
                  <Input
                    list={`${entry.id}-sub`}
                    value={entry.subtitle[locale] ?? ""}
                    onChange={(ev) => up((e) => void (e.subtitle = { ...e.subtitle, [locale]: ev.target.value }), "subtitle")}
                  />
                  <datalist id={`${entry.id}-sub`}>
                    {kind.subtitleOptions.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </Field>
              ) : (
                <LText label={f.subtitle} value={entry.subtitle} onChange={(v) => up((e) => void (e.subtitle = v), "subtitle")} />
              ))}
            {f.url && (
              <Field label={f.url}>
                <Input value={entry.url} placeholder="https://…" className="font-mono text-xs" onChange={(ev) => up((e) => void (e.url = ev.target.value.trim()), "url")} />
              </Field>
            )}
            {f.location && <LText label={f.location} value={entry.location} onChange={(v) => up((e) => void (e.location = v), "location")} />}
          </div>

          {(f.dates || f.type) && (
            <div className="flex flex-wrap items-start gap-4">
              {f.dates && (
                <>
                  <DateField label="Start" value={entry.start} onChange={(v) => up((e) => void (e.start = v), "start")} />
                  <DateField label="End" value={entry.end} allowPresent onChange={(v) => up((e) => void (e.end = v), "end")} />
                </>
              )}
              {f.type && (
                <Field label={f.type} className="min-w-[10rem] flex-1">
                  <Input list={`${entry.id}-type`} value={entry.type} onChange={(ev) => up((e) => void (e.type = ev.target.value), "type")} />
                  <datalist id={`${entry.id}-type`}>
                    {kind.typeOptions?.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </Field>
              )}
            </div>
          )}

          {f.summary && <LText label={f.summary} value={entry.summary} multiline rows={2} onChange={(v) => up((e) => void (e.summary = v), "summary")} />}

          {f.bullets && (
            <Field label={f.bullets}>
              <BulletsEditor bullets={entry.bullets} onChange={(bullets) => up((e) => void (e.bullets = bullets), "bullets")} />
            </Field>
          )}

          {f.tags && (
            <Field label={f.tags} hint={section.kind === "skills" ? "Use the same spelling as in your other entries so visitors can click through to evidence." : "These link this entry to your Skills section."}>
              <TagInput value={entry.tags} suggestions={tagSuggestions} onChange={(tags) => up((e) => void (e.tags = tags))} />
            </Field>
          )}

          {f.links && (
            <Field label={f.links}>
              <LinksEditor links={entry.links} onChange={(links) => up((e) => void (e.links = links), "links")} />
            </Field>
          )}

          {f.facts && (
            <Field label={f.facts}>
              <FactsEditor facts={entry.facts} onChange={(facts) => up((e) => void (e.facts = facts), "facts")} />
            </Field>
          )}

          {f.image && (
            <Field label={f.image}>
              <ImageField value={entry.image} onChange={(image) => up((e) => void (e.image = image))} />
              {entry.image && <LText value={entry.imageAlt} placeholder="Describe the image (for screen readers)" onChange={(v) => up((e) => void (e.imageAlt = v), "alt")} />}
            </Field>
          )}

          {f.body && (
            <LText
              label={f.body}
              hint="Markdown: ## Heading, **bold**, *italic*, - lists, [links](https://…). A “Read the case study” page appears automatically."
              value={entry.body}
              multiline
              rows={8}
              inputClassName="font-mono text-[0.8rem]"
              onChange={(v) => up((e) => void (e.body = v), "body")}
            />
          )}

          <div className="grid gap-3 rounded-lg bg-sunken/60 p-3 sm:grid-cols-3">
            <Toggle checked={!entry.hidden} onChange={(v) => up((e) => void (e.hidden = !v))} label="On website" />
            <Toggle checked={!entry.hideOnResume} onChange={(v) => up((e) => void (e.hideOnResume = !v))} label="On résumé" />
            {f.featured !== undefined || section.kind === "awards" ? (
              <Toggle checked={entry.featured} onChange={(v) => up((e) => void (e.featured = v))} label="Featured" />
            ) : null}
          </div>

          <Field
            label={
              <span className="inline-flex items-center gap-1.5">
                <Lock size={12} /> Private note
              </span>
            }
            hint="Only you see this — saved in the git-ignored vault. Good for metrics you still need to confirm, interview talking points…"
          >
            <Textarea
              rows={2}
              value={note}
              onChange={(ev) => {
                const value = ev.target.value;
                updateVault((v) => {
                  if (value) v.notes[entry.id] = value;
                  else delete v.notes[entry.id];
                });
              }}
            />
          </Field>

          {issues.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-line p-3">
              <p className="label text-[0.6rem] text-ink-3">Coach</p>
              {issues.map((issue) => (
                <p key={issue.id} className="flex items-start gap-2 text-xs">
                  <Badge tone={SEVERITY_TONE[issue.severity]}>{issue.severity}</Badge>
                  <span className="text-ink-2">
                    {issue.title.replace(`${t(entry.title, "en")}: `, "")}
                    {issue.detail && <span className="block text-ink-3">{issue.detail}</span>}
                  </span>
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button
              size="sm"
              onClick={() => {
                const copy = cloneEntry(entry);
                update((d) => {
                  const s = d.sections.find((x) => x.id === section.id);
                  const i = s?.items.findIndex((x) => x.id === entry.id) ?? -1;
                  s?.items.splice(i + 1, 0, copy);
                });
                go({ type: "section", sectionId: section.id }, copy.id);
              }}
            >
              <Copy size={13} /> Duplicate
            </Button>
            <Select
              value=""
              className="h-7 w-auto py-0 text-xs"
              onChange={(ev) => {
                const target = ev.target.value;
                if (!target) return;
                update((d) => {
                  const from = d.sections.find((x) => x.id === section.id);
                  const to = d.sections.find((x) => x.id === target);
                  const i = from?.items.findIndex((x) => x.id === entry.id) ?? -1;
                  if (!from || !to || i < 0) return;
                  const [moved] = from.items.splice(i, 1);
                  to.items.unshift(moved);
                });
                toast(`Moved to ${t(sections.find((s) => s.id === target)?.title, "en")}`, { label: "Undo", run: undo });
              }}
            >
              <option value="">Move to…</option>
              {sections
                .filter((s) => s.id !== section.id && KINDS[s.kind].hasItems)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {t(s.title, "en")}
                  </option>
                ))}
            </Select>
            <span className="flex-1" />
            <span className="font-mono text-[0.65rem] text-ink-3">{entry.id}</span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                update((d) => {
                  const s = d.sections.find((x) => x.id === section.id);
                  if (s) s.items = s.items.filter((x) => x.id !== entry.id);
                });
                toast(`Deleted “${title}”`, { label: "Undo", run: undo });
              }}
            >
              <Trash2 size={13} /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
