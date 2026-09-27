import type { Obyektivka, Portfolio } from "./schema";
import { parseDate, isPresent } from "./dates";
import { uid } from "./derive";
import { latinToCyrillic } from "./translit";

/** Printed labels of the standard Uzbek "Ma’lumotnoma" (Obyektivka), in both scripts. */
export const OBY_LABELS = {
  cyrl: {
    title: "МАЪЛУМОТНОМА",
    birthDate: "Туғилган йили:",
    birthPlace: "Туғилган жойи:",
    nationality: "Миллати:",
    party: "Партиявийлиги:",
    education: "Маълумоти:",
    graduated: "Тамомлаган:",
    specialty: "Маълумоти бўйича мутахассислиги:",
    degree: "Илмий даражаси:",
    academicTitle: "Илмий унвони:",
    languages: "Қайси чет тилларини билади:",
    stateAwards: "Давлат мукофотлари билан тақдирланганми (қанақа):",
    electedBodies:
      "Халқ депутатлари, республика, вилоят, шаҳар ва туман Кенгаши депутатими ёки бошқа сайланадиган органларнинг аъзосими (тўлиқ кўрсатилиши лозим):",
    work: "МЕҲНАТ ФАОЛИЯТИ",
    relation: "Қариндошлиги",
    fullName: "Фамилияси, исми ва отасининг исми",
    birth: "Туғилган йили ва жойи",
    workplace: "Иш жойи ва лавозими",
    address: "Турар жойи",
    relativesSuffix: "нинг яқин қариндошлари ҳақида",
    relativesHeading: "МАЪЛУМОТ",
    year: "й.",
    months: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
    now: "ҳозирги вақтгача",
  },
  latn: {
    title: "MA’LUMOTNOMA",
    birthDate: "Tug‘ilgan yili:",
    birthPlace: "Tug‘ilgan joyi:",
    nationality: "Millati:",
    party: "Partiyaviyligi:",
    education: "Ma’lumoti:",
    graduated: "Tamomlagan:",
    specialty: "Ma’lumoti bo‘yicha mutaxassisligi:",
    degree: "Ilmiy darajasi:",
    academicTitle: "Ilmiy unvoni:",
    languages: "Qaysi chet tillarini biladi:",
    stateAwards: "Davlat mukofotlari bilan taqdirlanganmi (qanaqa):",
    electedBodies:
      "Xalq deputatlari, respublika, viloyat, shahar va tuman Kengashi deputatimi yoki boshqa saylanadigan organlarning a’zosimi (to‘liq ko‘rsatilishi lozim):",
    work: "MEHNAT FAOLIYATI",
    relation: "Qarindoshligi",
    fullName: "Familiyasi, ismi va otasining ismi",
    birth: "Tug‘ilgan yili va joyi",
    workplace: "Ish joyi va lavozimi",
    address: "Turar joyi",
    relativesSuffix: "ning yaqin qarindoshlari haqida",
    relativesHeading: "MA’LUMOT",
    year: "y.",
    months: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
    now: "hozirgi vaqtgacha",
  },
} as const;

/** The basic fields, in printed order (the extra fields follow). */
export const OBY_FIELDS = [
  ["birthDate", "birthPlace"],
  ["nationality", "party"],
  ["education", "graduated"],
  ["specialty", null],
  ["degree", "academicTitle"],
  ["languages", null],
  ["stateAwards", null],
  ["electedBodies", null],
] as const;

function period(value: string, script: Obyektivka["script"]) {
  const labels = OBY_LABELS[script];
  if (isPresent(value)) return labels.now;
  const d = parseDate(value);
  if (!d) return value;
  return d.month ? `${d.year} ${labels.year} ${labels.months[d.month - 1]}` : `${d.year} ${labels.year}`;
}

/**
 * Suggest МЕҲНАТ ФАОЛИЯТИ rows from dated portfolio entries (oldest first), using the Uzbek
 * translations and converting them to Cyrillic when needed. Always review before printing.
 */
export function suggestWorkRows(portfolio: Portfolio, script: Obyektivka["script"]): Obyektivka["work"] {
  const rows: { sort: string; period: string; text: string }[] = [];
  for (const section of portfolio.sections) {
    if (!["experience", "education"].includes(section.kind)) continue;
    for (const item of section.items) {
      if (!item.start) continue;
      const title = item.title.uz || item.title.en || "";
      const org = item.subtitle.uz || item.subtitle.en || "";
      const range = item.end && item.end !== item.start ? `${period(item.start, script)} – ${period(item.end, script)}` : period(item.start, script);
      const text = [org, title].filter(Boolean).join(" — ");
      rows.push({ sort: item.start, period: range, text: script === "cyrl" ? latinToCyrillic(text) : text });
    }
  }
  return rows.sort((a, b) => a.sort.localeCompare(b.sort)).map((row) => ({ id: uid("w"), period: row.period, text: row.text }));
}
