/**
 * 🧮 VS Inference Ingest (Consultor)
 * =========================================================
 * Cuando un benchmark (CSV SEI individual de Six Seconds) se importa, este
 * servicio calcula los 15 pulse points de Vital Signs por persona y los
 * persiste como filas `PulsePointInference`.
 *
 * Reusa el motor existente `calculateVitalSigns` (src/lib/vital-signs/calculate.ts)
 * — NO duplica la lógica de inferencia. Lee los `BenchmarkDataPoint` ya
 * importados (con su `sourceId` pseudonimizado y `projectCohort` = equipo).
 *
 * Privacidad: los datos del benchmark son anónimos a nivel de Rowiverse, por
 * lo que `subjectUserId` queda en null. La trazabilidad va por `snapshotRef`,
 * que codifica el benchmark + el sourceId (hash de email) de origen.
 *
 * Idempotencia: cada fila se etiqueta con `snapshotRef = "bench:<benchmarkId>:<ref>"`.
 * Antes de insertar borramos todas las filas con ese prefijo, de modo que
 * re-correr la inferencia para un benchmark reemplaza limpiamente lo anterior
 * sin tocar inferencias de otros benchmarks ni de usuarios reales.
 */

import { prisma } from "@/core/prisma";
import {
  calculateVitalSigns,
  type InputSeiCompetencies,
  type InputBrainTalents,
} from "@/lib/vital-signs/calculate";
import type { BrainTalentKey } from "@/lib/vital-signs/catalog";

const WEIGHTS_VERSION = "v0-hypothesis";

/** Prefijo de snapshotRef que aísla las inferencias de este benchmark. */
function snapshotPrefix(benchmarkId: string): string {
  return `bench:${benchmarkId}:`;
}

/**
 * Mapea los campos camelCase de BenchmarkDataPoint (talentos cerebrales) a las
 * claves lowercase que espera `InputBrainTalents` / el catálogo de Vital Signs.
 * `calculateVitalSigns` lee `talents[key]` con claves lowercase, así que la
 * conversión es obligatoria para que los talentos contribuyan a la inferencia.
 */
type BenchmarkTalentRow = {
  dataMining: number | null;
  modeling: number | null;
  prioritizing: number | null;
  connection: number | null;
  emotionalInsight: number | null;
  collaboration: number | null;
  reflecting: number | null;
  adaptability: number | null;
  criticalThinking: number | null;
  resilience: number | null;
  riskTolerance: number | null;
  imagination: number | null;
  proactivity: number | null;
  commitment: number | null;
  problemSolving: number | null;
  vision: number | null;
  designing: number | null;
  entrepreneurship: number | null;
};

const TALENT_CAMEL_TO_LOWER: Record<keyof BenchmarkTalentRow, BrainTalentKey> = {
  dataMining: "datamining",
  modeling: "modeling",
  prioritizing: "prioritizing",
  connection: "connection",
  emotionalInsight: "emotionalinsight",
  collaboration: "collaboration",
  reflecting: "reflecting",
  adaptability: "adaptability",
  criticalThinking: "criticalthinking",
  resilience: "resilience",
  riskTolerance: "risktolerance",
  imagination: "imagination",
  proactivity: "proactivity",
  commitment: "commitment",
  problemSolving: "problemsolving",
  vision: "vision",
  designing: "designing",
  entrepreneurship: "entrepreneurship",
};

function toTalentInput(row: BenchmarkTalentRow): InputBrainTalents {
  const talents: InputBrainTalents = {};
  for (const [camel, lower] of Object.entries(TALENT_CAMEL_TO_LOWER) as Array<
    [keyof BenchmarkTalentRow, BrainTalentKey]
  >) {
    const v = row[camel];
    if (typeof v === "number" && Number.isFinite(v)) {
      talents[lower] = v;
    }
  }
  return talents;
}

function toSeiInput(row: {
  EL: number | null;
  RP: number | null;
  ACT: number | null;
  NE: number | null;
  IM: number | null;
  OP: number | null;
  EMP: number | null;
  NG: number | null;
}): InputSeiCompetencies {
  return {
    EL: row.EL,
    RP: row.RP,
    ACT: row.ACT,
    NE: row.NE,
    IM: row.IM,
    OP: row.OP,
    EMP: row.EMP,
    NG: row.NG,
  };
}

type InferenceCreateRow = {
  subjectUserId: null;
  subjectTeamId: string | null;
  subjectOrgId: null;
  pulsePointCode: string;
  inferredScore: number;
  competencyComp: number | null;
  talentComp: number | null;
  signalComp: null;
  weightsVersion: string;
  snapshotRef: string;
};

/**
 * Calcula y persiste las inferencias de pulse points para todas las personas
 * de un benchmark. Idempotente: limpia las inferencias previas del benchmark
 * antes de insertar las nuevas.
 */
export async function runVsInferenceForBenchmark(
  benchmarkId: string,
): Promise<{ inferred: number }> {
  const dataPoints = await prisma.benchmarkDataPoint.findMany({
    where: { benchmarkId },
    select: {
      id: true,
      sourceId: true,
      projectCohort: true,
      // 8 competencias SEI
      EL: true,
      RP: true,
      ACT: true,
      NE: true,
      IM: true,
      OP: true,
      EMP: true,
      NG: true,
      // 18 brain talents (camelCase en el schema)
      dataMining: true,
      modeling: true,
      prioritizing: true,
      connection: true,
      emotionalInsight: true,
      collaboration: true,
      reflecting: true,
      adaptability: true,
      criticalThinking: true,
      resilience: true,
      riskTolerance: true,
      imagination: true,
      proactivity: true,
      commitment: true,
      problemSolving: true,
      vision: true,
      designing: true,
      entrepreneurship: true,
    },
  });

  // Idempotencia: borrar inferencias previas de ESTE benchmark.
  await prisma.pulsePointInference.deleteMany({
    where: { snapshotRef: { startsWith: snapshotPrefix(benchmarkId) } },
  });

  if (dataPoints.length === 0) return { inferred: 0 };

  const rows: InferenceCreateRow[] = [];

  for (const dp of dataPoints) {
    try {
      const sei = toSeiInput(dp);
      const talents = toTalentInput(dp);
      const result = calculateVitalSigns(sei, talents);

      // Trazabilidad: prefijo del benchmark + sourceId (hash) o id del datapoint.
      const ref = `${snapshotPrefix(benchmarkId)}${dp.sourceId ?? dp.id}`;

      for (const pp of result.pulsePoints) {
        if (pp.score === null) continue; // sin datos para este pulse point
        rows.push({
          subjectUserId: null,
          subjectTeamId: dp.projectCohort ?? null,
          subjectOrgId: null,
          pulsePointCode: pp.code,
          inferredScore: pp.score,
          competencyComp: pp.competencyComponent,
          talentComp: pp.talentComponent,
          signalComp: null,
          weightsVersion: WEIGHTS_VERSION,
          snapshotRef: ref,
        });
      }
    } catch (error) {
      // Nunca abortamos todo el ingest por una fila mala.
      console.error(
        `⚠️ VS inference: fila ${dp.id} del benchmark ${benchmarkId} falló:`,
        error,
      );
    }
  }

  // Insertar en lotes con createMany.
  const BATCH = 1000;
  let inferred = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    try {
      const res = await prisma.pulsePointInference.createMany({ data: batch });
      inferred += res.count;
    } catch (error) {
      console.error(
        `⚠️ VS inference: lote ${i / BATCH} del benchmark ${benchmarkId} falló:`,
        error,
      );
    }
  }

  return { inferred };
}
