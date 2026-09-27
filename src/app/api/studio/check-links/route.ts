import { guard, json } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

interface Result {
  url: string;
  ok: boolean;
  status: number;
  finalUrl?: string;
  error?: string;
}

async function check(url: string): Promise<Result> {
  const attempt = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      return await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (Portfolio Studio link check)" },
      });
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    let res = await attempt("HEAD");
    // Plenty of hosts reject HEAD; confirm with GET before calling a link broken.
    if (res.status >= 400) res = await attempt("GET");
    return { url, ok: res.status < 400, status: res.status, finalUrl: res.url !== url ? res.url : undefined };
  } catch (error) {
    return { url, ok: false, status: 0, error: (error as Error).name === "AbortError" ? "Timed out" : (error as Error).message };
  }
}

/** Checks every link in the portfolio from this machine (the browser can't, because of CORS). */
export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const body = (await request.json().catch(() => ({}))) as { urls?: unknown };
  const urls = [...new Set(Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === "string") : [])]
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 80);
  const results: Result[] = [];
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (queue.length) {
        const next = queue.shift();
        if (next) results.push(await check(next));
      }
    }),
  );
  return json({ results });
}
