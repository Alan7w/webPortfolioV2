import { Inter, JetBrains_Mono, Manrope, Press_Start_2P, Source_Serif_4, Unbounded } from "next/font/google";

/*
 * Every face supports Cyrillic so Russian (and Uzbek names in Cyrillic) render in the same type.
 * Only the default editorial trio is preloaded; the other presets' faces load on demand.
 */

export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  variable: "--font-source-serif",
  axes: ["opsz"],
  display: "swap",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});

export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
  preload: false,
});

export const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-pixel",
  display: "swap",
  preload: false,
});

export const fontVariables = [inter, sourceSerif, jetbrains, manrope, unbounded, pixel]
  .map((font) => font.variable)
  .join(" ");
