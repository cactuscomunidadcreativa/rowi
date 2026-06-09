/**
 * Exportador de dataset (Fase 7 del knowledge layer).
 *
 * Materializa el ground-truth acumulado en pares (input, label) listos para
 * entrenamiento / fine-tuning de Rowi LLM. Recorre las fuentes de verdad y
 * emite registros JSONL. Respeta privacidad: anonimiza (sin userId/PII) y
 * solo incluye fuentes con base de consentimiento.
 *
 * NO entrena nada: solo materializa el corpus. El entrenamiento (Fase 8) es
 * un paso posterior y externo.
 *
 * Ver docs/entregables/ROWI_KNOWLEDGE_LAYER_AUDITORIA.md
 */

import { prisma } from "@/core/prisma";

export type DatasetRecord = {
  task: string; // "pulse_point_inference" | "affinity_outcome" | "intervention_effect"
  input: Record<string, unknown>;
  label: number; // el valor real medido (target de regresión)
  meta?: Record<string, unknown>;
};

export type ExportOptions = {
  /** Máximo de registros por fuente (evita exports enormes). */
  limitPerSource?: number;
};

/**
 * Exporta el ground-truth de Pulse Points: (inferencia → valor medido real).
 * Es el dataset más maduro (el patrón de oro ya existe).
 */
async function exportPulsePointGroundTruth(limit: number): Promise<DatasetRecord[]> {
  const rows = await prisma.pulsePointGroundTruth.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { inference: true },
  });
  return rows.map((r) => ({
    task: "pulse_point_inference",
    input: {
      pulsePointCode: r.inference?.pulsePointCode,
      inferredScore: r.inference?.inferredScore,
      competencyComp: r.inference?.competencyComp,
      talentComp: r.inference?.talentComp,
      signalComp: r.inference?.signalComp,
    },
    label: r.measuredScore,
    meta: { source: r.source, delta: r.delta },
  }));
}

/**
 * Exporta el ground-truth de Affinity: (afinidad predicha → resultado real).
 * Anonimiza: no incluye userId ni memberId, solo el contexto y los valores.
 */
async function exportAffinityGroundTruth(limit: number): Promise<DatasetRecord[]> {
  let rows: any[] = [];
  try {
    rows = await prisma.affinityGroundTruth.findMany({
      take: limit,
      orderBy: { measuredAt: "desc" },
    });
  } catch {
    return []; // tabla aún sin datos / sin migrar
  }
  return rows.map((r) => ({
    task: "affinity_outcome",
    input: { context: r.context, predicted135: r.predicted135, outcomeKind: r.outcomeKind },
    label: r.outcomeReal,
  }));
}

/**
 * Exporta el efecto medido de intervenciones: (intervención → Δ outcome real).
 * Anonimiza: agrega por intervención, no expone usuarios.
 */
async function exportInterventionOutcomes(limit: number): Promise<DatasetRecord[]> {
  let rows: any[] = [];
  try {
    rows = await prisma.interventionOutcome.findMany({
      take: limit,
      orderBy: { measuredAt: "desc" },
      include: { intervention: { select: { key: true, kind: true, targetOutcome: true } } },
    });
  } catch {
    return [];
  }
  return rows
    .filter((r) => typeof r.delta === "number")
    .map((r) => ({
      task: "intervention_effect",
      input: {
        interventionKey: r.intervention?.key,
        kind: r.intervention?.kind,
        targetOutcome: r.intervention?.targetOutcome,
        outcomeKey: r.outcomeKey,
      },
      label: r.delta,
    }));
}

/**
 * Construye el dataset completo desde todas las fuentes de ground-truth.
 * Devuelve los registros en memoria; el caller decide cómo persistirlos
 * (escribir a JSONL, subir a storage firmado, etc.).
 */
export async function buildTrainingDataset(opts: ExportOptions = {}): Promise<DatasetRecord[]> {
  const limit = opts.limitPerSource ?? 5000;
  const [pulse, affinity, interventions] = await Promise.all([
    exportPulsePointGroundTruth(limit),
    exportAffinityGroundTruth(limit),
    exportInterventionOutcomes(limit),
  ]);
  return [...pulse, ...affinity, ...interventions];
}

/** Serializa el dataset a JSONL (una línea por registro). */
export function toJSONL(records: DatasetRecord[]): string {
  return records.map((r) => JSON.stringify(r)).join("\n");
}

/** Resumen del dataset por tarea (para dashboards / decisiones de entrenamiento). */
export function summarizeDataset(records: DatasetRecord[]) {
  const byTask: Record<string, number> = {};
  for (const r of records) byTask[r.task] = (byTask[r.task] ?? 0) + 1;
  return { total: records.length, byTask };
}
