/**
 * LVS xlsx parser.
 *
 * Schema (from Six Seconds LVS export):
 *   Project, Participant, BLANKS, Respondent, Trust, Change, Motivation,
 *   Teamwork, Execution, Engagement, Influence, Direction, Efficacy, Design,
 *   q1..q34 (item scores 1-5)
 *
 * Each row = one rater's evaluation of the leader. Respondent values include:
 *   "Self", "Manager", "Direct Report", "Peer", "Client", "6 Seconds Network" (benchmark).
 *
 * The LVS xlsx has two sheets:
 *   - "all" — every rater (incl. peers and direct reports)
 *   - "only full (self)" — only self-ratings
 *
 * We default to "all" because that's the multi-rater 360 view that defines LVS.
 */

import * as XLSX from "xlsx";

export interface LvsRespondent {
  rowIndex: number;
  project: string | null;
  participant: string | null;
  respondentRole: string; // self | manager | peer | report | client | benchmark | external
  drivers: {
    trust: number | null;
    change: number | null;
    motivation: number | null;
    teamwork: number | null;
    execution: number | null;
  };
  engagementComposite: number | null;
  outcomes: {
    influence: number | null;
    direction: number | null;
    efficacy: number | null;
    design: number | null;
  };
  items: Record<string, number | null>; // q1..q34
}

export interface LvsParseResult {
  scope: "LVS";
  sampleSize: number;
  projectName: string | null;
  participants: string[];
  respondents: LvsRespondent[];
  benchmarkRow: LvsRespondent | null;
  errors: string[];
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function normalizeRole(raw: string | null): string {
  if (!raw) return "anonymous";
  const r = raw.trim().toLowerCase();
  if (r === "self") return "self";
  if (r.includes("manager") || r.includes("supervisor")) return "manager";
  if (r.includes("peer") || r.includes("colleague")) return "peer";
  if (r.includes("direct report") || r === "report" || r.includes("subordinate")) return "report";
  if (r.includes("client") || r.includes("customer")) return "client";
  if (r.includes("network") || r.includes("benchmark") || r.includes("6 seconds")) return "benchmark";
  return "external";
}

export function parseLvsXlsx(buffer: ArrayBuffer): LvsParseResult {
  const result: LvsParseResult = {
    scope: "LVS",
    sampleSize: 0,
    projectName: null,
    participants: [],
    respondents: [],
    benchmarkRow: null,
    errors: [],
  };

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch (e) {
    result.errors.push(`Cannot read xlsx: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }

  const sheetName = workbook.SheetNames.includes("all") ? "all" : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    result.errors.push(`No sheet "${sheetName}" in workbook`);
    return result;
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const participants = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const respondent: LvsRespondent = {
      rowIndex: i,
      project: row["Project"] ? String(row["Project"]) : null,
      participant: row["Participant"] ? String(row["Participant"]) : null,
      respondentRole: normalizeRole(row["Respondent"] as string | null),
      drivers: {
        trust: toNum(row["Trust"]),
        change: toNum(row["Change"]),
        motivation: toNum(row["Motivation"]),
        teamwork: toNum(row["Teamwork"]),
        execution: toNum(row["Execution"]),
      },
      engagementComposite: toNum(row["Engagement"]),
      outcomes: {
        influence: toNum(row["Influence"]),
        direction: toNum(row["Direction"]),
        efficacy: toNum(row["Efficacy"]),
        design: toNum(row["Design"]),
      },
      items: {},
    };

    for (let q = 1; q <= 34; q++) {
      respondent.items[`q${q}`] = toNum(row[`q${q}`]);
    }

    const hasData = Object.values(respondent.drivers).some((v) => v !== null);
    if (!hasData) continue;

    if (respondent.respondentRole === "benchmark") {
      result.benchmarkRow = respondent;
    } else {
      result.respondents.push(respondent);
    }

    if (respondent.participant) participants.add(respondent.participant);
    if (!result.projectName && respondent.project) result.projectName = respondent.project;
  }

  result.sampleSize = result.respondents.length;
  result.participants = Array.from(participants);
  return result;
}

/**
 * Aggregate by driver and LVS outcome, grouped by respondent role.
 * The interesting LVS pattern is self vs others gap.
 */
export function aggregateLvs(respondents: LvsRespondent[]) {
  const driverKeys = ["trust", "change", "motivation", "teamwork", "execution"] as const;
  const outcomeKeys = ["influence", "direction", "efficacy", "design"] as const;
  const roles = ["self", "manager", "peer", "report", "client", "external"] as const;

  function statsOf(values: Array<number | null>) {
    const xs = values.filter((v): v is number => typeof v === "number");
    if (xs.length === 0) return { mean: 0, sd: 0, n: 0 };
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const variance = xs.reduce((sum, v) => sum + (v - mean) ** 2, 0) / xs.length;
    return { mean, sd: Math.sqrt(variance), n: xs.length };
  }

  const overallDrivers = driverKeys.map((k) => {
    const s = statsOf(respondents.map((r) => r.drivers[k]));
    return { code: k.toUpperCase(), ...s };
  });

  const overallOutcomes = outcomeKeys.map((k) => {
    const s = statsOf(respondents.map((r) => r.outcomes[k]));
    return { code: k.toUpperCase(), ...s };
  });

  const byRole: Record<string, { drivers: typeof overallDrivers; outcomes: typeof overallOutcomes }> = {};
  for (const role of roles) {
    const subset = respondents.filter((r) => r.respondentRole === role);
    if (subset.length === 0) continue;
    byRole[role] = {
      drivers: driverKeys.map((k) => {
        const s = statsOf(subset.map((r) => r.drivers[k]));
        return { code: k.toUpperCase(), ...s };
      }),
      outcomes: outcomeKeys.map((k) => {
        const s = statsOf(subset.map((r) => r.outcomes[k]));
        return { code: k.toUpperCase(), ...s };
      }),
    };
  }

  return { overallDrivers, overallOutcomes, byRole };
}
