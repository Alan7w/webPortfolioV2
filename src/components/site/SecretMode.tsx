"use client";

import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

const SEQUENCE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const EVENT = "pf:arcade";

/** Flip the page into the arcade preset (and back). Also reachable from the command palette. */
export function toggleArcade() {
  const root = document.documentElement;
  const active = root.getAttribute("data-theme") === "arcade" && root.dataset.prevTheme !== undefined;
  if (active) {
    root.setAttribute("data-theme", root.dataset.prevTheme || "editorial");
    root.setAttribute("data-mode", root.dataset.prevMode || "light");
    delete root.dataset.prevTheme;
    delete root.dataset.prevMode;
  } else {
    root.dataset.prevTheme = root.getAttribute("data-theme") ?? "editorial";
    root.dataset.prevMode = root.getAttribute("data-mode") ?? "light";
    root.setAttribute("data-theme", "arcade");
    root.setAttribute("data-mode", "dark");
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: !active }));
}

export function SecretMode({ enabled, title, onText, offText }: { enabled: boolean; title: string; onText: string; offText: string }) {
  const [toast, setToast] = useState<{ on: boolean; key: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let position = 0;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      position = key === SEQUENCE[position] ? position + 1 : key === SEQUENCE[0] ? 1 : 0;
      if (position === SEQUENCE.length) {
        position = 0;
        toggleArcade();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  useEffect(() => {
    const onToggle = (event: Event) => setToast({ on: (event as CustomEvent<boolean>).detail, key: Date.now() });
    window.addEventListener(EVENT, onToggle);
    return () => window.removeEventListener(EVENT, onToggle);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  return (
    <div role="status" className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
      <div
        key={toast.key}
        className="flex max-w-md animate-[toast-in_.35s_ease-out] items-center gap-4 rounded-card border border-accent/60 bg-elev px-5 py-4 shadow-2xl shadow-black/20"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-ink">
          <Trophy size={22} aria-hidden />
        </span>
        <div>
          <p className="font-[family-name:var(--font-pixel)] text-[0.62rem] uppercase leading-5 tracking-wide text-accent-text">{title}</p>
          <p className="text-sm text-ink-2">{toast.on ? onText : offText}</p>
        </div>
      </div>
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
