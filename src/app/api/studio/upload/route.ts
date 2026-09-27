import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { guard, json, PRIVATE_DIR, PUBLIC_UPLOADS, safeJoin } from "@/lib/studio/server";
import { slugify } from "@/lib/content/derive";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Upload an image. scope=public → public/uploads (committed, served by the site);
 * scope=private → private/ (git-ignored; used for the Obyektivka photo).
 */
export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const scope = new URL(request.url).searchParams.get("scope") === "private" ? "private" : "public";
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "No file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return json({ error: `Unsupported type ${file.type || "(unknown)"}` }, { status: 415 });
  if (file.size > MAX_BYTES) return json({ error: "File is larger than 8 MB" }, { status: 413 });
  if (scope === "private" && ext === "svg") return json({ error: "SVG isn't allowed here" }, { status: 415 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const digest = createHash("sha1").update(bytes).digest("hex").slice(0, 8);
  const base = slugify(path.parse(file.name).name) || "file";
  const name = `${base}-${digest}.${ext}`;
  const dir = scope === "private" ? PRIVATE_DIR : PUBLIC_UPLOADS;
  const target = safeJoin(dir, name);
  if (!target) return json({ error: "Invalid name" }, { status: 400 });
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(target, bytes);
  return json({ ok: true, path: scope === "private" ? name : `/uploads/${name}` });
}
