/**
 * 🎭 Resolver de motor IA para el AI Practice Partner — PLUGGABLE.
 *
 * El motor que conduce el roleplay no está clavado a un proveedor: se resuelve
 * en runtime, con prioridad explícita, para poder enchufar CUALQUIER IA sin
 * tocar la ruta ni la UI (mismo espíritu que Rowi Sales / Rowi ECO, donde el
 * AgentConfig manda provider+model).
 *
 * Orden de resolución:
 *  1. El AgentConfig "practice" (si trae provider/model en DB) — fuente de verdad.
 *  2. Override por región/cliente vía env (p.ej. China: modelo local on-prem).
 *  3. Default: Anthropic Claude (Sonnet) — multi-turno de calidad ya integrado.
 *
 * NOTA China: cuando exista un modelo residente en China (Qwen/DeepSeek/on-prem),
 * basta con setear PRACTICE_MODEL_CN / PRACTICE_PROVIDER_CN — cero cambios de
 * código. `generateText` ya acepta `model` explícito por proveedor.
 */

import type { AIProvider } from "@/lib/ai/generate";

// Default del motor: Claude Sonnet (balance calidad/velocidad para multi-turno).
// Se inlinea el id (en vez de importar el cliente Anthropic) para no arrastrar
// la instanciación del SDK al cargar este módulo puro/testeable.
const DEFAULT_PRACTICE_MODEL = "claude-sonnet-4-6";

export interface PracticeModelChoice {
  provider: AIProvider;
  model: string;
}

/** Config del agente (subconjunto de AgentConfig) que puede fijar el motor. */
export interface PracticeAgentLike {
  provider?: string | null;
  model?: string | null;
}

/** Región del practicante (hoy se infiere del locale; mañana de tenant/jurisdicción). */
export type PracticeRegion = "cn" | "global";

const DEFAULT_CHOICE: PracticeModelChoice = {
  provider: "anthropic",
  model: DEFAULT_PRACTICE_MODEL,
};

function normalizeProvider(p: string | null | undefined): AIProvider | null {
  return p === "openai" || p === "anthropic" ? p : null;
}

/**
 * Resuelve provider+model para una sesión de práctica.
 * @param agent  AgentConfig "practice" (opcional) — su provider/model gana.
 * @param region región del practicante para overrides por jurisdicción.
 */
export function resolvePracticeModel(
  agent?: PracticeAgentLike | null,
  region: PracticeRegion = "global",
): PracticeModelChoice {
  // 1. El agente manda si declara modelo explícito.
  const agentProvider = normalizeProvider(agent?.provider);
  if (agentProvider && agent?.model) {
    return { provider: agentProvider, model: agent.model };
  }

  // 2. Override por región (China primero — PIPL/residencia).
  if (region === "cn") {
    const cnModel = process.env.PRACTICE_MODEL_CN;
    const cnProvider = normalizeProvider(process.env.PRACTICE_PROVIDER_CN);
    if (cnModel) {
      return { provider: cnProvider ?? "anthropic", model: cnModel };
    }
  }

  // 3. Override global por env (sin tocar código).
  const envModel = process.env.PRACTICE_MODEL;
  const envProvider = normalizeProvider(process.env.PRACTICE_PROVIDER);
  if (envModel) {
    return { provider: envProvider ?? DEFAULT_CHOICE.provider, model: envModel };
  }

  // 4. Default seguro.
  return DEFAULT_CHOICE;
}

/** Mapea un locale a región para el resolver (zh → cn). */
export function regionFromLocale(locale: string | null | undefined): PracticeRegion {
  return locale === "zh" ? "cn" : "global";
}
