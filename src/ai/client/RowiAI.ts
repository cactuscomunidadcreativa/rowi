// src/ai/RowiAI.ts
import { runAgent } from "../agents/router";
import { registerUsage } from "./registerUsage";

/**
 * =========================================================
 * 🔹 RowiAI — Wrapper Universal (conectado al Hub Maestro)
 * =========================================================
 * - Reemplaza las llamadas directas a OpenAI
 * - Pasa por runAgent(), que valida AgentConfig
 * - Registra tokens reales en UsageDaily
 * =========================================================
 */
export async function RowiAI({
  tenantId = "six-seconds-global",
  intent = "super",
  locale = "es",
  ask = "",
  payload = {},
}: {
  tenantId?: string;
  intent?: string;
  locale?: "es" | "en" | "pt" | "it";
  ask?: string;
  payload?: Record<string, any>;
}) {
  try {
    // 🚀 Ejecutar usando el router de agentes
    const result = await runAgent({
      intent,
      locale,
      payload: { ...payload, ask, tenantId },
    });

    if (!result.ok) {
      throw new Error((result as any).error || "Error ejecutando RowiAI");
    }

    // 📊 Registrar uso IA si el agente lo reporta
    const tokensInput = (result as any).tokensInput || 0;
    const tokensOutput = (result as any).tokensOutput || 0;
    const costUsd = ((tokensInput + tokensOutput) / 1000) * 0.002;

    await registerUsage({
      tenantId,
      feature: intent.toUpperCase(),
      model: result.model || "gpt-4o-mini",
      tokensInput,
      tokensOutput,
      costUsd,
    });

    return {
      ok: true,
      answer:
        typeof result.answer === "string"
          ? result.answer
          : result.answer?.text || "",
      tokensInput,
      tokensOutput,
      costUsd,
    };
  } catch (err: any) {
    console.error("❌ Error en RowiAI:", err);
    return {
      ok: false,
      error: err?.message || "Error desconocido en RowiAI",
    };
  }
}