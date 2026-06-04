/**
 * Tests for POST /api/research/calibration — promote v0 → v1 weights.
 *
 * Guards verified: research tier (founder/scientific_lead only), ground-truth
 * minimum (>=30), monotonic version, and the safety default that new weights
 * are written INACTIVE unless explicitly activated. Prisma + auth mocked.
 */

import { POST } from "@/app/api/research/calibration/route";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

jest.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));

jest.mock("@/core/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    researchAccessAudit: { create: jest.fn() },
    pulsePointGroundTruth: { findMany: jest.fn() },
    pulsePointWeights: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockToken = getToken as jest.Mock;
const mockUser = prisma.user.findUnique as jest.Mock;
const mockGT = prisma.pulsePointGroundTruth.findMany as jest.Mock;
const mockWeightsFirst = prisma.pulsePointWeights.findFirst as jest.Mock;
const mockWeightsCreate = prisma.pulsePointWeights.create as jest.Mock;
const mockWeightsUpdateMany = prisma.pulsePointWeights.updateMany as jest.Mock;
const mockTx = prisma.$transaction as jest.Mock;

function makeReq(body: unknown) {
  return { json: async () => body } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  jest.clearAllMocks();
  mockToken.mockResolvedValue({ email: "founder@rowi.test" });
  (prisma.researchAccessAudit.create as jest.Mock).mockResolvedValue({});
  // $transaction runs the callback with the prisma mock as tx.
  mockTx.mockImplementation(async (cb: (tx: typeof prisma) => unknown) => cb(prisma));
  mockWeightsCreate.mockResolvedValue({ id: "w1" });
  mockWeightsUpdateMany.mockResolvedValue({ count: 0 });
});

it("rejects non-founder/scientific_lead tiers", async () => {
  mockUser.mockResolvedValue({
    id: "u1", name: "T", email: "t@rowi.test", researchAccessLevel: "rowi_team",
  });
  const res = await POST(makeReq({ pulsePointCode: "TRUST_CARE" }));
  expect(res.status).toBe(403);
});

it("422 when ground truth < 30", async () => {
  mockUser.mockResolvedValue({
    id: "u1", name: "F", email: "founder@rowi.test", researchAccessLevel: "founder",
  });
  mockGT.mockResolvedValue(new Array(10).fill({ delta: 5 }));
  const res = await POST(makeReq({ pulsePointCode: "TRUST_CARE" }));
  expect(res.status).toBe(422);
});

it("400 on unknown pulse point", async () => {
  mockUser.mockResolvedValue({
    id: "u1", name: "F", email: "founder@rowi.test", researchAccessLevel: "founder",
  });
  const res = await POST(makeReq({ pulsePointCode: "NOPE" }));
  expect(res.status).toBe(400);
});

it("writes a new INACTIVE version by default and does not deactivate v0", async () => {
  mockUser.mockResolvedValue({
    id: "u1", name: "F", email: "founder@rowi.test", researchAccessLevel: "founder",
  });
  mockGT.mockResolvedValue(new Array(40).fill({ delta: 6 }));
  mockWeightsFirst.mockResolvedValue({ version: 0 });

  const res = await POST(makeReq({ pulsePointCode: "TRUST_CARE" }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.version).toBe(1);
  expect(body.active).toBe(false);
  expect(body.groundTruthCount).toBe(40);
  // not activated → no deactivation of existing active set
  expect(mockWeightsUpdateMany).not.toHaveBeenCalled();
  // wrote one row per predictor, all inactive
  expect(mockWeightsCreate).toHaveBeenCalled();
  const firstCall = mockWeightsCreate.mock.calls[0][0];
  expect(firstCall.data.active).toBe(false);
  expect(firstCall.data.version).toBe(1);
});

it("deactivates prior active set when activate=true", async () => {
  mockUser.mockResolvedValue({
    id: "u1", name: "F", email: "founder@rowi.test", researchAccessLevel: "founder",
  });
  mockGT.mockResolvedValue(new Array(35).fill({ delta: -3 }));
  mockWeightsFirst.mockResolvedValue({ version: 2 });

  const res = await POST(makeReq({ pulsePointCode: "TRUST_CARE", activate: true }));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body.version).toBe(3);
  expect(body.active).toBe(true);
  expect(mockWeightsUpdateMany).toHaveBeenCalledWith({
    where: { pulsePointCode: "TRUST_CARE", active: true },
    data: { active: false },
  });
});
