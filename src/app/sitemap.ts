import type { MetadataRoute } from "next";
import { caseStudies } from "@/lib/content/derive";
import { getPortfolio } from "@/lib/content/load";
import type { Locale } from "@/lib/content/schema";
import { enabledLocales, paths, resolveSiteUrl } from "@/lib/content/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const portfolio = getPortfolio();
  const base = resolveSiteUrl(portfolio) || "http://localhost:3000";
  const locales = enabledLocales(portfolio);
  const lastModified = portfolio.meta.updatedAt ? new Date(portfolio.meta.updatedAt) : new Date();
  const entry = (build: (l: Locale) => string, priority: number) =>
    locales.map((locale) => ({
      url: base + build(locale),
      lastModified,
      priority,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, base + build(l)])) },
    }));
  return [
    ...entry((l) => paths.home(l), 1),
    ...entry((l) => paths.resume(l), 0.8),
    ...caseStudies(portfolio).flatMap((study) => entry((l) => paths.project(l, study.slug), 0.6)),
  ];
}
