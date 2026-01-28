"use client";

import { useEffect, useState } from "react";

type Translations = Record<string, string>;
const cache: Record<string, Translations> = {};

/**
 * 🎯 useI18n — Hook de traducción en cliente (versión BD real)
 * -------------------------------------------------------------
 * ✔ Carga traducciones desde Prisma vía /api/hub/translations?format=dict
 * ✔ Escucha cambios de idioma globales
 * ✔ Cachea por tenant + idioma
 * ✔ Soporta fallback automático si una clave no se encuentra
 */
export function useI18n(defaultNs = "common") {
  const [locale, setLocale] = useState<"es" | "en" | "pt" | "it">("es");
  const [tData, setTData] = useState<Translations>({});

  /* =========================================================
     🌍 Inicializar idioma al montar
  ========================================================== */
  useEffect(() => {
    const stored =
      (localStorage.getItem("rowi.lang") as string) ||
      document.documentElement.getAttribute("data-lang") ||
      "es";

    const safeLang = ["es", "en", "pt", "it"].includes(stored)
      ? (stored as "es" | "en" | "pt" | "it")
      : "es";

    setLocale(safeLang);
  }, []);

  /* =========================================================
     🔁 Escuchar cambio de idioma global (sin reload)
  ========================================================== */
  useEffect(() => {
    const onLangChange = (e: CustomEvent) => {
      const next = e.detail;
      if (next && next !== locale) {
        console.log("🌐 Cambio de idioma detectado:", next);
        Object.keys(cache).forEach((k) => {
          if (k.startsWith(`${locale}:`)) delete cache[k];
        });
        setLocale(next);
      }
    };

    window.addEventListener("rowi:lang-changed", onLangChange as EventListener);
    return () =>
      window.removeEventListener("rowi:lang-changed", onLangChange as EventListener);
  }, [locale]);

  /* =========================================================
     🧠 Cargar traducciones desde Prisma (vía API)
  ========================================================== */
  useEffect(() => {
    const tenant =
      document.documentElement.getAttribute("data-tenant") || "rowi-master";
    const cacheKey = `${tenant}:${locale}`;

    // Si ya están cacheadas, no recarga
    if (cache[cacheKey]) {
      setTData(cache[cacheKey]);
      return;
    }

    (async () => {
      try {
        console.log(`🌍 Cargando traducciones desde BD (${locale})...`);
        const res = await fetch(`/api/hub/translations?format=dict&lang=${locale}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (data?.ok && data?.dict) {
          cache[cacheKey] = data.dict;
          setTData(data.dict);
          console.log(`✅ ${Object.keys(data.dict).length} traducciones cargadas.`);
        } else {
          console.warn("⚠️ No se encontraron traducciones válidas para:", locale);
        }
      } catch (err) {
        console.error("❌ Error al cargar traducciones desde BD:", err);
      }
    })();
  }, [locale, defaultNs]);

  /* =========================================================
     🔠 Función traductora tolerante
  ========================================================== */
  function t(key: string, fallback?: string): string {
    if (tData[key]) return tData[key];

    // Busca coincidencia por sufijo (ej: “dashboard” → “page.dashboard”)
    const simple = key.split(".").pop()!;
    const match = Object.entries(tData).find(([k]) =>
      k.toLowerCase().endsWith(simple.toLowerCase())
    );
    if (match) return match[1];

    return fallback || key;
  }

  return { t, locale, setLocale };
}