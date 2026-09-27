"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribe = (callback: () => void) => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => observer.disconnect();
};
const getMode = () => document.documentElement.getAttribute("data-mode") ?? "light";

export function setMode(mode: "light" | "dark") {
  document.documentElement.setAttribute("data-mode", mode);
  try {
    localStorage.setItem("pf-mode", mode);
  } catch {
    // Private mode / blocked storage: the choice just won't persist.
  }
}

export function toggleMode() {
  setMode(getMode() === "dark" ? "light" : "dark");
}

export function ThemeToggle({ label }: { label: string }) {
  const mode = useSyncExternalStore(subscribe, getMode, () => "light");
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-chip text-ink-2 transition hover:bg-sunken hover:text-ink"
    >
      {mode === "dark" ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
    </button>
  );
}
