/**
 * =========================================================
 * 🧠 Anthropic (Claude) Client — Cliente centralizado
 * =========================================================
 *
 * Espejo de src/lib/openai/client.ts para Claude. Obtiene la API key
 * de forma segura: primero desde SystemConfig (DB, encriptada), luego
 * desde la variable de entorno como fallback.
 *
 * Se usa para tareas PESADAS donde Claude rinde mejor: el consultor,
 * reportes, presentaciones, análisis largos. OpenAI sigue para el resto
 * (chat ligero, clasificación, inferencias rápidas).
 *
 * USO:
 * ```ts
 * import { getAnthropicClient } from "@/lib/anthropic/client";
 * const claude = await getAnthropicClient();
 * const msg = await claude.messages.create({
 *   model: CLAUDE_MODELS.heavy,
 *   max_tokens: 4000,
 *   messages: [{ role: "user", content: "..." }],
 * });
 * ```
 */

import Anthropic from "@anthropic-ai/sdk";
import { getSystemConfig } from "@/lib/config/systemConfig";

/** Modelos Claude por tarea (ver claude-api skill — model IDs verificados). */
export const CLAUDE_MODELS = {
  /** Tareas pesadas: consultor, reportes, presentaciones, análisis largos. */
  heavy: "claude-opus-4-8",
  /** Balance velocidad/calidad para tareas medias. */
  balanced: "claude-sonnet-4-6",
  /** Tareas rápidas y baratas. */
  fast: "claude-haiku-4-5",
} as const;

// Cache del cliente por instancia serverless (evita recrearlo).
let cachedClient: Anthropic | null = null;
let cachedApiKey: string | null = null;

/**
 * Obtiene un cliente de Anthropic configurado con la API key del sistema.
 * Lanza si no está configurada (igual que getOpenAIClient).
 */
export async function getAnthropicClient(): Promise<Anthropic> {
  const apiKey = await getSystemConfig("ANTHROPIC_API_KEY");

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY no está configurada. Ve a Admin > Configuración (categoría IA) para configurarla."
    );
  }

  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }

  cachedClient = new Anthropic({ apiKey });
  cachedApiKey = apiKey;
  return cachedClient;
}

/** Verifica si Anthropic está configurado (sin lanzar). */
export async function isAnthropicConfigured(): Promise<boolean> {
  const apiKey = await getSystemConfig("ANTHROPIC_API_KEY");
  return !!apiKey;
}

/** Invalida el cache del cliente (tras actualizar la API key en admin). */
export function invalidateAnthropicClientCache(): void {
  cachedClient = null;
  cachedApiKey = null;
}
