"use client";

import { ClipboardCopy, Download, FileJson, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { BrandIcon } from "@/components/shared/Icons";
import { copyText } from "@/components/site/CopyButton";
import { fromJsonResume, portfolioFromJsonResume, toJsonResume } from "@/lib/content/jsonresume";
import { EntrySchema, LOCALES, LOCALE_LABELS, PortfolioSchema, type Locale, type Portfolio } from "@/lib/content/schema";
import { resumeSections, uid } from "@/lib/content/derive";
import { formatRange } from "@/lib/content/dates";
import { t } from "@/lib/content/i18n";
import { replaceDoc, toast, update, useStudio } from "@/lib/studio/store";
import { Badge, Button, Card, cx, Input, PanelHeader, SectionTitle, Select } from "../ui";
import { downloadJson } from "./VaultPanel";

/** Plain-text résumé for job portals that want pasted text (hh.uz, government forms…). */
export function plainTextResume(p: Portfolio, locale: Locale): string {
  const L = (v: Parameters<typeof t>[0]) => t(v, locale).replace(/\*\*|`/g, "");
  const lines: string[] = [L(p.profile.name).toUpperCase(), L(p.profile.headline)];
  lines.push(p.profile.contacts.filter((c) => c.onResume).map((c) => c.value).join(" | "), "", L(p.profile.summary));
  for (const s of resumeSections(p)) {
    lines.push("", L(s.title).toUpperCase());
    for (const e of s.items) {
      if (s.kind === "skills") {
        lines.push(`${L(e.title)}: ${e.tags.join(", ")}`);
        continue;
      }
      const head = [L(e.title), L(e.subtitle)].filter(Boolean).join(" — ");
      const range = formatRange(e.start, e.end, locale);
      lines.push(range ? `${head} (${range})` : head);
      for (const b of e.bullets) if (L(b.text)) lines.push(`  • ${L(b.text)}`);
    }
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

interface Repo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  created_at: string;
  pushed_at: string;
  stargazers_count: number;
}

const pretty = (name: string) =>
  name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function DataPanel() {
  const doc = useStudio((s) => s.doc)!;
  const [exportLocale, setExportLocale] = useState<Locale>("en");
  const [pending, setPending] = useState<{ kind: "jsonresume" | "portfolio"; data: unknown; name: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const githubContact = doc.profile.contacts.find((c) => c.kind === "github")?.value ?? "";
  const [user, setUser] = useState(githubContact.split("/").filter(Boolean).pop() ?? "");
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const existingUrls = new Set(doc.sections.flatMap((s) => s.items.flatMap((i) => i.links.map((l) => l.url.replace(/\/$/, "").toLowerCase()))));

  const loadRepos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`, { headers: { Accept: "application/vnd.github+json" } });
      if (!res.ok) throw new Error(res.status === 404 ? "User not found" : `GitHub said ${res.status}`);
      setRepos(((await res.json()) as Repo[]).filter((r) => !r.fork));
      setPicked(new Set());
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const importRepos = () => {
    const target = doc.sections.find((s) => s.kind === "projects");
    if (!target || !repos) return toast("Add a Projects section first");
    const entries = repos
      .filter((r) => picked.has(r.html_url))
      .map((r) =>
        EntrySchema.parse({
          id: uid("proj"),
          title: { en: pretty(r.name) },
          summary: { en: r.description ?? "" },
          start: r.created_at.slice(0, 7),
          tags: [r.language, ...(r.topics ?? [])].filter(Boolean),
          links: [
            ...(r.homepage ? [{ id: uid("l"), label: {}, url: r.homepage, kind: "live" }] : []),
            { id: uid("l"), label: {}, url: r.html_url, kind: "code" },
          ],
        }),
      );
    update((d) => void d.sections.find((s) => s.id === target.id)!.items.push(...entries));
    toast(`Added ${entries.length} project(s) to “${t(target.title, "en")}” — add descriptions and screenshots next`);
    setPicked(new Set());
  };

  const onFile = async (f?: File | null) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data && typeof data === "object" && "basics" in data) setPending({ kind: "jsonresume", data, name: f.name });
      else {
        PortfolioSchema.parse(data);
        setPending({ kind: "portfolio", data, name: f.name });
      }
    } catch (e) {
      toast(`Couldn’t read ${f.name}: ${(e as Error).message.slice(0, 90)}`);
    }
  };

  return (
    <div>
      <PanelHeader eyebrow="Data" title="Import & export" description="Your content is yours: take it anywhere, bring it from anywhere." />

      <SectionTitle>Export</SectionTitle>
      <Card className="flex flex-wrap items-center gap-3 p-5">
        <Button onClick={() => downloadJson("portfolio.json", doc)}>
          <Download size={14} /> portfolio.json
        </Button>
        <div className="flex items-center gap-2">
          <Select value={exportLocale} onChange={(e) => setExportLocale(e.target.value as Locale)} className="h-9 w-auto">
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l].english}
              </option>
            ))}
          </Select>
          <Button onClick={() => downloadJson(`resume.${exportLocale}.json`, toJsonResume(doc, exportLocale))}>
            <FileJson size={14} /> JSON Resume
          </Button>
          <Button
            onClick={async () => {
              await copyText(plainTextResume(doc, exportLocale));
              toast("Plain-text résumé copied — paste it into any job portal");
            }}
          >
            <ClipboardCopy size={14} /> Copy as plain text
          </Button>
        </div>
      </Card>

      <SectionTitle>Import a file</SectionTitle>
      <Card
        className="p-5"
      >
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files?.[0]);
          }}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong px-4 py-8 text-center"
        >
          <Upload size={20} className="text-ink-3" />
          <p className="text-sm text-ink-2">
            Drop a <strong>JSON Resume</strong> (from LinkedIn exporters, other builders…) or a <strong>portfolio.json</strong> backup
          </p>
          <Button size="sm" onClick={() => file.current?.click()}>
            Choose file
          </Button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        {pending && (
          <div className="mt-4 rounded-lg bg-accent-soft p-4">
            <p className="text-sm text-ink">
              <strong>{pending.name}</strong> — {pending.kind === "jsonresume" ? "JSON Resume" : "Portfolio backup"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pending.kind === "jsonresume" && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const { sections } = fromJsonResume(pending.data);
                    update((d) => void d.sections.push(...sections));
                    toast(`Added ${sections.length} section(s) — review and merge them into yours`);
                    setPending(null);
                  }}
                >
                  Add as new sections
                </Button>
              )}
              <Button
                size="sm"
                variant={pending.kind === "portfolio" ? "primary" : "secondary"}
                onClick={() => {
                  const next = pending.kind === "jsonresume" ? portfolioFromJsonResume(pending.data, doc) : PortfolioSchema.parse(pending.data);
                  replaceDoc(next, "Replaced everything with the imported file");
                  setPending(null);
                }}
              >
                Replace everything
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      <SectionTitle>Import projects from GitHub</SectionTitle>
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-sunken">
            <BrandIcon name="github" />
          </span>
          <Input value={user} onChange={(e) => setUser(e.target.value.trim())} placeholder="GitHub username" className="w-56" />
          <Button onClick={() => void loadRepos()} disabled={!user || loading}>
            {loading ? "Loading…" : "Load repositories"}
          </Button>
          {repos && picked.size > 0 && (
            <Button variant="primary" onClick={importRepos}>
              Import {picked.size}
            </Button>
          )}
        </div>
        {repos && (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {repos.map((r) => {
              const imported = existingUrls.has(r.html_url.toLowerCase());
              return (
                <li key={r.html_url}>
                  <label className={cx("flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-sunken/60", imported && "opacity-60")}>
                    <input
                      type="checkbox"
                      className="mt-1 accent-[var(--accent)]"
                      checked={picked.has(r.html_url)}
                      onChange={(e) => {
                        const next = new Set(picked);
                        if (e.target.checked) next.add(r.html_url);
                        else next.delete(r.html_url);
                        setPicked(next);
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        {r.name}
                        {r.language && <Badge>{r.language}</Badge>}
                        {imported && <Badge tone="ok">already in portfolio</Badge>}
                      </span>
                      <span className="block truncate text-xs text-ink-3">{r.description ?? "No description"}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[0.65rem] text-ink-3">{r.pushed_at.slice(0, 10)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
