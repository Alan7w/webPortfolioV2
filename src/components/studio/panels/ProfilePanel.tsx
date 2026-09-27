"use client";

import { Lock, Plus, Trash2 } from "lucide-react";
import type { Contact, Highlight } from "@/lib/content/schema";
import { CONTACT_KINDS } from "@/lib/content/schema";
import { contactHref, uid } from "@/lib/content/derive";
import { go, update, useStudio } from "@/lib/studio/store";
import { ContactIcon } from "@/components/shared/Icons";
import { Button, Card, Field, Input, PanelHeader, SectionTitle, Select, Toggle } from "../ui";
import { DragHandle, ImageField, LText, SortableList } from "../fields";

const CONTACT_HINTS: Partial<Record<Contact["kind"], string>> = {
  email: "you@example.com",
  phone: "+998 90 123 45 67",
  github: "github.com/username",
  linkedin: "linkedin.com/in/username",
  telegram: "@username",
  x: "@username",
  itch: "username.itch.io",
  website: "example.com",
};

export function ContactsEditor({ contacts, onChange, isPrivate }: { contacts: Contact[]; onChange: (c: Contact[]) => void; isPrivate?: boolean }) {
  const patch = (i: number, p: Partial<Contact>) => onChange(contacts.map((c, j) => (j === i ? { ...c, ...p } : c)));
  return (
    <div className="space-y-2">
      <SortableList
        items={contacts}
        onReorder={onChange}
        render={(contact, i, controls) => (
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <DragHandle controls={controls} />
              <span className="flex size-8 items-center justify-center rounded-lg bg-sunken text-ink-2">
                <ContactIcon kind={contact.kind} size={15} />
              </span>
              <Select value={contact.kind} onChange={(e) => patch(i, { kind: e.target.value as Contact["kind"] })} className="w-32">
                {CONTACT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
              <Input
                value={contact.value}
                placeholder={CONTACT_HINTS[contact.kind] ?? "Value"}
                onChange={(e) => patch(i, { value: e.target.value })}
                className="min-w-[10rem] flex-1"
              />
              <Button variant="ghost" size="icon" aria-label="Remove contact" onClick={() => onChange(contacts.filter((_, j) => j !== i))}>
                <Trash2 size={14} />
              </Button>
            </div>
            <div className="mt-3 grid gap-3 pl-9 sm:grid-cols-[1fr_1fr_auto]">
              <LText value={contact.label} placeholder="Label (e.g. Email)" onChange={(label) => patch(i, { label })} />
              <Input value={contact.url} placeholder={contactHref({ ...contact, url: "" }) || "Link (optional)"} onChange={(e) => patch(i, { url: e.target.value.trim() })} className="font-mono text-xs" />
              <div className="flex items-center gap-4">
                {!isPrivate && <Toggle checked={contact.onSite} onChange={(v) => patch(i, { onSite: v })} label="Site" />}
                <Toggle checked={contact.onResume} onChange={(v) => patch(i, { onResume: v })} label="Résumé" />
              </div>
            </div>
          </Card>
        )}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onChange([...contacts, { id: uid("c"), kind: isPrivate ? "phone" : "linkedin", label: {}, value: "", url: "", onSite: !isPrivate, onResume: true }])}
      >
        <Plus size={14} /> Add contact
      </Button>
    </div>
  );
}

export function ProfilePanel() {
  const doc = useStudio((s) => s.doc)!;
  const p = doc.profile;
  const up = (recipe: (d: typeof doc) => void, key?: string) => update(recipe, key ? `profile:${key}` : undefined);

  return (
    <div>
      <PanelHeader eyebrow="Profile" title="Who you are" description="The hero of your website and the header of your résumé." />

      <Card className="grid gap-5 p-5 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <LText label="Name" value={p.name} onChange={(v) => up((d) => void (d.profile.name = v), "name")} />
          <LText label="Headline" hint="The role you want to be hired for." value={p.headline} onChange={(v) => up((d) => void (d.profile.headline = v), "headline")} />
          <LText
            label="Summary"
            hint="2–3 sentences. Who you are, what you build, what makes you different."
            value={p.summary}
            multiline
            rows={4}
            onChange={(v) => up((d) => void (d.profile.summary = v), "summary")}
          />
          <LText label="Location" value={p.location} onChange={(v) => up((d) => void (d.profile.location = v), "location")} />
        </div>
        <Field label="Portrait" className="lg:w-64">
          <ImageField value={p.avatar} aspect="aspect-[4/5]" onChange={(v) => up((d) => void (d.profile.avatar = v))} />
          <LText value={p.avatarAlt} placeholder="Alt text" onChange={(v) => up((d) => void (d.profile.avatarAlt = v), "alt")} />
        </Field>
      </Card>

      <SectionTitle>Availability</SectionTitle>
      <Card className="space-y-3 p-5">
        <Toggle checked={p.status.enabled} onChange={(v) => up((d) => void (d.profile.status.enabled = v))} label="Show a status badge" hint="The green dot at the top of your page." />
        {p.status.enabled && <LText value={p.status.text} placeholder="Open to software & game development roles" onChange={(v) => up((d) => void (d.profile.status.text = v), "status")} />}
      </Card>

      <SectionTitle
        aside={
          <button type="button" onClick={() => go({ type: "vault" })} className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink">
            <Lock size={11} /> Private contacts (phone) live in the vault
          </button>
        }
      >
        Contacts
      </SectionTitle>
      <ContactsEditor contacts={p.contacts} onChange={(contacts) => up((d) => void (d.profile.contacts = contacts), "contacts")} />

      <SectionTitle>Highlights</SectionTitle>
      <p className="-mt-1 mb-3 text-xs text-ink-3">Big numbers under the hero. Keep them true and specific — 3 or 4 work best.</p>
      <SortableList
        items={p.highlights}
        onReorder={(highlights) => up((d) => void (d.profile.highlights = highlights))}
        render={(h: Highlight, i, controls) => (
          <div className="flex items-start gap-2">
            <DragHandle controls={controls} />
            <LText value={h.value} placeholder="3.77" className="w-28 shrink-0" onChange={(value) => up((d) => void (d.profile.highlights[i].value = value), `hv${h.id}`)} />
            <LText value={h.label} placeholder="What it means" className="flex-1" onChange={(label) => up((d) => void (d.profile.highlights[i].label = label), `hl${h.id}`)} />
            <Button variant="ghost" size="icon" aria-label="Remove highlight" onClick={() => up((d) => void d.profile.highlights.splice(i, 1))}>
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      />
      <Button size="sm" variant="ghost" className="mt-2" onClick={() => up((d) => void d.profile.highlights.push({ id: uid("h"), value: {}, label: {} }))}>
        <Plus size={14} /> Add highlight
      </Button>
    </div>
  );
}
