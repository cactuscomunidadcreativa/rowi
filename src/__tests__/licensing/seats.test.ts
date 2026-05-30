/**
 * Unit tests for seat licensing helpers.
 *
 * A tenant buys N seats (Tenant.licenseCount, synced from Stripe). Each
 * Membership consumes one. Seat math gates invites/activation, so off-by-one
 * or sign errors over/under-provision paid seats. Note the legacy rule:
 * licenseCount === 0 means "no seat scheme" → treated as unlimited. Prisma is
 * mocked at the seam.
 */

import { getSeatSummary, assertSeatAvailable } from "@/lib/licensing/seats";
import { prisma } from "@/core/prisma";

jest.mock("@/core/prisma", () => ({
  prisma: {
    tenant: { findUnique: jest.fn() },
    membership: { count: jest.fn() },
  },
}));

const mockTenant = prisma.tenant.findUnique as jest.Mock;
const mockCount = prisma.membership.count as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getSeatSummary", () => {
  it("computes remaining seats under a license count", async () => {
    mockTenant.mockResolvedValue({ licenseCount: 10 });
    mockCount.mockResolvedValue(3);

    const s = await getSeatSummary("t1");
    expect(s).toEqual({ purchased: 10, used: 3, available: 7, hasAvailable: true });
  });

  it("clamps available to zero when over the license count (never negative)", async () => {
    mockTenant.mockResolvedValue({ licenseCount: 10 });
    mockCount.mockResolvedValue(12);

    const s = await getSeatSummary("t1");
    expect(s.available).toBe(0);
    expect(s.hasAvailable).toBe(false);
  });

  it("treats a missing tenant as zero purchased seats", async () => {
    mockTenant.mockResolvedValue(null);
    mockCount.mockResolvedValue(2);

    const s = await getSeatSummary("missing");
    expect(s).toEqual({ purchased: 0, used: 2, available: 0, hasAvailable: false });
  });

  it("counts every membership of the tenant", async () => {
    mockTenant.mockResolvedValue({ licenseCount: 5 });
    mockCount.mockResolvedValue(1);

    await getSeatSummary("t1");
    expect(mockCount).toHaveBeenCalledWith({ where: { tenantId: "t1" } });
  });
});

describe("assertSeatAvailable", () => {
  it("allows tenants with no seat scheme (licenseCount 0 → unlimited)", async () => {
    mockTenant.mockResolvedValue({ licenseCount: 0 });
    mockCount.mockResolvedValue(9999);

    const r = await assertSeatAvailable("t1");
    expect(r.ok).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it("allows when at least one seat remains", async () => {
    mockTenant.mockResolvedValue({ licenseCount: 10 });
    mockCount.mockResolvedValue(9);

    const r = await assertSeatAvailable("t1");
    expect(r.ok).toBe(true);
    expect(r.summary?.available).toBe(1);
  });

  it("denies with reason no_seats when the license count is exhausted", async () => {
    mockTenant.mockResolvedValue({ licenseCount: 10 });
    mockCount.mockResolvedValue(10);

    const r = await assertSeatAvailable("t1");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("no_seats");
    expect(r.summary?.available).toBe(0);
  });
});
