/**
 * Maps ISO country codes (and common spellings) to broad regions used for
 * benchmark positioning. Falls back to "OTHER" when unknown.
 */

const REGION_BY_COUNTRY: Record<string, string> = {
  // LATAM
  MX: "LATAM", MEX: "LATAM", MEXICO: "LATAM", "MÉXICO": "LATAM",
  AR: "LATAM", ARG: "LATAM", ARGENTINA: "LATAM",
  BR: "LATAM", BRA: "LATAM", BRAZIL: "LATAM", BRASIL: "LATAM",
  CL: "LATAM", CHL: "LATAM", CHILE: "LATAM",
  CO: "LATAM", COL: "LATAM", COLOMBIA: "LATAM",
  PE: "LATAM", PER: "LATAM", PERU: "LATAM", "PERÚ": "LATAM",
  UY: "LATAM", URY: "LATAM", URUGUAY: "LATAM",
  PY: "LATAM", PRY: "LATAM", PARAGUAY: "LATAM",
  VE: "LATAM", VEN: "LATAM", VENEZUELA: "LATAM",
  BO: "LATAM", BOL: "LATAM", BOLIVIA: "LATAM",
  EC: "LATAM", ECU: "LATAM", ECUADOR: "LATAM",
  CR: "LATAM", CRI: "LATAM", "COSTA RICA": "LATAM",
  PA: "LATAM", PAN: "LATAM", PANAMA: "LATAM", "PANAMÁ": "LATAM",
  GT: "LATAM", GTM: "LATAM", GUATEMALA: "LATAM",
  SV: "LATAM", SLV: "LATAM", "EL SALVADOR": "LATAM",
  HN: "LATAM", HND: "LATAM", HONDURAS: "LATAM",
  NI: "LATAM", NIC: "LATAM", NICARAGUA: "LATAM",
  DO: "LATAM", DOM: "LATAM", "DOMINICAN REPUBLIC": "LATAM", "REPÚBLICA DOMINICANA": "LATAM",
  CU: "LATAM", CUB: "LATAM", CUBA: "LATAM",
  PR: "LATAM", PRI: "LATAM", "PUERTO RICO": "LATAM",

  // NORTHAM
  US: "NORTHAM", USA: "NORTHAM", "UNITED STATES": "NORTHAM",
  CA: "NORTHAM", CAN: "NORTHAM", CANADA: "NORTHAM", "CANADÁ": "NORTHAM",

  // EUROPE
  ES: "EUROPE", ESP: "EUROPE", SPAIN: "EUROPE", "ESPAÑA": "EUROPE",
  PT: "EUROPE", PRT: "EUROPE", PORTUGAL: "EUROPE",
  FR: "EUROPE", FRA: "EUROPE", FRANCE: "EUROPE", FRANCIA: "EUROPE",
  DE: "EUROPE", DEU: "EUROPE", GERMANY: "EUROPE", ALEMANIA: "EUROPE",
  IT: "EUROPE", ITA: "EUROPE", ITALY: "EUROPE", ITALIA: "EUROPE",
  UK: "EUROPE", GB: "EUROPE", GBR: "EUROPE", "UNITED KINGDOM": "EUROPE", ENGLAND: "EUROPE",
  IE: "EUROPE", IRL: "EUROPE", IRELAND: "EUROPE", IRLANDA: "EUROPE",
  NL: "EUROPE", NLD: "EUROPE", NETHERLANDS: "EUROPE",
  BE: "EUROPE", BEL: "EUROPE", BELGIUM: "EUROPE",
  CH: "EUROPE", CHE: "EUROPE", SWITZERLAND: "EUROPE",
  AT: "EUROPE", AUT: "EUROPE", AUSTRIA: "EUROPE",
  SE: "EUROPE", SWE: "EUROPE", SWEDEN: "EUROPE",
  NO: "EUROPE", NOR: "EUROPE", NORWAY: "EUROPE",
  DK: "EUROPE", DNK: "EUROPE", DENMARK: "EUROPE",
  FI: "EUROPE", FIN: "EUROPE", FINLAND: "EUROPE",
  PL: "EUROPE", POL: "EUROPE", POLAND: "EUROPE",
  GR: "EUROPE", GRC: "EUROPE", GREECE: "EUROPE",

  // APAC
  CN: "APAC", CHN: "APAC", CHINA: "APAC",
  JP: "APAC", JPN: "APAC", JAPAN: "APAC",
  KR: "APAC", KOR: "APAC", "SOUTH KOREA": "APAC", KOREA: "APAC",
  IN: "APAC", IND: "APAC", INDIA: "APAC",
  AU: "APAC", AUS: "APAC", AUSTRALIA: "APAC",
  NZ: "APAC", NZL: "APAC", "NEW ZEALAND": "APAC",
  SG: "APAC", SGP: "APAC", SINGAPORE: "APAC",
  TH: "APAC", THA: "APAC", THAILAND: "APAC",
  ID: "APAC", IDN: "APAC", INDONESIA: "APAC",
  MY: "APAC", MYS: "APAC", MALAYSIA: "APAC",
  PH: "APAC", PHL: "APAC", PHILIPPINES: "APAC", FILIPINAS: "APAC",
  VN: "APAC", VNM: "APAC", VIETNAM: "APAC",

  // MENA
  AE: "MENA", ARE: "MENA", "UNITED ARAB EMIRATES": "MENA", UAE: "MENA",
  SA: "MENA", SAU: "MENA", "SAUDI ARABIA": "MENA",
  EG: "MENA", EGY: "MENA", EGYPT: "MENA",
  IL: "MENA", ISR: "MENA", ISRAEL: "MENA",
  TR: "MENA", TUR: "MENA", TURKEY: "MENA",
  MA: "MENA", MAR: "MENA", MOROCCO: "MENA",

  // AFRICA
  ZA: "AFRICA", ZAF: "AFRICA", "SOUTH AFRICA": "AFRICA",
  NG: "AFRICA", NGA: "AFRICA", NIGERIA: "AFRICA",
  KE: "AFRICA", KEN: "AFRICA", KENYA: "AFRICA",
};

/**
 * Returns the broad region key for a country.
 * Accepts ISO-2, ISO-3, full English name, full Spanish name, case-insensitive.
 */
export function regionFromCountry(country: string | null | undefined): string {
  if (!country) return "OTHER";
  const key = country.trim().toUpperCase();
  return REGION_BY_COUNTRY[key] || "OTHER";
}

export const REGION_LABELS: Record<string, { es: string; en: string; pt: string; it: string }> = {
  LATAM: { es: "Latinoamérica", en: "Latin America", pt: "América Latina", it: "America Latina" },
  NORTHAM: { es: "Norteamérica", en: "North America", pt: "América do Norte", it: "Nord America" },
  EUROPE: { es: "Europa", en: "Europe", pt: "Europa", it: "Europa" },
  APAC: { es: "Asia-Pacífico", en: "Asia-Pacific", pt: "Ásia-Pacífico", it: "Asia-Pacifico" },
  MENA: { es: "Medio Oriente y Norte de África", en: "Middle East & North Africa", pt: "Oriente Médio e Norte da África", it: "Medio Oriente e Nord Africa" },
  AFRICA: { es: "África", en: "Africa", pt: "África", it: "Africa" },
  OTHER: { es: "Otra región", en: "Other region", pt: "Outra região", it: "Altra regione" },
};
