/**
 * Tipos del insight Pre-SEI tal como lo devuelve /api/public/pre-sei/submit.
 * Espejo de PreSeiResult (scoring.ts) + normativa, para los componentes cliente.
 */
import type { PreSeiResult } from "@/lib/pre-sei/scoring";
import type { NormativeReading } from "@/lib/pre-sei/normative";

export interface PreSeiInsightData extends PreSeiResult {
  normative: NormativeReading[];
  hasBenchmark: boolean;
}
