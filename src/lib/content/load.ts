import "server-only";
import raw from "../../../content/portfolio.json";
import { parsePortfolio, type Portfolio } from "./schema";

/**
 * The public site imports the content file statically: it is bundled at build time
 * (so hosting stays fully static) and hot-reloads in development when the Studio saves.
 */
let cached: { source: unknown; value: Portfolio } | null = null;

export function getPortfolio(): Portfolio {
  if (!cached || cached.source !== raw) cached = { source: raw, value: parsePortfolio(raw) };
  return cached.value;
}
