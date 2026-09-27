import type { CSSProperties } from "react";
import type { Theme, ThemePreset } from "./schema";

export const PRESET_INFO: Record<ThemePreset, { label: string; description: string; swatch: [string, string, string] }> = {
  editorial: {
    label: "Editorial",
    description: "Warm paper, serif headlines, calm and recruiter-friendly.",
    swatch: ["#f6f4ef", "#17171a", "#2f5bea"],
  },
  midnight: {
    label: "Midnight",
    description: "Cool, modern sans-serif. Dark-first with crisp contrast.",
    swatch: ["#0b0d14", "#e8ebf5", "#7c9cff"],
  },
  arcade: {
    label: "Arcade",
    description: "Pixel labels, neon accents, CRT scanlines. For the game dev in you.",
    swatch: ["#0d0b1a", "#f5f3ff", "#ff3cac"],
  },
  terminal: {
    label: "Terminal",
    description: "Monospace everything. Reads like a well-kept README.",
    swatch: ["#0a0f0a", "#d6f5d6", "#39d353"],
  },
};

export const ACCENT_SWATCHES: { name: string; value: string }[] = [
  { name: "Registan lapis", value: "#2f5bea" },
  { name: "Samarkand turquoise", value: "#0f9aa8" },
  { name: "Emerald", value: "#12875a" },
  { name: "Saffron", value: "#d97706" },
  { name: "Pomegranate", value: "#d23a3a" },
  { name: "Arcade pink", value: "#ff3cac" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Ink", value: "#1f2937" },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]) {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Readable text color on top of the accent. */
export function accentInk(accent: string): string {
  const rgb = hexToRgb(accent);
  if (!rgb) return "#ffffff";
  return luminance(rgb) > 0.45 ? "#111111" : "#ffffff";
}

export function isHexColor(value: string) {
  return hexToRgb(value) !== null;
}

/** Attributes + CSS variables applied to <html> (site) or the preview root. */
export function themeAttributes(theme: Theme): { "data-theme": ThemePreset; "data-radius": string; "data-motion": string; style: CSSProperties } {
  const accent = isHexColor(theme.accent) ? theme.accent : "#2f5bea";
  return {
    "data-theme": theme.preset,
    "data-radius": theme.radius,
    "data-motion": theme.motion ? "on" : "off",
    style: { "--accent": accent, "--accent-ink": accentInk(accent) } as CSSProperties,
  };
}

/**
 * Runs before paint so the page never flashes the wrong color scheme.
 * Viewer choice (localStorage) wins over the owner's default; "system" follows the OS.
 */
export function themeInitScript(defaultMode: Theme["mode"]): string {
  return `(function(){try{var d=${JSON.stringify(defaultMode)};var s=localStorage.getItem('pf-mode');var m=s||d;if(m==='system'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-mode',m)}catch(e){document.documentElement.setAttribute('data-mode','light')}})();`;
}
