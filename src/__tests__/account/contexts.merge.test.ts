/**
 * Tests for getActiveContexts after the family/service query MERGE.
 *
 * The optimization fetches family relations (and service engagements) in a
 * SINGLE query over both sides of the relation, then splits them in memory.
 * A regression here is privacy-relevant: the related user must only see
 * ACCEPTED inbound relations; the owner sees all of theirs. These tests pin
 * the split + assert each relation table is queried exactly once (the merge).
 */

import { getActiveContexts } from "@/lib/account/contexts";
import { prisma } from "@/core/prisma";

jest.mock("@/core/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    employeeProfile: { findMany: jest.fn(), count: jest.fn() },
    familyRelation: { findMany: jest.fn() },
    serviceEngagement: { findMany: jest.fn() },
    rowiCommunityUser: { findMany: jest.fn() },
  },
}));

const mUser = prisma.user.findUnique as jest.Mock;
const mEmpMany = prisma.employeeProfile.findMany as jest.Mock;
const mEmpCount = prisma.employeeProfile.count as jest.Mock;
const mFamily = prisma.familyRelation.findMany as jest.Mock;
const mService = prisma.serviceEngagement.findMany as jest.Mock;
const mWorkspace = prisma.rowiCommunityUser.findMany as jest.Mock;

const ME = "me";

beforeEach(() => {
  jest.clearAllMocks();
  mUser.mockResolvedValue({ id: ME, name: "Me", primaryTenantId: null, primaryTenant: null });
  mEmpMany.mockResolvedValue([]);
  mEmpCount.mockResolvedValue(0);
  mFamily.mockResolvedValue([]);
  mService.mockResolvedValue([]);
  mWorkspace.mockResolvedValue([]);
});

it("queries each relation table exactly ONCE (8 -> 6 query merge)", async () => {
  await getActiveContexts(ME);
  expect(mFamily).toHaveBeenCalledTimes(1);
  expect(mService).toHaveBeenCalledTimes(1);
});

it("splits family rows into owned vs accepted-inbound", async () => {
  mFamily.mockResolvedValue([
    // Owned by me, still pending — owner sees it regardless of consent.
    {
      id: "f1", ownerId: ME, relatedUserId: "u2", relationship: "child",
      relatedName: "Kid", relatedEmail: null, consentStatus: "pending",
      relatedUser: null, owner: { id: ME, name: "Me", email: null },
    },
    // Declared by someone else, I accepted — surfaces as inbound.
    {
      id: "f2", ownerId: "u3", relatedUserId: ME, relationship: "parent",
      relatedName: null, relatedEmail: null, consentStatus: "accepted",
      relatedUser: { id: ME, name: "Me", email: null },
      owner: { id: "u3", name: "Dad", email: null },
    },
  ]);

  const ctx = await getActiveContexts(ME);
  const ids = ctx.map((c) => c.id);

  expect(ids).toContain("family:f1");
  expect(ids).toContain("family_inbound:f2");

  const owned = ctx.find((c) => c.id === "family:f1")!;
  expect(owned.detail).toContain("pendiente"); // pending consent surfaced
  const inbound = ctx.find((c) => c.id === "family_inbound:f2")!;
  expect(inbound.detail).toBe("Dad");
});

it("splits service rows into provider vs client", async () => {
  mService.mockResolvedValue([
    {
      id: "s1", providerId: ME, clientUserId: null, serviceRole: "coach",
      status: "active", clientTenant: { id: "t", name: "Acme" },
      clientCommunity: null, clientOrganization: null, clientUser: null,
      provider: { id: ME, name: "Me", email: null },
    },
    {
      id: "s2", providerId: "u9", clientUserId: ME, serviceRole: "mentor",
      status: "active", clientTenant: null, clientCommunity: null,
      clientOrganization: null, clientUser: { id: ME, name: "Me", email: null },
      provider: { id: "u9", name: "Mentor", email: null },
    },
  ]);

  const ctx = await getActiveContexts(ME);
  const ids = ctx.map((c) => c.id);

  expect(ids).toContain("service_provider:s1");
  expect(ids).toContain("service_client:s2");
  expect(ctx.find((c) => c.id === "service_provider:s1")!.detail).toBe("Acme");
});

it("always includes the personal context and returns [] for unknown users", async () => {
  const ctx = await getActiveContexts(ME);
  expect(ctx.map((c) => c.id)).toContain(`personal:${ME}`);

  mUser.mockResolvedValue(null);
  expect(await getActiveContexts("ghost")).toEqual([]);
});
