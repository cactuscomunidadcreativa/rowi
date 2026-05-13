"use client";

/**
 * 🔄 useI18n — Wrapper LEGACY (DEPRECATED)
 * ---------------------------------------------------------
 * Mantiene la firma `{ t, lang, setLanguage, ready }` que usaban
 * los componentes antes de consolidar en I18nProvider.
 *
 * No mantiene state propio: todo viene del contexto del Provider.
 * Esto elimina las race conditions que ocurrían cuando este hook
 * tenía su propio localStorage write y peleaba con el Provider.
 *
 * Para componentes nuevos, importar directamente desde:
 *   import { useI18n } from "@/lib/i18n/I18nProvider";
 */
import { useI18n as useProvider } from "./I18nProvider";

export type Dict = Record<string, string>;

export function useI18n(_initialLang?: string) {
  const { t, lang, setLang, ready } = useProvider();
  return {
    t,
    lang,
    /** Alias legacy: el Provider la expone como `setLang` */
    setLanguage: setLang,
    ready,
  };
}
