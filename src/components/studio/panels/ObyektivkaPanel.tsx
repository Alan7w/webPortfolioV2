"use client";

import { Languages, Plus, Printer, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Obyektivka } from "@/lib/content/schema";
import { uid } from "@/lib/content/derive";
import { OBY_FIELDS, OBY_LABELS, suggestWorkRows } from "@/lib/content/obyektivka";
import { toScript } from "@/lib/content/translit";
import { setPreview, toast, updateVault, useStudio } from "@/lib/studio/store";
import { Button, Card, cx, Empty, Field, Input, PanelHeader, SectionTitle, Textarea } from "../ui";
import { DragHandle, ImageField, SortableList } from "../fields";

export const PRINT_EVENT = "studio:print";

type Scalar = Exclude<keyof Obyektivka, "extra" | "work" | "relatives" | "script">;

export function ObyektivkaPanel() {
  const oby = useStudio((s) => s.vault?.obyektivka);
  const doc = useStudio((s) => s.doc)!;
  const [suggestions, setSuggestions] = useState<Obyektivka["work"] | null>(null);

  useEffect(() => {
    setPreview({ page: "obyektivka", open: true });
    return () => setPreview({ page: "site" });
  }, []);

  if (!oby) return <Empty>The vault couldn’t be loaded.</Empty>;
  const labels = OBY_LABELS[oby.script];
  const up = (recipe: (o: Obyektivka) => void) => updateVault((v) => recipe(v.obyektivka));
  const setField = (key: Scalar, value: string) => up((o) => void (o[key] = value));

  const convertAll = () => {
    const target = oby.script === "cyrl" ? "latn" : "cyrl";
    if (!window.confirm(`Convert every field to ${target === "latn" ? "Latin" : "Cyrillic"}? Names of foreign institutions may need a manual touch-up afterwards.`)) return;
    up((o) => {
      for (const key of Object.keys(o) as (keyof Obyektivka)[]) {
        const value = o[key];
        if (typeof value === "string" && key !== "photo" && key !== "script") (o as Record<string, unknown>)[key] = toScript(value, target);
      }
      o.work = o.work.map((w) => ({ ...w, period: toScript(w.period, target), text: toScript(w.text, target) }));
      o.relatives = o.relatives.map((r) => ({
        ...r,
        relation: toScript(r.relation, target),
        fullName: toScript(r.fullName, target),
        birth: toScript(r.birth, target),
        work: toScript(r.work, target),
        address: toScript(r.address, target),
      }));
      o.extra = o.extra.map((x) => ({ ...x, label: toScript(x.label, target), value: toScript(x.value, target) }));
      o.script = target;
    });
    toast(`Converted to ${target === "latn" ? "Latin" : "Cyrillic"} — please proofread`);
  };

  return (
    <div>
      <PanelHeader
        eyebrow="Private · Uzbek official format"
        title="Obyektivka"
        description="Ma’lumotnoma for government, banks and local employers — generated from the same data as your résumé. Stored only in the private vault."
        actions={
          <>
            <Button onClick={convertAll}>
              <Languages size={14} /> {oby.script === "cyrl" ? "Convert to Latin" : "Convert to Cyrillic"}
            </Button>
            <Button variant="accent" onClick={() => window.dispatchEvent(new Event(PRINT_EVENT))}>
              <Printer size={14} /> Print / PDF
            </Button>
          </>
        }
      />

      <Card className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-ink-2">Labels</span>
            <div className="inline-flex rounded-lg border border-line bg-bg p-0.5">
              {(["cyrl", "latn"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => up((o) => void (o.script = s))}
                  className={cx("rounded-md px-3 py-1 text-sm", oby.script === s ? "bg-ink text-bg" : "text-ink-2")}
                >
                  {s === "cyrl" ? "Кирилл" : "Lotin"}
                </button>
              ))}
            </div>
          </div>
          <Field label="F.I.Sh. (full name with patronymic)">
            <Input value={oby.fullName} onChange={(e) => setField("fullName", e.target.value)} />
          </Field>
          <Field label="Current position — date" hint="The line under your name must describe your position as of the submission date.">
            <Input value={oby.currentPositionDate} onChange={(e) => setField("currentPositionDate", e.target.value)} />
          </Field>
          <Field label="Current position">
            <Textarea rows={2} value={oby.currentPosition} onChange={(e) => setField("currentPosition", e.target.value)} />
          </Field>
        </div>
        <Field label="Photo 3×4 (private)" className="lg:w-60">
          <ImageField
            scope="private"
            aspect="aspect-[3/4]"
            value={oby.photo}
            previewSrc={oby.photo ? `/api/studio/private-file?name=${encodeURIComponent(oby.photo)}` : undefined}
            onChange={(photo) => setField("photo", photo)}
          />
        </Field>
      </Card>

      <SectionTitle>Personal details</SectionTitle>
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        {OBY_FIELDS.flat()
          .filter((k): k is Exclude<(typeof OBY_FIELDS)[number][number], null> => k !== null)
          .map((key) => {
            const long = key === "electedBodies" || key === "stateAwards" || key === "specialty";
            return (
              <Field key={key} label={labels[key].replace(/:$/, "")} className={long ? "sm:col-span-2" : undefined}>
                {long ? <Textarea rows={2} value={oby[key]} onChange={(e) => setField(key, e.target.value)} /> : <Input value={oby[key]} onChange={(e) => setField(key, e.target.value)} />}
              </Field>
            );
          })}
      </Card>

      <SectionTitle>Extra fields</SectionTitle>
      <div className="space-y-2">
        {oby.extra.map((x, i) => (
          <div key={x.id} className="flex items-start gap-2">
            <Input value={x.label} placeholder="Label" className="w-56" onChange={(e) => up((o) => void (o.extra[i].label = e.target.value))} />
            <Input value={x.value} placeholder="Value" className="flex-1" onChange={(e) => up((o) => void (o.extra[i].value = e.target.value))} />
            <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => up((o) => void o.extra.splice(i, 1))}>
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={() => up((o) => void o.extra.push({ id: uid("x"), label: "", value: "" }))}>
          <Plus size={14} /> Add field
        </Button>
      </div>

      <SectionTitle
        aside={
          <Button size="sm" onClick={() => setSuggestions(suggestWorkRows(doc, oby.script))}>
            <Sparkles size={13} /> Suggest from portfolio
          </Button>
        }
      >
        Work history
      </SectionTitle>

      {suggestions && (
        <Card className="mb-4 border-accent/40 p-4">
          <p className="text-sm font-medium text-ink">{suggestions.length} rows built from your dated entries (Uzbek text, converted to {oby.script === "cyrl" ? "Cyrillic" : "Latin"})</p>
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto text-xs text-ink-2">
            {suggestions.map((row) => (
              <li key={row.id}>
                <span className="font-medium text-ink">{row.period}</span> — {row.text}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="primary" onClick={() => (up((o) => void (o.work = suggestions)), setSuggestions(null))}>
              Replace all rows
            </Button>
            <Button size="sm" onClick={() => (up((o) => void o.work.push(...suggestions)), setSuggestions(null))}>
              Append
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSuggestions(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <SortableList
        items={oby.work}
        onReorder={(work) => up((o) => void (o.work = work))}
        render={(row, i, controls) => (
          <div className="flex items-start gap-2">
            <DragHandle controls={controls} />
            <Input value={row.period} placeholder="2024 й. январь – 2025 й. декабрь" className="w-52 shrink-0" onChange={(e) => up((o) => void (o.work[i].period = e.target.value))} />
            <Textarea rows={2} value={row.text} className="flex-1" onChange={(e) => up((o) => void (o.work[i].text = e.target.value))} />
            <Button variant="ghost" size="icon" aria-label="Remove row" onClick={() => up((o) => void o.work.splice(i, 1))}>
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      />
      <Button size="sm" variant="ghost" className="mt-2" onClick={() => up((o) => void o.work.push({ id: uid("w"), period: "", text: "" }))}>
        <Plus size={14} /> Add row
      </Button>

      <SectionTitle>Relatives</SectionTitle>
      <Field
        label="Table title"
        aside={
          <button type="button" className="text-xs text-accent-text hover:underline" onClick={() => up((o) => void (o.relativesTitle = `${o.fullName}${labels.relativesSuffix} ${labels.relativesHeading}`))}>
            Rebuild from name
          </button>
        }
      >
        <Input value={oby.relativesTitle} onChange={(e) => setField("relativesTitle", e.target.value)} />
      </Field>
      <div className="mt-3 space-y-3">
        {oby.relatives.map((r, i) => (
          <Card key={r.id} className="grid gap-3 p-4 sm:grid-cols-2">
            <Field label={labels.relation}>
              <Input value={r.relation} onChange={(e) => up((o) => void (o.relatives[i].relation = e.target.value))} />
            </Field>
            <Field label={labels.fullName}>
              <Input value={r.fullName} onChange={(e) => up((o) => void (o.relatives[i].fullName = e.target.value))} />
            </Field>
            <Field label={labels.birth}>
              <Input value={r.birth} onChange={(e) => up((o) => void (o.relatives[i].birth = e.target.value))} />
            </Field>
            <Field label={labels.workplace}>
              <Input value={r.work} onChange={(e) => up((o) => void (o.relatives[i].work = e.target.value))} />
            </Field>
            <Field label={labels.address} className="sm:col-span-2">
              <Input value={r.address} onChange={(e) => up((o) => void (o.relatives[i].address = e.target.value))} />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button size="sm" variant="ghost" disabled={i === 0} onClick={() => up((o) => void o.relatives.splice(i - 1, 0, ...o.relatives.splice(i, 1)))}>
                Move up
              </Button>
              <Button size="sm" variant="danger" onClick={() => up((o) => void o.relatives.splice(i, 1))}>
                <Trash2 size={13} /> Remove
              </Button>
            </div>
          </Card>
        ))}
        <Button size="sm" variant="ghost" onClick={() => up((o) => void o.relatives.push({ id: uid("rel"), relation: "", fullName: "", birth: "", work: "", address: "" }))}>
          <Plus size={14} /> Add relative
        </Button>
      </div>
    </div>
  );
}
