"use client";

import { ArrowRight, Download, Lock, Upload } from "lucide-react";
import { useRef } from "react";
import { PrivateSchema } from "@/lib/content/schema";
import { t } from "@/lib/content/i18n";
import { findEntry, jumpTo, toast, updateVault, useStudio } from "@/lib/studio/store";
import { Button, Card, Empty, PanelHeader, SectionTitle } from "../ui";
import { ContactsEditor } from "./ProfilePanel";

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

export function VaultPanel() {
  const vault = useStudio((s) => s.vault);
  const doc = useStudio((s) => s.doc)!;
  const file = useRef<HTMLInputElement>(null);
  if (!vault) return <Empty>The vault couldn’t be loaded.</Empty>;
  const notes = Object.entries(vault.notes).filter(([, note]) => note.trim());

  return (
    <div>
      <PanelHeader
        eyebrow="Private"
        title="Vault"
        description="Personal data that must never reach the public site or GitHub."
        actions={
          <>
            <Button onClick={() => downloadJson(`portfolio-vault-${new Date().toISOString().slice(0, 10)}.json`, vault)}>
              <Download size={14} /> Back up
            </Button>
            <Button onClick={() => file.current?.click()}>
              <Upload size={14} /> Restore
            </Button>
            <input
              ref={file}
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const parsed = PrivateSchema.parse(JSON.parse(await f.text()));
                  if (!window.confirm("Replace the whole vault with this backup?")) return;
                  updateVault((v) => void Object.assign(v, parsed));
                  toast("Vault restored");
                } catch (err) {
                  toast(`Not a valid vault backup: ${(err as Error).message.slice(0, 80)}`);
                }
              }}
            />
          </>
        }
      />

      <Card className="flex items-start gap-4 border-accent/30 bg-accent-soft p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink">
          <Lock size={18} />
        </span>
        <div className="space-y-1.5 text-sm leading-relaxed text-ink-2">
          <p>
            Stored in <code className="rounded bg-elev px-1 font-mono text-xs">content/private.json</code> and{" "}
            <code className="rounded bg-elev px-1 font-mono text-xs">private/</code>, both git-ignored. They are never committed, never deployed and never bundled into the website.
          </p>
          <p>
            That also means they exist <strong className="text-ink">only on this computer</strong>. Use “Back up” now and then, and keep the file somewhere private (not a public repo).
          </p>
        </div>
      </Card>

      <SectionTitle>Private contacts</SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-ink-3">Printed on résumés you export from the Studio — never shown on the public website or the public /resume page.</p>
      <ContactsEditor contacts={vault.contacts} isPrivate onChange={(contacts) => updateVault((v) => void (v.contacts = contacts))} />

      <SectionTitle>Private notes</SectionTitle>
      {notes.length === 0 ? (
        <Empty>No notes yet. Every entry has a “Private note” field.</Empty>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-elev">
          {notes.map(([id, note]) => {
            const found = findEntry(doc, id);
            return (
              <li key={id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{found ? t(found.entry.title, "en") : id}</p>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-ink-2">{note}</p>
                </div>
                {found && (
                  <Button size="sm" variant="ghost" onClick={() => jumpTo(id)}>
                    Open <ArrowRight size={13} />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
