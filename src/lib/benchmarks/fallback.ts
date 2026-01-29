/**
 * 🔄 BENCHMARK FALLBACK
 * Lógica de fallback inteligente cuando no hay suficiente muestra
 */

import { MIN_SAMPLE_SIZE } from "./statistics";

// =========================================================
// 📊 TIPOS
// =========================================================

export interface FallbackContext {
  country?: string | null;
  region?: string | null;
  sector?: string | null;
  jobRole?: string | null;
  tenantId?: string | null;
  hubId?: string | null;
  teamId?: string | null;
  communityId?: string | null;
}

export interface FallbackResult<T> {
  data: T | null;
  fallbackLevel: FallbackLevel;
  originalContext: FallbackContext;
  usedContext: FallbackContext;
  sampleSize: number;
}

export type FallbackLevel =
  | "exact" // Todos los filtros coinciden
  | "country_sector" // País + sector
  | "country" // Solo país
  | "region_sector" // Región + sector
  | "region" // Solo región
  | "global"; // Sin filtros

// =========================================================
// 🔄 CADENA DE FALLBACK
// =========================================================

/**
 * Orden de fallback para comparaciones:
 * 1. Exacto (país + sector + rol + tenant)
 * 2. País + sector + rol
 * 3. País + sector
 * 4. País
 * 5. Región + sector
 * 6. Región
 * 7. Global
 */
export const FALLBACK_CHAIN: { level: FallbackLevel; keepFields: (keyof FallbackContext)[] }[] = [
  { level: "exact", keepFields: ["country", "region", "sector", "jobRole", "tenantId", "hubId", "teamId", "communityId"] },
  { level: "country_sector", keepFields: ["country", "sector", "jobRole"] },
  { level: "country_sector", keepFields: ["country", "sector"] },
  { level: "country", keepFields: ["country"] },
  { level: "region_sector", keepFields: ["region", "sector"] },
  { level: "region", keepFields: ["region"] },
  { level: "global", keepFields: [] },
];

/**
 * Genera un contexto filtrado basado en los campos a mantener
 */
export function createFilteredContext(
  original: FallbackContext,
  keepFields: (keyof FallbackContext)[]
): FallbackContext {
  const filtered: FallbackContext = {};
  for (const field of keepFields) {
    if (original[field]) {
      filtered[field] = original[field];
    }
  }
  return filtered;
}

/**
 * Ejecuta una función con fallback automático
 * @param context El contexto original de comparación
 * @param fetchFn Función que busca datos con un contexto dado
 * @param minSample Tamaño mínimo de muestra requerido
 */
export async function withFallback<T>(
  context: FallbackContext,
  fetchFn: (ctx: FallbackContext) => Promise<{ data: T | null; sampleSize: number }>,
  minSample: number = MIN_SAMPLE_SIZE
): Promise<FallbackResult<T>> {
  for (const { level, keepFields } of FALLBACK_CHAIN) {
    const filteredContext = createFilteredContext(context, keepFields);
    const result = await fetchFn(filteredContext);

    if (result.data !== null && result.sampleSize >= minSample) {
      return {
        data: result.data,
        fallbackLevel: level,
        originalContext: context,
        usedContext: filteredContext,
        sampleSize: result.sampleSize,
      };
    }
  }

  // Si ningún fallback funciona, retornar null con nivel global
  return {
    data: null,
    fallbackLevel: "global",
    originalContext: context,
    usedContext: {},
    sampleSize: 0,
  };
}

/**
 * Versión síncrona de withFallback para cuando ya tenemos los datos en memoria
 */
export function withFallbackSync<T>(
  context: FallbackContext,
  fetchFn: (ctx: FallbackContext) => { data: T | null; sampleSize: number },
  minSample: number = MIN_SAMPLE_SIZE
): FallbackResult<T> {
  for (const { level, keepFields } of FALLBACK_CHAIN) {
    const filteredContext = createFilteredContext(context, keepFields);
    const result = fetchFn(filteredContext);

    if (result.data !== null && result.sampleSize >= minSample) {
      return {
        data: result.data,
        fallbackLevel: level,
        originalContext: context,
        usedContext: filteredContext,
        sampleSize: result.sampleSize,
      };
    }
  }

  return {
    data: null,
    fallbackLevel: "global",
    originalContext: context,
    usedContext: {},
    sampleSize: 0,
  };
}

// =========================================================
// 🎯 HELPERS DE FALLBACK
// =========================================================

/**
 * Determina si un contexto está vacío (global)
 */
export function isEmptyContext(context: FallbackContext): boolean {
  return Object.values(context).every((v) => !v);
}

/**
 * Genera un mensaje de fallback para mostrar al usuario
 */
export function getFallbackMessage(
  level: FallbackLevel,
  locale: "es" | "en" = "es"
): string {
  const messages: Record<FallbackLevel, { es: string; en: string }> = {
    exact: {
      es: "Comparación con contexto exacto",
      en: "Comparison with exact context",
    },
    country_sector: {
      es: "Comparación con país y sector (muestra ampliada)",
      en: "Comparison with country and sector (expanded sample)",
    },
    country: {
      es: "Comparación con promedio del país",
      en: "Comparison with country average",
    },
    region_sector: {
      es: "Comparación con región y sector",
      en: "Comparison with region and sector",
    },
    region: {
      es: "Comparación con promedio regional",
      en: "Comparison with regional average",
    },
    global: {
      es: "Comparación con promedio global",
      en: "Comparison with global average",
    },
  };

  return messages[level][locale];
}

/**
 * Obtiene el nivel de precisión del fallback (0-100)
 */
export function getFallbackPrecision(level: FallbackLevel): number {
  const precision: Record<FallbackLevel, number> = {
    exact: 100,
    country_sector: 80,
    country: 60,
    region_sector: 50,
    region: 40,
    global: 20,
  };
  return precision[level];
}

/**
 * Genera la descripción del contexto usado
 */
export function describeContext(
  context: FallbackContext,
  locale: "es" | "en" = "es"
): string {
  const parts: string[] = [];

  if (context.tenantId) {
    parts.push(locale === "es" ? "organización" : "organization");
  }
  if (context.hubId) {
    parts.push(locale === "es" ? "hub" : "hub");
  }
  if (context.country) {
    parts.push(context.country);
  }
  if (context.region) {
    parts.push(context.region);
  }
  if (context.sector) {
    parts.push(context.sector);
  }
  if (context.jobRole) {
    parts.push(context.jobRole);
  }

  if (parts.length === 0) {
    return locale === "es" ? "global" : "global";
  }

  return parts.join(", ");
}
