/**
 * 🪞 Motor de PUNTOS CIEGOS (cruce SEI ↔ Vital Signs) — formato Rowi.
 *
 * Esto NO es correlación (eso vive en vs-sei-individual.ts y necesita ≥2 tomas).
 * Es el mapa del perfil integral (modelo: Carolina Navarro): con UNA sola toma de
 * VS + UNA de SEI, lee la BRECHA DE AUTOCONCIENCIA de la persona.
 *
 * HALLAZGO QUE RESPETA (proyecto Bancolombia): SEI ≠ Clima (r≈0). El cruce NO
 * predice nada. Es una lectura RELATIVA INTERNA (z-score dentro de la persona):
 * la escala absoluta no aplica porque el VS (sobre todo LVS) es autoevaluación
 * generosa. Importa el PATRÓN dentro de la persona, no el nivel.
 *
 * Mecánica:
 *  1. Auto-percepción: z-score de cada pulse point entre los pulse points de la persona.
 *  2. Capacidad real: para cada pulse, promedio de sus competencias SEI + talentos
 *     (mapa BE2GROW del catálogo, PulsePoint.competencies/talents), en z-score
 *     interno entre las competencias/talentos de la persona.
 *  3. Estado del cruce:
 *     - alineado   → se cree fuerte (auto alta) y su capacidad lo respalda (cap alta)
 *     - punto_ciego→ se cree fuerte (auto alta) pero su capacidad es baja (sobrevalora)
 *     - oculto     → se subvalora (auto baja) teniendo capacidad alta (no reclamada)
 *     - neutral    → ambos cerca de su media interna
 *
 * Los umbrales son del motor BE2GROW (hipótesis v0, calibrable). No hay magia:
 * z ≥ +0.5 = "alto para esta persona", z ≤ −0.5 = "bajo para esta persona".
 */
import { PULSE_POINTS, type PulsePointCode, type SeiKey, type BrainTalentKey } from "@/lib/vital-signs/catalog";

export type BlindspotState = "alineado" | "punto_ciego" | "oculto" | "neutral";

export interface BlindspotRow {
  pulse: PulsePointCode;
  /** z-score interno de la auto-percepción VS de este pulse */
  selfZ: number;
  /** z-score interno de la capacidad real (SEI comp + talentos) que sostiene este pulse */
  capacityZ: number;
  state: BlindspotState;
  /** competencias/talentos que componen la capacidad (para la narrativa) */
  drivers: { competencies: SeiKey[]; talents: BrainTalentKey[] };
}

export interface BlindspotMapInput {
  /** pulse point code → valor auto-percibido (LVS 1-5, o TVS/OVS 70-130; la escala da igual, se z-scorea) */
  pulses: Partial<Record<PulsePointCode, number>>;
  /** competencia SEI → score (70-130) */
  competencies: Partial<Record<SeiKey, number>>;
  /** talento → score (70-130) */
  talents: Partial<Record<string, number>>;
}

// Umbrales del motor BE2GROW (hipótesis v0, calibrable). 0.35 ≈ "alto/bajo para
// esta persona": sensible al patrón interno incluso en perfiles comprimidos
// (personas con casi todo alto, como muchos líderes). Subir a 0.5 los hace más
// conservadores; afinar con más perfiles reales contra el juicio del partner.
const HIGH_Z = 0.35;
const LOW_Z = -0.35;

function zScores<K extends string>(values: Partial<Record<K, number>>): Record<string, number> {
  const entries = Object.entries(values).filter(
    ([, v]) => typeof v === "number" && Number.isFinite(v),
  ) as [string, number][];
  if (entries.length < 2) {
    // Sin dispersión no hay z-score significativo: todo neutral (z=0).
    return Object.fromEntries(entries.map(([k]) => [k, 0]));
  }
  const nums = entries.map(([, v]) => v);
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length;
  const sd = Math.sqrt(variance);
  if (sd === 0) return Object.fromEntries(entries.map(([k]) => [k, 0]));
  return Object.fromEntries(entries.map(([k, v]) => [k, (v - mean) / sd]));
}

function classify(selfZ: number, capacityZ: number): BlindspotState {
  const selfHigh = selfZ >= HIGH_Z;
  const selfLow = selfZ <= LOW_Z;
  const capHigh = capacityZ >= HIGH_Z;
  const capLow = capacityZ <= LOW_Z;

  if (selfHigh && capLow) return "punto_ciego"; // se cree fuerte, capacidad no lo sostiene
  if (selfLow && capHigh) return "oculto"; // se subvalora teniendo capacidad
  if (selfHigh && capHigh) return "alineado"; // fortaleza real
  return "neutral";
}

/**
 * Construye el mapa de puntos ciegos de UNA persona.
 * Devuelve una fila por cada pulse point presente en el input, ordenada por
 * "qué tan reveladora" es la brecha (|selfZ - capacityZ| desc).
 */
export function buildBlindspotMap(input: BlindspotMapInput): BlindspotRow[] {
  const selfZ = zScores(input.pulses);
  const compZ = zScores(input.competencies);
  const talZ = zScores(input.talents as Partial<Record<string, number>>);

  const rows: BlindspotRow[] = [];

  for (const pp of PULSE_POINTS) {
    const selfVal = input.pulses[pp.code];
    if (typeof selfVal !== "number" || !Number.isFinite(selfVal)) continue;

    // Capacidad real = promedio de los z-scores de las competencias + talentos
    // que el catálogo BE2GROW asocia a este pulse point.
    const capZParts: number[] = [];
    for (const c of pp.competencies) {
      if (c in compZ) capZParts.push(compZ[c]);
    }
    for (const t of pp.talents) {
      if (t in talZ) capZParts.push(talZ[t]);
    }
    const capacityZ =
      capZParts.length > 0
        ? capZParts.reduce((a, b) => a + b, 0) / capZParts.length
        : 0;

    const sz = selfZ[pp.code] ?? 0;
    rows.push({
      pulse: pp.code,
      selfZ: Math.round(sz * 100) / 100,
      capacityZ: Math.round(capacityZ * 100) / 100,
      state: classify(sz, capacityZ),
      drivers: { competencies: pp.competencies, talents: pp.talents },
    });
  }

  // Las brechas más grandes primero (lo más revelador para el coaching).
  return rows.sort(
    (a, b) => Math.abs(b.selfZ - b.capacityZ) - Math.abs(a.selfZ - a.capacityZ),
  );
}

/** Resumen compacto para la narrativa/diagnóstico. */
export interface BlindspotSummary {
  blindspots: BlindspotRow[]; // state === punto_ciego
  hidden: BlindspotRow[]; // state === oculto
  aligned: BlindspotRow[]; // state === alineado
}

export function summarizeBlindspots(rows: BlindspotRow[]): BlindspotSummary {
  return {
    blindspots: rows.filter((r) => r.state === "punto_ciego"),
    hidden: rows.filter((r) => r.state === "oculto"),
    aligned: rows.filter((r) => r.state === "alineado"),
  };
}
