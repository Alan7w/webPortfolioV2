import type { Viewport } from "next";
import { notFound } from "next/navigation";
import "../../globals.css";
import { fontVariables } from "@/lib/fonts";
import { getPortfolio } from "@/lib/content/load";
import { isLocale } from "@/lib/content/i18n";
import { enabledLocales } from "@/lib/content/seo";
import { themeAttributes, themeInitScript } from "@/lib/content/theme";

export const dynamicParams = false;

export function generateStaticParams() {
  return enabledLocales(getPortfolio()).map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1012" },
  ],
};

export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const portfolio = getPortfolio();
  const theme = themeAttributes(portfolio.theme);

  return (
    <html
      lang={locale}
      data-theme={theme["data-theme"]}
      data-radius={theme["data-radius"]}
      data-motion={theme["data-motion"]}
      style={theme.style}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript(portfolio.theme.mode) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
