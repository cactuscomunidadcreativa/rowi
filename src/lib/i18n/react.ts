"use client";

/**
 * 🔄 useI18n — Wrapper LEGACY (DEPRECATED)
 * ---------------------------------------------------------
 * Mantiene la firma `{ t, locale, setLocale }` que usaban
 * los componentes antes de consolidar en I18nProvider.
 *
 * No mantiene state propio: todo viene del contexto del Provider.
 * Esto elimina las race conditions y el cache duplicado de
 * traducciones que existían cuando este hook tenía su propio
 * fetch + cache + listener del evento `rowi:lang-changed`.
 *
 * Para componentes nuevos, importar directamente desde:
 *   import { useI18n } from "@/lib/i18n/I18nProvider";
 */
import { useI18n as useProvider } from "./I18nProvider";

export function useI18n(_defaultNs = "common") {
  const { t, lang, setLang } = useProvider();
  return {
    t,
    /** Alias legacy: el Provider la expone como `lang` */
    locale: lang,
    /** Alias legacy: el Provider la expone como `setLang` */
    setLocale: setLang,
  };
}
