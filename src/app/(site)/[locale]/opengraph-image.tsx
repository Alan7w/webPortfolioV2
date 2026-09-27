import { ImageResponse } from "next/og";
import { getPortfolio } from "@/lib/content/load";
import { t, UI } from "@/lib/content/i18n";
import type { Locale } from "@/lib/content/schema";
import { accentInk, isHexColor } from "@/lib/content/theme";
import { ogFonts, publicImageDataUrl } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Portfolio preview";

/** The card shown when the portfolio link is shared on Telegram, LinkedIn, Slack… */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale as Locale;
  const portfolio = getPortfolio();
  const profile = portfolio.profile;
  const accent = isHexColor(portfolio.theme.accent) ? portfolio.theme.accent : "#2f5bea";
  const [fonts, avatar] = await Promise.all([ogFonts(), publicImageDataUrl(profile.avatar)]);
  const highlights = profile.highlights.slice(0, 3);
  const bracket = (pos: Record<string, number>) => ({
    position: "absolute" as const,
    width: 22,
    height: 22,
    borderColor: accent,
    borderStyle: "solid" as const,
    borderWidth: 0,
    ...pos,
  });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f4ef", color: "#17171a", fontFamily: "Inter, InterCyr", padding: 64 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 10,
                background: accent,
                color: accentInk(accent),
                fontFamily: "Serif, SerifCyr",
                fontSize: 20,
              }}
            >
              {(profile.name.en ?? "").split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div style={{ fontSize: 20, letterSpacing: 3, textTransform: "uppercase", color: "#6f6f78" }}>
              {`Portfolio · ${UI[locale].resume}`}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Serif, SerifCyr", fontSize: 84, lineHeight: 1, letterSpacing: -2 }}>{t(profile.name, locale)}</div>
            <div style={{ marginTop: 22, fontSize: 34, color: accent, fontWeight: 600 }}>{t(profile.headline, locale)}</div>
          </div>
          <div style={{ display: "flex", gap: 44 }}>
            {highlights.map((h) => (
              <div key={h.id} style={{ display: "flex", flexDirection: "column", maxWidth: 230 }}>
                <div style={{ fontFamily: "Serif, SerifCyr", fontSize: 40 }}>{t(h.value, locale)}</div>
                <div style={{ fontSize: 17, color: "#6f6f78", lineHeight: 1.3 }}>{t(h.label, locale)}</div>
              </div>
            ))}
          </div>
        </div>
        {avatar && (
          <div style={{ display: "flex", position: "relative", marginLeft: 48, alignSelf: "center" }}>
            <img src={avatar} alt="" width={300} height={380} style={{ objectFit: "cover", borderRadius: 18 }} />
            <div style={{ ...bracket({ left: -10, top: -10 }), borderLeftWidth: 4, borderTopWidth: 4 }} />
            <div style={{ ...bracket({ right: -10, top: -10 }), borderRightWidth: 4, borderTopWidth: 4 }} />
            <div style={{ ...bracket({ left: -10, bottom: -10 }), borderLeftWidth: 4, borderBottomWidth: 4 }} />
            <div style={{ ...bracket({ right: -10, bottom: -10 }), borderRightWidth: 4, borderBottomWidth: 4 }} />
          </div>
        )}
      </div>
    ),
    { ...size, fonts },
  );
}
