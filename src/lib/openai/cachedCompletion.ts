/**
 * =========================================================
 * 💾 cachedCompletion — Capa de cache de respuestas IA
 * =========================================================
 *
 * Fase 1 del knowledge layer (ver ROWI_KNOWLEDGE_LAYER_AUDITORIA.md).
 *
 * Envuelve una llamada a OpenAI con una capa de cache persistente
 * (tabla AIResponseCache). Si ya generamos una respuesta para el mismo
 * (kind + prompt normalizado + scope), la servimos desde la DB sin
 * volver a pagar OpenAI. Cada respuesta cacheada es además corpus para
 * entrenar Rowi LLM más adelante.
 *
 * USO:
 * ```ts
 * const text = await cachedCompletion({
 *   kind: "affinity_interpret",
 *   prompt: `Analiza la relación entre ${a} y ${b} en ${ctx}`,
 *   scope: `tenant:${tenantId}`,
 *   model: "gpt-4o-mini",
 *   maxTokens: 400,
 *   call: async (openai) => (await openai.chat.completions.create({...}))
 *           .choices?.[0]?.message?.content ?? "",
 * });
 * ```
 *
 * Si OpenAI no está configurado o la llamada falla, devuelve `fallback`
 * (si se provee) o lanza — nunca rompe silenciosamente el cache.
 */

import { createHash } from "crypto";
import type OpenAI from "openai";
import { prisma } from "@/core/prisma";
import { getOpenAIClient } from "@/lib/openai/client";

export type CachedCompletionParams = {
  /** Categoría de la respuesta (para agrupar y purgar). */
  kind: string;
  /** El prompt o clave semántica que identifica la respuesta. */
  prompt: string;
  /** Ámbito de aislamiento del cache. Default "global". */
  scope?: string;
  /** Modelo usado (se guarda con la respuesta). */
  model: string;
  /** La llamada real a OpenAI; recibe el cliente y devuelve el texto. */
  call: (openai: OpenAI) => Promise<string>;
  /** Si la respuesta cacheada tiene más de esto (ms), se ignora. Default: sin expiración. */
  maxAgeMs?: number;
  /** Valor a devolver si OpenAI falla y no hay cache. Si no se da, relanza. */
  fallback?: string;
};

/** Normaliza el prompt para que variaciones triviales compartan cache. */
function normalize(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").toLowerCase();
}

function hashKey(kind: string, prompt: string): string {
  return createHash("sha256").update(`${kind}::${normalize(prompt)}`).digest("hex");
}

export async function cachedCompletion(params: CachedCompletionParams): Promise<{
  text: string;
  cached: boolean;
}> {
  const scope = params.scope ?? "global";
  const promptHash = hashKey(params.kind, params.prompt);

  // 1) Intentar servir desde cache.
  try {
    const hit = await prisma.aIResponseCache.findUnique({
      where: { promptHash_scope: { promptHash, scope } },
    });
    if (hit) {
      const fresh =
        params.maxAgeMs == null ||
        Date.now() - hit.createdAt.getTime() <= params.maxAgeMs;
      if (fresh) {
        // Actualizar contador de hits (fire-and-forget, no bloquea).
        prisma.aIResponseCache
          .update({
            where: { id: hit.id },
            data: { hits: { increment: 1 }, lastHitAt: new Date() },
          })
          .catch(() => {});
        return { text: hit.response, cached: true };
      }
    }
  } catch {
    // Si la tabla no existe aún (migración) seguimos a la llamada en vivo.
  }

  // 2) No hay cache fresco → llamar a OpenAI.
  let text: string;
  try {
    const openai = await getOpenAIClient();
    text = await params.call(openai);
  } catch (e) {
    if (params.fallback != null) return { text: params.fallback, cached: false };
    throw e;
  }

  // 3) Persistir en cache (no bloquea el retorno si falla).
  try {
    await prisma.aIResponseCache.upsert({
      where: { promptHash_scope: { promptHash, scope } },
      create: {
        promptHash,
        scope,
        kind: params.kind,
        model: params.model,
        response: text,
      },
      update: { response: text, model: params.model, createdAt: new Date() },
    });
  } catch {
    // Cache best-effort: si falla la escritura, igual devolvemos la respuesta.
  }

  return { text, cached: false };
}
