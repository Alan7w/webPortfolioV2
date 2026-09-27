import { promises as fs } from "node:fs";
import path from "node:path";
import { guard, PRIVATE_DIR, safeJoin } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

/** Serve an image from the git-ignored private/ folder to the local Studio only. */
export async function GET(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const name = new URL(request.url).searchParams.get("name") ?? "";
  const file = safeJoin(PRIVATE_DIR, name);
  const mime = MIME[path.extname(name).toLowerCase()];
  if (!file || !mime) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(file);
    return new Response(new Uint8Array(data), { headers: { "content-type": mime, "cache-control": "no-store" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
