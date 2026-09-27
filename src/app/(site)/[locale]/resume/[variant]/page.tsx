import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumePage } from "@/components/resume/ResumePage";
import { findVariant } from "@/lib/content/derive";
import { getPortfolio } from "@/lib/content/load";
import { t, UI } from "@/lib/content/i18n";
import type { Locale } from "@/lib/content/schema";
import { buildMetadata, paths } from "@/lib/content/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPortfolio().variants.map((variant) => ({ variant: variant.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/resume/[variant]">): Promise<Metadata> {
  const { locale: raw, variant } = await params;
  const locale = raw as Locale;
  const portfolio = getPortfolio();
  return buildMetadata(portfolio, locale, {
    build: (l) => paths.resume(l, variant),
    title: `${UI[locale].resume} — ${t(portfolio.profile.name, locale)}`,
    noindex: true,
  });
}

export default async function VariantResume({ params }: PageProps<"/[locale]/resume/[variant]">) {
  const { locale, variant } = await params;
  const base = getPortfolio();
  if (!findVariant(base, variant)) notFound();
  return <ResumePage base={base} locale={locale as Locale} variantSlug={variant} />;
}
