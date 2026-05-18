/**
 * Integration tests for the service-engagement API flow.
 *
 * Same approach as family.flow.test.ts: import the actual route
 * handlers and mock prisma + auth + email at the seams.
 */

jest.mock("next/server", () => {
  const json = jest.fn((body, init?: any) => ({
    status: init?.status ?? 200,
    body,
    json: async () => body,
  }));
  return { NextRequest: class {}, NextResponse: { json } };
});

jest.mock("@/core/auth", () => ({
  getServerAuthUser: jest.fn(),
}));

jest.mock("@/core/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    tenant: { findUnique: jest.fn() },
    rowiCommunity: { findUnique: jest.fn() },
    organization: { findUnique: jest.fn() },
    serviceEngagement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email/sendContextNotification", () => ({
  sendContextNotification: jest.fn().mockResolvedValue(undefined),
}));

import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { sendContextNotification } from "@/lib/email/sendContextNotification";
import { POST as servicePOST } from "@/app/api/account/services/route";
import { PATCH as servicePATCH, DELETE as serviceDELETE } from "@/app/api/account/services/[id]/route";

const authMock = getServerAuthUser as jest.Mock;
const userFind = prisma.user.findUnique as jest.Mock;
const tenantFind = prisma.tenant.findUnique as jest.Mock;
const communityFind = prisma.rowiCommunity.findUnique as jest.Mock;
const orgFind = prisma.organization.findUnique as jest.Mock;
const seCreate = prisma.serviceEngagement.create as jest.Mock;
const seFind = prisma.serviceEngagement.findUnique as jest.Mock;
const seUpdate = prisma.serviceEngagement.update as jest.Mock;
const seDelete = prisma.serviceEngagement.delete as jest.Mock;
const emailMock = sendContextNotification as jest.Mock;

function mockReq(body: unknown) {
  return { json: async () => body } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/account/services", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      id: "provider_id",
      name: "Provider",
      primaryTenantId: "tenant_home",
    });
  });

  it("rejects invalid serviceRole", async () => {
    const res: any = await servicePOST(
      mockReq({ serviceRole: "wizard", clientUserId: "u1" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects when no client is provided", async () => {
    const res: any = await servicePOST(mockReq({ serviceRole: "coach" }));
    expect(res.status).toBe(400);
  });

  it("rejects when multiple clients are provided", async () => {
    const res: any = await servicePOST(
      mockReq({
        serviceRole: "coach",
        clientUserId: "u1",
        clientTenantId: "t1",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects self-as-client", async () => {
    const res: any = await servicePOST(
      mockReq({ serviceRole: "coach", clientUserId: "provider_id" }),
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/proveedor y cliente/);
  });

  it("creates with status=proposed for external client tenant", async () => {
    tenantFind.mockResolvedValue({ id: "tenant_other" });
    seCreate.mockResolvedValue({ id: "se1", status: "proposed" });
    const res: any = await servicePOST(
      mockReq({ serviceRole: "coach", clientTenantId: "tenant_other" }),
    );
    expect(res.body.ok).toBe(true);
    expect(seCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "proposed" }),
      }),
    );
  });

  it("auto-actives engagement when client is provider's primary tenant", async () => {
    tenantFind.mockResolvedValue({ id: "tenant_home" });
    seCreate.mockResolvedValue({ id: "se2", status: "active" });
    const res: any = await servicePOST(
      mockReq({ serviceRole: "consultant", clientTenantId: "tenant_home" }),
    );
    expect(res.body.ok).toBe(true);
    expect(seCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active" }),
      }),
    );
  });

  it("notifies 1:1 client with their preferredLang", async () => {
    userFind
      .mockResolvedValueOnce({ id: "client_x" }) // validators[0]: client user exists
      .mockResolvedValueOnce({ preferredLang: "pt", language: null }); // email lookup
    seCreate.mockResolvedValue({
      id: "se3",
      status: "proposed",
      serviceRole: "mentor",
      provider: { id: "provider_id", name: "Provider" },
      clientUser: { id: "client_x", email: "x@y.com" },
    });
    await servicePOST(
      mockReq({ serviceRole: "mentor", clientUserId: "client_x" }),
    );
    expect(emailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "x@y.com",
        kind: "service.proposed",
        locale: "pt",
      }),
    );
  });
});

describe("PATCH /api/account/services/[id] — state transitions", () => {
  it("rejects when caller is not provider or client user", async () => {
    authMock.mockResolvedValue({ id: "stranger" });
    seFind.mockResolvedValue({
      id: "se1",
      providerId: "p",
      clientUserId: "c",
      status: "active",
    });
    const res: any = await servicePATCH(mockReq({ status: "ended" }), {
      params: Promise.resolve({ id: "se1" }),
    });
    expect(res.status).toBe(403);
  });

  it("client can accept proposed → active", async () => {
    authMock.mockResolvedValue({ id: "c", name: "Client" });
    seFind.mockResolvedValue({
      id: "se1",
      providerId: "p",
      clientUserId: "c",
      status: "proposed",
    });
    seUpdate.mockResolvedValue({ id: "se1", status: "active", serviceRole: "coach" });
    userFind.mockResolvedValue({ email: "prov@x.com", preferredLang: "it" });
    const res: any = await servicePATCH(mockReq({ status: "active" }), {
      params: Promise.resolve({ id: "se1" }),
    });
    expect(res.body.ok).toBe(true);
    expect(emailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "service.accepted",
        locale: "it",
      }),
    );
  });

  it("client CANNOT skip from proposed straight back to paused", async () => {
    authMock.mockResolvedValue({ id: "c" });
    seFind.mockResolvedValue({
      id: "se1",
      providerId: "p",
      clientUserId: "c",
      status: "proposed",
    });
    const res: any = await servicePATCH(mockReq({ status: "paused" }), {
      params: Promise.resolve({ id: "se1" }),
    });
    expect(res.status).toBe(400);
    expect(seUpdate).not.toHaveBeenCalled();
  });

  it("client can end an active engagement", async () => {
    authMock.mockResolvedValue({ id: "c", name: "Client" });
    seFind.mockResolvedValue({
      id: "se1",
      providerId: "p",
      clientUserId: "c",
      status: "active",
    });
    seUpdate.mockResolvedValue({ id: "se1", status: "ended", serviceRole: "coach" });
    userFind.mockResolvedValue({ email: "prov@x.com", preferredLang: "es" });
    const res: any = await servicePATCH(mockReq({ status: "ended" }), {
      params: Promise.resolve({ id: "se1" }),
    });
    expect(res.body.ok).toBe(true);
  });

  it("provider can pause an active engagement at will", async () => {
    authMock.mockResolvedValue({ id: "p" });
    seFind.mockResolvedValue({
      id: "se1",
      providerId: "p",
      clientUserId: "c",
      status: "active",
    });
    seUpdate.mockResolvedValue({ id: "se1", status: "paused" });
    const res: any = await servicePATCH(mockReq({ status: "paused" }), {
      params: Promise.resolve({ id: "se1" }),
    });
    expect(res.body.ok).toBe(true);
    expect(seUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "paused" }),
      }),
    );
  });
});

describe("DELETE /api/account/services/[id]", () => {
  it("client cannot delete — only provider", async () => {
    authMock.mockResolvedValue({ id: "c" });
    seFind.mockResolvedValue({
      id: "se1",
      providerId: "p",
      clientUserId: "c",
      status: "active",
    });
    const res: any = await serviceDELETE({} as any, {
      params: Promise.resolve({ id: "se1" }),
    });
    expect(res.status).toBe(403);
    expect(seDelete).not.toHaveBeenCalled();
  });

  it("provider delete succeeds", async () => {
    authMock.mockResolvedValue({ id: "p" });
    seFind.mockResolvedValue({
      id: "se1",
      providerId: "p",
      clientUserId: "c",
      status: "active",
    });
    seDelete.mockResolvedValue({});
    const res: any = await serviceDELETE({} as any, {
      params: Promise.resolve({ id: "se1" }),
    });
    expect(res.body.ok).toBe(true);
  });
});
