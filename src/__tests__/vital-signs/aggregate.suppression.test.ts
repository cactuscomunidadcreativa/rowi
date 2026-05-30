/**
 * Unit tests for the N≥5 privacy floor in the inferred Vital Signs aggregate.
 *
 * This is a GDPR / anonymization guarantee, not a cosmetic threshold: a group
 * aggregate must be SUPPRESSED (no scores) unless at least 5 members both
 * consented to analytics AND have a snapshot. A regression that leaks
 * aggregates at N=4 is a privacy incident. These tests pin the three
 * suppression gates (empty group, too few consenting, too few with snapshots);
 * `filterByConsent` and prisma are mocked at the seam.
 */

import { aggregateInferredVitalSigns } from "@/lib/vital-signs/aggregate";
import { prisma } from "@/core/prisma";
import { filterByConsent } from "@/lib/privacy/checkConsent";

jest.mock("@/lib/privacy/checkConsent", () => ({
  filterByConsent: jest.fn(),
}));

jest.mock("@/core/prisma", () => ({
  prisma: {
    membership: { findMany: jest.fn() },
    eqSnapshot: { findMany: jest.fn() },
    talentSnapshot: { findMany: jest.fn() },
    pulsePointWeights: { findMany: jest.fn() },
  },
}));

const mockMembers = prisma.membership.findMany as jest.Mock;
const mockSnapshots = prisma.eqSnapshot.findMany as jest.Mock;
const mockFilter = filterByConsent as jest.Mock;

const ARGS = { scope: "org" as const, subjectId: "tenant-1", subjectName: "Acme" };

function members(n: number) {
  return Array.from({ length: n }, (_, i) => ({ userId: `u${i + 1}` }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

it("suppresses (and skips consent lookup) when the group is empty", async () => {
  mockMembers.mockResolvedValue([]);

  const res = await aggregateInferredVitalSigns(ARGS);

  expect(res.suppressed).toBe(true);
  expect(res.n).toBe(0);
  expect(res.nTotal).toBe(0);
  expect(res.drivers).toEqual([]);
  expect(res.pulsePoints).toEqual([]);
  expect(mockFilter).not.toHaveBeenCalled();
});

it("suppresses when fewer than 5 members consented (N=4), without reading snapshots", async () => {
  mockMembers.mockResolvedValue(members(6));
  mockFilter.mockResolvedValue(["u1", "u2", "u3", "u4"]); // 4 < N_MIN

  const res = await aggregateInferredVitalSigns(ARGS);

  expect(res.suppressed).toBe(true);
  expect(res.n).toBe(4);
  expect(res.nTotal).toBe(6);
  expect(mockFilter).toHaveBeenCalledWith(
    ["u1", "u2", "u3", "u4", "u5", "u6"],
    "analytics",
  );
  expect(mockSnapshots).not.toHaveBeenCalled();
});

it("suppresses when fewer than 5 consenting members have a snapshot (N=4 distinct)", async () => {
  mockMembers.mockResolvedValue(members(6));
  mockFilter.mockResolvedValue(["u1", "u2", "u3", "u4", "u5", "u6"]);
  // Only 4 DISTINCT users have snapshots (u1 appears twice) → nWithSnapshot = 4.
  mockSnapshots.mockResolvedValue([
    { id: "s1", userId: "u1" },
    { id: "s1b", userId: "u1" },
    { id: "s2", userId: "u2" },
    { id: "s3", userId: "u3" },
    { id: "s4", userId: "u4" },
  ]);

  const res = await aggregateInferredVitalSigns(ARGS);

  expect(res.suppressed).toBe(true);
  expect(res.n).toBe(4);
  expect(res.nTotal).toBe(6);
});
