"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STEPS = [40, 28, 20, 14, 10, 7, 5, 3, 2];

/**
 * The portrait "spawns" like a game texture streaming in: it starts as big pixels and
 * resolves to full detail. Hovering re-plays it (with a cooldown). Respects reduced motion.
 */
export function PixelPortrait({ src, alt, initials }: { src: string; alt: string; initials: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const lastRun = useRef(0);
  const [phase, setPhase] = useState<"loading" | "animating" | "done" | "failed">("loading");

  const run = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-motion") === "off";
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    image.onerror = () => setPhase("failed");
    image.onload = () => {
      if (reduce) {
        setPhase("done");
        return;
      }
      lastRun.current = Date.now();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(canvas.clientWidth * dpr);
      const height = Math.round(canvas.clientHeight * dpr);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const small = document.createElement("canvas");
      const smallCtx = small.getContext("2d");
      if (!ctx || !smallCtx) return setPhase("done");

      // object-fit: cover
      const scale = Math.max(width / image.width, height / image.height);
      const sw = width / scale;
      const sh = height / scale;
      const sx = (image.width - sw) / 2;
      const sy = (image.height - sh) / 4;

      let step = 0;
      setPhase("animating");
      const tick = () => {
        const block = STEPS[step] * dpr;
        const cols = Math.max(1, Math.ceil(width / block));
        const rows = Math.max(1, Math.ceil(height / block));
        small.width = cols;
        small.height = rows;
        smallCtx.drawImage(image, sx, sy, sw, sh, 0, 0, cols, rows);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(small, 0, 0, cols, rows, 0, 0, width, height);
        step += 1;
        if (step < STEPS.length) timer.current = window.setTimeout(tick, 70);
        else timer.current = window.setTimeout(() => setPhase("done"), 70);
      };
      tick();
    };
  }, [src]);

  useEffect(() => {
    run();
    return () => window.clearTimeout(timer.current);
  }, [run]);

  const replay = () => {
    if (phase !== "done" || Date.now() - lastRun.current < 4000) return;
    window.clearTimeout(timer.current);
    run();
  };

  return (
    <div
      onPointerEnter={replay}
      className="group relative aspect-[4/5] w-36 shrink-0 sm:w-48 lg:w-60"
    >
      <div className="relative size-full overflow-hidden rounded-card bg-sunken ring-1 ring-line">
        {src && phase !== "failed" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className={`pp-img absolute inset-0 size-full object-cover object-[50%_25%] transition-opacity duration-200 ${phase === "done" ? "opacity-100" : "opacity-0"}`}
            />
            <canvas
              ref={canvasRef}
              aria-hidden
              className={`absolute inset-0 size-full transition-opacity duration-200 ${phase === "animating" ? "opacity-100" : "opacity-0"}`}
            />
            <noscript>
              <style>{`.pp-img{opacity:1!important}`}</style>
            </noscript>
          </>
        ) : (
          <div className="flex size-full items-center justify-center font-display text-5xl text-ink-3">{initials}</div>
        )}
      </div>
      {/* Pixel corner brackets — the only "HUD" on the page */}
      <span aria-hidden className="absolute -left-1.5 -top-1.5 size-3 border-l-2 border-t-2 border-accent" />
      <span aria-hidden className="absolute -right-1.5 -top-1.5 size-3 border-r-2 border-t-2 border-accent" />
      <span aria-hidden className="absolute -bottom-1.5 -left-1.5 size-3 border-b-2 border-l-2 border-accent" />
      <span aria-hidden className="absolute -bottom-1.5 -right-1.5 size-3 border-b-2 border-r-2 border-accent" />
    </div>
  );
}
