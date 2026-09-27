"use client";

import { CloudUpload, ExternalLink, GitBranch, History, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { commitMessage, diffPortfolio, type Change } from "@/lib/content/diff";
import { PortfolioSchema, type Portfolio } from "@/lib/content/schema";
import { replaceDoc, saveNow, toast, useStudio } from "@/lib/studio/store";
import { Badge, Button, Card, cx, Empty, Input, PanelHeader, SectionTitle, Toggle } from "../ui";

export interface GitStatus {
  isRepo: boolean;
  branch?: string;
  remote?: string;
  hasUpstream?: boolean;
  ahead?: number;
  behind?: number;
  changes?: { status: string; path: string }[];
  otherChanges?: number;
  published?: unknown;
  last?: { sha: string; date: string; subject: string } | null;
}

export function usePublishedDiff(status: GitStatus | null, doc: Portfolio | null): Change[] {
  return useMemo(() => {
    if (!status?.isRepo || !doc) return [];
    let published: Portfolio | null = null;
    try {
      published = status.published ? PortfolioSchema.parse(status.published) : null;
    } catch {
      published = null;
    }
    return diffPortfolio(published, doc);
  }, [status, doc]);
}

export async function fetchGitStatus(): Promise<GitStatus> {
  const res = await fetch("/api/studio/git");
  return res.json();
}

async function loadPublishState() {
  await saveNow();
  const [status, history] = await Promise.all([
    fetchGitStatus(),
    fetch("/api/studio/git?action=history")
      .then((r) => r.json())
      .then((h) => (h.commits ?? []) as { sha: string; date: string; author: string; subject: string }[]),
  ]);
  return { status, history };
}

const KIND_TONE = { added: "ok", removed: "bad", changed: "accent", moved: "neutral" } as const;

function repoUrl(remote?: string) {
  if (!remote) return "";
  const m = /github\.com[:/](.+?)(\.git)?$/.exec(remote);
  return m ? `https://github.com/${m[1]}` : "";
}

export function PublishPanel() {
  const doc = useStudio((s) => s.doc);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [history, setHistory] = useState<{ sha: string; date: string; author: string; subject: string }[]>([]);
  const [message, setMessage] = useState("");
  const [push, setPush] = useState(true);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<{ ok: boolean; text: string } | null>(null);
  const changes = usePublishedDiff(status, doc);

  const refresh = useCallback(
    () =>
      loadPublishState().then(({ status: s, history: h }) => {
        setStatus(s);
        setHistory(h);
      }),
    [],
  );

  useEffect(() => {
    let alive = true;
    loadPublishState().then(({ status: s, history: h }) => {
      if (!alive) return;
      setStatus(s);
      setHistory(h);
    });
    return () => {
      alive = false;
    };
  }, []);

  const publish = async (pushOnly = false) => {
    setBusy(true);
    setOutput(null);
    try {
      await saveNow();
      const res = await fetch("/api/studio/git", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: message.trim() || commitMessage(changes), push: pushOnly || push, pushOnly }),
      });
      const data = await res.json();
      setOutput({ ok: data.ok, text: data.ok ? data.log || "Done." : data.error });
      if (data.ok) {
        toast(pushOnly || push ? "Published and pushed — your host will redeploy in a minute" : "Committed locally");
        setMessage("");
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const restore = async (sha: string, date: string) => {
    const res = await fetch(`/api/studio/git?action=show&sha=${sha}`);
    const data = await res.json();
    if (!res.ok) return toast(data.error ?? "Couldn’t load that version");
    try {
      replaceDoc(PortfolioSchema.parse(data.content), `Restored the version from ${new Date(date).toLocaleString()}`);
    } catch {
      toast("That version doesn’t match the current schema");
    }
  };

  if (!status) return <PanelHeader eyebrow="Publish" title="Loading git status…" />;
  if (!status.isRepo) return <Empty>This folder isn’t a git repository. Run <code>git init</code> and connect it to GitHub to publish.</Empty>;

  const github = repoUrl(status.remote);
  const fileChanges = status.changes ?? [];

  return (
    <div>
      <PanelHeader
        eyebrow="Publish"
        title="Ship your changes"
        description="Your edits are already saved on this computer. Publishing commits them to git; pushing to GitHub lets your host (e.g. Vercel) redeploy the live site."
        actions={
          <Button variant="ghost" onClick={() => void refresh()}>
            <RefreshCw size={14} /> Refresh
          </Button>
        }
      />

      <Card className="grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-3">Branch</p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-sm text-ink">
            <GitBranch size={14} /> {status.branch}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-3">Remote</p>
          {github ? (
            <a href={github} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 truncate text-sm text-accent-text hover:underline">
              {github.replace("https://github.com/", "")} <ExternalLink size={12} />
            </a>
          ) : (
            <p className="mt-1 text-sm text-ink-3">none</p>
          )}
        </div>
        <div>
          <p className="text-xs text-ink-3">Last published</p>
          <p className="mt-1 truncate text-sm text-ink">{status.last ? new Date(status.last.date).toLocaleString() : "never"}</p>
        </div>
        {(status.ahead ?? 0) > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn sm:col-span-3">
            <TriangleAlert size={15} /> {status.ahead} commit(s) not pushed yet.
            <Button size="sm" onClick={() => void publish(true)} disabled={busy}>
              Push now
            </Button>
          </div>
        )}
        {(status.behind ?? 0) > 0 && (
          <p className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad sm:col-span-3">
            GitHub has {status.behind} newer commit(s). Run <code>git pull</code> before publishing.
          </p>
        )}
      </Card>

      <SectionTitle aside={<Badge tone={changes.length ? "accent" : "ok"}>{changes.length ? `${changes.length} change${changes.length === 1 ? "" : "s"}` : "Up to date"}</Badge>}>Changes since last publish</SectionTitle>
      {changes.length === 0 && fileChanges.length === 0 ? (
        <Empty>Everything is published.</Empty>
      ) : (
        <Card className="divide-y divide-line">
          {changes.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <Badge tone={KIND_TONE[c.kind]}>{c.kind}</Badge>
              <span className="min-w-0 flex-1 truncate text-ink">{c.label}</span>
              {c.fields && <span className="truncate font-mono text-xs text-ink-3">{c.fields.join(", ")}</span>}
            </div>
          ))}
          {fileChanges
            .filter((f) => f.path.startsWith("public/uploads"))
            .map((f) => (
              <div key={f.path} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Badge>{f.status === "??" ? "new file" : f.status}</Badge>
                <span className="truncate font-mono text-xs text-ink-2">{f.path}</span>
              </div>
            ))}
        </Card>
      )}

      <Card className="mt-4 space-y-4 p-5">
        <Input value={message} placeholder={commitMessage(changes)} onChange={(e) => setMessage(e.target.value)} aria-label="Commit message" />
        <Toggle checked={push} onChange={setPush} label="Push to GitHub" hint={status.hasUpstream ? "Your host redeploys automatically after a push." : "First push will set up the upstream branch (git push -u origin HEAD)."} />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="accent" onClick={() => void publish()} disabled={busy || (!changes.length && !fileChanges.length)}>
            <CloudUpload size={15} /> {busy ? "Publishing…" : push ? "Publish & push" : "Commit"}
          </Button>
          <span className="text-xs text-ink-3">
            Only <code>content/portfolio.json</code> and <code>public/uploads/</code> are committed — never code, never the vault.
          </span>
        </div>
        {(status.otherChanges ?? 0) > 0 && (
          <p className="rounded-lg bg-sunken px-3 py-2 text-xs text-ink-2">
            {status.otherChanges} other file(s) (code, config…) have uncommitted changes. Publish leaves them alone — commit them with git when you’re ready.
          </p>
        )}
        {output && (
          <pre className={cx("max-h-56 overflow-auto whitespace-pre-wrap rounded-lg p-3 font-mono text-xs", output.ok ? "bg-ok/10 text-ink-2" : "bg-bad/10 text-bad")}>{output.text}</pre>
        )}
      </Card>

      <SectionTitle aside={<History size={14} className="text-ink-3" />}>History</SectionTitle>
      {history.length === 0 ? (
        <Empty>No published versions yet.</Empty>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-elev">
          {history.map((c) => (
            <li key={c.sha} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-20 shrink-0 font-mono text-xs text-ink-3">{c.sha.slice(0, 7)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{c.subject}</span>
                <span className="block text-xs text-ink-3">
                  {new Date(c.date).toLocaleString()} · {c.author}
                </span>
              </span>
              <Button size="sm" variant="ghost" onClick={() => void restore(c.sha, c.date)}>
                <RotateCcw size={13} /> Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-ink-3">Restoring loads that version into the editor (undoable). Publish again to make it live.</p>
    </div>
  );
}
