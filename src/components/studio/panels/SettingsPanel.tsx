"use client";

import { LOCALES, LOCALE_LABELS, type Locale, type Settings } from "@/lib/content/schema";
import { t } from "@/lib/content/i18n";
import { update, useStudio } from "@/lib/studio/store";
import { Card, Field, Input, PanelHeader, SectionTitle, Select, Toggle } from "../ui";
import { DragHandle, LText, SortableList } from "../fields";

export function SettingsPanel() {
  const doc = useStudio((s) => s.doc)!;
  const s = doc.settings;
  const set = (recipe: (s: Settings) => void, key?: string) => update((d) => recipe(d.settings), key ? `settings:${key}` : undefined);

  // Résumé order: saved order first, then any remaining eligible sections.
  const eligible = doc.sections.filter((x) => x.kind !== "text" && x.kind !== "timeline");
  const ordered = [
    ...s.resume.order.map((id) => eligible.find((x) => x.id === id)).filter((x): x is (typeof eligible)[number] => Boolean(x)),
    ...eligible.filter((x) => !s.resume.order.includes(x.id)),
  ];

  return (
    <div>
      <PanelHeader eyebrow="Settings" title="Site & résumé" />

      <SectionTitle>Website</SectionTitle>
      <Card className="space-y-4 p-5">
        <Field label="Site URL" hint="Your live address (e.g. https://asadkhon.dev). Used for the résumé QR code, link previews and the sitemap. On Vercel the project URL is used until you set this.">
          <Input value={s.siteUrl} placeholder="https://…" className="font-mono" onChange={(e) => set((x) => void (x.siteUrl = e.target.value.trim()), "siteUrl")} />
        </Field>
        <Field label="Source code URL" hint="Shown in the footer as “Built with my own Portfolio Studio”. Leave empty to hide.">
          <Input value={s.sourceUrl} placeholder="https://github.com/…" className="font-mono" onChange={(e) => set((x) => void (x.sourceUrl = e.target.value.trim()), "sourceUrl")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Languages on the site">
            <div className="flex flex-wrap gap-4 pt-1">
              {LOCALES.map((l) => (
                <label key={l} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="accent-[var(--accent)]"
                    checked={s.locales.includes(l)}
                    disabled={l === s.defaultLocale}
                    onChange={(e) => set((x) => void (x.locales = e.target.checked ? [...x.locales, l] : x.locales.filter((y) => y !== l)))}
                  />
                  {LOCALE_LABELS[l].english}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Default language" hint="Where visitors without a matching browser language land.">
            <Select value={s.defaultLocale} onChange={(e) => set((x) => void (x.defaultLocale = e.target.value as Locale))}>
              {s.locales.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l].english}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <LText label="Search & link-preview title" value={s.seo.title} onChange={(v) => set((x) => void (x.seo.title = v), "seoTitle")} />
        <LText label="Search & link-preview description" multiline rows={2} value={s.seo.description} onChange={(v) => set((x) => void (x.seo.description = v), "seoDesc")} />
        <LText label="Footer text" value={s.footer} onChange={(v) => set((x) => void (x.footer = v), "footer")} />
        <Toggle checked={s.showLastUpdated} onChange={(v) => set((x) => void (x.showLastUpdated = v))} label="Show “Last updated” in the footer" hint="Signals that the portfolio is actively maintained." />
      </Card>

      <SectionTitle>Résumé</SectionTitle>
      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paper size">
            <Select value={s.resume.paper} onChange={(e) => set((x) => void (x.resume.paper = e.target.value as "a4" | "letter"))}>
              <option value="a4">A4 (Uzbekistan, Europe, most of the world)</option>
              <option value="letter">US Letter</option>
            </Select>
          </Field>
          <div className="space-y-3 pt-1">
            <Toggle checked={s.resume.showSummary} onChange={(v) => set((x) => void (x.resume.showSummary = v))} label="Summary paragraph" />
            <Toggle checked={s.resume.showPhoto} onChange={(v) => set((x) => void (x.resume.showPhoto = v))} label="Photo by default" hint="Common in Uzbekistan & CIS; usually left off for US/UK." />
            <Toggle checked={s.resume.showQr} onChange={(v) => set((x) => void (x.resume.showQr = v))} label="QR code to your portfolio" />
          </div>
        </div>
        <Field label="Section order on the résumé" hint="Recent graduates usually lead with Education; experienced hires with Experience. Hide sections from the résumé in each section's settings.">
          <SortableList
            items={ordered}
            onReorder={(items) => set((x) => void (x.resume.order = items.map((i) => i.id)))}
            render={(section, _i, controls) => (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-elev px-2 py-1.5">
                <DragHandle controls={controls} />
                <span className="flex-1 text-sm text-ink">{t(section.title, "en")}</span>
                {(section.hidden || section.hideOnResume) && <span className="text-xs text-ink-3">not on résumé</span>}
              </div>
            )}
          />
        </Field>
      </Card>
    </div>
  );
}
