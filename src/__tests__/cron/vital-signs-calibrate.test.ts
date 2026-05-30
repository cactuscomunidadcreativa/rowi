/**
 * Unit tests for the vital-signs calibration cron route.
 *
 * Crons are internet-reachable POST endpoints, so the Bearer CRON_SECRET gate
 * is a real security boundary — an unauthenticated caller must never trigger a
 * DB scan. Beyond auth, this pins the per-pulse-point aggregation: it scans all
 * 15 PPs, computes the mean delta, and flags readiness at the 30-sample floor.
 *
 * prisma + NextResponse are mocked at the seam; the real PULSE_POINTS catalog
 * is used so the count (15) and codes stay honest.
 */

jest.mock("next/server", () => {
  const json = jest.fn((body: any, init?: any) => ({
    status: init?.status ?? 200,
    body,
    json: async () => body,
  }));
  return { NextRequest: class {}, NextResponse: { json } };
});

jest.mock("@/core/prisma", () => ({
  prisma: {
    pulsePointGroundTruth: { findMany: jest.fn() },
    backgroundTask: { create: jest.fn() },
  },
}));

import { POST } from "@/app/api/cron/vital-signs-calibrate/route";
import { prisma } from "@/core/prisma";
import { PULSE_POINTS } from "@/lib/vital-signs/catalog";

const gtFindMany = prisma.pulsePointGroundTruth.findMany as jest.Mock;
const taskCreate = prisma.backgroundTask.create as jest.Mock;

const OLD_ENV = process.env.CRON_SECRET;

function req(authHeader?: string): any {
  return {
    headers: { get: (k: string) => (k === "authorization" ? authHeader ?? null : null) },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = "topsecret";
  gtFindMany.mockResolvedValue([]);
  taskCreate.mockResolvedValue({});
});

afterAll(() => {
  process.env.CRON_SECRET = OLD_ENV;
});

describe("authorization", () => {
  it("401s when the Bearer token is missing", async () => {
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(gtFindMany).not.toHaveBeenCalled();
  });

  it("401s when the Bearer token is wrong", async () => {
    const res = await POST(req("Bearer nope"));
    expect(res.status).toBe(401);
  });

  it("401s when CRON_SECRET is unset (fail closed)", async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(req("Bearer topsecret"));
    expect(res.status).toBe(401);
  });
});

describe("calibration scan", () => {
  it("scans every pulse point and reports all not-ready with no data", async () => {
    const res = await POST(req("Bearer topsecret"));

    expect(gtFindMany).toHaveBeenCalledTimes(PULSE_POINTS.length);
    expect(res.body.ok).toBe(true);
    expect(res.body.summary.totalPulsePoints).toBe(PULSE_POINTS.length);
    expect(res.body.summary.readyForCalibration).toBe(0);
    expect(res.body.summary.notReady).toBe(PULSE_POINTS.length);
    expect(res.body.details).toHaveLength(PULSE_POINTS.length);
  });

  it("flags a pulse point ready only at >= 30 samples and computes mean delta", async () => {
    // First PP: 30 ground truths of delta 2 → mean 2, ready.
    // All others: empty → meanDelta null, not ready.
    gtFindMany.mockImplementation((args: any) => {
      const code = args.where.inference.pulsePointCode;
      if (code === PULSE_POINTS[0].code) {
        return Promise.resolve(Array.from({ length: 30 }, () => ({ delta: 2 })));
      }
      return Promise.resolve([]);
    });

    const res = await POST(req("Bearer topsecret"));

    const first = res.body.details.find((d: any) => d.pulsePointCode === PULSE_POINTS[0].code);
    expect(first.pairedSamples).toBe(30);
    expect(first.meanDelta).toBe(2);
    expect(first.readyForCalibration).toBe(true);
    expect(res.body.summary.readyForCalibration).toBe(1);
  });

  it("does NOT flag ready at 29 samples (boundary below the floor)", async () => {
    gtFindMany.mockImplementation((args: any) => {
      const code = args.where.inference.pulsePointCode;
      if (code === PULSE_POINTS[0].code) {
        return Promise.resolve(Array.from({ length: 29 }, () => ({ delta: 1 })));
      }
      return Promise.resolve([]);
    });

    const res = await POST(req("Bearer topsecret"));
    const first = res.body.details.find((d: any) => d.pulsePointCode === PULSE_POINTS[0].code);
    expect(first.pairedSamples).toBe(29);
    expect(first.readyForCalibration).toBe(false);
    expect(res.body.summary.readyForCalibration).toBe(0);
  });

  it("records a completed BackgroundTask ledger row", async () => {
    await POST(req("Bearer topsecret"));
    expect(taskCreate).toHaveBeenCalledTimes(1);
    const data = taskCreate.mock.calls[0][0].data;
    expect(data.type).toBe("vital_signs_calibration");
    expect(data.status).toBe("completed");
  });

  it("500s when the DB scan throws", async () => {
    gtFindMany.mockRejectedValueOnce(new Error("connection reset"));
    const res = await POST(req("Bearer topsecret"));
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe("connection reset");
  });
});
