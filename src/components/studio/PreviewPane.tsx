"use client";

import { ExternalLink, Laptop, Printer, RotateCw, Smartphone, Tablet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { setPreview, useStudio, type PreviewPage } from "@/lib/studio/store";
import { cx } from "./ui";
import { PRINT_EVENT } from "./panels/ObyektivkaPanel";

const DEVICES = { desktop: 1280, tablet: 820, mobile: 390 } as const;
const WIDTH_KEY = "studio:preview-width";

export interface PreviewMessage {
  type: "studio:render";
  doc: unknown;
  locale: string;
  page: PreviewPage;
  variant: string;
  privateContacts: unknown[];
  obyektivka: unknown;
}

/**
 * Live preview: an iframe running the real site components, fed the draft via postMessage.
 * Being a separate document it gets true media queries, the theme and fonts in isolation.
 */
export function PreviewPane() {
  const doc = useStudio((s) => s.doc);
  const vault = useStudio((s) => s.vault);
  const locale = useStudio((s) => s.editLocale);
  const preview = useStudio((s) => s.preview);
  const openEntryId = useStudio((s) => s.openEntryId);
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ w: 600, h: 800 });
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return 560;
    try {
      const saved = Number(localStorage.getItem(WIDTH_KEY));
      if (saved > 280) return saved;
    } catch {
      // storage blocked — use the default
    }
    return Math.round(window.innerWidth * 0.42);
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "studio:ready") setReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const post = useCallback(
    (message: unknown) => frame.current?.contentWindow?.postMessage(message, window.location.origin),
    [],
  );

  // Send the draft (throttled to one frame).
  useEffect(() => {
    if (!ready || !doc) return;
    const id = requestAnimationFrame(() =>
      post({
        type: "studio:render",
        doc,
        locale,
        page: preview.page,
        variant: preview.variant,
        privateContacts: vault?.contacts ?? [],
        obyektivka: vault?.obyektivka ?? null,
      } satisfies PreviewMessage),
    );
    return () => cancelAnimationFrame(id);
  }, [ready, doc, vault, locale, preview.page, preview.variant, post]);

  useEffect(() => {
    if (ready && openEntryId && preview.page === "site") post({ type: "studio:focus", id: openEntryId });
  }, [ready, openEntryId, preview.page, post]);

  useEffect(() => {
    const onPrint = () => {
      if (useStudio.getState().preview.page === "site") setPreview({ page: "resume" });
      window.setTimeout(() => frame.current?.contentWindow?.print(), 350);
    };
    window.addEventListener(PRINT_EVENT, onPrint);
    return () => window.removeEventListener(PRINT_EVENT, onPrint);
  }, []);

  const startResize = (event: React.PointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;
    const move = (e: PointerEvent) => setWidth(Math.min(Math.max(startWidth + (startX - e.clientX), 320), window.innerWidth - 520));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      setWidth((w) => {
        try {
          localStorage.setItem(WIDTH_KEY, String(w));
        } catch {}
        return w;
      });
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (!preview.open) return null;

  const paper = preview.page !== "site";
  const deviceWidth = paper ? 900 : DEVICES[preview.device];
  const scale = Math.min(1, (size.w - 16) / deviceWidth);
  const openHref = preview.page === "resume" ? `/${locale}/resume${preview.variant ? `/${preview.variant}` : ""}` : `/${locale}${preview.variant ? `/v/${preview.variant}` : ""}`;

  const tab = (page: PreviewPage, label: string) => (
    <button
      key={page}
      type="button"
      onClick={() => setPreview({ page })}
      className={cx("rounded-md px-2.5 py-1 text-xs transition", preview.page === page ? "bg-ink text-bg" : "text-ink-2 hover:bg-sunken")}
    >
      {label}
    </button>
  );

  return (
    <aside className="relative flex min-h-0 min-w-0 shrink-0 flex-col border-l border-line bg-sunken" style={{ width: `min(${width}px, calc(100vw - 560px))` }}>
      <div onPointerDown={startResize} className="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize hover:bg-accent/30" aria-hidden />
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-line bg-elev px-2">
        {tab("site", "Site")}
        {tab("resume", "Résumé")}
        {tab("obyektivka", "Obyektivka")}
        <span className="mx-1 h-5 w-px bg-line" />
        {!paper &&
          (
            [
              ["desktop", Laptop],
              ["tablet", Tablet],
              ["mobile", Smartphone],
            ] as const
          ).map(([device, Icon]) => (
            <button
              key={device}
              type="button"
              aria-label={device}
              title={device}
              onClick={() => setPreview({ device })}
              className={cx("rounded-md p-1.5", preview.device === device ? "bg-sunken text-ink" : "text-ink-3 hover:text-ink")}
            >
              <Icon size={14} />
            </button>
          ))}
        {doc && doc.variants.length > 0 && preview.page !== "obyektivka" && (
          <select
            value={preview.variant}
            onChange={(e) => setPreview({ variant: e.target.value })}
            className="ml-1 h-7 max-w-[8.5rem] truncate rounded-md border border-line bg-bg px-1.5 text-xs text-ink"
            aria-label="Variant"
          >
            <option value="">Standard</option>
            {doc.variants.map((v) => (
              <option key={v.id} value={v.slug}>
                {v.label || v.slug}
              </option>
            ))}
          </select>
        )}
        <span className="flex-1" />
        {paper && (
          <button type="button" onClick={() => window.dispatchEvent(new Event(PRINT_EVENT))} className="rounded-md p-1.5 text-ink-2 hover:bg-sunken" title="Print / Save as PDF (includes private contacts)">
            <Printer size={14} />
          </button>
        )}
        <button type="button" onClick={() => (setReady(false), setNonce((n) => n + 1))} className="rounded-md p-1.5 text-ink-3 hover:text-ink" title="Reload preview">
          <RotateCw size={13} />
        </button>
        {preview.page !== "obyektivka" && (
          <a href={openHref} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-ink-3 hover:text-ink" title="Open saved version in a new tab">
            <ExternalLink size={13} />
          </a>
        )}
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden p-2">
        <div
          className="origin-top-left overflow-hidden rounded-lg border border-line bg-white shadow-sm"
          style={{ width: deviceWidth, height: (size.h - 16) / scale, transform: `scale(${scale})`, marginLeft: Math.max(0, (size.w - 16 - deviceWidth * scale) / 2) }}
        >
          <iframe key={nonce} ref={frame} src="/studio/preview" title="Live preview" className="size-full border-0" />
        </div>
      </div>
    </aside>
  );
}
