"use client";

import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function CopyButton({
  text,
  label,
  copiedLabel,
  className,
  children,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  className?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        }
      }}
      aria-label={copied ? copiedLabel : label}
    >
      {children}
      {copied ? <Check size={15} strokeWidth={2.2} aria-hidden /> : <Copy size={15} strokeWidth={1.8} aria-hidden />}
      <span aria-live="polite" className={children ? "sr-only" : ""}>
        {copied ? copiedLabel : children ? "" : label}
      </span>
    </button>
  );
}
