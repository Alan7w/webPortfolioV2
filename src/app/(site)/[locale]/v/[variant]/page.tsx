import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioView } from "@/components/site/PortfolioView";
import { applyVariant, findVariant } from "@/lib/content/derive";
import { getPortfolio } from "@/lib/content/load";
import type { Locale } from "@/lib/content/schema";
import { buildMetadata, localeHrefs, paths } from "@/lib/content/seo";

/** Tailored, shareable views: /en/v/game-dev, /ru/v/web… (not indexed — they duplicate the main page). */
export const dynamicParams = false;

export function generateStaticParams() {
  return getPortfolio().variants.map((variant) => ({ variant: variant.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/v/[variant]">): Promise<Metadata> {
  const { locale, variant: slug } = await params;
  const base = getPortfolio();
  const portfolio = applyVariant(base, findVariant(base, slug));
  return buildMetadata(portfolio, locale as Locale, { build: (l) => paths.home(l, slug), noindex: true });
}

export default async function VariantPage({ params }: PageProps<"/[locale]/v/[variant]">) {
  const { locale: raw, variant: slug } = await params;
  const locale = raw as Locale;
  const base = getPortfolio();
  const variant = findVariant(base, slug);
  if (!variant) notFound();
  const portfolio = applyVariant(base, variant);
  return (
    <PortfolioView
      portfolio={portfolio}
      locale={locale}
      basePath={paths.home(locale, slug)}
      resumeHref={paths.resume(locale, slug)}
      localeHrefs={localeHrefs(base, (l) => paths.home(l, slug))}
    />
  );
}
