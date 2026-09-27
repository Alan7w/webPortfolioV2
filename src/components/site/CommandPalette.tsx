"use client";

import { ArrowRight, Command, CornerDownLeft, FileText, Gamepad2, Languages, Mail, MoonStar, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { copyText } from "./CopyButton";
import { toggleArcade } from "./SecretMode";
import { toggleMode } from "./ThemeToggle";

export interface PaletteItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href?: string;
  action?: "theme" | "copy" | "arcade";
  payload?: string;
  icon?: "go" | "lang" | "resume" | "theme" | "mail" | "arcade";
}

const ICONS = { go: ArrowRight, lang: Languages, resume: FileText, theme: MoonStar, mail: Mail, arcade: Gamepad2 };

export const OPEN_PALETTE_EVENT = "pf:palette";

export function openPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

/** ⌘K / Ctrl+K / "/" — jump anywhere, switch language, toggle theme, copy email. */
export function CommandPalette({ items, placeholder, empty }: { items: PaletteItem[]; placeholder: string; empty: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    restoreFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        restoreFocus.current = document.activeElement as HTMLElement;
        setOpen((value) => !value);
      }
    };
    const onOpen = () => {
      restoreFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => `${item.label} ${item.hint ?? ""} ${item.group}`.toLowerCase().includes(q));
  }, [items, query]);

  const run = (item: PaletteItem) => {
    close();
    if (item.href) {
      if (item.href.startsWith("#")) {
        document.getElementById(item.href.slice(1))?.scrollIntoView({ block: "start" });
        history.replaceState(null, "", item.href);
      } else window.location.href = item.href;
    } else if (item.action === "theme") toggleMode();
    else if (item.action === "arcade") toggleArcade();
    else if (item.action === "copy" && item.payload) void copyText(item.payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={placeholder}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-card border border-line bg-elev shadow-2xl shadow-black/25"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="text-ink-3" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") close();
              else if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, filtered.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (event.key === "Enter" && filtered[active]) run(filtered[active]);
            }}
            placeholder={placeholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={filtered[active] ? `palette-${filtered[active].id}` : undefined}
            className="h-14 w-full bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-ink-3"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[0.65rem] text-ink-3 sm:block">esc</kbd>
        </div>
        <ul id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-3">{empty}</li>}
          {filtered.map((item, index) => {
            const Icon = ICONS[item.icon ?? "go"];
            const showGroup = index === 0 || filtered[index - 1].group !== item.group;
            return (
              <li key={item.id} role="presentation">
                {showGroup && <p className="label px-3 pb-1 pt-3 text-[0.6rem] text-ink-3">{item.group}</p>}
                <div
                  id={`palette-${item.id}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseMove={() => setActive(index)}
                  onClick={() => run(item)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${index === active ? "bg-accent-soft text-ink" : "text-ink-2"}`}
                >
                  <Icon size={15} className={index === active ? "text-accent-text" : "text-ink-3"} aria-hidden />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="truncate text-xs text-ink-3">{item.hint}</span>}
                  {index === active && <CornerDownLeft size={13} className="text-ink-3" aria-hidden />}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2 border-t border-line px-4 py-2 text-[0.7rem] text-ink-3">
          <Command size={12} aria-hidden /> K
        </div>
      </div>
    </div>
  );
}
