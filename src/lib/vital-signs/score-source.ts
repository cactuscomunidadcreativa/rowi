/**
 * Helpers to fan out per-respondent driver/outcome scores into
 * VitalSignsScoreSource rows, with demographics denormalized so the
 * benchmark recompute job can slice without joining VitalSignsResponse.
 *
 * One row per (respondent, dimension). Items (Q1..N standardized) are not
 * fanned out here — they live in VitalSignsResponse and are queryable
 * directly when needed.
 */

import type { OvsRespondent } from "./parsers/ovs";
import type { LvsRespondent } from "./parsers/lvs";

export type ScoreSourceKind = "measured" | "inferred";
export type VitalSignsScope = "OVS" | "TVS" | "LVS" | "FVS";

interface BaseRow {
  scope: VitalSignsScope;
  dimension: string;
  level: "driver" | "outcome";
  sourceKind: ScoreSourceKind;
  assessmentId: string;
  value: number;
  n: number;
  country: string | null;
  region: string | null;
  sector: string | null;
  industry: string | null;
  ageRange: string | null;
  gender: string | null;
  positionType: string | null;
  businessUnit: string | null;
  jobFunction: string | null;
  tenantId: string | null;
  contributesToBenchmark: boolean;
  contributedAt: Date | null;
}

export interface ScoreSourceContext {
  assessmentId: string;
  scope: VitalSignsScope;
  tenantId?: string | null;
  contributesToBenchmark: boolean;
  /** Optional: project-level context that may override null demos */
  country?: string | null;
  region?: string | null;
  sector?: string | null;
}

/**
 * OVS/TVS demographics are integer-coded by Six Seconds per project (e.g.
 * gender=1/2/3, ageGroup=1..7). We store them as strings so the cron's
 * GROUP BY treats them consistently. The semantic mapping (e.g. "ageGroup=2
 * means 25-29") is project-specific and lives in a separate label table
 * (out of scope here).
 */
function ovsDemoToString(v: number | null): string | null {
  return v === null || v === undefined ? null : String(v);
}

export function buildOvsScoreSources(
  respondents: OvsRespondent[],
  ctx: ScoreSourceContext,
): BaseRow[] {
  const rows: BaseRow[] = [];
  const contributedAt = ctx.contributesToBenchmark ? new Date() : null;

  for (const r of respondents) {
    const demo = r.demographics;
    const denorm = {
      country: ctx.country ?? null,
      region: ctx.region ?? null,
      sector: ctx.sector ?? null,
      industry: null,
      ageRange: ovsDemoToString(demo.ageGroup),
      gender: ovsDemoToString(demo.gender),
      positionType: ovsDemoToString(demo.positionType),
      businessUnit: ovsDemoToString(demo.businessUnit),
      jobFunction: ovsDemoToString(demo.jobFunction),
      tenantId: ctx.tenantId ?? null,
      contributesToBenchmark: ctx.contributesToBenchmark,
      contributedAt,
    };

    for (const [key, v] of Object.entries(r.drivers)) {
      if (typeof v !== "number") continue;
      rows.push({
        scope: ctx.scope,
        dimension: key,
        level: "driver",
        sourceKind: "measured",
        assessmentId: ctx.assessmentId,
        value: v,
        n: 1,
        ...denorm,
      });
    }
    for (const [key, v] of Object.entries(r.outcomes)) {
      if (typeof v !== "number") continue;
      rows.push({
        scope: ctx.scope,
        dimension: key,
        level: "outcome",
        sourceKind: "measured",
        assessmentId: ctx.assessmentId,
        value: v,
        n: 1,
        ...denorm,
      });
    }
  }
  return rows;
}

/**
 * LVS respondents don't carry the same OVS demographic block; we keep
 * the structure so a future LVS parser extension can populate it.
 */
export function buildLvsScoreSources(
  respondents: LvsRespondent[],
  ctx: ScoreSourceContext,
): BaseRow[] {
  const rows: BaseRow[] = [];
  const contributedAt = ctx.contributesToBenchmark ? new Date() : null;
  const denorm = {
    country: ctx.country ?? null,
    region: ctx.region ?? null,
    sector: ctx.sector ?? null,
    industry: null,
    ageRange: null,
    gender: null,
    positionType: null,
    businessUnit: null,
    jobFunction: null,
    tenantId: ctx.tenantId ?? null,
    contributesToBenchmark: ctx.contributesToBenchmark,
    contributedAt,
  };

  for (const r of respondents) {
    for (const [key, v] of Object.entries(r.drivers)) {
      if (typeof v !== "number") continue;
      rows.push({
        scope: ctx.scope,
        dimension: key,
        level: "driver",
        sourceKind: "measured",
        assessmentId: ctx.assessmentId,
        value: v,
        n: 1,
        ...denorm,
      });
    }
    if (r.outcomes) {
      for (const [key, v] of Object.entries(r.outcomes)) {
        if (typeof v !== "number") continue;
        rows.push({
          scope: ctx.scope,
          dimension: key,
          level: "outcome",
          sourceKind: "measured",
          assessmentId: ctx.assessmentId,
          value: v,
          n: 1,
          ...denorm,
        });
      }
    }
  }
  return rows;
}
