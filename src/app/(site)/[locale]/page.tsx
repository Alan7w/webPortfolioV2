import type { Metadata } from "next";
import { PortfolioView } from "@/components/site/PortfolioView";
import { getPortfolio } from "@/lib/content/load";
import type { Locale } from "@/lib/content/schema";
import { buildMetadata, jsonLdScript, localeHrefs, paths, personJsonLd } from "@/lib/content/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return buildMetadata(getPortfolio(), locale, { build: (l) => paths.home(l) });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  const portfolio = getPortfolio();
  return (
    <>
      <PortfolioView
        portfolio={portfolio}
        locale={locale}
        basePath={paths.home(locale)}
        resumeHref={paths.resume(locale)}
        localeHrefs={localeHrefs(portfolio, (l) => paths.home(l))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(personJsonLd(portfolio, locale))} />
    </>
  );
}
