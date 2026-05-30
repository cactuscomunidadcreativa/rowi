/**
 * Unit tests for the consent gate helpers.
 *
 * This is the single place that answers "may we do X with this user's data?"
 * A consent is active only when the latest row is granted, not revoked, and at
 * least the current descriptor version. The privacy-safe default is NOT
 * granted — a regression to "default open" here would leak non-consenting users
 * into benchmarks/research, so these gates must fail closed. The real consent
 * descriptors (all version 1) are used; only prisma is mocked.
 */

import {
  canSendMarketing,
  canContributeToBenchmark,
  hasResearchLensConsent,
  hasBasicProcessing,
  canLinkVsSeiIndividual,
  filterByConsent,
} from "@/lib/privacy/checkConsent";
import { prisma } from "@/core/prisma";

jest.mock("@/core/prisma", () => ({
  prisma: {
    userConsent: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockFindFirst = prisma.userConsent.findFirst as jest.Mock;
const mockFindMany = prisma.userConsent.findMany as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("single-consent gates (isGranted)", () => {
  it("grants when the latest row is granted, not revoked, at current version", async () => {
    mockFindFirst.mockResolvedValue({ granted: true, revokedAt: null, version: 1 });
    await expect(canSendMarketing("u1")).resolves.toBe(true);
  });

  it("fails closed when the latest row is not granted", async () => {
    mockFindFirst.mockResolvedValue({ granted: false, revokedAt: null, version: 1 });
    await expect(canContributeToBenchmark("u1")).resolves.toBe(false);
  });

  it("fails closed when the consent was revoked", async () => {
    mockFindFirst.mockResolvedValue({ granted: true, revokedAt: new Date(), version: 1 });
    await expect(hasResearchLensConsent("u1")).resolves.toBe(false);
  });

  it("fails closed when the granted version is older than the descriptor", async () => {
    mockFindFirst.mockResolvedValue({ granted: true, revokedAt: null, version: 0 });
    await expect(hasBasicProcessing("u1")).resolves.toBe(false);
  });

  it("fails closed when there is no consent row at all (default-deny)", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(canLinkVsSeiIndividual("u1")).resolves.toBe(false);
  });

  it("queries each gate with its own consent key", async () => {
    mockFindFirst.mockResolvedValue({ granted: true, revokedAt: null, version: 1 });

    await canSendMarketing("u1");
    await hasBasicProcessing("u1");
    await canLinkVsSeiIndividual("u1");

    const keys = mockFindFirst.mock.calls.map((c) => c[0].where.consentKey);
    expect(keys).toEqual([
      "marketing_communications",
      "basic_processing",
      "vs_sei_individual_linking",
    ]);
  });
});

describe("filterByConsent", () => {
  it("short-circuits to [] without hitting the DB for an empty input", async () => {
    const res = await filterByConsent([], "analytics");
    expect(res).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("returns only granted user ids, preserving input order", async () => {
    mockFindMany.mockResolvedValue([{ userId: "u3" }, { userId: "u1" }]);

    const res = await filterByConsent(["u1", "u2", "u3"], "analytics");
    expect(res).toEqual(["u1", "u3"]);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        userId: { in: ["u1", "u2", "u3"] },
        consentKey: "analytics",
        granted: true,
        revokedAt: null,
        version: { gte: 1 },
      },
      select: { userId: true },
    });
  });

  it("returns [] when nobody in the set granted consent", async () => {
    mockFindMany.mockResolvedValue([]);
    const res = await filterByConsent(["u1", "u2"], "benchmarking_contribution");
    expect(res).toEqual([]);
  });
});
