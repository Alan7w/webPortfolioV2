import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { guard, json, ROOT } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

const run = promisify(execFile);

/** Only these paths are ever staged by "Publish" — never code, never the private vault. */
const PUBLISH_PATHS = ["content/portfolio.json", "content/portfolio.schema.json", "public/uploads"];

async function git(args: string[]) {
  const { stdout } = await run("git", args, { cwd: ROOT, maxBuffer: 20 * 1024 * 1024, timeout: 90_000 });
  return stdout;
}

async function tryGit(args: string[]) {
  try {
    return await git(args);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "status";

  if ((await tryGit(["rev-parse", "--is-inside-work-tree"]))?.trim() !== "true") {
    return json({ isRepo: false });
  }

  if (action === "history") {
    const out = (await tryGit(["log", "-n", "40", "--format=%H%x1f%cI%x1f%an%x1f%s", "--", "content/portfolio.json"])) ?? "";
    const commits = out
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, date, author, subject] = line.split("\x1f");
        return { sha, date, author, subject };
      });
    return json({ isRepo: true, commits });
  }

  if (action === "show") {
    const sha = url.searchParams.get("sha") ?? "";
    if (!/^[0-9a-f]{7,40}$/i.test(sha)) return json({ error: "Invalid commit" }, { status: 400 });
    const text = await tryGit(["show", `${sha}:content/portfolio.json`]);
    if (text === null) return json({ error: "Not found in that commit" }, { status: 404 });
    return json({ content: JSON.parse(text) });
  }

  const [branch, statusSb, changes, remote, head, lastPublished, otherChanges] = await Promise.all([
    tryGit(["rev-parse", "--abbrev-ref", "HEAD"]),
    tryGit(["status", "-sb", "--porcelain=v1"]),
    tryGit(["status", "--porcelain=v1", "--untracked-files=all", "--", ...PUBLISH_PATHS]),
    tryGit(["remote", "get-url", "origin"]),
    tryGit(["show", "HEAD:content/portfolio.json"]),
    tryGit(["log", "-1", "--format=%H%x1f%cI%x1f%s", "--", "content/portfolio.json"]),
    tryGit(["status", "--porcelain=v1"]),
  ]);
  const header = statusSb?.split("\n")[0] ?? "";
  const ahead = Number(/ahead (\d+)/.exec(header)?.[1] ?? 0);
  const behind = Number(/behind (\d+)/.exec(header)?.[1] ?? 0);
  const [lastSha, lastDate, lastSubject] = (lastPublished ?? "").trim().split("\x1f");
  const contentChanges = (changes ?? "")
    .split("\n")
    .filter(Boolean)
    .map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3) }));
  const others = (otherChanges ?? "")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3))
    .filter((p) => !PUBLISH_PATHS.some((allowed) => p === allowed || p.startsWith(allowed + "/")));

  let published: unknown = null;
  try {
    published = head ? JSON.parse(head) : null;
  } catch {
    published = null;
  }

  return json({
    isRepo: true,
    branch: branch?.trim() ?? "",
    remote: remote?.trim() ?? "",
    hasUpstream: /\.\.\./.test(header),
    ahead,
    behind,
    changes: contentChanges,
    otherChanges: others.length,
    published,
    last: lastSha ? { sha: lastSha, date: lastDate, subject: lastSubject } : null,
  });
}

/** Commit (and optionally push) only the content paths. */
export async function POST(request: Request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  let body: { message?: string; push?: boolean; pushOnly?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const log: string[] = [];
  try {
    if (!body.pushOnly) {
      const message = (body.message ?? "").trim() || "content: update portfolio";
      await git(["add", "--", ...PUBLISH_PATHS]);
      const staged = await git(["diff", "--cached", "--name-only", "--", ...PUBLISH_PATHS]);
      if (!staged.trim()) return json({ ok: false, error: "Nothing to publish — content matches the last commit." }, { status: 400 });
      log.push(await git(["commit", "-m", message, "--", ...PUBLISH_PATHS]));
    }
    if (body.push || body.pushOnly) {
      const upstream = await tryGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
      const { stdout, stderr } = await run("git", upstream ? ["push"] : ["push", "-u", "origin", "HEAD"], { cwd: ROOT, timeout: 120_000 });
      log.push(stdout, stderr);
    }
    return json({ ok: true, log: log.join("\n").trim() });
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string; message: string };
    return json({ ok: false, error: (err.stderr || err.stdout || err.message).trim(), log: log.join("\n") }, { status: 500 });
  }
}
