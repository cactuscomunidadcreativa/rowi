/**
 * Loader de pesos calibrados del motor de afinidad (Fase 4/6).
 *
 * Lee la versión `active` de AffinityWeights para un scope y la devuelve
 * como AffinityWeightOverride para inyectar en el motor puro. Si no hay
 * pesos calibrados, devuelve undefined → el motor usa la hipótesis v0
 * hardcoded (fallback seguro). Cacheado por instancia serverless.
 */

import { prisma } from "@/core/prisma";
import type { AffinityWeightOverride } from "@/domains/affinity/lib/affinityEngine";

type CacheEntry = { value: AffinityWeightOverride | undefined; at: number };
const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Carga el override de pesos activo para un scope ("global" | "tenant:<id>" ...).
 * Resuelve en cascada: scope específico → global → undefined (hardcoded).
 */
export async function loadAffinityWeights(
  scope = "global"
): Promise<AffinityWeightOverride | undefined> {
  const cached = CACHE.get(scope);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  let value: AffinityWeightOverride | undefined;
  try {
    const row = await prisma.affinityWeights.findFirst({
      where: { scope, active: true },
      orderBy: { version: "desc" },
    });
    if (row?.payload && typeof row.payload === "object") {
      value = row.payload as AffinityWeightOverride;
    }
  } catch {
    // Tabla ausente o sin migrar → fallback a hardcoded.
    value = undefined;
  }

  CACHE.set(scope, { value, at: Date.now() });
  return value;
}

/** Invalida el cache (tras promover una nueva versión de pesos). */
export function invalidateAffinityWeightsCache(scope?: string) {
  if (scope) CACHE.delete(scope);
  else CACHE.clear();
}
