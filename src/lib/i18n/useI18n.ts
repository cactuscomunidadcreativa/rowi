import { useEffect, useState, useCallback } from "react";

export type Dict = Record<string, string>;

// Importar traducciones locales como fallback
import esLocale from "./locales/es.json";
import enLocale from "./locales/en.json";
import ptLocale from "./locales/pt.json";
import itLocale from "./locales/it.json";

const localDicts: Record<string, Dict> = {
  es: esLocale as Dict,
  en: enLocale as Dict,
  pt: ptLocale as Dict,
  it: itLocale as Dict,
};

/**
 * Hook de traducción con fallback automático
 * 🔹 Carga el diccionario desde archivos locales + API
 * 🔹 Escucha cambios de idioma globales
 * 🔹 Si falta una traducción, intenta en otros idiomas
 * 🔹 Si no existe en ninguno, convierte la key en texto legible
 */
export function useI18n(initialLang?: string) {
  const [lang, setLang] = useState(() => {
    // Intentar leer del localStorage o usar el inicial
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("rowi.lang");
      return stored || initialLang || "es";
    }
    return initialLang || "es";
  });

  const [dict, setDict] = useState<Dict>(() => {
    // Inicializar con el diccionario local del idioma actual
    return localDicts[lang] || localDicts.es;
  });

  const [ready, setReady] = useState(false);

  // Cargar traducciones adicionales desde API
  const loadFromAPI = useCallback(async (targetLang: string) => {
    try {
      const tenant = typeof document !== "undefined"
        ? document.documentElement.getAttribute("data-tenant") || "six-seconds-global"
        : "six-seconds-global";

      const res = await fetch(
        `/api/hub/translations?format=list&lang=${targetLang}&tenantId=${tenant}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (data?.ok && Array.isArray(data.rows) && data.rows.length > 0) {
        const apiDict: Dict = {};
        for (const r of data.rows) {
          const full = r.ns ? `${r.ns}.${r.key}` : r.key;
          apiDict[full] = r[targetLang] || r.es || r.en || full;
        }
        // Combinar: local como base, API sobrescribe
        setDict(prev => ({ ...prev, ...apiDict }));
      }
    } catch (err) {
      console.warn("⚠️ No se pudieron cargar traducciones de API, usando locales");
    }
  }, []);

  // Inicialización
  useEffect(() => {
    // Cargar diccionario local inmediatamente
    const currentLang = localStorage.getItem("rowi.lang") || lang;
    const localDict = localDicts[currentLang] || localDicts.es;
    setDict(localDict);
    setLang(currentLang);
    setReady(true);

    // Intentar cargar desde API
    loadFromAPI(currentLang);
  }, []);

  // Escuchar cambios de idioma globales (desde el Provider o cualquier otro lugar)
  useEffect(() => {
    const handleLangChange = (e: CustomEvent<string>) => {
      const newLang = e.detail;
      if (newLang && newLang !== lang) {
        const localDict = localDicts[newLang] || localDicts.es;
        setDict(localDict);
        setLang(newLang);
        loadFromAPI(newLang);
      }
    };

    window.addEventListener("rowi:lang-changed", handleLangChange as EventListener);

    return () => {
      window.removeEventListener("rowi:lang-changed", handleLangChange as EventListener);
    };
  }, [lang, loadFromAPI]);

  /** Traduce con fallback y humanización */
  function t(key: string, fallback?: string): string {
    if (!ready || !key) return fallback || "...";

    // Buscar en el diccionario actual
    if (dict[key]) return dict[key];

    // Buscar en otros idiomas como fallback
    const fallbackLangs = lang === "es" ? ["en", "pt", "it"] : ["es", "en", "pt", "it"];
    for (const l of fallbackLangs) {
      const fallbackDict = localDicts[l];
      if (fallbackDict && fallbackDict[key]) return fallbackDict[key];
    }

    return fallback || humanizeKey(key);
  }

  /** Permite cambiar idioma dinámicamente */
  function setLanguage(l: string) {
    if (l === lang) return;

    // Actualizar estado local
    const localDict = localDicts[l] || localDicts.es;
    setDict(localDict);
    setLang(l);
    localStorage.setItem("rowi.lang", l);
    document.documentElement.setAttribute("data-lang", l);

    // Notificar globalmente
    window.dispatchEvent(
      new CustomEvent("rowi:lang-changed", { detail: l })
    );

    // Cargar desde API
    loadFromAPI(l);
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
