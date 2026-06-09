import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { buildTrainingDataset, toJSONL } from "@/ai/learning/datasetExporter";

export const runtime = "nodejs";
export const maxDuration = 120;

/* =========================================================
   📥 GET — Descargar el dataset de entrenamiento (Fase 8)
   ---------------------------------------------------------
   Plataforma-level → SuperAdmin only.
   Materializa todo el ground-truth acumulado a JSONL y lo
   devuelve como descarga. Es la parte accionable de la
   recopilación: el corpus que entrenará a Rowi LLM.
   El entrenamiento en sí es un paso externo posterior.
   ========================================================= */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const records = await buildTrainingDataset({ limitPerSource: 50000 });
  const jsonl = toJSONL(records);

  return new NextResponse(jsonl, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": `attachment; filename="rowi-dataset-${records.length}.jsonl"`,
    },
  });
}
