export const runtime = "nodejs";

/**
 * POST /api/admin/vital-signs/weights/recalculate?benchmarkId=X
 *
 * Reads BenchmarkCorrelation rows for the given benchmark and produces a new
 * inactive PulsePointWeights version per pulse point.
 *
 * Predictor set (32 total):
 *   - 8 SEI competencies  : EL, RP, ACT, NE, IM, OP, EMP, NG
 *   - 18 Brain Talents    : dataMining, modeling, ... (catalog keys)
 *   - 6 aggregated groups : grp:focus_data, grp:focus_people, grp:decisions_evaluative,
 *                           grp:decisions_innovative, grp:drive_practical, grp:drive_idealistic
 *
 * For each (pulsePoint, predictor) the weight is the mean Pearson correlation
 * across the outcomes mapped to the pulse point's successFactors. We keep the
 * sign — a predictor negatively associated with an outcome stays negative.
 *
 * SuperAdmin only. The new version is created with active=false; activation is
 * done explicitly from /hub/admin/vital-signs/lab.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import { PULSE_POINTS } from "@/lib/vital-signs/catalog";

export const maxDuration = 60;

const SEI_PREDICTORS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

const BRAIN_TALENT_PREDICTORS = [
  "dataMining", "modeling", "prioritizing",
  "connection", "emotionalInsight", "collaboration",
  "reflecting", "adaptability", "criticalThinking",
  "resilience", "riskTolerance", "imagination",
  "proactivity", "commitment", "problemSolving",
  "vision", "designing", "entrepreneurship",
];

const GROUP_PREDICTORS = [
  "grp:focus_data", "grp:focus_people",
  "grp:decisions_evaluative", "grp:decisions_innovative",
  "grp:drive_practical", "grp:drive_idealistic",
];

const ALL_PREDICTORS = [...SEI_PREDICTORS, ...BRAIN_TALENT_PREDICTORS, ...GROUP_PREDICTORS];

const FACTOR_TO_OUTCOME: Record<string, string> = {
  Effectiveness: "effectiveness",
  Relationships: "relationships",
  Wellbeing: "wellbeing",
  QualityOfLife: "qualityOfLife",
};

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!auth.isSuperAdmin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const benchmarkId = url.searchParams.get("benchmarkId");
    if (!benchmarkId) {
      return NextResponse.json(
        { ok: false, error: "benchmarkId query param required" },
        { status: 400 },
      );
    }

    const correlations = await prisma.benchmarkCorrelation.findMany({
      where: { benchmarkId, year: null }, // global rows (not per-year)
      select: { competencyKey: true, outcomeKey: true, correlation: true, n: true },
    });

    if (correlations.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No correlations found for this benchmark. Run /correlations/calculate first." },
        { status: 400 },
      );
    }

    // Map keyed lookup: (predictor, outcome) → {r, n}
    const corrMap = new Map<string, { r: number; n: number }>();
    for (const c of correlations) {
      corrMap.set(`${c.competencyKey}|${c.outcomeKey}`, { r: c.correlation, n: c.n });
    }

    let createdRows = 0;
    const versionsByPp: Record<string, number> = {};

    for (const pp of PULSE_POINTS) {
      // Outcomes for this PP
      const ppOutcomes = pp.successFactors.map((f) => FACTOR_TO_OUTCOME[f]).filter(Boolean);

      // Next version
      const last = await prisma.pulsePointWeights.findFirst({
        where: { pulsePointCode: pp.code },
        orderBy: { version: "desc" },
        select: { version: true },
      });
      const nextVersion = (last?.version ?? 0) + 1;
      versionsByPp[pp.code] = nextVersion;

      // For each predictor, compute mean correlation across PP outcomes
      const rows: {
        pulsePointCode: string;
        version: number;
        predictor: string;
        weight: number;
        sampleSize: number | null;
        active: boolean;
        benchmarkId: string;
        createdById: string;
      }[] = [];

      for (const predictor of ALL_PREDICTORS) {
        const values: number[] = [];
        const ns: number[] = [];
        for (const outcome of ppOutcomes) {
          const hit = corrMap.get(`${predictor}|${outcome}`);
          if (hit && Number.isFinite(hit.r)) {
            values.push(hit.r);
            ns.push(hit.n);
          }
        }
        if (values.length === 0) continue;
        const meanR = values.reduce((s, v) => s + v, 0) / values.length;
        const minN = ns.length > 0 ? Math.min(...ns) : null;
        rows.push({
          pulsePointCode: pp.code,
          version: nextVersion,
          predictor,
          weight: meanR,
          sampleSize: minN,
          active: false,
          benchmarkId,
          createdById: auth.id,
        });
      }

      if (rows.length > 0) {
        await prisma.pulsePointWeights.createMany({ data: rows });
        createdRows += rows.length;
      }
    }

    return NextResponse.json({
      ok: true,
      benchmarkId,
      ppsProcessed: PULSE_POINTS.length,
      createdRows,
      versions: versionsByPp,
      note: "All rows created with active=false. Activate from /hub/admin/vital-signs/lab.",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/admin/vital-signs/weights/recalculate error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
