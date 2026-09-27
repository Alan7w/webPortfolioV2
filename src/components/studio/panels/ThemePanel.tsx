"use client";

import { Check } from "lucide-react";
import { THEME_PRESETS, type Theme } from "@/lib/content/schema";
import { ACCENT_SWATCHES, accentInk, isHexColor, PRESET_INFO } from "@/lib/content/theme";
import { update, useStudio } from "@/lib/studio/store";
import { Card, cx, Input, PanelHeader, SectionTitle, Toggle } from "../ui";

function Choice<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-bg p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx("rounded-md px-3 py-1.5 text-sm transition", value === o.value ? "bg-ink text-bg" : "text-ink-2 hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ThemePanel() {
  const theme = useStudio((s) => s.doc!.theme);
  const set = (patch: Partial<Theme>, key?: string) => update((d) => void Object.assign(d.theme, patch), key);

  return (
    <div>
      <PanelHeader eyebrow="Appearance" title="Theme" description="Changes show instantly in the preview. Visitors can still flip light/dark for themselves." />

      <SectionTitle>Preset</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_PRESETS.map((preset) => {
          const info = PRESET_INFO[preset];
          const [bg, ink, accent] = info.swatch;
          const active = theme.preset === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => set({ preset })}
              aria-pressed={active}
              className={cx("overflow-hidden rounded-xl border text-left transition", active ? "border-accent ring-2 ring-accent/20" : "border-line hover:border-line-strong")}
            >
              <div className="flex h-24 items-end gap-2 p-4" style={{ background: bg }}>
                <span className="text-2xl font-semibold" style={{ color: ink, fontFamily: preset === "terminal" ? "var(--font-jetbrains)" : preset === "arcade" ? "var(--font-unbounded)" : preset === "midnight" ? "var(--font-manrope)" : "var(--font-source-serif)" }}>
                  Aa
                </span>
                <span className="mb-1.5 h-2 w-10 rounded-full" style={{ background: accent }} />
                {active && (
                  <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-accent text-accent-ink">
                    <Check size={14} />
                  </span>
                )}
              </div>
              <div className="bg-elev p-4">
                <p className="font-medium text-ink">{info.label}</p>
                <p className="mt-0.5 text-xs text-ink-3">{info.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <SectionTitle>Accent color</SectionTitle>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {ACCENT_SWATCHES.map((s) => (
            <button
              key={s.value}
              type="button"
              title={s.name}
              aria-label={s.name}
              onClick={() => set({ accent: s.value })}
              className={cx("flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-elev transition", theme.accent.toLowerCase() === s.value ? "ring-2 ring-ink" : "hover:scale-110")}
              style={{ background: s.value, color: accentInk(s.value) }}
            >
              {theme.accent.toLowerCase() === s.value && <Check size={15} />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={isHexColor(theme.accent) ? theme.accent : "#2f5bea"}
            onChange={(e) => set({ accent: e.target.value }, "theme:accent")}
            className="h-9 w-12 cursor-pointer rounded-lg border border-line bg-transparent"
            aria-label="Custom accent color"
          />
          <Input value={theme.accent} onChange={(e) => set({ accent: e.target.value.trim() }, "theme:accent")} className={cx("w-32 font-mono", !isHexColor(theme.accent) && "border-bad")} />
          <span className="text-xs text-ink-3">Default “Registan lapis” is inspired by the tilework of Samarkand.</span>
        </div>
      </Card>

      <SectionTitle>Details</SectionTitle>
      <Card className="space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-ink">Default color scheme</span>
          <Choice
            value={theme.mode}
            onChange={(mode) => set({ mode })}
            options={[
              { value: "system", label: "Follow system" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-ink">Corners</span>
          <Choice
            value={theme.radius}
            onChange={(radius) => set({ radius })}
            options={[
              { value: "sharp", label: "Sharp" },
              { value: "soft", label: "Soft" },
              { value: "round", label: "Round" },
            ]}
          />
        </div>
        <Toggle checked={theme.motion} onChange={(motion) => set({ motion })} label="Animations" hint="Pixel portrait, hover effects, smooth scrolling. Always off for visitors who prefer reduced motion." />
        <Toggle checked={theme.secrets} onChange={(secrets) => set({ secrets })} label="Easter egg" hint="↑ ↑ ↓ ↓ ← → ← → B A switches the site into arcade mode." />
      </Card>
    </div>
  );
}
