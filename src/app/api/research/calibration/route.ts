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
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/research/calibration error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
