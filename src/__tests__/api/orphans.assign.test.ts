/**
 * Integration tests for the orphan-member assignment flow.
 *
 * Two critical invariants:
 *   1. The caller's admin scope must reach the destination community's
 *      tenant. Tenant admins outside that tenant get 403.
 *   2. Cross-tenant moves are silently dropped — only members already
 *      in the destination community's tenant get reassigned. The
 *      response counts assigned vs skipped so the UI can show what
 *      happened.
 */

jest.mock("next/server", () => {
  const jsonImpl = (body: any, init?: any) => ({
    status: init?.status ?? 200,
    body,
    json: async () => body,
  });
  return { NextRequest: class {}, NextResponse: { json: jsonImpl } };
});

jest.mock("@/core/auth/requireAdmin", () => ({
  requireAdminWithScope: jest.fn(),
}));

jest.mock("@/core/prisma", () => ({
  prisma: {
    rowiCommunity: { findUnique: jest.fn() },
    hub: { findUnique: jest.fn() },
    superHub: { findUnique: jest.fn() },
    communityMember: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { prisma } from "@/core/prisma";
import { POST as assignPOST } from "@/app/api/admin/community-members/assign/route";

const authMock = requireAdminWithScope as jest.Mock;
const communityFind = prisma.rowiCommunity.findUnique as jest.Mock;
const hubFind = prisma.hub.findUnique as jest.Mock;
const superHubFind = prisma.superHub.findUnique as jest.Mock;
const memberFindMany = prisma.communityMember.findMany as jest.Mock;
const memberUpdate = prisma.communityMember.updateMany as jest.Mock;

function mockReq(body: unknown) {
  return { json: async () => body } as any;
}

beforeEach(() => {
  jest.resetAllMocks();
  authMock.mockResolvedValue({
    error: null,
    user: { id: "admin" },
    scope: { type: "rowiverse", id: null },
  });
});

describe("POST /api/admin/community-members/assign", () => {
  it("requires memberIds (non-empty array)", async () => {
    const res: any = await assignPOST(
      mockReq({ memberIds: [], communityId: "c1" }),
    );
    expect(res.status).toBe(400);
    expect(memberUpdate).not.toHaveBeenCalled();
  });

  it("requires communityId", async () => {
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1"] }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects when destination community doesn't exist", async () => {
    communityFind.mockResolvedValueOnce(null);
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1"], communityId: "ghost" }),
    );
    expect(res.status).toBe(404);
    expect(memberUpdate).not.toHaveBeenCalled();
  });

  it("rejects when community has no tenant", async () => {
    communityFind.mockResolvedValueOnce({ id: "c1", tenantId: null });
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1"], communityId: "c1" }),
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tenant/);
  });

  it("tenant-scoped admin cannot assign to a community outside their tenant", async () => {
    authMock.mockResolvedValueOnce({
      error: null,
      user: { id: "admin" },
      scope: { type: "tenant", id: "t_mine" },
    });
    communityFind.mockResolvedValueOnce({ id: "c1", tenantId: "t_other" });
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1"], communityId: "c1" }),
    );
    expect(res.status).toBe(403);
    expect(memberUpdate).not.toHaveBeenCalled();
  });

  it("happy path: assigns all eligible members in the same tenant", async () => {
    communityFind.mockResolvedValueOnce({ id: "c1", tenantId: "t1" });
    memberFindMany.mockResolvedValueOnce([{ id: "m1" }, { id: "m2" }]);
    memberUpdate.mockResolvedValueOnce({ count: 2 });
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1", "m2"], communityId: "c1" }),
    );
    expect(res.body.ok).toBe(true);
    expect(res.body.assigned).toBe(2);
    expect(res.body.skipped).toBe(0);
  });

  it("silently skips cross-tenant members and reports the count", async () => {
    communityFind.mockResolvedValueOnce({ id: "c1", tenantId: "t1" });
    // 3 members requested, only 2 are in tenant t1
    memberFindMany.mockResolvedValueOnce([{ id: "m1" }, { id: "m2" }]);
    memberUpdate.mockResolvedValueOnce({ count: 2 });
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1", "m2", "m3_other_tenant"], communityId: "c1" }),
    );
    expect(res.body.ok).toBe(true);
    expect(res.body.assigned).toBe(2);
    expect(res.body.skipped).toBe(1);
  });

  it("returns assigned:0 when none of the members belong to the tenant", async () => {
    communityFind.mockResolvedValueOnce({ id: "c1", tenantId: "t1" });
    memberFindMany.mockResolvedValueOnce([]); // none match
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m_other"], communityId: "c1" }),
    );
    expect(res.body.ok).toBe(true);
    expect(res.body.assigned).toBe(0);
    expect(res.body.skipped).toBe(1);
    expect(memberUpdate).not.toHaveBeenCalled();
  });

  it("hub-scoped admin can assign within their hub's tenant", async () => {
    authMock.mockResolvedValueOnce({
      error: null,
      user: { id: "admin" },
      scope: { type: "hub", id: "h1" },
    });
    communityFind.mockResolvedValueOnce({ id: "c1", tenantId: "t1" });
    // scope check looks up the hub's tenantId
    hubFind.mockResolvedValueOnce({ tenantId: "t1" });
    memberFindMany.mockResolvedValueOnce([{ id: "m1" }]);
    memberUpdate.mockResolvedValueOnce({ count: 1 });
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1"], communityId: "c1" }),
    );
    expect(res.body.ok).toBe(true);
    expect(res.body.assigned).toBe(1);
  });

  it("superhub-scoped admin works when community's tenant is in superhub's set", async () => {
    authMock.mockResolvedValueOnce({
      error: null,
      user: { id: "admin" },
      scope: { type: "superhub", id: "sh1" },
    });
    communityFind.mockResolvedValueOnce({ id: "c1", tenantId: "t1" });
    superHubFind.mockResolvedValueOnce({
      tenants: [{ id: "t1" }, { id: "t2" }],
    });
    memberFindMany.mockResolvedValueOnce([{ id: "m1" }]);
    memberUpdate.mockResolvedValueOnce({ count: 1 });
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1"], communityId: "c1" }),
    );
    expect(res.body.ok).toBe(true);
    expect(res.body.assigned).toBe(1);
  });

  it("superhub-scoped admin rejected when target tenant isn't in the superhub", async () => {
    authMock.mockResolvedValueOnce({
      error: null,
      user: { id: "admin" },
      scope: { type: "superhub", id: "sh1" },
    });
    communityFind.mockResolvedValueOnce({ id: "c1", tenantId: "t_outside" });
    superHubFind.mockResolvedValueOnce({
      tenants: [{ id: "t1" }, { id: "t2" }],
    });
    const res: any = await assignPOST(
      mockReq({ memberIds: ["m1"], communityId: "c1" }),
    );
    expect(res.status).toBe(403);
  });
});
