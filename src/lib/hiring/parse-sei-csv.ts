/**
 * 🧾 Parser de CSV SEI (Six Seconds export) → HiringPerson[].
 *
 * El export del SEI tiene DOS columnas "Profile" duplicadas:
 *   - 1ª "Profile"  → Brain Brief (Visionary/Sage/Superhero…) = estilo cognitivo.
 *   - 2ª "Profile"  → Influence Profile (Connector/Advisor/Generator/Negotiator)
 *                     = "perfil de ventas" (cómo influye/persuade).
 * Por eso se parsea POR ÍNDICE (no por nombre de header, que colapsaría los
 * duplicados). Probado contra los CSV reales de Recrutamento BDP.
 *
 * Devuelve también lo que el Rowiverse necesita (demografía + outcomes +
 * talentos) para la contribución anónima, sin PII en el pool global.
 */
import type { HiringPerson } from "./build-report-data";
import type { CompKey } from "@/domains/affinity/lib/affinityEngine";

// Header CSV → clave interna. Competencias (8) en escala 70-130.
const COMP_COLS: Record<CompKey, string> = {
  EL: "Enhance Emotional Literacy Score",
  RP: "Recognize Patterns Score",
  ACT: "Apply Consequential Thinking Score",
  NE: "Navigate Emotions Score",
  IM: "Engage Intrinsic Motivation Score",
  OP: "Excercise Optimism Score", // (typo del export original de Six Seconds)
  EMP: "Increase Empathy Score",
  NG: "Pursue Noble Goals Score",
};
// Talentos: clave del engine (camelCase) → header CSV.
const TAL_COLS: Record<string, string> = {
  dataMining: "DataMining", modeling: "Modeling", prioritizing: "Prioritizing",
  connection: "Connection", emotionalInsight: "EmotionalInsight", collaboration: "Collaboration",
  reflecting: "Reflecting", adaptability: "Adaptability", criticalThinking: "CriticalThinking",
  resilience: "Resilience", riskTolerance: "RiskTolerance", imagination: "Imagination",
  proactivity: "Proactivity", commitment: "Commitment", problemSolving: "ProblemSolving",
  vision: "Vision", design: "Designing", entrepreneurship: "Entrepreneurship",
};
// Outcomes (para understanding135 y para el Rowiverse).
const OUT_COLS: Record<string, string> = {
  influence: "Influence", decisionMaking: "Decision Making", community: "Community",
  network: "Network", achievement: "Achievement", satisfaction: "Satisfaction",
  balance: "Balance", health: "Health",
};
// Demografía para el Rowiverse (anónima, sin PII).
const DEMO_COLS: Record<string, string> = {
  country: "Country", sector: "Sector", jobFunction: "Job Function",
  jobRole: "Job Role", ageRange: "Age", gender: "Gender", education: "Education",
};

const N = (v: string | undefined): number | null => {
  if (v == null || v === "" || v === "N/A") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Una persona del CSV con TODO lo que necesitan el motor y el Rowiverse. */
export interface ParsedSeiPerson {
  person: HiringPerson; // para buildHiringReportData
  email: string | null; // para el EqSnapshot puente
  eqTotal: number | null;
  kcg: { K: number | null; C: number | null; G: number | null };
  demographics: Record<string, string | null>;
  outcomesForVerse: Record<string, number | null>;
  talentsForVerse: Record<string, number | null>;
}

/**
 * Parsea un CSV SEI (string) → personas. Acepta el grid ya parseado (filas) o
 * el texto crudo; el caller pasa el grid de papaparse/csv-parse (sin header,
 * para no colapsar las columnas "Profile" duplicadas).
 */
export function parseSeiGrid(grid: string[][]): ParsedSeiPerson[] {
  if (grid.length < 2) return [];
  const hdr = grid[0];
  const idx = (name: string, from = 0) => hdr.indexOf(name, from);

  const I_NAME = idx("Test Taker Name");
  const I_SUR = idx("Test Taker Surname");
  const I_EMAIL = idx("Email");
  const I_EQ = idx("Emotional Intelligence Score");
  const I_K = idx("Know Yourself Score");
  const I_C = idx("Choose Yourself Score");
  const I_G = idx("Give Yourself Score");
  const I_PROFILE1 = idx("Profile"); // Brain Brief
  const I_PROFILE2 = idx("Profile", I_PROFILE1 + 1); // Influence Profile (2º)
  const I_STYLE = idx("STYLE"); // Change Style

  const compI = mapIdx(COMP_COLS, idx);
  const talI = mapIdx(TAL_COLS, idx);
  const outI = mapIdx(OUT_COLS, idx);
  const demoI = mapIdx(DEMO_COLS, idx);

  const out: ParsedSeiPerson[] = [];
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    if (!row || !row[0] || !row[I_NAME]) continue; // salta filas vacías

    const comp = {} as Record<CompKey, number | null>;
    for (const k of Object.keys(compI) as CompKey[]) comp[k] = N(row[compI[k]]);
    const tals: Record<string, number | null> = {};
    for (const k of Object.keys(talI)) tals[k] = N(row[talI[k]]);
    const outs = Object.keys(outI).map((key) => ({ key, score: N(row[outI[key]]) }));

    const demographics: Record<string, string | null> = {};
    for (const k of Object.keys(demoI)) demographics[k] = row[demoI[k]] || null;

    const outcomesForVerse: Record<string, number | null> = {};
    for (const k of Object.keys(outI)) outcomesForVerse[k] = N(row[outI[k]]);
    const talentsForVerse: Record<string, number | null> = {};
    for (const k of Object.keys(talI)) talentsForVerse[k] = N(row[talI[k]]);

    const person: HiringPerson = {
      name: `${row[I_NAME]} ${row[I_SUR] ?? ""}`.trim(),
      eq: N(row[I_EQ]) ?? 100,
      brain: row[I_PROFILE1] || null, // Brain Brief (entra al motor de afinidad)
      style: row[I_STYLE] || null, // Change Style (informativo)
      leadProfile: row[I_PROFILE2] || null, // Influence Profile (informativo, "perfil de ventas")
      comp,
      tals,
      outs,
    };

    out.push({
      person,
      email: (row[I_EMAIL] || "").trim().toLowerCase() || null,
      eqTotal: N(row[I_EQ]),
      kcg: { K: N(row[I_K]), C: N(row[I_C]), G: N(row[I_G]) },
      demographics,
      outcomesForVerse,
      talentsForVerse,
    });
  }
  return out;
}

function mapIdx(cols: Record<string, string>, idx: (n: string) => number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, h] of Object.entries(cols)) out[k] = idx(h);
  return out;
}
