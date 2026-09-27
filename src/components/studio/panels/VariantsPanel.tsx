"use client";

import { Copy, ExternalLink, Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Variant } from "@/lib/content/schema";
import { slugify, uid } from "@/lib/content/derive";
import { t } from "@/lib/content/i18n";
import { KINDS } from "@/lib/content/kinds";
import { setPreview, toast, undo, update, useStudio } from "@/lib/studio/store";
import { tagsFor } from "@/lib/studio/derived";
import { copyText } from "@/components/site/CopyButton";
import { Badge, Button, Card, cx, Empty, Field, Input, PanelHeader, SectionTitle } from "../ui";
import { LText, TagInput } from "../fields";

export function VariantsPanel() {
  const doc = useStudio((s) => s.doc)!;
  const locale = useStudio((s) => s.editLocale);
  const previewVariant = useStudio((s) => s.preview.variant);
  const [selected, setSelected] = useState<string | null>(doc.variants[0]?.id ?? null);
  const variant = doc.variants.find((v) => v.id === selected) ?? null;
  const index = doc.variants.findIndex((v) => v.id === selected);
  const up = (recipe: (v: Variant) => void, key?: string) =>
    update((d) => {
      const v = d.variants.find((x) => x.id === selected);
      if (v) recipe(v);
    }, key ? `variant:${selected}:${key}` : undefined);

  const add = () => {
    const id = uid("v");
    const slug = `version-${doc.variants.length + 1}`;
    update((d) => void d.variants.push({ id, slug, label: "New version", headline: {}, summary: {}, hidden: [], emphasize: [] }));
    setSelected(id);
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = doc.settings.siteUrl || origin;

  return (
    <div>
      <PanelHeader
        eyebrow="Tailoring"
        title="Variants"
        description="One source, many versions. A variant hides what's irrelevant, swaps the headline and floats key skills to the top — each gets its own link and résumé."
        actions={
          <Button variant="primary" onClick={add}>
            <Plus size={15} /> New variant
          </Button>
        }
      />

      {doc.variants.length === 0 ? (
        <Empty>No variants yet. Create one per kind of role you apply to — e.g. “Game Developer”, “Front-end”.</Empty>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {doc.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelected(v.id)}
              className={cx("rounded-lg border px-3 py-2 text-left text-sm transition", v.id === selected ? "border-accent bg-accent-soft" : "border-line bg-elev hover:border-line-strong")}
            >
              <span className="block font-medium text-ink">{v.label || v.slug}</span>
              <span className="block font-mono text-xs text-ink-3">/v/{v.slug}</span>
            </button>
          ))}
        </div>
      )}

      {variant && (
        <>
          <Card className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (only you see this)">
                <Input value={variant.label} onChange={(e) => up((v) => void (v.label = e.target.value), "label")} />
              </Field>
              <Field
                label="Link slug"
                hint={
                  doc.variants.some((v, i) => i !== index && v.slug === variant.slug) ? <span className="text-bad">Another variant already uses this slug.</span> : `${base}/${locale}/v/${variant.slug}`
                }
              >
                <Input
                  value={variant.slug}
                  className="font-mono"
                  onChange={(e) => up((v) => void (v.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-")), "slug")}
                  onBlur={() => up((v) => void (v.slug = slugify(v.slug) || `version-${index + 1}`))}
                />
              </Field>
            </div>
            <LText label="Headline override" hint="Leave empty to keep your main headline." value={variant.headline} onChange={(val) => up((v) => void (v.headline = val), "headline")} />
            <LText label="Summary override" value={variant.summary} multiline rows={3} onChange={(val) => up((v) => void (v.summary = val), "summary")} />
            <Field label="Emphasize skills" hint="These float to the front of each skill group.">
              <TagInput value={variant.emphasize} suggestions={tagsFor(doc)} onChange={(tags) => up((v) => void (v.emphasize = tags))} />
            </Field>
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button size="sm" variant={previewVariant === variant.slug ? "primary" : "secondary"} onClick={() => setPreview({ variant: previewVariant === variant.slug ? "" : variant.slug, open: true })}>
                <Eye size={13} /> {previewVariant === variant.slug ? "Previewing" : "Preview"}
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  await copyText(`${base}/${locale}/v/${variant.slug}`);
                  toast("Link copied");
                }}
              >
                <Copy size={13} /> Copy link
              </Button>
              <a href={`/${locale}/resume/${variant.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-line bg-elev px-2.5 text-xs font-medium text-ink hover:border-line-strong">
                <ExternalLink size={13} /> Résumé
              </a>
              <span className="flex-1" />
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  update((d) => void (d.variants = d.variants.filter((v) => v.id !== variant.id)));
                  setSelected(doc.variants.find((v) => v.id !== variant.id)?.id ?? null);
                  toast(`Deleted variant “${variant.label}”`, { label: "Undo", run: undo });
                }}
              >
                <Trash2 size={13} /> Delete
              </Button>
            </div>
          </Card>

          <SectionTitle aside={<Badge>{variant.hidden.length} hidden</Badge>}>What this version shows</SectionTitle>
          <div className="space-y-3">
            {doc.sections.map((section) => {
              const sectionHidden = variant.hidden.includes(section.id);
              const toggle = (id: string) => up((v) => void (v.hidden = v.hidden.includes(id) ? v.hidden.filter((x) => x !== id) : [...v.hidden, id]));
              return (
                <Card key={section.id} className={cx("p-3", section.hidden && "opacity-50")}>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={!sectionHidden} onChange={() => toggle(section.id)} className="size-4 accent-[var(--accent)]" />
                    <span className="font-medium text-ink">{t(section.title, "en")}</span>
                    <span className="text-xs text-ink-3">{KINDS[section.kind].label}</span>
                    {section.hidden && <Badge>hidden everywhere</Badge>}
                  </label>
                  {!sectionHidden && section.items.length > 0 && (
                    <div className="mt-2 grid gap-1 pl-7 sm:grid-cols-2">
                      {section.items.map((item) => (
                        <label key={item.id} className={cx("flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-sunken", item.hidden && "opacity-50")}>
                          <input type="checkbox" checked={!variant.hidden.includes(item.id)} onChange={() => toggle(item.id)} className="accent-[var(--accent)]" />
                          <span className="truncate text-ink-2">{t(item.title, "en") || "Untitled"}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
