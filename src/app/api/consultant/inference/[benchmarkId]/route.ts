/**
 * POST /api/consultant/inference/[benchmarkId]
 * =========================================================
 * Dispara la inferencia de Vital Signs sobre un benchmark ya importado:
 * calcula los 15 pulse points por persona (vía calculateVitalSigns) y
 * persiste las filas PulsePointInference. Idempotente — re-correr reemplaza
 * las inferencias previas del mismo benchmark.
 *
 * Guard: requireAdminWithScope() (consultor/admin).
 */

import { NextResponse } from "next/server";
import { requireCapability } from "@/core/capabilities/requireCapability";
import { benchmarkInScope } from "@/lib/consultant/benchmarkAccess";
import { runVsInferenceForBenchmark } from "@/lib/consultant/vs-inference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ benchmarkId: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
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
  if (!benchmarkId) {
    return NextResponse.json(
      { ok: false, error: "benchmarkId requerido" },
      { status: 400 },
    );
  }

  try {
    const { inferred } = await runVsInferenceForBenchmark(benchmarkId);
    return NextResponse.json({ ok: true, inferred });
  } catch (error) {
    console.error("❌ Error en inferencia VS:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error en la inferencia",
      },
      { status: 500 },
    );
  }
}
