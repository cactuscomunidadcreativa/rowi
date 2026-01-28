import { useEffect, useState } from "react";

export type Dict = Record<string, string>;

/**
 * Hook de traducción con fallback automático
 * 🔹 Carga el diccionario desde la API
 * 🔹 Si falta una traducción, intenta en otros idiomas
 * 🔹 Si no existe en ninguno, convierte la key en texto legible
 */
export function useI18n(initialLang: string = "es") {
  const [lang, setLang] = useState(initialLang);
  const [dicts, setDicts] = useState<Record<string, Dict>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const langs = ["es", "en", "pt", "it"];
        const loaded: Record<string, Dict> = {};

        // Cargar todos los idiomas desde la API
        for (const l of langs) {
          const res = await fetch(`/api/i18n/dict?lang=${l}`, { cache: "no-store" });
          const json = await res.json();
          loaded[l] = json.dict || {};
        }

        setDicts(loaded);
        setReady(true);
      } catch (err) {
        console.error("❌ Error cargando diccionarios i18n:", err);
        setReady(true);
      }
    })();
  }, []);

  /** Traduce con fallback y humanización */
  function t(key: string, fallback?: string): string {
    if (!ready || !key) return "...";
    const langs = [lang, "es", "en", "pt", "it"];
    for (const l of langs) {
      const dict = dicts[l] || {};
      if (dict[key]) return dict[key];
    }
    return fallback || humanizeKey(key);
  }

  /** Permite cambiar idioma dinámicamente */
  function setLanguage(l: string) {
    setLang(l);
    localStorage.setItem("lang", l);
  }

  return { t, lang, setLanguage, ready };
}

/** Convierte una key tipo nav.dashboard → Dashboard */
function humanizeKey(key: string): string {
  return key
    .split(".")
    .pop()!
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}