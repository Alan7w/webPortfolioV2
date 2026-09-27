"use client";

import { Plus, Route, Trash2 } from "lucide-react";
import { EntrySchema } from "@/lib/content/schema";
import { KINDS } from "@/lib/content/kinds";
import { t } from "@/lib/content/i18n";
import { timelineEvents, uid, visibleItems } from "@/lib/content/derive";
import { formatRange } from "@/lib/content/dates";
import { go, toast, undo, update, useStudio } from "@/lib/studio/store";
import { tagsFor, useIssues } from "@/lib/studio/derived";
import { Button, Card, Empty, PanelHeader, SectionTitle, Toggle } from "../ui";
import { LText, SortableList } from "../fields";
import { EntryEditor } from "../EntryEditor";

const PREFIX: Record<string, string> = { experience: "exp", education: "edu", projects: "proj", skills: "sk", awards: "aw", languages: "lang", custom: "item" };

export function SectionPanel({ sectionId }: { sectionId: string }) {
  const doc = useStudio((s) => s.doc)!;
  const openEntryId = useStudio((s) => s.openEntryId);
  const issues = useIssues();
  const section = doc.sections.find((s) => s.id === sectionId);
  if (!section) return <Empty>This section no longer exists.</Empty>;
  const kind = KINDS[section.kind];
  const upSection = (recipe: (s: (typeof doc.sections)[number]) => void, key?: string) =>
    update((d) => {
      const s = d.sections.find((x) => x.id === sectionId);
      if (s) recipe(s);
    }, key ? `${sectionId}:${key}` : undefined);

  const addEntry = () => {
    const entry = EntrySchema.parse({ id: uid(PREFIX[section.kind] ?? "item"), title: { en: "" } });
    upSection((s) => void s.items.unshift(entry));
    go({ type: "section", sectionId }, entry.id);
  };

  const tags = tagsFor(doc);

  return (
    <div>
      <PanelHeader
        eyebrow={kind.label}
        title={t(section.title, "en") || "Untitled section"}
        description={kind.description}
        actions={
          kind.hasItems && (
            <Button variant="primary" onClick={addEntry}>
              <Plus size={15} /> {kind.newItemTitle}
            </Button>
          )
        }
      />

      <Card className="space-y-4 p-4 sm:p-5">
        <LText label="Section title" value={section.title} onChange={(v) => upSection((s) => void (s.title = v), "title")} />
        <LText
          label={section.kind === "text" ? "Text (Markdown)" : "Intro (optional)"}
          hint={section.kind === "text" ? "Paragraphs, **bold**, *italic*, [links](https://…), - lists." : "A line under the heading on the website."}
          value={section.intro}
          multiline
          rows={section.kind === "text" ? 10 : 2}
          onChange={(v) => upSection((s) => void (s.intro = v), "intro")}
        />
        <div className="flex flex-wrap gap-6">
          <Toggle checked={!section.hidden} onChange={(v) => upSection((s) => void (s.hidden = !v))} label="Show on website" />
          {section.kind !== "text" && section.kind !== "timeline" && (
            <Toggle checked={!section.hideOnResume} onChange={(v) => upSection((s) => void (s.hideOnResume = !v))} label="Include on résumé" />
          )}
        </div>
      </Card>

      {kind.hasItems && (
        <>
          <SectionTitle aside={<span className="text-xs text-ink-3">{section.items.length} entries · drag to reorder</span>}>Entries</SectionTitle>
          {section.items.length === 0 ? (
            <Empty>
              Nothing here yet.{" "}
              <button type="button" className="font-medium text-accent-text hover:underline" onClick={addEntry}>
                Add the first one
              </button>
            </Empty>
          ) : (
            <SortableList
              items={section.items}
              onReorder={(items) => upSection((s) => void (s.items = items))}
              render={(entry, _i, controls) => (
                <EntryEditor
                  section={section}
                  entry={entry}
                  open={openEntryId === entry.id}
                  controls={controls}
                  issues={issues.filter((i) => i.targetId === entry.id)}
                  tagSuggestions={tags}
                  sections={doc.sections}
                />
              )}
            />
          )}
        </>
      )}

      {section.kind === "timeline" && (
        <>
          <SectionTitle>Built automatically</SectionTitle>
          <Card className="p-4">
            <p className="mb-3 flex items-start gap-2 text-sm text-ink-2">
              <Route size={16} className="mt-0.5 shrink-0 text-accent" />
              Every visible entry with a date appears here, newest first. To leave something out, hide that entry.
            </p>
            <ul className="divide-y divide-line text-sm">
              {timelineEvents(doc.sections.filter((s) => !s.hidden).map((s) => ({ ...s, items: visibleItems(s, "site") })))
                .slice(0, 40)
                .map((ev) => (
                  <li key={ev.id} className="flex items-center justify-between gap-3 py-1.5">
                    <button type="button" className="truncate text-left text-ink hover:text-accent-text" onClick={() => go({ type: "section", sectionId: ev.sectionId }, ev.id)}>
                      {t(ev.title, "en")}
                    </button>
                    <span className="shrink-0 font-mono text-xs text-ink-3">{formatRange(ev.start, ev.end, "en")}</span>
                  </li>
                ))}
            </ul>
          </Card>
        </>
      )}

      <div className="mt-10 flex justify-end border-t border-line pt-5">
        <Button
          variant="danger"
          onClick={() => {
            const title = t(section.title, "en");
            update((d) => void (d.sections = d.sections.filter((s) => s.id !== sectionId)));
            go({ type: "home" });
            toast(`Deleted section “${title}”`, { label: "Undo", run: () => (undo(), go({ type: "section", sectionId })) });
          }}
        >
          <Trash2 size={14} /> Delete section
        </Button>
      </div>
    </div>
  );
}
