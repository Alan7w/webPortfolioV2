import { NextResponse, type NextRequest } from "next/server";
import content from "../content/portfolio.json";

/**
 * "/" and "/resume" pick a language from the visitor's browser (Accept-Language):
 * Uzbek and Russian speakers land on /uz or /ru, everyone else on the default locale.
 */
const settings = (content as { settings?: { defaultLocale?: string; locales?: string[] } }).settings ?? {};
const SUPPORTED = (settings.locales?.length ? settings.locales : ["en", "uz", "ru"]).filter((l) => ["en", "uz", "ru"].includes(l));
const DEFAULT = settings.defaultLocale && SUPPORTED.includes(settings.defaultLocale) ? settings.defaultLocale : SUPPORTED[0] ?? "en";

function pickLocale(header: string | null): string {
  if (!header) return DEFAULT;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((item) => SUPPORTED.includes(item.lang))?.lang ?? DEFAULT;
}

export function proxy(request: NextRequest) {
  const locale = pickLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = request.nextUrl.pathname === "/resume" ? `/${locale}/resume` : `/${locale}`;
  const response = NextResponse.redirect(url, 307);
  response.headers.set("Vary", "Accept-Language");
  return response;
}

export const config = {
  matcher: ["/", "/resume"],
};
