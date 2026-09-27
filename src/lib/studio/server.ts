import "server-only";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * File-system helpers for the local Studio API. Everything here refuses to run outside
 * `next dev` — the deployed site is static and has no write access by design.
 */

export const ROOT = process.cwd();
export const CONTENT_FILE = path.join(ROOT, "content", "portfolio.json");
export const PRIVATE_FILE = path.join(ROOT, "content", "private.json");
export const PUBLIC_UPLOADS = path.join(ROOT, "public", "uploads");
export const PRIVATE_DIR = path.join(ROOT, "private");

export function studioEnabled() {
  return process.env.NODE_ENV === "development" || process.env.PORTFOLIO_STUDIO === "1";
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Rejects requests that are not same-origin from this machine. Blocks other devices on the
 * network and cross-site requests from web pages open in the same browser (CSRF).
 */
export function guard(request: Request): Response | null {
  if (!studioEnabled()) return new Response("Not found", { status: 404 });
  const url = new URL(request.url);
  const host = (request.headers.get("host") ?? url.host).replace(/:\d+$/, "");
  if (!LOCAL_HOSTS.has(host)) return new Response("Studio is only available on localhost", { status: 403 });
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return new Response("Cross-site request blocked", { status: 403 });
  }
  const origin = request.headers.get("origin");
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).hostname;
    } catch {
      // "null" or malformed origins are never ours.
    }
    if (!LOCAL_HOSTS.has(originHost)) {
      return new Response("Cross-origin request blocked", { status: 403 });
    }
  }
  return null;
}

export function hashText(text: string) {
  return createHash("sha1").update(text).digest("hex").slice(0, 12);
}

export async function readText(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** Write via temp file + rename so a crash (or the dev server's file watcher) never sees half a file. */
export async function writeTextAtomic(file: string, text: string) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, text, "utf8");
  await fs.rename(tmp, file);
}

export function stringifyContent(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Resolve a user-supplied relative path inside a base directory, refusing traversal. */
export function safeJoin(base: string, relative: string): string | null {
  const resolved = path.resolve(base, relative);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) return null;
  return resolved;
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { "cache-control": "no-store", ...(init?.headers ?? {}) } });
}
