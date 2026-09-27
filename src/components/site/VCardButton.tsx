"use client";

import { Contact } from "lucide-react";

export interface VCardData {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  urls: string[];
  note?: string;
}

function escape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

/** "Save contact card" — recruiters on a phone can add you to their contacts in one tap. */
export function VCardButton({ data, label, className }: { data: VCardData; label: string; className?: string }) {
  const download = () => {
    const [first, ...rest] = data.name.split(" ");
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escape(rest.join(" "))};${escape(first)};;;`,
      `FN:${escape(data.name)}`,
      data.title ? `TITLE:${escape(data.title)}` : "",
      data.email ? `EMAIL;TYPE=INTERNET:${data.email}` : "",
      data.phone ? `TEL;TYPE=CELL:${data.phone}` : "",
      ...data.urls.map((url) => `URL:${url}`),
      data.note ? `NOTE:${escape(data.note)}` : "",
      "END:VCARD",
    ].filter(Boolean);
    const blob = new Blob([lines.join("\r\n")], { type: "text/vcard" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${data.name.replace(/\s+/g, "-")}.vcf`;
    a.click();
    URL.revokeObjectURL(href);
  };
  return (
    <button type="button" onClick={download} className={className}>
      <Contact size={16} strokeWidth={1.8} aria-hidden />
      {label}
    </button>
  );
}
