import type { MetadataRoute } from "next";
import { getPortfolio } from "@/lib/content/load";
import { resolveSiteUrl } from "@/lib/content/seo";

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteUrl(getPortfolio());
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/studio", "/api/"] }],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
