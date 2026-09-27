"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/lib/content/i18n";
import { go, useStudio, type Panel } from "@/lib/studio/store";
import { cx } from "./ui";

const EVENT = "studio:jump";
export const openJump = () => window.dispatchEvent(new Event(EVENT));

interface Item {
  id: string;
  label: string;
  hint: string;
  panel: Panel;
  entryId?: string;
}

const PANELS: { label: string; panel: Panel }[] = [
  { label: "Overview", panel: { type: "home" } },
  { label: "Profile", panel: { type: "profile" } },
  { label: "Coach", panel: { type: "coach" } },
  { label: "Variants", panel: { type: "variants" } },
  { label: "Theme", panel: { type: "theme" } },
  { label: "Vault", panel: { type: "vault" } },
  { label: "Obyektivka", panel: { type: "obyektivka" } },
  { label: "Publish", panel: { type: "publish" } },
  { label: "Import & export", panel: { type: "data" } },
  { label: "Settings", panel: { type: "settings" } },
];

/** ⌘K in the Studio: jump to any panel, section or entry by typing part of its name. */
export function StudioJump() {
  const doc = useStudio((s) => s.doc);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);
  useEffect(() => {
    if (open) requestAnimationFrame(() => input.current?.focus());
  }, [open]);

  const items = useMemo<Item[]>(() => {
    if (!doc) return [];
    return [
      ...PANELS.map((p) => ({ id: `p-${p.panel.type}`, label: p.label, hint: "Panel", panel: p.panel })),
      ...doc.sections.map((s) => ({ id: `s-${s.id}`, label: t(s.title, "en") || "Untitled", hint: "Section", panel: { type: "section", sectionId: s.id } as Panel })),
      ...doc.sections.flatMap((s) =>
        s.items.map((e) => ({
          id: `e-${e.id}`,
          label: t(e.title, "en") || "Untitled",
          hint: [t(e.subtitle, "en"), t(s.title, "en")].filter(Boolean).join(" · "),
          panel: { type: "section", sectionId: s.id } as Panel,
          entryId: e.id,
        })),
      ),
    ];
  }, [doc]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (needle ? items.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(needle)) : items).slice(0, 40);
  }, [items, q]);

  const close = () => {
    setOpen(false);
    setQ("");
    setActive(0);
  };
  const pick = (item: Item) => {
    go(item.panel, item.entryId ?? null);
    close();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/25 px-4 pt-[14vh] backdrop-blur-[2px]" onMouseDown={close}>
      <div role="dialog" aria-label="Jump to" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-elev shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search size={16} className="text-ink-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              else if (e.key === "Enter" && filtered[active]) pick(filtered[active]);
            }}
            placeholder="Jump to a section, entry or panel…"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
          />
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-1.5">
          {filtered.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseMove={() => setActive(i)}
                onClick={() => pick(item)}
                className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm", i === active ? "bg-accent-soft" : "")}
              >
                <span className="flex-1 truncate text-ink">{item.label}</span>
                <span className="truncate text-xs text-ink-3">{item.hint}</span>
                {i === active && <CornerDownLeft size={12} className="text-ink-3" />}
              </button>
            </li>
          ))}
          {!filtered.length && <li className="px-3 py-6 text-center text-sm text-ink-3">No matches</li>}
        </ul>
      </div>
    </div>
  );
}
