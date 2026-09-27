import type { Metadata } from "next";
import { ResumePage } from "@/components/resume/ResumePage";
import { getPortfolio } from "@/lib/content/load";
import { t, UI } from "@/lib/content/i18n";
import type { Locale } from "@/lib/content/schema";
import { buildMetadata, paths } from "@/lib/content/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/resume">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const portfolio = getPortfolio();
  return buildMetadata(portfolio, locale, {
    build: (l) => paths.resume(l),
    title: `${UI[locale].resume} — ${t(portfolio.profile.name, locale)}`,
  });
}

export default async function Resume({ params }: PageProps<"/[locale]/resume">) {
  const locale = (await params).locale as Locale;
  return <ResumePage base={getPortfolio()} locale={locale} />;
}
