import { ImageResponse } from "next/og";
import { getPortfolio } from "@/lib/content/load";
import { accentInk, isHexColor } from "@/lib/content/theme";
import { ogFonts } from "@/lib/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon generated from your initials and accent color — updates when you change either. */
export default async function Icon() {
  const portfolio = getPortfolio();
  const accent = isHexColor(portfolio.theme.accent) ? portfolio.theme.accent : "#2f5bea";
  const letters = (portfolio.profile.name.en ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: accent,
          color: accentInk(accent),
          borderRadius: 14,
          fontFamily: "Serif, SerifCyr",
          fontSize: 32,
          letterSpacing: -1,
        }}
      >
        {letters || "•"}
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
