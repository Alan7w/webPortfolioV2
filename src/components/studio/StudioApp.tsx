"use client";

import { CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { go, loadStudio, redo, resolveConflict, saveNow, saveVaultNow, setPreview, undo, useStudio } from "@/lib/studio/store";
import { Button } from "./ui";
import { PreviewPane } from "./PreviewPane";
import { Sidebar } from "./Sidebar";
import { StudioJump, openJump } from "./StudioJump";
import { TopBar } from "./TopBar";
import { CoachPanel } from "./panels/CoachPanel";
import { DataPanel } from "./panels/DataPanel";
import { HomePanel } from "./panels/HomePanel";
import { ObyektivkaPanel } from "./panels/ObyektivkaPanel";
import { ProfilePanel } from "./panels/ProfilePanel";
import { PublishPanel } from "./panels/PublishPanel";
import { SectionPanel } from "./panels/SectionPanel";
import { SettingsPanel } from "./panels/SettingsPanel";
import { ThemePanel } from "./panels/ThemePanel";
import { VariantsPanel } from "./panels/VariantsPanel";
import { VaultPanel } from "./panels/VaultPanel";

function CurrentPanel() {
  const panel = useStudio((s) => s.panel);
  switch (panel.type) {
    case "profile":
      return <ProfilePanel />;
    case "section":
      return <SectionPanel key={panel.sectionId} sectionId={panel.sectionId} />;
    case "theme":
      return <ThemePanel />;
    case "variants":
      return <VariantsPanel />;
    case "coach":
      return <CoachPanel />;
    case "vault":
      return <VaultPanel />;
    case "obyektivka":
      return <ObyektivkaPanel />;
    case "publish":
      return <PublishPanel />;
    case "data":
      return <DataPanel />;
    case "settings":
      return <SettingsPanel />;
    default:
      return <HomePanel />;
  }
}

function Toast() {
  const toast = useStudio((s) => s.toast);
  if (!toast) return null;
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-4 rounded-xl bg-ink px-4 py-3 text-sm text-bg shadow-2xl">
      {toast.text}
      {toast.action && (
        <button
          type="button"
          className="font-semibold text-accent-soft underline-offset-2 hover:underline"
          onClick={() => {
            toast.action?.run();
            useStudio.setState({ toast: null });
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}

function ConflictDialog() {
  const conflict = useStudio((s) => s.conflict);
  if (!conflict) return null;
  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/30 p-4">
      <div role="alertdialog" aria-labelledby="conflict-title" className="max-w-md rounded-xl bg-elev p-6 shadow-2xl">
        <h2 id="conflict-title" className="flex items-center gap-2 font-semibold text-ink">
          <CircleAlert size={18} className="text-bad" /> content/portfolio.json changed on disk
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          Something else edited the file since the Studio loaded it — a manual edit, <code>git pull</code> or a second Studio tab. Choose which version to keep.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button onClick={() => resolveConflict("theirs")}>Load the file from disk</Button>
          <Button variant="danger" onClick={() => resolveConflict("mine")}>
            Overwrite with the Studio’s version
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StudioApp() {
  const status = useStudio((s) => s.status);
  const loadError = useStudio((s) => s.loadError);
  const panelKey = useStudio((s) => (s.panel.type === "section" ? `section:${s.panel.sectionId}` : s.panel.type));
  const mainRef = useRef<HTMLElement>(null);

  // A new panel starts at the top (entry jumps scroll themselves into view).
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [panelKey]);

  useEffect(() => {
    void loadStudio();
  }, []);

  // Autosave: debounce content and vault separately.
  useEffect(() => {
    let docTimer: number | undefined;
    let vaultTimer: number | undefined;
    const unsubscribe = useStudio.subscribe((state, prev) => {
      if (state.doc !== prev.doc && state.save.state === "dirty") {
        window.clearTimeout(docTimer);
        docTimer = window.setTimeout(() => void saveNow(), 700);
      }
      if (state.vault !== prev.vault && state.vaultSave.state === "dirty") {
        window.clearTimeout(vaultTimer);
        vaultTimer = window.setTimeout(() => void saveVaultNow(), 700);
      }
    });
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const { save, vaultSave } = useStudio.getState();
      if (["dirty", "saving", "error"].includes(save.state) || ["dirty", "saving", "error"].includes(vaultSave.state)) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      unsubscribe();
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        void saveNow();
        void saveVaultNow();
      } else if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        event.preventDefault();
        redo();
      } else if (key === "k") {
        event.preventDefault();
        openJump();
      } else if (key === "\\") {
        event.preventDefault();
        setPreview({ open: !useStudio.getState().preview.open });
      } else if (key === "," ) {
        event.preventDefault();
        go({ type: "settings" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (status === "loading")
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-sm text-ink-3">
        <Loader2 size={16} className="animate-spin" /> Loading your portfolio…
      </div>
    );
  if (status === "error")
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <div className="max-w-lg rounded-xl border border-bad/40 bg-elev p-6">
          <p className="font-semibold text-bad">The Studio couldn’t load your content</p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-ink-2">{loadError}</p>
          <p className="mt-3 text-sm text-ink-2">Fix the JSON in content/portfolio.json (or restore it with git), then reload.</p>
        </div>
      </div>
    );

  return (
    <div className="grid h-screen w-screen grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-bg">
      <TopBar />
      <div className="flex min-h-0 min-w-0">
        <div className="hidden w-60 shrink-0 md:block">
          <Sidebar />
        </div>
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">
            <CurrentPanel />
          </div>
        </main>
        <PreviewPane />
      </div>
      <StudioJump />
      <ConflictDialog />
      <Toast />
    </div>
  );
}
