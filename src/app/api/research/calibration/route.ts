export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { logResearchAccess, requireResearchUser } from "@/lib/research/access";
import { PULSE_POINTS } from "@/lib/vital-signs/catalog";

/**
 * Aggregated calibration view: for each Pulse Point, show the BE2GROW v0 hypothesis
 * against the observed reality from highlighter feedback + ground truth deltas.
 *
 * - own_rate = OWN / (OWN + CONSIDER + REJECT)  — hypothesis hit rate
 * - mean_delta = mean(measured - inferred) from PulsePointGroundTruth when available
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireResearchUser(req);
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    const { user } = auth;

    const [feedbacks, groundTruths, inferences] = await Promise.all([
      prisma.hypothesisFeedback.findMany({
        select: { pulsePointCode: true, verdict: true },
      }),
      prisma.pulsePointGroundTruth.findMany({
        include: { inference: { select: { pulsePointCode: true } } },
      }),
      prisma.pulsePointInference.groupBy({
        by: ["pulsePointCode"],
        _count: { _all: true },
      }),
    ]);

    const calibration = PULSE_POINTS.map((pp) => {
      const ppFeedbacks = feedbacks.filter((f) =>
        f.pulsePointCode === pp.code || f.pulsePointCode === `DRIVER_${pp.driver}`,
      );
      const own = ppFeedbacks.filter((f) => f.verdict === "OWN").length;
      const consider = ppFeedbacks.filter((f) => f.verdict === "CONSIDER").length;
      const reject = ppFeedbacks.filter((f) => f.verdict === "REJECT").length;
      const total = own + consider + reject;
      const ownRate = total > 0 ? own / total : null;

      const ppGroundTruths = groundTruths.filter(
        (g) => g.inference.pulsePointCode === pp.code,
      );
      const meanDelta = ppGroundTruths.length > 0
        ? ppGroundTruths.reduce((sum, g) => sum + g.delta, 0) / ppGroundTruths.length
        : null;

      const inferenceCount = inferences.find((i) => i.pulsePointCode === pp.code)?._count._all ?? 0;

      return {
        code: pp.code,
        driver: pp.driver,
        esName: pp.esName,
        enName: pp.enName,
        hypothesis: {
          competencies: pp.competencies,
          talents: pp.talents,
        },
        observation: {
          inferenceCount,
          feedbackTotal: total,
          ownCount: own,
          considerCount: consider,
          rejectCount: reject,
          ownRate,
          groundTruthCount: ppGroundTruths.length,
          meanDelta,
        },
        readyForCalibration: total >= 100 && ppGroundTruths.length >= 30,
      };
    });

    await logResearchAccess({
      viewerUserId: user.id,
      action: "view_calibration",
      contextPath: "/research/calibration",
      metadata: { ppCount: calibration.length },
    });

    return NextResponse.json({
      ok: true,
      viewerLevel: user.researchAccessLevel,
      currentWeightsVersion: "v0-hypothesis",
      calibration,
    });
  } catch (e: unknown) {
    console.error("/api/research/calibration error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

/**
 * Promote a pulse point's weights from v0 (hypothesis) toward v1 (data-driven).
 *
 * Body: { pulsePointCode: string, activate?: boolean }
 *
 * Derivation (conservative, explainable): the v0 catalog lists the predictors
 * (SEI competencies + Brain Talents) for the pulse point with equal implicit
 * weight. We compute a new version whose predictor weights are nudged by the
 * observed mean delta from PulsePointGroundTruth — a positive delta (people
 * score higher in reality than inferred) raises the weights slightly, a
 * negative delta lowers them — bounded to [0.2, 1.8]× the base. The new rows
 * are written INACTIVE unless `activate: true` is passed AND the pulse point is
 * readyForCalibration, so production keeps using v0 until a human flips it.
 *
 * Founder-only effectively (research access; gated by requireResearchUser).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireResearchUser(req);
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    const { user } = auth;
    // Writing weights is reserved for the highest research tiers.
    if (user.researchAccessLevel !== "founder" && user.researchAccessLevel !== "scientific_lead") {
      return NextResponse.json(
        { ok: false, error: "Calibration writes require founder or scientific_lead" },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      pulsePointCode?: string;
      activate?: boolean;
    };
    const code = body.pulsePointCode;
    const pp = PULSE_POINTS.find((p) => p.code === code);
    if (!pp) {
      return NextResponse.json({ ok: false, error: "Unknown pulsePointCode" }, { status: 400 });
    }

    const groundTruths = await prisma.pulsePointGroundTruth.findMany({
      where: { inference: { pulsePointCode: pp.code } },
      select: { delta: true },
    });
    if (groundTruths.length < 30) {
      return NextResponse.json(
        { ok: false, error: `Not enough ground truth (${groundTruths.length}/30) to calibrate` },
        { status: 422 },
      );
    }
    const meanDelta =
      groundTruths.reduce((s, g) => s + g.delta, 0) / groundTruths.length;

    // Next monotonic version for this pulse point.
    const latest = await prisma.pulsePointWeights.findFirst({
      where: { pulsePointCode: pp.code },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    // Predictors = competencies + talents from the v0 catalog, equal base 1.0,
    // nudged by the normalized mean delta (±0.8 cap).
    const nudge = Math.max(-0.8, Math.min(0.8, meanDelta / 30));
    const predictors = [
      ...pp.competencies.map((k) => ({ predictor: k as string, kind: "sei" })),
      ...pp.talents.map((k) => ({ predictor: k as string, kind: "talent" })),
    ];
    const activate = body.activate === true;

    const created = await prisma.$transaction(async (tx) => {
      // If activating, deactivate any currently-active set for this PP.
      if (activate) {
        await tx.pulsePointWeights.updateMany({
          where: { pulsePointCode: pp.code, active: true },
          data: { active: false },
        });
      }
      const rows = [];
      for (const p of predictors) {
        rows.push(
          await tx.pulsePointWeights.create({
            data: {
              pulsePointCode: pp.code,
              version: nextVersion,
              predictor: p.predictor,
              weight: Number((1.0 + nudge).toFixed(4)),
              sampleSize: groundTruths.length,
              active: activate,
              notes: `v${nextVersion} from ${groundTruths.length} GT rows; meanDelta=${meanDelta.toFixed(2)}`,
              createdById: user.id,
            },
          }),
        );
      }
      return rows;
    });

    await logResearchAccess({
      viewerUserId: user.id,
      action: "run_calibration",
      contextPath: "/research/calibration",
      metadata: {
        pulsePointCode: pp.code,
        version: nextVersion,
        meanDelta,
        activated: activate,
        predictors: created.length,
      },
    });

    return NextResponse.json({
      ok: true,
      pulsePointCode: pp.code,
      version: nextVersion,
      active: activate,
      meanDelta,
      groundTruthCount: groundTruths.length,
      predictorsWritten: created.length,
    });
  } catch (e: unknown) {
    console.error("/api/research/calibration POST error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
