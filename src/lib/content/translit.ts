/**
 * Uzbek Latin ⇄ Cyrillic transliteration (for the Obyektivka and Uzbek content).
 * It follows the official 1995 alphabet rules; English words and brand names
 * (anything with c, w, "th", or written in ALL CAPS) are left untouched. Always review the result.
 */

const OKINA = /[‘ʻ`']/; // o‘ g‘
const TUTUQ = /[’ʼ]/; // a’lo, ma’lumot

const LAT_SINGLE: Record<string, string> = {
  a: "а", b: "б", d: "д", e: "е", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л", m: "м",
  n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з",
};
const VOWELS_LAT = "aeiouAEIOU";

const ENGLISH = new Set(["the", "of", "and", "for", "at", "in", "on", "to", "with", "by", "from", "is", "an"]);

function keepAsIs(word: string) {
  const letters = word.replace(/[^A-Za-z]/g, "");
  if (!letters) return true;
  if (ENGLISH.has(letters.toLowerCase())) return true;
  // c (outside "ch"), w and "th" don't occur in Uzbek Latin; consonant + final "y" is English-like ("University").
  if (/c(?!h)|w|th/i.test(word) || /[^aeiou]y$/i.test(letters)) return true;
  // Short acronyms (UGTA, HTML) stay; Uzbek ones with q/x (AQSH) are converted.
  return letters.length >= 2 && letters.length <= 5 && letters === letters.toUpperCase() && !/[QX]/.test(letters);
}

function applyCase(source: string, target: string) {
  if (source === source.toUpperCase() && source.length > 1 && source !== source.toLowerCase()) return target.toUpperCase();
  if (source[0] && source[0] === source[0].toUpperCase() && source[0] !== source[0].toLowerCase())
    return target[0].toUpperCase() + target.slice(1);
  return target;
}

function latinWord(word: string): string {
  if (keepAsIs(word)) return word;
  let out = "";
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const next = word[i + 1] ?? "";
    const lower = ch.toLowerCase();
    const pair = lower + next.toLowerCase();
    const prev = word[i - 1] ?? "";
    const atStart = i === 0 || !/[A-Za-z‘ʻ’ʼ']/.test(prev);
    if ((lower === "o" || lower === "g") && OKINA.test(next)) {
      out += applyCase(ch, lower === "o" ? "ў" : "ғ");
      i++;
    } else if (pair === "sh" || pair === "ch") {
      out += applyCase(ch + next, pair === "sh" ? "ш" : "ч");
      i++;
    } else if (pair === "yo" && OKINA.test(word[i + 2] ?? "")) {
      // "yo‘l" is й + ў, not ё
      out += applyCase(ch, "й");
    } else if (pair === "yo" || pair === "yu" || pair === "ya") {
      out += applyCase(ch + next, { yo: "ё", yu: "ю", ya: "я" }[pair]!);
      i++;
    } else if (pair === "ye" && (atStart || VOWELS_LAT.includes(prev))) {
      out += applyCase(ch + next, "е");
      i++;
    } else if (lower === "e") {
      out += applyCase(ch, atStart || VOWELS_LAT.includes(prev) ? "э" : "е");
    } else if (TUTUQ.test(ch) || (ch === "'" && i > 0)) {
      out += "ъ";
    } else if (LAT_SINGLE[lower]) {
      out += applyCase(ch, LAT_SINGLE[lower]);
    } else out += ch;
  }
  return out;
}

export function latinToCyrillic(text: string): string {
  return text.replace(/[A-Za-z‘ʻ’ʼ'`]+/g, (word) => latinWord(word));
}

const CYR_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ғ: "g‘", д: "d", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", қ: "q",
  л: "l", м: "m", н: "n", о: "o", ў: "o‘", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ҳ: "h",
  ч: "ch", ш: "sh", щ: "sh", ъ: "’", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
};
const VOWELS_CYR = "аеёиоуўэюяАЕЁИОУЎЭЮЯ";

export function cyrillicToLatin(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const lower = ch.toLowerCase();
    const isUpper = ch !== lower;
    const prev = text[i - 1] ?? "";
    const next = text[i + 1] ?? "";
    const atStart = i === 0 || !/[\p{L}]/u.test(prev);
    let mapped: string | undefined;
    if (lower === "е") mapped = atStart || VOWELS_CYR.includes(prev) || prev === "ъ" || prev === "ь" ? "ye" : "e";
    else if (lower === "ц") mapped = atStart ? "s" : "ts";
    else mapped = CYR_MAP[lower];
    if (mapped === undefined) {
      out += ch;
      continue;
    }
    if (isUpper && mapped) {
      const wordUpper = next && next !== next.toLowerCase();
      mapped = wordUpper ? mapped.toUpperCase() : mapped[0].toUpperCase() + mapped.slice(1);
    }
    out += mapped;
  }
  return out;
}

export function detectScript(text: string): "cyrl" | "latn" | "none" {
  const cyr = (text.match(/[Ѐ-ӿ]/g) ?? []).length;
  const lat = (text.match(/[A-Za-z]/g) ?? []).length;
  if (!cyr && !lat) return "none";
  return cyr >= lat ? "cyrl" : "latn";
}

export function toScript(text: string, script: "cyrl" | "latn"): string {
  return script === "cyrl" ? latinToCyrillic(text) : cyrillicToLatin(text);
}
