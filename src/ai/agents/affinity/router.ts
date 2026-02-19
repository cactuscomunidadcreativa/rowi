// src/ai/agents/affinity/router.ts
import { AffinityRelationshipAgent } from "./relationship";
import { AffinityCommunityAgent } from "./community";
import { AffinityCustomerAgent } from "./customer";
import { AffinityTeamworkAgent } from "./teamwork";
import { registerUsage } from "../../client/registerUsage";

export const SUB_AGENTS = {
  relationship: AffinityRelationshipAgent,
  community: AffinityCommunityAgent,
  customer: AffinityCustomerAgent,
  teamwork: AffinityTeamworkAgent, // ✅ ya está enlazado
};

/**
 * 🔁 Sub-router de AFFINITY
 * - Gestiona sub-agentes (relationship, community, teamwork, customer)
 * - Reporta uso IA al Hub
 */
export async function runAffinityRouter({
  subIntent = "relationship",
  locale = "es",
  tenantId = "six-seconds-global",
  plan = "free",
  payload = {},
}: {
  subIntent?: keyof typeof SUB_AGENTS;
  locale?: string;
  tenantId?: string;
  plan?: string;
  payload?: Record<string, any>;
}) {
  const agent = SUB_AGENTS[subIntent];
  if (!agent) {
    return { ok: false, error: `Sub-agente de afinidad "${subIntent}" no encontrado.` };
  }

  // 🔒 Control de plan
  if (plan === "free" && subIntent !== "relationship") {
    return {
      ok: false,
      answer: "🔒 Este análisis de afinidad avanzada está disponible solo en planes Pro o Enterprise.",
    };
  }

  try {
    const result = await agent.run({ locale, tenantId, payload });

    // 🧾 Registrar uso IA
    if (result?.tokens && tenantId) {
      const tokens = result.tokens as any;
      await registerUsage({
        tenantId,
        feature: `AFFINITY_${subIntent.toUpperCase()}`,
        model: agent.model,
        tokensInput: tokens.prompt_tokens || tokens.input || 0,
        tokensOutput: tokens.completion_tokens || tokens.output || 0,
        costUsd: result.costUsd || 0,
      });
    }

    return {
      ok: true,
      subIntent,
      agent: agent.name,
      model: agent.model,
      color: agent.color,
      answer: result.answer || result,
      meta: {
        tenantId,
        tokens: result.tokens || null,
        costUsd: result.costUsd || 0,
      },
    };
  } catch (e: any) {
    console.error(`[AffinityRouter] Error ejecutando ${subIntent}:`, e);
    return { ok: false, error: e?.message || "Error interno en sub-agente Affinity." };
  }
}