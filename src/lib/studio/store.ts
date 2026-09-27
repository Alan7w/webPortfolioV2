"use client";

import { produce, type Draft } from "immer";
import { create } from "zustand";
import type { Entry, Locale, Portfolio, PrivateVault, Section } from "@/lib/content/schema";
import type { LinkResult } from "@/lib/content/coach";

export type Panel =
  | { type: "home" }
  | { type: "profile" }
  | { type: "section"; sectionId: string }
  | { type: "theme" }
  | { type: "variants" }
  | { type: "coach" }
  | { type: "vault" }
  | { type: "obyektivka" }
  | { type: "publish" }
  | { type: "data" }
  | { type: "settings" };

export type SaveState = { state: "saved" | "dirty" | "saving" | "error" | "conflict"; error?: string; at?: number };
export type PreviewPage = "site" | "resume" | "obyektivka";

interface StudioState {
  status: "loading" | "ready" | "error";
  loadError?: string;
  doc: Portfolio | null;
  hash: string | null;
  vault: PrivateVault | null;
  vaultExists: boolean;
  past: Portfolio[];
  future: Portfolio[];
  lastKey: string | null;
  lastAt: number;
  save: SaveState;
  vaultSave: SaveState;
  conflict: { content: Portfolio; hash: string } | null;
  editLocale: Locale;
  panel: Panel;
  openEntryId: string | null;
  preview: { open: boolean; page: PreviewPage; device: "desktop" | "tablet" | "mobile"; variant: string };
  links: Record<string, LinkResult>;
  toast: { id: number; text: string; action?: { label: string; run: () => void } } | null;
}

export const useStudio = create<StudioState>(() => ({
  status: "loading",
  doc: null,
  hash: null,
  vault: null,
  vaultExists: false,
  past: [],
  future: [],
  lastKey: null,
  lastAt: 0,
  save: { state: "saved" },
  vaultSave: { state: "saved" },
  conflict: null,
  editLocale: "en",
  panel: { type: "home" },
  openEntryId: null,
  preview: { open: true, page: "site", device: "desktop", variant: "" },
  links: {},
  toast: null,
}));

const get = useStudio.getState;
const set = useStudio.setState;

/* ───────────────────────── Loading ───────────────────────── */

export async function loadStudio() {
  try {
    const [contentRes, vaultRes] = await Promise.all([fetch("/api/studio/content"), fetch("/api/studio/private")]);
    const content = await contentRes.json();
    if (!contentRes.ok) throw new Error(content.error ?? `Failed to load content (${contentRes.status})`);
    const vault = vaultRes.ok ? await vaultRes.json() : { vault: null, exists: false };
    set({ status: "ready", doc: content.content, hash: content.hash, vault: vault.vault, vaultExists: vault.exists });
  } catch (error) {
    set({ status: "error", loadError: (error as Error).message });
  }
}

/* ───────────────────────── Editing with undo ───────────────────────── */

const HISTORY_LIMIT = 150;

/**
 * Apply an edit. Edits sharing a `key` within ~1s (e.g. typing in one field) collapse into a
 * single undo step.
 */
export function update(recipe: (draft: Draft<Portfolio>) => void, key?: string) {
  const { doc, past, lastKey, lastAt } = get();
  if (!doc) return;
  const next = produce(doc, recipe);
  if (next === doc) return;
  const now = Date.now();
  const coalesce = Boolean(key) && key === lastKey && now - lastAt < 1200;
  set({
    doc: next,
    past: coalesce ? past : [...past.slice(-HISTORY_LIMIT + 1), doc],
    future: [],
    lastKey: key ?? null,
    lastAt: now,
    save: { state: "dirty" },
  });
}

export function replaceDoc(next: Portfolio, message?: string) {
  const { doc, past } = get();
  set({ doc: next, past: doc ? [...past.slice(-HISTORY_LIMIT + 1), doc] : past, future: [], lastKey: null, save: { state: "dirty" } });
  if (message) toast(message, { label: "Undo", run: undo });
}

export function undo() {
  const { doc, past, future } = get();
  if (!doc || !past.length) return;
  set({ doc: past[past.length - 1], past: past.slice(0, -1), future: [doc, ...future], lastKey: null, save: { state: "dirty" } });
}

export function redo() {
  const { doc, past, future } = get();
  if (!doc || !future.length) return;
  set({ doc: future[0], past: [...past, doc], future: future.slice(1), lastKey: null, save: { state: "dirty" } });
}

export function updateVault(recipe: (draft: Draft<PrivateVault>) => void) {
  const { vault } = get();
  if (!vault) return;
  const next = produce(vault, recipe);
  if (next !== vault) set({ vault: next, vaultSave: { state: "dirty" } });
}

/* ───────────────────────── Saving ───────────────────────── */

let saving: Promise<void> | null = null;

export async function saveNow(force = false) {
  if (saving) await saving;
  const { doc, hash, save } = get();
  if (!doc || (save.state !== "dirty" && save.state !== "error" && !force)) return;
  set({ save: { state: "saving" } });
  saving = (async () => {
    try {
      const res = await fetch("/api/studio/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: doc, baseHash: hash, force }),
      });
      const data = await res.json();
      if (res.status === 409) {
        set({ save: { state: "conflict" }, conflict: { content: data.content, hash: data.hash } });
        return;
      }
      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status})`);
      // Only mark clean if nothing changed while the request was in flight.
      const current = get().doc;
      const stamped = current ? produce(current, (d) => void (d.meta.updatedAt = data.updatedAt)) : current;
      set({
        hash: data.hash,
        doc: stamped,
        conflict: null,
        save: current === doc ? { state: "saved", at: Date.now() } : { state: "dirty" },
      });
    } catch (error) {
      set({ save: { state: "error", error: (error as Error).message } });
    }
  })();
  await saving;
  saving = null;
}

export async function saveVaultNow() {
  const { vault, vaultSave } = get();
  if (!vault || vaultSave.state === "saved") return;
  set({ vaultSave: { state: "saving" } });
  try {
    const res = await fetch("/api/studio/private", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ vault }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Save failed");
    set({ vaultSave: get().vault === vault ? { state: "saved", at: Date.now() } : { state: "dirty" }, vaultExists: true });
  } catch (error) {
    set({ vaultSave: { state: "error", error: (error as Error).message } });
  }
}

/** Conflict resolution: take the file on disk, or overwrite it with the Studio's version. */
export function resolveConflict(choice: "theirs" | "mine") {
  const { conflict } = get();
  if (!conflict) return;
  if (choice === "theirs") {
    set({ doc: conflict.content, hash: conflict.hash, conflict: null, past: [], future: [], save: { state: "saved", at: Date.now() } });
  } else {
    set({ hash: conflict.hash, conflict: null, save: { state: "dirty" } });
    void saveNow(true);
  }
}

/* ───────────────────────── Navigation & UI ───────────────────────── */

export function go(panel: Panel, openEntryId: string | null = null) {
  set({ panel, openEntryId });
}

/** Navigate to whatever an issue/review item points at. */
export function jumpTo(targetId: string) {
  const { doc } = get();
  if (!doc) return;
  if (["profile"].includes(targetId)) return go({ type: "profile" });
  if (targetId === "settings" || targetId === "resume") return go({ type: "settings" });
  if (targetId === "variants") return go({ type: "variants" });
  if (targetId === "vault") return go({ type: "vault" });
  if (targetId === "obyektivka") return go({ type: "obyektivka" });
  if (targetId === "theme") return go({ type: "theme" });
  const section = doc.sections.find((s) => s.id === targetId);
  if (section) return go({ type: "section", sectionId: section.id });
  const found = findEntry(doc, targetId);
  if (found) go({ type: "section", sectionId: found.section.id }, targetId);
}

export function setPreview(patch: Partial<StudioState["preview"]>) {
  set({ preview: { ...get().preview, ...patch } });
}

let toastTimer: number | undefined;
export function toast(text: string, action?: { label: string; run: () => void }) {
  window.clearTimeout(toastTimer);
  set({ toast: { id: Date.now(), text, action } });
  toastTimer = window.setTimeout(() => set({ toast: null }), action ? 6000 : 3000);
}

/* ───────────────────────── Lookups ───────────────────────── */

export function findEntry(doc: Portfolio, entryId: string): { section: Section; entry: Entry; sIndex: number; eIndex: number } | null {
  for (let sIndex = 0; sIndex < doc.sections.length; sIndex++) {
    const section = doc.sections[sIndex];
    const eIndex = section.items.findIndex((e) => e.id === entryId);
    if (eIndex !== -1) return { section, entry: section.items[eIndex], sIndex, eIndex };
  }
  return null;
}

/** Mutate a single entry inside a draft by id. */
export function withEntry(draft: Draft<Portfolio>, entryId: string, fn: (entry: Draft<Entry>) => void) {
  for (const section of draft.sections) {
    const entry = section.items.find((e) => e.id === entryId);
    if (entry) {
      fn(entry);
      return;
    }
  }
}
