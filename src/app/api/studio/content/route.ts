import { CONTENT_FILE, guard, hashText, json, readText, stringifyContent, writeTextAtomic } from "@/lib/studio/server";
import { PortfolioSchema } from "@/lib/content/schema";

export const dynamic = "force-dynamic";

/** Read the working copy of content/portfolio.json (+ a hash for conflict detection). */
export async function GET(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const text = await readText(CONTENT_FILE);
  if (text === null) return json({ error: "content/portfolio.json not found" }, { status: 404 });
  try {
    const content = PortfolioSchema.parse(JSON.parse(text));
    return json({ content, hash: hashText(text) });
  } catch (error) {
    return json({ error: `content/portfolio.json is invalid: ${(error as Error).message}`, raw: text }, { status: 422 });
  }
}

/**
 * Save the working copy. Rejects the write (409) if the file changed on disk since the Studio
 * loaded it — e.g. edited by hand, or replaced by `git pull` — unless `force` is set.
 */
export async function PUT(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  let body: { content?: unknown; baseHash?: string; force?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PortfolioSchema.safeParse(body.content);
  if (!parsed.success) {
    return json({ error: "Content failed validation", issues: parsed.error.issues.slice(0, 20) }, { status: 422 });
  }
  const current = await readText(CONTENT_FILE);
  if (!body.force && current !== null && body.baseHash && hashText(current) !== body.baseHash) {
    return json({ error: "conflict", hash: hashText(current), content: JSON.parse(current) }, { status: 409 });
  }
  const updatedAt = new Date().toISOString();
  const next = {
    $schema: "./portfolio.schema.json",
    ...parsed.data,
    meta: { ...parsed.data.meta, schemaVersion: parsed.data.meta.schemaVersion || 1, updatedAt },
  };
  const text = stringifyContent(next);
  await writeTextAtomic(CONTENT_FILE, text);
  return json({ ok: true, hash: hashText(text), updatedAt });
}
