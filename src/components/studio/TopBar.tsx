"use client";

import { Check, CircleAlert, CloudUpload, ExternalLink, Loader2, PanelRight, Redo2, Search, Undo2 } from "lucide-react";
import { initials } from "@/lib/content/derive";
import { redo, saveNow, saveVaultNow, go, setPreview, undo, useStudio, type SaveState } from "@/lib/studio/store";
import { statsFor } from "@/lib/studio/derived";
import { Button, cx } from "./ui";
import { LocaleSwitch } from "./fields";
import { openJump } from "./StudioJump";

function worst(a: SaveState, b: SaveState): SaveState {
  const rank = { conflict: 5, error: 4, saving: 3, dirty: 2, saved: 1 };
  return rank[a.state] >= rank[b.state] ? a : b;
}

function SaveIndicator() {
  const save = useStudio((s) => s.save);
  const vaultSave = useStudio((s) => s.vaultSave);
  const state = worst(save, vaultSave);
  const map = {
    saved: { icon: <Check size={13} />, text: "Saved", cls: "text-ink-3" },
    dirty: { icon: <span className="size-1.5 rounded-full bg-warn" />, text: "Editing…", cls: "text-ink-3" },
    saving: { icon: <Loader2 size={13} className="animate-spin" />, text: "Saving…", cls: "text-ink-3" },
    error: { icon: <CircleAlert size={13} />, text: "Save failed — retry", cls: "text-bad" },
    conflict: { icon: <CircleAlert size={13} />, text: "File changed on disk", cls: "text-bad" },
  }[state.state];
  return (
    <button
      type="button"
      title={state.error ?? "Changes save to content/ automatically"}
      onClick={() => (void saveNow(), void saveVaultNow())}
      className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-sunken", map.cls)}
    >
      {map.icon}
      {map.text}
    </button>
  );
}

export function TopBar() {
  const doc = useStudio((s) => s.doc)!;
  const canUndo = useStudio((s) => s.past.length > 0);
  const canRedo = useStudio((s) => s.future.length > 0);
  const previewOpen = useStudio((s) => s.preview.open);
  const locale = useStudio((s) => s.editLocale);
  const stats = statsFor(doc);

  return (
    <header className="flex h-14 items-center gap-3 border-b border-line bg-elev px-3">
      <button type="button" onClick={() => go({ type: "home" })} className="flex items-center gap-2.5 pr-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-ink font-display text-sm text-bg">{initials(doc.profile.name.en ?? "")}</span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-sm font-semibold text-ink">Portfolio Studio</span>
          <span className="block text-[0.68rem] text-ink-3">localhost · only you</span>
        </span>
      </button>

      <button
        type="button"
        onClick={openJump}
        className="hidden h-8 min-w-[12rem] items-center gap-2 rounded-lg border border-line bg-bg px-2.5 text-xs text-ink-3 hover:border-line-strong lg:flex"
      >
        <Search size={13} /> Jump to…
        <kbd className="ml-auto font-mono text-[0.65rem]">⌘K</kbd>
      </button>

      <div className="mx-auto">
        <LocaleSwitch stats={stats} />
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)">
          <Undo2 size={15} />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
          <Redo2 size={15} />
        </Button>
        <SaveIndicator />
        <Button variant={previewOpen ? "secondary" : "ghost"} size="icon" onClick={() => setPreview({ open: !previewOpen })} aria-label="Toggle preview" title="Preview (⌘\)">
          <PanelRight size={15} />
        </Button>
        <a
          href={`/${locale}`}
          target="_blank"
          rel="noreferrer"
          className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-ink-2 hover:bg-sunken hover:text-ink sm:inline-flex"
        >
          <ExternalLink size={14} /> Site
        </a>
        <Button variant="accent" onClick={() => go({ type: "publish" })}>
          <CloudUpload size={15} /> Publish
        </Button>
      </div>
    </header>
  );
}
