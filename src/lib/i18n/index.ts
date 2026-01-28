import es from "./locales/es.json";
import en from "./locales/en.json";
import pt from "./locales/pt.json";
import it from "./locales/it.json";

export const defaultLocale = "es" as const;
export const locales = ["es","en","pt","it"] as const;
export type Locale = typeof locales[number];

const dictionaries: Record<Locale, Record<string,string>> = {
  es: es as Record<string, any>,
  en: en as Record<string, any>,
  pt: pt as Record<string, any>,
  it: it as Record<string, any>,
};

export function normalizeLocale(s?: string|null): Locale {
  const v = (s || "").toLowerCase();
  if (v.startsWith("pt")) return "pt";
  if (v.startsWith("en")) return "en";
  if (v.startsWith("it")) return "it";
  return defaultLocale;
}

export function getLang(locale: Locale) {
  return dictionaries[locale] || dictionaries[defaultLocale];
}

export function t(locale: Locale, key: string): string {
  const d = getLang(locale);
  return d[key] || getLang(defaultLocale)[key] || key;
}
