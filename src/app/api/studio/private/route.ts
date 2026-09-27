import { guard, json, PRIVATE_FILE, readText, stringifyContent, writeTextAtomic } from "@/lib/studio/server";
import { PrivateSchema } from "@/lib/content/schema";

export const dynamic = "force-dynamic";

/** The private vault (content/private.json) — git-ignored, never bundled into the public site. */
export async function GET(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const text = await readText(PRIVATE_FILE);
  if (text === null) return json({ vault: PrivateSchema.parse({}), exists: false });
  try {
    return json({ vault: PrivateSchema.parse(JSON.parse(text)), exists: true });
  } catch (error) {
    return json({ error: `content/private.json is invalid: ${(error as Error).message}` }, { status: 422 });
  }
}

export async function PUT(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  let body: { vault?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PrivateSchema.safeParse(body.vault);
  if (!parsed.success) return json({ error: "Vault failed validation", issues: parsed.error.issues.slice(0, 20) }, { status: 422 });
  await writeTextAtomic(PRIVATE_FILE, stringifyContent(parsed.data));
  return json({ ok: true });
}
