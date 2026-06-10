export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { PULSE_POINTS } from "@/lib/vital-signs/catalog";

/**
 * Cron-triggered calibration job. Runs weekly on Vercel cron (configured separately).
 *
 * For each Pulse Point:
 *  1. Pull all PulsePointInference + paired PulsePointGroundTruth for the last 90 days.
 *  2. If sample >= 30, compute a weighted least squares fit:
 *       measured = α + Σ β_i * SEI_i + Σ γ_j * BT_j
 *  3. Store proposed weights as a draft v1 (not promoted — requires founder approval).
 *
 * For now (no enough data yet) this is a stub that records what's available and
 * marks status accordingly. Real regression kicks in when sample thresholds are met.
 */

const MIN_SAMPLE = 30;

function authorize(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const results: Array<{
      pulsePointCode: string;
      pairedSamples: number;
      meanDelta: number | null;
      readyForCalibration: boolean;
    }> = [];

    for (const pp of PULSE_POINTS) {
      const groundTruths = await prisma.pulsePointGroundTruth.findMany({
        where: {
          measuredAt: { gte: cutoff },
          inference: { pulsePointCode: pp.code },
        },
        include: { inference: true },
      });

      const meanDelta = groundTruths.length > 0
        ? groundTruths.reduce((s, g) => s + g.delta, 0) / groundTruths.length
        : null;

      results.push({
        pulsePointCode: pp.code,
        pairedSamples: groundTruths.length,
        meanDelta,
        readyForCalibration: groundTruths.length >= MIN_SAMPLE,
      });
    }

    const ready = results.filter((r) => r.readyForCalibration);

    await prisma.backgroundTask.create({
      data: {
        type: "vital_signs_calibration",
        status: "completed",
        description: `Calibration run for ${PULSE_POINTS.length} pulse points`,
        payload: { cutoff: cutoff.toISOString() } as object,
        result: {
          pulsePointsReady: ready.map((r) => r.pulsePointCode),
          totalPulsePoints: PULSE_POINTS.length,
          summary: results,
        } as object,
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      runAt: new Date().toISOString(),
      summary: {
        totalPulsePoints: PULSE_POINTS.length,
        readyForCalibration: ready.length,
        notReady: results.length - ready.length,
      },
      details: results,
    });
  } catch (e: unknown) {
    console.error("/api/cron/vital-signs-calibrate error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
