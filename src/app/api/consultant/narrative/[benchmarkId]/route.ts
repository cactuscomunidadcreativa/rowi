/**
 * 📝 API: Narrativa del consultor (resumen ejecutivo generado por IA)
 * POST /api/consultant/narrative/[benchmarkId]
 *
 * Toma los hallazgos REALES ya computados (runMultiLeaderAnalysis) y pide
 * a Claude (tarea pesada) un resumen ejecutivo tipo informe de consultoría.
 * Es la primera integración de generateText({provider:"anthropic"}).
 *
 * Principio (feedback_no_fake_social_proof): la IA SOLO redacta sobre los
 * datos que se le pasan — correlaciones, deltas, espejos ya calculados.
 * No se le pide inventar métricas; el prompt se lo prohíbe explícitamente.
 *
 * Requiere ANTHROPIC_API_KEY en Admin > Configuración (categoría IA). Sin
 * ella, generateText cae a OpenAI (allowFallback) o devuelve error claro.
 *
 * Body (opcional): { provider?: "anthropic" | "openai", topN?: number }
 * Acceso: admin con scope.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/core/capabilities/requireCapability";
import { benchmarkInScope } from "@/lib/consultant/benchmarkAccess";
import { runMultiLeaderAnalysis } from "@/lib/consultant/cross-analysis";
import { generateText, type AIProvider } from "@/lib/ai/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ benchmarkId: string }>;
}

const SYSTEM_PROMPT = `Eres un consultor senior de inteligencia emocional formado en la metodología Six Seconds (modelo KCG: Know yourself / Choose yourself / Give yourself).
Redactas el resumen ejecutivo de un informe de diagnóstico para una organización.
REGLAS ESTRICTAS:
- Usa SOLO los datos que se te entregan. NO inventes cifras, porcentajes, nombres ni hallazgos que no estén en los datos.
- Si un dato no está, dilo ("no hay suficientes mediciones para X") en vez de rellenar.
- Tono: profesional, claro, accionable. Español neutro (sirve para toda Latam y España).
- Estructura: (1) panorama, (2) fortalezas, (3) brechas prioritarias, (4) 3 recomendaciones concretas.
- No reveles identidades: los líderes vienen como hash, refiérete a ellos como "el líder evaluado".`;

export async function POST(req: NextRequest, { params }: RouteParams) {
  const gate = await requireCapability("consultant.narrative");
  if (gate.error) return gate.error;

  const { benchmarkId } = await params;
  // Anti-IDOR (F6): el benchmark debe pertenecer al scope del consultor.
  if (!gate.scope || !(await benchmarkInScope(benchmarkId, gate.scope))) {
    return NextResponse.json(
      { ok: false, error: "benchmark_not_in_scope" },
      { status: 403 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const provider: AIProvider = body?.provider === "openai" ? "openai" : "anthropic";
  const topN =
    body?.topN && Number.isFinite(Number(body.topN)) ? Number(body.topN) : undefined;

  try {
    const findings = await runMultiLeaderAnalysis(benchmarkId, { topN });

    // Datos honestos: si no hay nada que narrar, no llamamos a la IA.
    if (findings.totalDataPoints === 0) {
      return NextResponse.json(
        { ok: false, error: "Sin datos suficientes para generar la narrativa." },
        { status: 422 }
      );
    }

    const prompt = [
      `Datos del diagnóstico (benchmark ${benchmarkId}), ${findings.totalDataPoints} mediciones:`,
      "",
      "Correlaciones EQ→outcome más fuertes:",
      JSON.stringify(findings.topCorrelations, null, 2),
      "",
      "Análisis por equipo (fortalezas / brechas vs norma):",
      JSON.stringify(findings.teams, null, 2),
      "",
      "Espejo líder↔equipo (cada líder marcado, por hash):",
      JSON.stringify(findings.leaders, null, 2),
      "",
      "Deriva temporal (personas re-medidas):",
      JSON.stringify(findings.temporalDrift, null, 2),
      "",
      "Redacta el resumen ejecutivo siguiendo las reglas.",
    ].join("\n");

    const result = await generateText({
      provider,
      system: SYSTEM_PROMPT,
      prompt,
      maxTokens: 2000,
    });

    return NextResponse.json({
      ok: true,
      narrative: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error("❌ Error generando narrativa del consultor:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error al generar la narrativa",
      },
      { status: 500 }
    );
  }
}
