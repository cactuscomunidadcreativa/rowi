/**
 * 🔬 API: Hallazgos del consultor (vista primaria, multi-líder)
 * GET /api/consultant/findings/[benchmarkId]
 *
 * Devuelve la vista PRIMARIA del consultor (informe tipo Bancolombia):
 *   - espejo líder↔equipo para CADA líder marcado en ConsultantLeaderAssignment
 *   - fortalezas/brechas por equipo (cohorte)
 *   - correlaciones EQ→outcome más fuertes del benchmark
 *   - deriva temporal de personas re-medidas
 *
 * Los líderes se marcan vía POST /api/consultant/leaders/[benchmarkId]. Si no
 * hay líderes marcados, `findings.leaders` vuelve [] (vacío honesto — la UI
 * invita a "marcar líderes para ver el espejo"). Nunca se inventan métricas.
 *
 * Privacidad: los líderes se identifican solo por su hash (sha256 del email),
 * nunca por email/nombre en claro.
 *
 * Query params:
 *   - topN (opcional): nº de correlaciones top (default 8).
 *
 * Acceso: admin con scope (requireAdminWithScope).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/core/capabilities/requireCapability";
import { runMultiLeaderAnalysis } from "@/lib/consultant/cross-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ benchmarkId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const gate = await requireCapability("consultant.cross");
  if (gate.error) return gate.error;

  const { benchmarkId } = await params;
  const { searchParams } = new URL(req.url);
  const topNRaw = searchParams.get("topN");
  const topN =
    topNRaw && Number.isFinite(Number(topNRaw)) ? Number(topNRaw) : undefined;

  try {
    const findings = await runMultiLeaderAnalysis(benchmarkId, { topN });
    return NextResponse.json({ ok: true, findings });
  } catch (error) {
    console.error("❌ Error generando hallazgos del consultor:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Error al generar hallazgos",
      },
      { status: 500 }
    );
  }
}
