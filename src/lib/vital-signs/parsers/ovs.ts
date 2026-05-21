/**
 * OVS / TVS CSV parser.
 *
 * Schema (from Six Seconds export):
 *   Date, Official Project Name, Project Name, Coach Name (Owner),
 *   QUESTION_1..36, OUTCOME_37..45,
 *   Motivation, Teamwork, Execution, Change, Trust (5 driver composites),
 *   Satisfaction, Results, Agility, Sustainability, Engagement (5 outcome composites),
 *   Item_ST_1..36 (standardized item scores)
 *
 * The TVS export uses the exact same schema with fewer respondents.
 *
 * Each row = one respondent. Driver and outcome composites are pre-computed
 * by Six Seconds; we trust them. Items go raw + standardized into the response.
 */

import Papa from "papaparse";

export type OvsTvsScope = "OVS" | "TVS";

export interface OvsRespondent {
  rowIndex: number;
  date: string | null;
  projectName: string | null;
  coachOwner: string | null;
  rawItems: Record<string, number | null>;     // QUESTION_1..36
  itemScoresST: Record<string, number | null>; // Item_ST_1..36
  outcomesRaw: Record<string, number | null>;  // OUTCOME_37..45
  drivers: {
    trust: number | null;
    motivation: number | null;
    teamwork: number | null;
    execution: number | null;
    change: number | null;
  };
  outcomes: {
    satisfaction: number | null;
    results: number | null;
    agility: number | null;
    sustainability: number | null;
    engagement: number | null;
  };
}

export interface OvsTvsParseResult {
  scope: OvsTvsScope;
  sampleSize: number;
  projectName: string | null;
  coachOwner: string | null;
  respondents: OvsRespondent[];
  errors: string[];
}

const DRIVER_COLS = ["Motivation", "Teamwork", "Execution", "Change", "Trust"] as const;
const OUTCOME_COLS = ["Satisfaction", "Results", "Agility", "Sustainability", "Engagement"] as const;

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export function parseOvsTvsCsv(csv: string, scope: OvsTvsScope): OvsTvsParseResult {
  const result: OvsTvsParseResult = {
    scope,
    sampleSize: 0,
    projectName: null,
    coachOwner: null,
    respondents: [],
    errors: [],
  };

  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    for (const e of parsed.errors) {
      result.errors.push(`Row ${e.row}: ${e.message}`);
    }
  }

  const requiredCols = ["QUESTION_1", ...DRIVER_COLS, ...OUTCOME_COLS];
  const headers = parsed.meta.fields ?? [];
  for (const col of requiredCols) {
    if (!headers.includes(col)) {
      result.errors.push(`Missing required column: ${col}`);
    }
  }
  if (result.errors.length > 0) return result;

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];

    const allDriversNull = DRIVER_COLS.every((c) => toNumber(row[c]) === null);
    const allItemsNull = !row["QUESTION_1"];
    if (allDriversNull && allItemsNull) continue;

    const rawItems: Record<string, number | null> = {};
    const itemScoresST: Record<string, number | null> = {};
    const outcomesRaw: Record<string, number | null> = {};

    for (let q = 1; q <= 36; q++) {
      rawItems[`q${q}`] = toNumber(row[`QUESTION_${q}`]);
      itemScoresST[`q${q}`] = toNumber(row[`Item_ST_${q}`]);
    }
    for (let o = 37; o <= 45; o++) {
      outcomesRaw[`o${o}`] = toNumber(row[`OUTCOME_${o}`]);
    }

    const respondent: OvsRespondent = {
      rowIndex: i,
      date: row["Date"] ?? null,
      projectName: row["Project Name"] ?? row["Official Project Name"] ?? null,
      coachOwner: row["Coach Name (Owner)"] ?? null,
      rawItems,
      itemScoresST,
      outcomesRaw,
      drivers: {
        trust: toNumber(row["Trust"]),
        motivation: toNumber(row["Motivation"]),
        teamwork: toNumber(row["Teamwork"]),
        execution: toNumber(row["Execution"]),
        change: toNumber(row["Change"]),
      },
      outcomes: {
        satisfaction: toNumber(row["Satisfaction"]),
        results: toNumber(row["Results"]),
        agility: toNumber(row["Agility"]),
        sustainability: toNumber(row["Sustainability"]),
        engagement: toNumber(row["Engagement"]),
      },
    };

    if (!result.projectName && respondent.projectName) result.projectName = respondent.projectName;
    if (!result.coachOwner && respondent.coachOwner) result.coachOwner = respondent.coachOwner;

    result.respondents.push(respondent);
  }

  result.sampleSize = result.respondents.length;
  return result;
}

/**
 * Aggregate driver and outcome scores: mean + SD across respondents.
 * Cohesion band derived from SD per Six Seconds OVS debrief guide (norm SD = 15).
 */
export function aggregateOvsTvs(respondents: OvsRespondent[]) {
  const driverKeys = ["trust", "motivation", "teamwork", "execution", "change"] as const;
  const outcomeKeys = ["satisfaction", "results", "agility", "sustainability", "engagement"] as const;

  function statsOf(values: Array<number | null>) {
    const xs = values.filter((v): v is number => typeof v === "number");
    if (xs.length === 0) return { mean: 0, sd: 0, n: 0 };
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const variance = xs.reduce((sum, v) => sum + (v - mean) ** 2, 0) / xs.length;
    return { mean, sd: Math.sqrt(variance), n: xs.length };
  }

  function band(mean: number): "bottom_quartile" | "mid" | "top_quartile" {
    if (mean < 90) return "bottom_quartile";
    if (mean >= 110) return "top_quartile";
    return "mid";
  }
  function cohesion(sd: number): "low" | "mid" | "high" {
    if (sd < 12) return "high";
    if (sd > 18) return "low";
    return "mid";
  }

  const drivers = driverKeys.map((k) => {
    const s = statsOf(respondents.map((r) => r.drivers[k]));
    return {
      code: k.toUpperCase(),
      mean: s.mean,
      sd: s.sd,
      n: s.n,
      strengthBand: band(s.mean),
      cohesionBand: cohesion(s.sd),
    };
  });

  const outcomes = outcomeKeys.map((k) => {
    const s = statsOf(respondents.map((r) => r.outcomes[k]));
    return {
      code: k.toUpperCase(),
      mean: s.mean,
      sd: s.sd,
      n: s.n,
      strengthBand: band(s.mean),
      cohesionBand: cohesion(s.sd),
    };
  });

  return { drivers, outcomes };
}
