/**
 * Integration tests for the manager assignment PATCH at
 * /api/admin/hr/employees/[id], focused on the cycle-detection
 * invariant. Same-tenant guard is also exercised.
 *
 * Cycle detection walks UP the candidate manager's chain. If the chain
 * eventually points back at the employee being edited, the assignment
 * is rejected. This test stubs prisma to model deliberately cyclic
 * scenarios.
 */

jest.mock("next/server", () => {
  // Use a stable implementation that doesn't get reset by
  // jest.resetAllMocks() between tests.
  const jsonImpl = (body: any, init?: any) => ({
    status: init?.status ?? 200,
    body,
    json: async () => body,
  });
  return {
    NextRequest: class {},
    NextResponse: { json: jsonImpl },
  };
});

jest.mock("@/core/auth/requireAdmin", () => ({
  requireAdminWithScope: jest.fn(),
}));

jest.mock("@/core/prisma", () => ({
  prisma: {
    employeeProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { prisma } from "@/core/prisma";
import { PATCH } from "@/app/api/admin/hr/employees/[id]/route";

const authMock = requireAdminWithScope as jest.Mock;
const empFind = prisma.employeeProfile.findUnique as jest.Mock;
const empUpdate = prisma.employeeProfile.update as jest.Mock;

function mockReq(body: unknown) {
  return { json: async () => body } as any;
}

beforeEach(() => {
  // resetAllMocks (not clearAllMocks) — the latter doesn't drain
  // queued mockResolvedValueOnce values, which causes earlier tests'
  // leftover queue entries to bleed into later tests.
  jest.resetAllMocks();
  authMock.mockResolvedValue({
    error: null,
    user: { id: "admin" },
    scope: { type: "rowiverse", id: null },
  });
});

describe("PATCH /api/admin/hr/employees/[id] — manager cycle detection", () => {
  it("accepts a clean manager assignment in the same tenant", async () => {
    empFind
      // 1st call: load employee under edit
      .mockResolvedValueOnce({
        id: "emp_a",
        tenantId: "t1",
        managerId: null,
      })
      // 2nd call: load candidate manager
      .mockResolvedValueOnce({
        id: "emp_b",
        tenantId: "t1",
      })
      // 3rd call (cycle walk): emp_b's manager is null → safe
      .mockResolvedValueOnce({ managerId: null })
      // 4th call: select for response
      .mockResolvedValueOnce({ id: "emp_a" });
    empUpdate.mockResolvedValueOnce({ id: "emp_a", managerId: "emp_b" });

    const res: any = await PATCH(mockReq({ managerId: "emp_b" }), {
      params: Promise.resolve({ id: "emp_a" }),
    });
    expect(res.body.ok).toBe(true);
    expect(empUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ managerId: "emp_b" }),
      }),
    );
  });

  it("rejects when candidate manager is the employee itself", async () => {
    empFind.mockResolvedValueOnce({
      id: "emp_a",
      tenantId: "t1",
      managerId: null,
    });
    empFind.mockResolvedValueOnce({ id: "emp_a", tenantId: "t1" });
    const res: any = await PATCH(mockReq({ managerId: "emp_a" }), {
      params: Promise.resolve({ id: "emp_a" }),
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ciclo/i);
    expect(empUpdate).not.toHaveBeenCalled();
  });

  it("rejects a transitive cycle (A reports to B, set A's manager = B)", async () => {
    // We want to assign emp_a.manager = emp_b, but emp_b reports up to
    // emp_c, and emp_c reports up to emp_a — closing the cycle.
    empFind.mockResolvedValueOnce({
      id: "emp_a",
      tenantId: "t1",
      managerId: null,
    });
    empFind.mockResolvedValueOnce({ id: "emp_b", tenantId: "t1" });
    // Cycle walk starting from candidate emp_b:
    empFind.mockResolvedValueOnce({ managerId: "emp_c" }); // b → c
    empFind.mockResolvedValueOnce({ managerId: "emp_a" }); // c → a  ← cycle!
    const res: any = await PATCH(mockReq({ managerId: "emp_b" }), {
      params: Promise.resolve({ id: "emp_a" }),
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ciclo/i);
    expect(empUpdate).not.toHaveBeenCalled();
  });

  it("rejects cross-tenant manager assignment", async () => {
    empFind.mockResolvedValueOnce({
      id: "emp_a",
      tenantId: "t1",
      managerId: null,
    });
    empFind.mockResolvedValueOnce({ id: "emp_x", tenantId: "t2" });
    const res: any = await PATCH(mockReq({ managerId: "emp_x" }), {
      params: Promise.resolve({ id: "emp_a" }),
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mismo tenant/i);
  });

  it("clearing manager (managerId=null) is always allowed", async () => {
    empFind.mockResolvedValueOnce({
      id: "emp_a",
      tenantId: "t1",
      managerId: "emp_b",
    });
    empFind.mockResolvedValueOnce({ id: "emp_a" }); // select for response
    empUpdate.mockResolvedValueOnce({ id: "emp_a", managerId: null });
    const res: any = await PATCH(mockReq({ managerId: null }), {
      params: Promise.resolve({ id: "emp_a" }),
    });
    expect(res.body.ok).toBe(true);
    expect(empUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ managerId: null }),
      }),
    );
  });

  it("tenant-scoped admin can't edit employees outside their tenant", async () => {
    authMock.mockResolvedValueOnce({
      error: null,
      user: { id: "admin" },
      scope: { type: "tenant", id: "t1" },
    });
    empFind.mockResolvedValueOnce({
      id: "emp_other",
      tenantId: "t_other",
      managerId: null,
    });
    const res: any = await PATCH(mockReq({ managerId: "emp_b" }), {
      params: Promise.resolve({ id: "emp_other" }),
    });
    expect(res.status).toBe(403);
    expect(empUpdate).not.toHaveBeenCalled();
  });
});
