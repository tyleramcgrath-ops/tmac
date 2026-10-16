// Country picker for sign-up. Names are spelled out rather than taken from
// Intl.DisplayNames: Node and each browser ship different ICU data, and a name
// that differs between server and client breaks hydration. Flags are built
// from the ISO code's regional indicator letters.
const NAMES: Record<string, string> = {
  AE: "United Arab Emirates", AR: "Argentina", AT: "Austria", AU: "Australia", BE: "Belgium",
  BG: "Bulgaria", BR: "Brazil", CA: "Canada", CH: "Switzerland", CL: "Chile", CN: "China",
  CO: "Colombia", CR: "Costa Rica", CZ: "Czechia", DE: "Germany", DK: "Denmark",
  DO: "Dominican Republic", EC: "Ecuador", EE: "Estonia", EG: "Egypt", ES: "Spain", FI: "Finland",
  FR: "France", GB: "United Kingdom", GH: "Ghana", GR: "Greece", GT: "Guatemala", HK: "Hong Kong",
  HR: "Croatia", HU: "Hungary", ID: "Indonesia", IE: "Ireland", IL: "Israel", IN: "India",
  IS: "Iceland", IT: "Italy", JM: "Jamaica", JP: "Japan", KE: "Kenya", KR: "South Korea",
  LT: "Lithuania", LV: "Latvia", MA: "Morocco", MX: "Mexico", MY: "Malaysia", NG: "Nigeria",
  NL: "Netherlands", NO: "Norway", NZ: "New Zealand", PA: "Panama", PE: "Peru", PH: "Philippines",
  PL: "Poland", PR: "Puerto Rico", PT: "Portugal", RO: "Romania", RS: "Serbia", SE: "Sweden",
  SG: "Singapore", SI: "Slovenia", SK: "Slovakia", TH: "Thailand", TR: "Turkey", TW: "Taiwan",
  UA: "Ukraine", US: "United States", UY: "Uruguay", VE: "Venezuela", VN: "Vietnam",
  ZA: "South Africa",
};

export function flagFor(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export const COUNTRIES = Object.entries(NAMES)
  .map(([code, name]) => ({ code, name, flag: flagFor(code) }))
  .sort((a, b) => (a.name < b.name ? -1 : 1));

export function countryByCode(code: string) {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}
