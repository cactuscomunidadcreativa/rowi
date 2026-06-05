/**
 * Mini-SEI scoring.
 *
 * Mirrors the SEI pipeline at a small scale:
 *   1. reverse-score keyed items (r -> 6 - r)
 *   2. apply pondering weights
 *   3. aggregate to a raw mean, scale to the norm metric (100/15)
 *   4. classify with the version-aware band (sei-bands)
 *
 * Total EQ uses Block A (the 12 short-form items) when provisioned; otherwise
 * it is a Block-B proxy and `indicative` is true. The competency profile is
 * ALWAYS indicative (one item per competency is not normable per the manual).
 */

import { loadMiniSeiItems, type MiniSeiItem } from "./items";
import { coarseBand, activeSeiVersion, type CoarseBand } from "@/lib/vital-signs/sei-bands";
import { seiCompetencyWeights } from "@/lib/vital-signs/sei-correlations";
import { SEI_ORDER } from "@/lib/daily-pulse/questions";
import type { SeiKey } from "@/lib/vital-signs/catalog";

export interface MiniSeiResult {
  totalEq: number; // standardized, version-clamped
  totalEqBand: CoarseBand;
  competencyProfile: Partial<Record<SeiKey, number>>; // indicative 1-5 means
  indicative: boolean; // true when Block A (12 items) was NOT used for Total EQ
  itemsVersion: string;
  scaleVersion: string;
}

function reverseScore(value: number, reverse: boolean): number {
  return reverse ? 6 - value : value;
}

/**
 * Score a set of raw 1-5 answers keyed by item id.
 */
export function scoreMiniSei(
  answers: Record<string, number>,
): MiniSeiResult {
  const set = loadMiniSeiItems();
  const scaleVersion = activeSeiVersion();

  // --- Total EQ: weighted mean of all answered items (reverse-corrected) ---
  let wsum = 0;
  let w = 0;
  const present: MiniSeiItem[] = [];
  for (const item of set.items) {
    const raw = answers[item.id];
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    const corrected = reverseScore(raw, item.reverse);
    wsum += corrected * item.weight;
    w += item.weight;
    present.push(item);
  }
  const weightedMean = w > 0 ? wsum / w : 3;

  // Standardize to 100/15, then clamp to the active version's range.
  const z = (weightedMean - 3) / 1;
  const norm = set.norm;
  const raw100 = norm.mean + z * norm.sd;
  const range = scaleVersion === "v5" ? { min: 75, max: 125 } : { min: 70, max: 130 };
  const totalEq = Math.max(range.min, Math.min(range.max, Math.round(raw100 * 10) / 10));

  // --- Indicative competency profile: mean of that competency's items (1-5) ---
  const byComp = new Map<SeiKey, number[]>();
  for (const item of present) {
    const raw = answers[item.id];
    const corrected = reverseScore(raw, item.reverse);
    const list = byComp.get(item.competency) ?? [];
    list.push(corrected);
    byComp.set(item.competency, list);
  }
  const competencyProfile: Partial<Record<SeiKey, number>> = {};
  for (const c of SEI_ORDER) {
    const vals = byComp.get(c);
    if (vals && vals.length > 0) {
      competencyProfile[c] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
    }
  }

  return {
    totalEq,
    totalEqBand: coarseBand(totalEq, scaleVersion),
    competencyProfile,
    indicative: !set.hasShortForm,
    itemsVersion: set.version,
    scaleVersion,
  };
}

/**
 * Outcome-weighted Total EQ variant: instead of equal weights, weight each
 * competency's contribution by its published outcome correlation (EIM/EO/PNG
 * heavier). Used when an outcome-oriented score is wanted; kept separate so the
 * plain scoreMiniSei stays a faithful short-form mirror.
 */
export function scoreMiniSeiOutcomeWeighted(answers: Record<string, number>): number {
  const base = scoreMiniSei(answers);
  const weights = seiCompetencyWeights("partial");
  let wsum = 0;
  let w = 0;
  for (const [c, mean] of Object.entries(base.competencyProfile) as Array<[SeiKey, number]>) {
    const cw = weights[c] ?? 0;
    wsum += mean * cw;
    w += cw;
  }
  if (w === 0) return base.totalEq;
  const weightedMean = wsum / w;
  const z = (weightedMean - 3) / 1;
  const raw100 = 100 + z * 15;
  const range = base.scaleVersion === "v5" ? { min: 75, max: 125 } : { min: 70, max: 130 };
  return Math.max(range.min, Math.min(range.max, Math.round(raw100 * 10) / 10));
}
