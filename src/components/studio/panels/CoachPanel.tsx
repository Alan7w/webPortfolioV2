"use client";

import { ArrowRight, Check, CircleAlert, Info, Link2, Plus, RotateCcw, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { collectUrls, type Category, type Issue, type LinkResult } from "@/lib/content/coach";
import { uid } from "@/lib/content/derive";
import { jumpTo, toast, updateVault, useStudio } from "@/lib/studio/store";
import { healthScore, useIssues } from "@/lib/studio/derived";
import { Badge, Button, Card, cx, Input, PanelHeader, SectionTitle, Textarea } from "../ui";

const ICON = { error: CircleAlert, warn: TriangleAlert, info: Info };
const COLOR = { error: "text-bad", warn: "text-warn", info: "text-ink-3" };
const CATEGORIES: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "content", label: "Writing" },
  { value: "links", label: "Links" },
  { value: "resume", label: "Résumé" },
  { value: "translation", label: "Translation" },
  { value: "consistency", label: "Consistency" },
  { value: "profile", label: "Profile" },
  { value: "data", label: "Data" },
];

function IssueRow({ issue }: { issue: Issue }) {
  const Icon = ICON[issue.severity];
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <Icon size={16} className={cx("mt-0.5 shrink-0", COLOR[issue.severity])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">{issue.title}</p>
        {issue.detail && <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{issue.detail}</p>}
      </div>
      <Button size="sm" variant="ghost" onClick={() => jumpTo(issue.targetId)}>
        Fix <ArrowRight size={13} />
      </Button>
    </li>
  );
}

export function CoachPanel() {
  const doc = useStudio((s) => s.doc)!;
  const vault = useStudio((s) => s.vault);
  const links = useStudio((s) => s.links);
  const issues = useIssues();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [checking, setChecking] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [draft, setDraft] = useState({ title: "", detail: "" });

  const review = vault?.review ?? [];
  const openReview = review.filter((r) => r.status === "open");
  const doneReview = review.filter((r) => r.status !== "open");
  const shown = issues.filter((i) => filter === "all" || i.category === filter);
  const count = (s: Issue["severity"]) => issues.filter((i) => i.severity === s).length;
  const score = healthScore(issues, openReview.length);
  const checked = Object.keys(links).length;

  const checkLinks = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/studio/check-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls: collectUrls(doc) }),
      });
      const data = (await res.json()) as { results: ({ url: string } & LinkResult)[] };
      const map: Record<string, LinkResult> = {};
      for (const r of data.results) map[r.url] = { ok: r.ok, status: r.status, error: r.error };
      useStudio.setState({ links: map });
      const broken = data.results.filter((r) => !r.ok).length;
      toast(broken ? `${broken} of ${data.results.length} links are broken` : `All ${data.results.length} links work`);
    } catch {
      toast("Link check failed — are you online?");
    } finally {
      setChecking(false);
    }
  };

  const setStatus = (id: string, status: "open" | "resolved" | "dismissed") =>
    updateVault((v) => {
      const item = v.review.find((r) => r.id === id);
      if (item) item.status = status;
    });

  return (
    <div>
      <PanelHeader
        eyebrow="Quality"
        title="Coach"
        description="Your content, linted like code. Issues update as you type."
        actions={
          <Button onClick={checkLinks} disabled={checking}>
            <Link2 size={14} /> {checking ? "Checking…" : checked ? `Re-check ${checked} links` : "Check all links"}
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4 sm:col-span-1">
          <p className="text-xs text-ink-3">Health</p>
          <p className={cx("font-display text-4xl", score >= 85 ? "text-ok" : score >= 60 ? "text-warn" : "text-bad")}>{score}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
            <div className={cx("h-full rounded-full", score >= 85 ? "bg-ok" : score >= 60 ? "bg-warn" : "bg-bad")} style={{ width: `${score}%` }} />
          </div>
        </Card>
        {(
          [
            ["error", "Must fix"],
            ["warn", "Should fix"],
            ["info", "Suggestions"],
          ] as const
        ).map(([sev, label]) => {
          const Icon = ICON[sev];
          return (
            <Card key={sev} className="p-4">
              <p className="flex items-center gap-1.5 text-xs text-ink-3">
                <Icon size={13} className={COLOR[sev]} /> {label}
              </p>
              <p className="font-display text-4xl text-ink">{count(sev)}</p>
            </Card>
          );
        })}
      </div>

      <SectionTitle aside={<Badge tone={openReview.length ? "warn" : "ok"}>{openReview.length} open</Badge>}>Review queue</SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-ink-3">Things to confirm or add — from comparing your résumé, Obyektivka and GitHub. Stored privately in the vault.</p>
      <div className="space-y-2">
        {openReview.map((item) => {
          const Icon = ICON[item.severity];
          return (
            <Card key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <Icon size={16} className={cx("mt-0.5 shrink-0", COLOR[item.severity])} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  {item.detail && <p className="mt-1 text-sm leading-relaxed text-ink-2">{item.detail}</p>}
                  {item.source && <p className="mt-1.5 text-[0.7rem] text-ink-3">{item.source}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 pl-7">
                {item.targetId && (
                  <Button size="sm" onClick={() => jumpTo(item.targetId)}>
                    Go there <ArrowRight size={13} />
                  </Button>
                )}
                <Button size="sm" variant="primary" onClick={() => setStatus(item.id, "resolved")}>
                  <Check size={13} /> Resolved
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setStatus(item.id, "dismissed")}>
                  <X size={13} /> Dismiss
                </Button>
              </div>
            </Card>
          );
        })}
        {!openReview.length && <p className="rounded-xl border border-dashed border-line-strong p-4 text-center text-sm text-ink-3">Queue is clear. 🎉</p>}
      </div>

      <details className="mt-3 rounded-xl border border-line bg-elev p-4" open={false}>
        <summary className="cursor-pointer text-sm text-ink-2">Add a note to the queue</summary>
        <div className="mt-3 space-y-2">
          <Input value={draft.title} placeholder="e.g. Ask manager for a reference letter" onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <Textarea rows={2} value={draft.detail} placeholder="Details (optional)" onChange={(e) => setDraft({ ...draft, detail: e.target.value })} />
          <Button
            size="sm"
            disabled={!draft.title.trim()}
            onClick={() => {
              updateVault((v) => void v.review.unshift({ id: uid("r"), title: draft.title.trim(), detail: draft.detail.trim(), targetId: "", severity: "info", status: "open", source: `Note · ${new Date().toISOString().slice(0, 10)}` }));
              setDraft({ title: "", detail: "" });
            }}
          >
            <Plus size={13} /> Add
          </Button>
        </div>
      </details>

      {doneReview.length > 0 && (
        <button type="button" className="mt-3 text-xs text-ink-3 hover:text-ink" onClick={() => setShowDone((v) => !v)}>
          {showDone ? "Hide" : "Show"} {doneReview.length} resolved / dismissed
        </button>
      )}
      {showDone && (
        <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-elev">
          {doneReview.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <Badge tone={item.status === "resolved" ? "ok" : "neutral"}>{item.status}</Badge>
              <span className="flex-1 truncate text-ink-2 line-through decoration-ink-3/40">{item.title}</span>
              <Button size="sm" variant="ghost" onClick={() => setStatus(item.id, "open")}>
                <RotateCcw size={12} /> Reopen
              </Button>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>Automatic checks</SectionTitle>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const n = c.value === "all" ? issues.length : issues.filter((i) => i.category === c.value).length;
          if (!n && c.value !== "all") return null;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilter(c.value)}
              className={cx("rounded-full border px-3 py-1 text-xs transition", filter === c.value ? "border-ink bg-ink text-bg" : "border-line text-ink-2 hover:border-line-strong")}
            >
              {c.label} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>
      {shown.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-elev">
          {shown.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-ink-3">Nothing to flag here.</p>
      )}
    </div>
  );
}
