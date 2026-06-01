/**
 * Unit tests for the scope-aware admin AUTHORIZATION CONTRACT in the paginated
 * list handlers (the parts scopedList.test.ts doesn't reach).
 *
 * The cookie/scope only NARROWS access, it never grants it — and the most
 * dangerous failure mode is the inverse: a scoped admin accidentally seeing
 * (or worse, a where-clause silently dropping so EVERYONE sees) data outside
 * their tenant. So this pins:
 *
 * - rowiverse (SuperAdmin) → NO where filter (global view).
 * - tenant/hub/superhub → query is narrowed to the scope's tenant set.
 * - The fail-CLOSED invariant: a scope that resolves to zero tenants returns
 *   an empty page WITHOUT querying the model (never falls through to "no
 *   filter" = everything).
 * - auth.error short-circuits before any DB work.
 * - resolveScopeTenantIds + tenantIdWhere scope→Prisma translation.
 *
 * requireAdminWithScope, prisma, and NextResponse are mocked at the seam.
 */

jest.mock("next/server", () => {
  const json = jest.fn((body: any, init?: any) => ({
    status: init?.status ?? 200,
    body,
  }));
  return { NextRequest: class {}, NextResponse: { json } };
});

jest.mock("@/core/auth/requireAdmin", () => ({
  requireAdminWithScope: jest.fn(),
}));

jest.mock("@/core/prisma", () => ({
  prisma: {
    hub: { findUnique: jest.fn() },
    superHub: { findUnique: jest.fn() },
  },
}));

import {
  scopedPaginatedListHandler,
  tenantScopedPaginatedListHandler,
  resolveScopeTenantIds,
  tenantIdWhere,
} from "@/core/admin/scopedList";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { prisma } from "@/core/prisma";

const authMock = requireAdminWithScope as jest.Mock;
const hubFind = prisma.hub.findUnique as jest.Mock;
const superHubFind = prisma.superHub.findUnique as jest.Mock;

function model() {
  return {
    findMany: jest.fn().mockResolvedValue([{ id: "row1" }]),
    count: jest.fn().mockResolvedValue(1),
  };
}

function req(url = "https://x.test/api/admin/things?page=1&pageSize=25"): any {
  return { url };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("resolveScopeTenantIds", () => {
  it("returns [] for rowiverse (caller must treat as 'no narrowing' separately)", async () => {
    await expect(resolveScopeTenantIds({ type: "rowiverse", id: null })).resolves.toEqual([]);
  });

  it("returns the single tenant id for tenant scope", async () => {
    await expect(resolveScopeTenantIds({ type: "tenant", id: "t1" })).resolves.toEqual(["t1"]);
  });

  it("resolves hub scope to its tenant via one lookup", async () => {
    hubFind.mockResolvedValue({ tenantId: "t9" });
    await expect(resolveScopeTenantIds({ type: "hub", id: "h1" })).resolves.toEqual(["t9"]);
  });

  it("returns [] when the hub has no tenant", async () => {
    hubFind.mockResolvedValue(null);
    await expect(resolveScopeTenantIds({ type: "hub", id: "h1" })).resolves.toEqual([]);
  });

  it("resolves superhub scope to all child tenants", async () => {
    superHubFind.mockResolvedValue({ tenants: [{ id: "t1" }, { id: "t2" }] });
    await expect(resolveScopeTenantIds({ type: "superhub", id: "sh1" })).resolves.toEqual(["t1", "t2"]);
  });

  it("returns [] for a scope with no id", async () => {
    await expect(resolveScopeTenantIds({ type: "tenant", id: null })).resolves.toEqual([]);
  });
});

describe("tenantIdWhere", () => {
  it("builds a direct tenantId filter for tenant scope", () => {
    expect(tenantIdWhere({ type: "tenant", id: "t1" })).toEqual({ tenantId: "t1" });
  });

  it("returns null for rowiverse / hub / superhub (resolved async elsewhere)", () => {
    expect(tenantIdWhere({ type: "rowiverse", id: null })).toBeNull();
    expect(tenantIdWhere({ type: "hub", id: "h1" })).toBeNull();
    expect(tenantIdWhere({ type: "superhub", id: "sh1" })).toBeNull();
  });
});

describe("scopedPaginatedListHandler — authorization contract", () => {
  it("short-circuits to auth.error before any DB work", async () => {
    const err = { status: 401, body: { error: "No autenticado" } };
    authMock.mockResolvedValue({ error: err });
    const m = model();

    const res = await scopedPaginatedListHandler(req(), m, { scopeWhere: () => null });

    expect(res).toBe(err);
    expect(m.findMany).not.toHaveBeenCalled();
  });

  it("applies NO where filter for rowiverse (global view)", async () => {
    authMock.mockResolvedValue({ scope: { type: "rowiverse", id: null }, error: null });
    const m = model();
    const scopeWhere = jest.fn();

    await scopedPaginatedListHandler(req(), m, { scopeWhere });

    expect(scopeWhere).not.toHaveBeenCalled(); // global → never consult scopeWhere
    expect(m.findMany.mock.calls[0][0].where).toBeUndefined();
  });

  it("narrows the query to the scope's tenant for a tenant admin", async () => {
    authMock.mockResolvedValue({ scope: { type: "tenant", id: "t1" }, error: null });
    const m = model();

    const res = await scopedPaginatedListHandler(req(), m, {
      scopeWhere: (s) => ({ tenantId: s.id }),
    });

    expect(m.findMany.mock.calls[0][0].where).toEqual({ tenantId: "t1" });
    expect(m.count).toHaveBeenCalledWith({ where: { tenantId: "t1" } });
    // NextResponse.json está mockeado → `body` es el payload directo.
    expect((res as any).body.scope).toEqual({ type: "tenant", id: "t1" });
  });

  it("combines the scope filter with a search query under AND", async () => {
    authMock.mockResolvedValue({ scope: { type: "tenant", id: "t1" }, error: null });
    const m = model();

    await scopedPaginatedListHandler(
      req("https://x.test/api?q=acme"),
      m,
      { scopeWhere: (s) => ({ tenantId: s.id }), searchableFields: ["name"] },
    );

    const where = m.findMany.mock.calls[0][0].where;
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0]).toEqual({ tenantId: "t1" });
    expect(where.AND[1].OR[0].name).toEqual({ contains: "acme", mode: "insensitive" });
  });
});

describe("tenantScopedPaginatedListHandler — fail-closed invariant", () => {
  it("returns an empty page WITHOUT querying when the scope resolves to zero tenants", async () => {
    authMock.mockResolvedValue({ scope: { type: "hub", id: "h1" }, error: null });
    hubFind.mockResolvedValue(null); // hub has no tenant → resolves to []
    const m = model();

    const res = await tenantScopedPaginatedListHandler(req(), m, {});

    // CRITICAL: must NOT fall through to an unfiltered query.
    expect(m.findMany).not.toHaveBeenCalled();
    expect((res as any).body).toMatchObject({ ok: true, rows: [], total: 0 });
  });

  it("narrows to the resolved tenant set with an `in` filter", async () => {
    authMock.mockResolvedValue({ scope: { type: "superhub", id: "sh1" }, error: null });
    superHubFind.mockResolvedValue({ tenants: [{ id: "t1" }, { id: "t2" }] });
    const m = model();

    await tenantScopedPaginatedListHandler(req(), m, {});

    expect(m.findMany.mock.calls[0][0].where).toEqual({ tenantId: { in: ["t1", "t2"] } });
  });

  it("narrows via a relation path when given relationTenantPath", async () => {
    authMock.mockResolvedValue({ scope: { type: "tenant", id: "t1" }, error: null });
    const m = model();

    await tenantScopedPaginatedListHandler(req(), m, {
      relationTenantPath: "community.tenantId",
    });

    expect(m.findMany.mock.calls[0][0].where).toEqual({
      community: { tenantId: { in: ["t1"] } },
    });
  });

  it("applies no filter for rowiverse (global view)", async () => {
    authMock.mockResolvedValue({ scope: { type: "rowiverse", id: null }, error: null });
    const m = model();

    await tenantScopedPaginatedListHandler(req(), m, {});

    expect(m.findMany.mock.calls[0][0].where).toBeUndefined();
  });
});
