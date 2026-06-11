/**
 * 🔬 API: Análisis cruzado de consultor
 * GET /api/consultant/analysis/[benchmarkId]
 *
 * Devuelve el análisis cruzado VS↔SEI de un benchmark: correlaciones
 * EQ→outcomes, fortalezas/brechas por equipo, espejo líder↔equipo y deriva
 * temporal (re-medición). Es la base de los "Hallazgos" que genera el
 * consultor.
 *
 * Query params:
 *   - leaderEmail (opcional): email del líder para el espejo líder↔equipo.
 *     Se hashea internamente; nunca se compara en claro.
 *   - leaderCohort (opcional): cohorte del líder si hay varias.
 *   - topN (opcional): nº de correlaciones top (default 8).
 *
 * Acceso: admin con scope (SuperAdmin o admin autorizado). El análisis
 * incluye lecturas individuales; quién las expone lo decide el generador
 * de informe (cliente agregado vs partner confidencial).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/core/capabilities/requireCapability";
import { benchmarkInScope } from "@/lib/consultant/benchmarkAccess";
import { runCrossAnalysis } from "@/lib/consultant/cross-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ benchmarkId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const gate = await requireCapability("consultant.cross");
  if (gate.error) return gate.error;

  const { benchmarkId } = await params;
  // Anti-IDOR (F6): el benchmark debe pertenecer al scope del consultor.
  if (!gate.scope || !(await benchmarkInScope(benchmarkId, gate.scope))) {
    return NextResponse.json(
      { ok: false, error: "benchmark_not_in_scope" },
      { status: 403 },
    );
  }
  const { searchParams } = new URL(req.url);
  const leaderEmail = searchParams.get("leaderEmail") || undefined;
  const leaderCohort = searchParams.get("leaderCohort") || undefined;
  const topNRaw = searchParams.get("topN");
  const topN = topNRaw && Number.isFinite(Number(topNRaw)) ? Number(topNRaw) : undefined;

  try {
    const analysis = await runCrossAnalysis(benchmarkId, {
      leaderEmail,
      leaderCohort,
      topN,
    });
    return NextResponse.json({ ok: true, analysis });
  } catch (error) {
    console.error("❌ Error en análisis cruzado:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error en el análisis",
      },
      { status: 500 }
    );
  }
}
