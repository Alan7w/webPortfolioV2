"use client";

import { GripVertical, ImagePlus, Languages, Plus, Trash2, Upload, X } from "lucide-react";
import { Reorder, useDragControls, type DragControls } from "motion/react";
import { useId, useRef, useState, type ReactNode } from "react";
import type { Bullet, Fact, Link, LString, Locale } from "@/lib/content/schema";
import { LOCALES } from "@/lib/content/schema";
import { formatDate, isPresent, isValidDateValue } from "@/lib/content/dates";
import { uid } from "@/lib/content/derive";
import { needsTranslation } from "@/lib/content/coach";
import { useStudio } from "@/lib/studio/store";
import { Button, cx, Field, Input, inputClass, Select, Textarea } from "./ui";

/* ───────────────────────── Localized text ───────────────────────── */

function LocaleDots({ value }: { value: LString | undefined }) {
  const editLocale = useStudio((s) => s.editLocale);
  if (!needsTranslation(value?.en)) return null;
  return (
    <span className="flex items-center gap-1" aria-label="Translations">
      {LOCALES.map((l) => (
        <span
          key={l}
          title={`${l.toUpperCase()}: ${value?.[l]?.trim() ? "done" : "missing"}`}
          className={cx(
            "font-mono text-[0.58rem] leading-none",
            value?.[l]?.trim() ? "text-ok" : "text-ink-3/60",
            l === editLocale && "underline underline-offset-2",
          )}
        >
          {l.toUpperCase()}
        </span>
      ))}
    </span>
  );
}

/**
 * Edits one localized string in the Studio's current editing language. While translating,
 * the English source is shown underneath with a one-click copy.
 */
export function LText({
  value,
  onChange,
  label,
  hint,
  multiline,
  rows = 3,
  placeholder,
  className,
  inputClassName,
  mono,
}: {
  value: LString | undefined;
  onChange: (next: LString) => void;
  label?: ReactNode;
  hint?: ReactNode;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  mono?: boolean;
}) {
  const locale = useStudio((s) => s.editLocale);
  const current = value?.[locale] ?? "";
  const english = value?.en ?? "";
  const set = (text: string) => onChange({ ...(value ?? {}), [locale]: text });
  const translating = locale !== "en" && Boolean(english.trim());
  const common = {
    value: current,
    placeholder: translating ? english : placeholder,
    lang: locale,
    className: cx(mono && "font-mono", translating && !current && "border-dashed", inputClassName),
  };
  return (
    <Field label={label} hint={hint} className={className} aside={label ? <LocaleDots value={value} /> : undefined}>
      {multiline ? (
        <Textarea {...common} rows={rows} onChange={(e) => set(e.target.value)} />
      ) : (
        <Input {...common} onChange={(e) => set(e.target.value)} />
      )}
      {translating && (
        <div className="flex items-start gap-2 rounded-md bg-sunken/70 px-2.5 py-1.5 text-xs text-ink-3">
          <span className="mt-px font-mono text-[0.6rem] text-ink-3">EN</span>
          <span className={cx("flex-1", multiline ? "line-clamp-4 whitespace-pre-line" : "truncate")}>{english}</span>
          {!current && (
            <button type="button" onClick={() => set(english)} className="shrink-0 font-medium text-accent-text hover:underline">
              Copy
            </button>
          )}
        </div>
      )}
    </Field>
  );
}

/* ───────────────────────── Dates ───────────────────────── */

export function DateField({ label, value, onChange, allowPresent }: { label: string; value: string; onChange: (v: string) => void; allowPresent?: boolean }) {
  const present = isPresent(value);
  const valid = isValidDateValue(value);
  return (
    <Field label={label} hint={!valid ? "Use YYYY, YYYY-MM or YYYY-MM-DD" : undefined}>
      <div className="flex items-center gap-2">
        <div className="w-28 shrink-0">
          <Input
            value={present ? "" : value}
            disabled={present}
            placeholder={present ? "Present" : "YYYY-MM"}
            onChange={(e) => onChange(e.target.value.trim())}
            aria-invalid={!valid}
            className={cx("font-mono", !valid && "border-bad focus:border-bad")}
          />
        </div>
        {allowPresent && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-2">
            <input type="checkbox" checked={present} onChange={(e) => onChange(e.target.checked ? "present" : "")} className="accent-[var(--accent)]" />
            Present
          </label>
        )}
        {valid && value && !present && <span className="truncate text-xs text-ink-3">{formatDate(value, "en")}</span>}
      </div>
    </Field>
  );
}

/* ───────────────────────── Tags ───────────────────────── */

export function TagInput({ value, onChange, suggestions = [], placeholder = "Type and press Enter" }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?: string }) {
  const [text, setText] = useState("");
  const listId = useId();
  const canonical = (raw: string) => suggestions.find((s) => s.toLowerCase() === raw.toLowerCase()) ?? raw;
  const add = (raw: string) => {
    const incoming = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map(canonical);
    const next = [...value];
    for (const tag of incoming) if (!next.some((t) => t.toLowerCase() === tag.toLowerCase())) next.push(tag);
    if (next.length !== value.length) onChange(next);
    setText("");
  };
  return (
    <div className={cx(inputClass, "flex min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15")}>
      {value.map((tag, i) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-sunken py-0.5 pl-2 pr-1 font-mono text-xs text-ink">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="rounded p-0.5 text-ink-3 hover:bg-line hover:text-ink"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={text}
        list={listId}
        placeholder={value.length ? "" : placeholder}
        onChange={(e) => {
          if (e.target.value.endsWith(",")) add(e.target.value);
          else setText(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => text && add(text)}
        className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-ink-3"
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}

/* ───────────────────────── Sortable lists ───────────────────────── */

function SortableRow<T extends { id: string }>({ item, children }: { item: T; children: (controls: DragControls) => ReactNode }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} className="relative list-none" as="li">
      {children(controls)}
    </Reorder.Item>
  );
}

export function DragHandle({ controls, label = "Drag to reorder" }: { controls: DragControls; label?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => controls.start(e)}
      className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink active:cursor-grabbing"
    >
      <GripVertical size={15} />
    </button>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  render,
  className,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  render: (item: T, index: number, controls: DragControls) => ReactNode;
  className?: string;
}) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className={cx("space-y-2", className)} as="ul">
      {items.map((item, index) => (
        <SortableRow key={item.id} item={item}>
          {(controls) => render(item, index, controls)}
        </SortableRow>
      ))}
    </Reorder.Group>
  );
}

/* ───────────────────────── Bullets / links / facts ───────────────────────── */

const WEAK = /^(helped|help|did|assisted|worked on|responsible for|was responsible|participated in|involved in|tasked with|handled|made|got)\b/i;

export function BulletsEditor({ bullets, onChange }: { bullets: Bullet[]; onChange: (b: Bullet[]) => void }) {
  const locale = useStudio((s) => s.editLocale);
  return (
    <div className="space-y-2">
      <SortableList
        items={bullets}
        onReorder={onChange}
        render={(bullet, i, controls) => {
          const weak = locale === "en" && WEAK.exec(bullet.text.en ?? "");
          return (
            <div className="flex items-start gap-1.5">
              <DragHandle controls={controls} />
              <div className="min-w-0 flex-1">
                <LText
                  value={bullet.text}
                  multiline
                  rows={2}
                  placeholder="Action verb + what you did + result (with a number if you can)"
                  onChange={(text) => onChange(bullets.map((b, j) => (j === i ? { ...b, text } : b)))}
                />
                {weak && (
                  <p className="mt-1 text-xs text-warn">
                    “{weak[0]}” is a weak opener — try Built, Led, Designed, Implemented, Mentored, Improved…
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" aria-label="Remove bullet" onClick={() => onChange(bullets.filter((_, j) => j !== i))}>
                <Trash2 size={14} />
              </Button>
            </div>
          );
        }}
      />
      <Button size="sm" variant="ghost" onClick={() => onChange([...bullets, { id: uid("b"), text: {} }])}>
        <Plus size={14} /> Add bullet
      </Button>
    </div>
  );
}

const LINK_KINDS: { value: Link["kind"]; label: string }[] = [
  { value: "live", label: "Live / Play" },
  { value: "code", label: "Source code" },
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
  { value: "download", label: "Download" },
  { value: "other", label: "Other" },
];

export function LinksEditor({ links, onChange }: { links: Link[]; onChange: (l: Link[]) => void }) {
  const patch = (i: number, p: Partial<Link>) => onChange(links.map((l, j) => (j === i ? { ...l, ...p } : l)));
  return (
    <div className="space-y-2">
      <SortableList
        items={links}
        onReorder={onChange}
        render={(link, i, controls) => (
          <div className="flex flex-wrap items-start gap-1.5 rounded-lg border border-line bg-bg/40 p-2 sm:flex-nowrap">
            <DragHandle controls={controls} />
            <Select value={link.kind} onChange={(e) => patch(i, { kind: e.target.value as Link["kind"] })} className="w-full sm:w-36">
              {LINK_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
            <Input value={link.url} placeholder="https://…" onChange={(e) => patch(i, { url: e.target.value.trim() })} className="min-w-0 flex-[2] font-mono text-xs" />
            <LText value={link.label} placeholder="Label (optional)" onChange={(label) => patch(i, { label })} className="min-w-0 flex-1" />
            <Button variant="ghost" size="icon" aria-label="Remove link" onClick={() => onChange(links.filter((_, j) => j !== i))}>
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      />
      <Button size="sm" variant="ghost" onClick={() => onChange([...links, { id: uid("l"), label: {}, url: "", kind: "live" }])}>
        <Plus size={14} /> Add link
      </Button>
    </div>
  );
}

export function FactsEditor({ facts, onChange }: { facts: Fact[]; onChange: (f: Fact[]) => void }) {
  const patch = (i: number, p: Partial<Fact>) => onChange(facts.map((f, j) => (j === i ? { ...f, ...p } : f)));
  return (
    <div className="space-y-2">
      <SortableList
        items={facts}
        onReorder={onChange}
        render={(fact, i, controls) => (
          <div className="flex items-start gap-1.5">
            <DragHandle controls={controls} />
            <LText value={fact.label} placeholder="Label (e.g. GPA)" onChange={(label) => patch(i, { label })} className="w-40 shrink-0" />
            <LText value={fact.value} placeholder="Value" onChange={(value) => patch(i, { value })} className="min-w-0 flex-1" />
            <Button variant="ghost" size="icon" aria-label="Remove detail" onClick={() => onChange(facts.filter((_, j) => j !== i))}>
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      />
      <Button size="sm" variant="ghost" onClick={() => onChange([...facts, { id: uid("f"), label: {}, value: {} }])}>
        <Plus size={14} /> Add detail
      </Button>
    </div>
  );
}

/* ───────────────────────── Images ───────────────────────── */

export async function uploadFile(file: File, scope: "public" | "private" = "public"): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/studio/upload?scope=${scope}`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.path as string;
}

export function ImageField({
  value,
  onChange,
  scope = "public",
  previewSrc,
  aspect = "aspect-[4/3]",
}: {
  value: string;
  onChange: (v: string) => void;
  scope?: "public" | "private";
  previewSrc?: string;
  aspect?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const handle = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await uploadFile(file, scope));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const src = previewSrc ?? value;
  return (
    <div
      className={cx("flex items-start gap-3 rounded-lg p-1 transition", over && "bg-accent-soft")}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void handle(e.dataTransfer.files?.[0]);
      }}
    >
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cx("relative w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-sunken", aspect)}
        aria-label="Upload image"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-ink-3">
            <ImagePlus size={20} />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => input.current?.click()} disabled={busy}>
            <Upload size={13} /> {busy ? "Uploading…" : "Upload"}
          </Button>
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange("")}>
              Remove
            </Button>
          )}
        </div>
        {scope === "public" && <Input value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="/uploads/… or https://…" className="font-mono text-xs" />}
        <p className="text-xs text-ink-3">{error ? <span className="text-bad">{error}</span> : "Drop an image here · JPG, PNG, WebP up to 8 MB"}</p>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void handle(e.target.files?.[0])} />
    </div>
  );
}

/* ───────────────────────── Locale switcher (top bar) ───────────────────────── */

export function LocaleSwitch({ stats }: { stats: Record<Locale, { total: number; done: number }> }) {
  const locale = useStudio((s) => s.editLocale);
  return (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-bg p-0.5" role="group" aria-label="Editing language">
      <Languages size={14} className="mx-1.5 text-ink-3" aria-hidden />
      {LOCALES.map((l) => {
        const s = stats[l];
        const pct = l === "en" || !s.total ? 100 : Math.round((s.done / s.total) * 100);
        return (
          <button
            key={l}
            type="button"
            aria-pressed={locale === l}
            onClick={() => useStudio.setState({ editLocale: l })}
            title={l === "en" ? "English (source)" : `${pct}% translated`}
            className={cx(
              "relative flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs transition",
              locale === l ? "bg-ink text-bg" : "text-ink-2 hover:bg-sunken",
            )}
          >
            {l.toUpperCase()}
            {l !== "en" && <span className={cx("text-[0.6rem]", locale === l ? "text-bg/70" : pct === 100 ? "text-ok" : "text-ink-3")}>{pct}%</span>}
          </button>
        );
      })}
    </div>
  );
}
