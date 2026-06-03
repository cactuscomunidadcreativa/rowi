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
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { runVsInferenceForBenchmark } from "@/lib/consultant/vs-inference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ benchmarkId: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const admin = await requireAdminWithScope();
  if (admin.error) return admin.error;

  const { benchmarkId } = await params;
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
