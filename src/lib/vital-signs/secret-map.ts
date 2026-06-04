/**
 * Secret pulse-point map — Rowi's moat.
 *
 * Six Seconds does NOT publish which questions compose each pulse point.
 * Rowi reverse-engineered and validated this mapping (TVS/OVS error ~0.9 pts,
 * LVS error ~0.17 pts vs the official PDFs). Because it is the moat, the exact
 * question→pulse-point map is NEVER committed to git or the bundle. It lives
 * only in an encrypted environment variable read at runtime on the server.
 *
 * Env var: ROWI_VS_PULSE_MAP  (base64-encoded JSON, server-only)
 *
 * Decoded JSON shape:
 * {
 *   "TVS": { "TRUST_CARE": [19], "TRUST_COHERENCE": [35], ... },   // item numbers (1..36)
 *   "OVS": { "TRUST_CARE": [13], ... },                            // OVS uses different items
 *   "LVS": { "MOTIVATION_MEANING": [1,26,30,33], ... }             // LVS pulse = subgroup of q1..q34
 * }
 *
 * When the env var is absent (local dev, CI, or before provisioning), every
 * loader returns null and callers MUST fall back to the existing SEI→VS
 * inference engine (`calculateVitalSigns`). Nothing breaks.
 *
 * SECURITY: never log the decoded map, never serialize it to the client,
 * never persist it to the DB or a file inside the repo.
 */

import type { PulsePointCode } from "./catalog";

export type VsInstrumentScope = "TVS" | "OVS" | "LVS";

/** pulse-point code → list of 1-based item numbers that compose it. */
export type PulsePointItemMap = Partial<Record<PulsePointCode, number[]>>;

/** Full decoded map keyed by instrument scope. */
export type SecretPulseMap = Partial<Record<VsInstrumentScope, PulsePointItemMap>>;

let _cache: SecretPulseMap | null | undefined;

/**
 * Load and decode the secret map from the environment. Cached per process.
 * Returns null when the env var is missing or unparseable — callers fall back
 * to inference. Throws nothing; failures degrade gracefully.
 */
export function loadSecretPulseMap(): SecretPulseMap | null {
  if (_cache !== undefined) return _cache;

  const raw = process.env.ROWI_VS_PULSE_MAP;
  if (!raw || raw.trim() === "") {
    _cache = null;
    return null;
  }

  try {
    // Accept either raw JSON or base64-encoded JSON.
    let json = raw.trim();
    if (!json.startsWith("{")) {
      json = Buffer.from(json, "base64").toString("utf-8");
    }
    const parsed = JSON.parse(json) as SecretPulseMap;
    _cache = parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    // Never surface the parse error with contents; just fall back.
    _cache = null;
  }

  return _cache;
}

/** Test seam: clear the in-process cache (used by unit tests only). */
export function __resetSecretPulseMapCache(): void {
  _cache = undefined;
}

/** True when a real map is provisioned for the given scope. */
export function hasSecretPulseMap(scope: VsInstrumentScope): boolean {
  const map = loadSecretPulseMap();
  return !!map && !!map[scope] && Object.keys(map[scope] as object).length > 0;
}

export interface PulsePointFromItems {
  code: PulsePointCode;
  score: number; // mean of the composing items (same scale as the items)
  itemCount: number; // how many items contributed (after dropping nulls)
}

/**
 * Apply the secret map to a single respondent's standardized item scores,
 * producing the 15 real (not inferred) pulse points for the given instrument.
 *
 * @param itemScores  record keyed "q1".."qN" (as the parsers emit), values are
 *                    Item_ST_N (TVS/OVS, ~70-130) or raw 1-5 (LVS).
 * @returns           array of pulse points, or null if no map is provisioned.
 */
export function applyPulseMap(
  itemScores: Record<string, number | null>,
  scope: VsInstrumentScope,
): PulsePointFromItems[] | null {
  const map = loadSecretPulseMap();
  const scopeMap = map?.[scope];
  if (!scopeMap) return null;

  const out: PulsePointFromItems[] = [];
  for (const [code, items] of Object.entries(scopeMap) as Array<
    [PulsePointCode, number[]]
  >) {
    if (!Array.isArray(items) || items.length === 0) continue;
    const vals: number[] = [];
    for (const n of items) {
      const v = itemScores[`q${n}`];
      if (typeof v === "number" && Number.isFinite(v)) vals.push(v);
    }
    if (vals.length === 0) continue;
    const score = vals.reduce((a, b) => a + b, 0) / vals.length;
    out.push({ code, score, itemCount: vals.length });
  }

  return out.length > 0 ? out : null;
}

/**
 * Cohort-level pulse points: mean of each pulse point across respondents.
 * Each respondent's items are mapped first, then averaged per pulse point.
 */
export function applyPulseMapCohort(
  respondents: Array<Record<string, number | null>>,
  scope: VsInstrumentScope,
): Array<PulsePointFromItems & { respondentCount: number }> | null {
  if (!hasSecretPulseMap(scope)) return null;

  const acc = new Map<PulsePointCode, number[]>();
  for (const r of respondents) {
    const pps = applyPulseMap(r, scope);
    if (!pps) continue;
    for (const pp of pps) {
      const list = acc.get(pp.code) ?? [];
      list.push(pp.score);
      acc.set(pp.code, list);
    }
  }

  if (acc.size === 0) return null;
  const out: Array<PulsePointFromItems & { respondentCount: number }> = [];
  for (const [code, scores] of acc) {
    const score = scores.reduce((a, b) => a + b, 0) / scores.length;
    out.push({ code, score, itemCount: 0, respondentCount: scores.length });
  }
  return out;
}
