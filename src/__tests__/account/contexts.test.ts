// Test the pure parsing/dispatch logic of resolveContextTenantId.
// We mock @/core/prisma so each kind branch uses a stub instead of
// hitting Postgres.

jest.mock("@/core/prisma", () => ({
  prisma: {
    employeeProfile: { findUnique: jest.fn() },
    rowiCommunity: { findUnique: jest.fn() },
    serviceEngagement: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

import {
  ACTIVE_CONTEXT_COOKIE,
  resolveContextTenantId,
} from "@/lib/account/contexts";
import { prisma } from "@/core/prisma";

const employeeFind = prisma.employeeProfile.findUnique as jest.Mock;
const communityFind = prisma.rowiCommunity.findUnique as jest.Mock;
const engagementFind = prisma.serviceEngagement.findUnique as jest.Mock;

describe("ACTIVE_CONTEXT_COOKIE constant", () => {
  it("matches the literal the AccountContextChip writes", () => {
    // If this assertion changes the chip writer must too, and vice
    // versa — that drift is exactly what almost broke /org filtering.
    expect(ACTIVE_CONTEXT_COOKIE).toBe("rowi_active_context");
  });
});

describe("resolveContextTenantId", () => {
  beforeEach(() => {
    employeeFind.mockReset();
    communityFind.mockReset();
    engagementFind.mockReset();
  });

  it("returns null for empty / undefined / null cookies", async () => {
    expect(await resolveContextTenantId(null)).toBeNull();
    expect(await resolveContextTenantId(undefined)).toBeNull();
    expect(await resolveContextTenantId("")).toBeNull();
  });

  it("returns null when cookie value has no kind:ref separator", async () => {
    expect(await resolveContextTenantId("tenant_primary_abc")).toBeNull();
    expect(await resolveContextTenantId(":onlyRef")).toBeNull();
    expect(await resolveContextTenantId("kindOnly:")).toBeNull();
  });

  it("tenant_primary kind returns the ref as-is (the ref IS the tenantId)", async () => {
    const tenantId = "tenant_abc123";
    expect(await resolveContextTenantId(`tenant_primary:${tenantId}`)).toBe(
      tenantId,
    );
  });

  it("employee kind looks up the EmployeeProfile and returns its tenantId", async () => {
    employeeFind.mockResolvedValueOnce({ tenantId: "tenant_xyz" });
    expect(await resolveContextTenantId("employee:profile_42")).toBe(
      "tenant_xyz",
    );
    expect(employeeFind).toHaveBeenCalledWith({
      where: { id: "profile_42" },
      select: { tenantId: true },
    });
  });

  it("employee kind returns null when the profile has no tenant", async () => {
    employeeFind.mockResolvedValueOnce({ tenantId: null });
    expect(await resolveContextTenantId("employee:profile_42")).toBeNull();
  });

  it("workspace_pro kind looks up the RowiCommunity tenantId", async () => {
    communityFind.mockResolvedValueOnce({ tenantId: "tenant_w1" });
    expect(await resolveContextTenantId("workspace_pro:com_1")).toBe(
      "tenant_w1",
    );
    expect(communityFind).toHaveBeenCalledWith({
      where: { id: "com_1" },
      select: { tenantId: true },
    });
  });

  it("service_provider kind prefers clientTenantId, falls back to clientCommunity.tenantId", async () => {
    engagementFind.mockResolvedValueOnce({
      clientTenantId: "tenant_direct",
      clientCommunity: { tenantId: "tenant_via_community" },
    });
    expect(
      await resolveContextTenantId("service_provider:engagement_1"),
    ).toBe("tenant_direct");

    engagementFind.mockResolvedValueOnce({
      clientTenantId: null,
      clientCommunity: { tenantId: "tenant_via_community" },
    });
    expect(
      await resolveContextTenantId("service_provider:engagement_2"),
    ).toBe("tenant_via_community");

    engagementFind.mockResolvedValueOnce({
      clientTenantId: null,
      clientCommunity: null,
    });
    expect(
      await resolveContextTenantId("service_provider:engagement_3"),
    ).toBeNull();
  });

  it("personal/family/family_inbound/service_client/manager → not tenant-scoped, returns null", async () => {
    expect(await resolveContextTenantId("personal:self")).toBeNull();
    expect(await resolveContextTenantId("family:rel_1")).toBeNull();
    expect(await resolveContextTenantId("family_inbound:rel_2")).toBeNull();
    expect(await resolveContextTenantId("service_client:eng_1")).toBeNull();
    expect(await resolveContextTenantId("manager:user_id")).toBeNull();
  });

  it("unknown kinds return null (defensive default)", async () => {
    expect(await resolveContextTenantId("totally_made_up:foo")).toBeNull();
  });

  it("does NOT call prisma for tenant-unrelated kinds — perf check", async () => {
    await resolveContextTenantId("personal:self");
    await resolveContextTenantId("family:rel_x");
    await resolveContextTenantId("service_client:e_x");
    expect(employeeFind).not.toHaveBeenCalled();
    expect(communityFind).not.toHaveBeenCalled();
    expect(engagementFind).not.toHaveBeenCalled();
  });
});
