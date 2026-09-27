import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** Fonts for next/og (Satori needs .woff/.ttf, and Cyrillic glyphs for /ru). */
export async function ogFonts() {
  const dir = (pkg: string) => path.join(process.cwd(), "node_modules", "@fontsource", pkg, "files");
  const load = (pkg: string, file: string) => readFile(path.join(dir(pkg), file));
  const [interLatin, interCyr, interBoldLatin, interBoldCyr, serifLatin, serifCyr] = await Promise.all([
    load("inter", "inter-latin-400-normal.woff"),
    load("inter", "inter-cyrillic-400-normal.woff"),
    load("inter", "inter-latin-600-normal.woff"),
    load("inter", "inter-cyrillic-600-normal.woff"),
    load("source-serif-4", "source-serif-4-latin-600-normal.woff"),
    load("source-serif-4", "source-serif-4-cyrillic-600-normal.woff"),
  ]);
  return [
    { name: "Inter", data: interLatin, weight: 400 as const, style: "normal" as const },
    { name: "InterCyr", data: interCyr, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: interBoldLatin, weight: 600 as const, style: "normal" as const },
    { name: "InterCyr", data: interBoldCyr, weight: 600 as const, style: "normal" as const },
    { name: "Serif", data: serifLatin, weight: 600 as const, style: "normal" as const },
    { name: "SerifCyr", data: serifCyr, weight: 600 as const, style: "normal" as const },
  ];
}

/** Read an image from /public as a data URL (Satori can't fetch relative paths). */
export async function publicImageDataUrl(src: string): Promise<string | null> {
  if (!src || /^https?:/.test(src)) return src || null;
  try {
    const file = path.join(process.cwd(), "public", src.replace(/^\//, ""));
    const data = await readFile(file);
    const ext = path.extname(file).slice(1).toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    if (ext === "webp") return null; // Satori doesn't decode WebP.
    return `data:${mime};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}
