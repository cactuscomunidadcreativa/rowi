// Unit tests for the scope-aware admin helpers.
// Pure logic + prisma mocks — no DB.

// next/server pulls in Web Request which jsdom doesn't have. We only
// touch the helpers (which don't actually use NextResponse), so stub it.
jest.mock("next/server", () => ({
  NextResponse: { json: jest.fn() },
}));

jest.mock("@/core/auth/requireAdmin", () => ({
  requireAdminWithScope: jest.fn(),
  requireSuperAdmin: jest.fn(),
}));

jest.mock("@/core/prisma", () => ({
  prisma: {
    hub: { findUnique: jest.fn() },
    superHub: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

import {
  tenantIdsForScope,
  scopeCanSeeUser,
  scopeCanAdminProfileFeatureScope,
} from "@/core/admin/scopedList";
import { scopeCanAdminHub } from "@/core/admin/hubScope";
import { prisma } from "@/core/prisma";

const hubFind = prisma.hub.findUnique as jest.Mock;
const superHubFind = prisma.superHub.findUnique as jest.Mock;
const userFind = prisma.user.findUnique as jest.Mock;

beforeEach(() => {
  hubFind.mockReset();
  superHubFind.mockReset();
  userFind.mockReset();
});

describe("tenantIdsForScope", () => {
  it("returns null for rowiverse (means: no narrowing)", async () => {
    expect(
      await tenantIdsForScope({ type: "rowiverse", id: null }),
    ).toBeNull();
  });

  it("returns the tenant id wrapped in an array for tenant scope", async () => {
    expect(
      await tenantIdsForScope({ type: "tenant", id: "tenant_1" }),
    ).toEqual(["tenant_1"]);
  });

  it("returns empty array for tenant scope with null id (defensive)", async () => {
    expect(await tenantIdsForScope({ type: "tenant", id: null })).toEqual(
      [],
    );
  });

  it("hub scope resolves to the hub's tenantId via one DB call", async () => {
    hubFind.mockResolvedValueOnce({ tenantId: "tenant_x" });
    expect(await tenantIdsForScope({ type: "hub", id: "hub_1" })).toEqual([
      "tenant_x",
    ]);
    expect(hubFind).toHaveBeenCalledWith({
      where: { id: "hub_1" },
      select: { tenantId: true },
    });
  });

  it("hub scope returns empty when the hub doesn't exist", async () => {
    hubFind.mockResolvedValueOnce(null);
    expect(await tenantIdsForScope({ type: "hub", id: "hub_missing" })).toEqual(
      [],
    );
  });

  it("superhub scope resolves to all child tenants", async () => {
    superHubFind.mockResolvedValueOnce({
      tenants: [{ id: "t1" }, { id: "t2" }, { id: "t3" }],
    });
    expect(
      await tenantIdsForScope({ type: "superhub", id: "sh_1" }),
    ).toEqual(["t1", "t2", "t3"]);
  });
});

describe("scopeCanSeeUser", () => {
  it("rowiverse can see anyone — no DB call needed", async () => {
    expect(
      await scopeCanSeeUser({ type: "rowiverse", id: null }, "user_x"),
    ).toBe(true);
    expect(userFind).not.toHaveBeenCalled();
  });

  it("returns false when the target user doesn't exist", async () => {
    userFind.mockResolvedValueOnce(null);
    expect(
      await scopeCanSeeUser({ type: "tenant", id: "tenant_1" }, "ghost"),
    ).toBe(false);
  });

  it("matches via primaryTenantId", async () => {
    userFind.mockResolvedValueOnce({
      primaryTenantId: "tenant_1",
      memberships: [],
      rowiCommunities: [],
    });
    expect(
      await scopeCanSeeUser({ type: "tenant", id: "tenant_1" }, "u"),
    ).toBe(true);
  });

  it("matches via memberships", async () => {
    userFind.mockResolvedValueOnce({
      primaryTenantId: null,
      memberships: [{ tenantId: "tenant_2" }],
      rowiCommunities: [],
    });
    expect(
      await scopeCanSeeUser({ type: "tenant", id: "tenant_2" }, "u"),
    ).toBe(true);
  });

  it("matches via community.tenantId", async () => {
    userFind.mockResolvedValueOnce({
      primaryTenantId: null,
      memberships: [],
      rowiCommunities: [{ community: { tenantId: "tenant_3" } }],
    });
    expect(
      await scopeCanSeeUser({ type: "tenant", id: "tenant_3" }, "u"),
    ).toBe(true);
  });

  it("returns false when no overlap", async () => {
    userFind.mockResolvedValueOnce({
      primaryTenantId: "tenant_other",
      memberships: [{ tenantId: "tenant_alsoOther" }],
      rowiCommunities: [],
    });
    expect(
      await scopeCanSeeUser({ type: "tenant", id: "tenant_mine" }, "u"),
    ).toBe(false);
  });
});

describe("scopeCanAdminProfileFeatureScope", () => {
  it("rowiverse can administer any scope", async () => {
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "rowiverse", id: null },
        "tenant",
        "anything",
      ),
    ).toBe(true);
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "rowiverse", id: null },
        null,
        null,
      ),
    ).toBe(true);
  });

  it("non-rowiverse cannot edit global defaults (null scope)", async () => {
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "tenant", id: "t1" },
        null,
        null,
      ),
    ).toBe(false);
  });

  it("tenant admin only edits permissions in their tenant", async () => {
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "tenant", id: "t1" },
        "tenant",
        "t1",
      ),
    ).toBe(true);
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "tenant", id: "t1" },
        "tenant",
        "t2",
      ),
    ).toBe(false);
  });

  it("tenant admin cannot edit hub-scoped permissions", async () => {
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "tenant", id: "t1" },
        "hub",
        "h1",
      ),
    ).toBe(false);
  });

  it("hub admin only edits their own hub permissions", async () => {
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "hub", id: "h1" },
        "hub",
        "h1",
      ),
    ).toBe(true);
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "hub", id: "h1" },
        "hub",
        "h2",
      ),
    ).toBe(false);
  });

  it("superhub admin can edit own superhub OR any tenant inside it", async () => {
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "superhub", id: "sh1" },
        "superhub",
        "sh1",
      ),
    ).toBe(true);

    // Tenant inside the superhub
    superHubFind.mockResolvedValueOnce({
      tenants: [{ id: "t_in_sh" }, { id: "t_other_in_sh" }],
    });
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "superhub", id: "sh1" },
        "tenant",
        "t_in_sh",
      ),
    ).toBe(true);

    // Tenant not in superhub
    superHubFind.mockResolvedValueOnce({
      tenants: [{ id: "t_in_sh" }],
    });
    expect(
      await scopeCanAdminProfileFeatureScope(
        { type: "superhub", id: "sh1" },
        "tenant",
        "t_outsider",
      ),
    ).toBe(false);
  });
});

describe("scopeCanAdminHub", () => {
  it("rowiverse can admin any hub without a DB lookup", async () => {
    expect(
      await scopeCanAdminHub({ type: "rowiverse", id: null }, "h"),
    ).toBe(true);
    expect(hubFind).not.toHaveBeenCalled();
  });

  it("hub scope matches strictly by id", async () => {
    expect(
      await scopeCanAdminHub({ type: "hub", id: "h1" }, "h1"),
    ).toBe(true);
    expect(
      await scopeCanAdminHub({ type: "hub", id: "h1" }, "h2"),
    ).toBe(false);
  });

  it("tenant scope: only when hub.tenantId === scope.id", async () => {
    hubFind.mockResolvedValueOnce({
      tenantId: "t1",
      superHubId: null,
    });
    expect(
      await scopeCanAdminHub({ type: "tenant", id: "t1" }, "h_target"),
    ).toBe(true);

    hubFind.mockResolvedValueOnce({
      tenantId: "t_other",
      superHubId: null,
    });
    expect(
      await scopeCanAdminHub({ type: "tenant", id: "t1" }, "h_target"),
    ).toBe(false);
  });

  it("superhub scope: only when hub.superHubId === scope.id", async () => {
    hubFind.mockResolvedValueOnce({
      tenantId: null,
      superHubId: "sh1",
    });
    expect(
      await scopeCanAdminHub({ type: "superhub", id: "sh1" }, "h"),
    ).toBe(true);

    hubFind.mockResolvedValueOnce({
      tenantId: null,
      superHubId: "sh_other",
    });
    expect(
      await scopeCanAdminHub({ type: "superhub", id: "sh1" }, "h"),
    ).toBe(false);
  });

  it("returns false when the hub doesn't exist", async () => {
    hubFind.mockResolvedValueOnce(null);
    expect(
      await scopeCanAdminHub({ type: "tenant", id: "t1" }, "h_missing"),
    ).toBe(false);
  });
});
