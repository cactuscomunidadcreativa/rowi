// src/ai/agents/router.ts
import { EqAgent } from "./eq";
import { AffinityAgent } from "./affinity";
import { EcoAgent } from "./eco";
import { SalesAgent } from "./sales";
import { TrainerAgent } from "./trainer";
import { SuperAgent } from "./super";

// 🔁 Importamos el nuevo sub-router de Affinity
import { runAffinityRouter } from "./affinity/router";

export type AgentKey =
  | "eq"
  | "affinity"
  | "eco"
  | "sales"
  | "trainer"
  | "super";

export const AGENTS = {
  eq: EqAgent,
  affinity: AffinityAgent,
  eco: EcoAgent,
  sales: SalesAgent,
  trainer: TrainerAgent,
  super: SuperAgent,
};

/**
 * 🔁 Router principal de agentes Rowi AI
 * ----------------------------------------------------------
 * - Normaliza idioma
 * - Inyecta tenantId y plan
 * - Redirige a subrouters cuando corresponde (AffinityRouter)
 * - Devuelve respuesta uniforme
 */
export async function runAgent({
  intent = "eq",
  locale = "es",
  tenantId = "rowi-master",
  plan = "free", // 👈 nuevo: permite control de acceso IA
  payload = {},
}: {
  intent?: string; // puede ser "affinity" o "affinity:community"
  locale?: string;
  tenantId?: string;
  plan?: string;
  payload?: Record<string, any>;
}) {
  try {
    // 🌐 Soporte de sub-agentes tipo "affinity:community"
    const [mainIntent, subIntent] = intent.split(":") as [AgentKey, string?];

    // 🌍 Normalizar idioma (solo es/en/pt/it)
    const v = (locale || "es").toLowerCase();
    const normLocale =
      v.startsWith("pt")
        ? "pt"
        : v.startsWith("it")
        ? "it"
        : v.startsWith("en")
        ? "en"
        : "es";

    const languageName =
      normLocale === "en"
        ? "English"
        : normLocale === "pt"
        ? "Português"
        : normLocale === "it"
        ? "Italiano"
        : "Español";

    // =========================================================
    // 🚦 Derivación especial: Sub-router de AFFINITY
    // =========================================================
    if (mainIntent === "affinity" && subIntent) {
      console.log(
        `[Rowi Router → SubRouter] Affinity:${subIntent} | Locale: ${normLocale} | Tenant: ${tenantId}`
      );
      return await runAffinityRouter({
        subIntent: subIntent as any,
        locale: normLocale,
        tenantId,
        plan,
        payload,
      });
    }

    // =========================================================
    // 🚀 Ejecución de agentes estándar
    // =========================================================
    const agent = AGENTS[mainIntent];
    if (!agent) {
      return {
        ok: false,
        error: `Agente ${mainIntent} no encontrado.`,
      };
    }

    console.log(`[Rowi Router] → ${agent.name} | Locale: ${normLocale} | Tenant: ${tenantId}`);

    const result = await (agent as any).run({
      locale: normLocale,
      language: languageName,
      tenantId,
      ...payload,
    });

    // =========================================================
    // ✅ Respuesta unificada estándar
    // =========================================================
    return {
      ok: true,
      agent: agent.name,
      model: agent.model,
      color: agent.color,
      locale: normLocale,
      answer: result.answer || result,
      tokens: result.tokens || null,
      costUsd: result.costUsd || null,
    };
  } catch (e: any) {
    console.error(`[AI Router] Error ejecutando ${intent}:`, e);
    return {
      ok: false,
      error: e?.message || "Error desconocido al ejecutar agente.",
    };
  }
}