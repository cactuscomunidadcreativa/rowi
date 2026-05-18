/**
 * Integration tests for the family-relation API flow.
 *
 * Exercises the actual route handlers (POST + PATCH + DELETE) end-to-end
 * with prisma and auth mocked at the seams. Catches regressions in:
 *
 * - Authorization gates (401 vs 403 vs 200)
 * - Consent flow asymmetry (owner can edit fields; only related user
 *   can flip consentStatus)
 * - Application-level dedup by email when no user is resolved
 * - Email notification side-effects (called with right kind + locale)
 *
 * Browser/UI flow (e.g. clicking the chip) is out of scope for these —
 * those would require Playwright + a running server.
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
    familyRelation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
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
import { GET as familyGET, POST as familyPOST } from "@/app/api/account/family/route";
import { PATCH as familyPATCH, DELETE as familyDELETE } from "@/app/api/account/family/[id]/route";

const authMock = getServerAuthUser as jest.Mock;
const userFind = prisma.user.findUnique as jest.Mock;
const frFindMany = prisma.familyRelation.findMany as jest.Mock;
const frFindUnique = prisma.familyRelation.findUnique as jest.Mock;
const frFindFirst = prisma.familyRelation.findFirst as jest.Mock;
const frCreate = prisma.familyRelation.create as jest.Mock;
const frUpdate = prisma.familyRelation.update as jest.Mock;
const frDelete = prisma.familyRelation.delete as jest.Mock;
const emailMock = sendContextNotification as jest.Mock;

function mockReq(body: unknown) {
  return { json: async () => body } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/account/family", () => {
  it("returns 401 when not authenticated", async () => {
    authMock.mockResolvedValue(null);
    const res: any = await familyGET();
    expect(res.status).toBe(401);
  });

  it("returns owned + inbound separately", async () => {
    authMock.mockResolvedValue({ id: "user_a" });
    frFindMany.mockResolvedValueOnce([{ id: "r1" }]); // owned
    frFindMany.mockResolvedValueOnce([{ id: "r2" }]); // inbound
    const res: any = await familyGET();
    expect(res.body.ok).toBe(true);
    expect(res.body.owned).toHaveLength(1);
    expect(res.body.inbound).toHaveLength(1);
  });
});

describe("POST /api/account/family", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ id: "owner_id", name: "Owner" });
  });

  it("rejects invalid relationship", async () => {
    const res: any = await familyPOST(
      mockReq({ relationship: "lover", relatedEmail: "x@y.com" }),
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/relationship inválido/);
  });

  it("rejects when no identifier provided", async () => {
    const res: any = await familyPOST(mockReq({ relationship: "partner" }));
    expect(res.status).toBe(400);
  });

  it("rejects self-link", async () => {
    userFind.mockResolvedValue({ id: "owner_id" });
    const res: any = await familyPOST(
      mockReq({ relationship: "partner", relatedEmail: "self@x.com" }),
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/contigo mismo/);
  });

  it("creates with consentStatus=pending when target user exists", async () => {
    userFind.mockResolvedValue({ id: "wife_id" });
    frFindFirst.mockResolvedValue(null);
    frCreate.mockResolvedValue({
      id: "rel_1",
      relationship: "spouse",
      relatedUserId: "wife_id",
      relatedEmail: "wife@x.com",
      relatedName: null,
      consentStatus: "pending",
      relatedUser: { id: "wife_id", name: "Wife", email: "wife@x.com" },
    });
    const res: any = await familyPOST(
      mockReq({ relationship: "spouse", relatedEmail: "wife@x.com" }),
    );
    expect(res.body.ok).toBe(true);
    expect(frCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          relatedUserId: "wife_id",
          consentStatus: "pending",
        }),
      }),
    );
  });

  it("creates with consentStatus=not_required when no user resolves", async () => {
    userFind.mockResolvedValue(null);
    frFindFirst.mockResolvedValue(null);
    frCreate.mockResolvedValue({
      id: "rel_2",
      relationship: "child",
      relatedName: "Mini",
      consentStatus: "not_required",
      relatedUser: null,
    });
    const res: any = await familyPOST(
      mockReq({ relationship: "child", relatedName: "Mini" }),
    );
    expect(res.body.ok).toBe(true);
    expect(frCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          relatedUserId: null,
          consentStatus: "not_required",
        }),
      }),
    );
  });

  it("dedups by email when no user resolved — 409 on duplicate", async () => {
    userFind.mockResolvedValue(null); // email doesn't resolve
    frFindFirst.mockResolvedValue({ id: "existing_rel" }); // but a row exists
    const res: any = await familyPOST(
      mockReq({ relationship: "child", relatedEmail: "kid@x.com" }),
    );
    expect(res.status).toBe(409);
    expect(frCreate).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/account/family/[id]", () => {
  it("returns 403 when caller is neither owner nor related", async () => {
    authMock.mockResolvedValue({ id: "stranger" });
    frFindUnique.mockResolvedValue({
      id: "r1",
      ownerId: "alice",
      relatedUserId: "bob",
    });
    const res: any = await familyPATCH(
      mockReq({ consentStatus: "accepted" }),
      { params: Promise.resolve({ id: "r1" }) },
    );
    expect(res.status).toBe(403);
  });

  it("owner cannot change consentStatus", async () => {
    authMock.mockResolvedValue({ id: "alice" });
    frFindUnique.mockResolvedValue({
      id: "r1",
      ownerId: "alice",
      relatedUserId: "bob",
    });
    // Owner sending only consentStatus → no fields actually allowed → 400
    const res: any = await familyPATCH(
      mockReq({ consentStatus: "accepted" }),
      { params: Promise.resolve({ id: "r1" }) },
    );
    expect(res.status).toBe(400);
    expect(frUpdate).not.toHaveBeenCalled();
  });

  it("related user can only flip consentStatus to accepted or declined", async () => {
    authMock.mockResolvedValue({ id: "bob" });
    frFindUnique.mockResolvedValue({
      id: "r1",
      ownerId: "alice",
      relatedUserId: "bob",
    });
    const res: any = await familyPATCH(
      mockReq({ consentStatus: "pending" }), // not allowed flip
      { params: Promise.resolve({ id: "r1" }) },
    );
    expect(res.status).toBe(400);
    expect(frUpdate).not.toHaveBeenCalled();
  });

  it("related user accepts → owner gets notified with their preferredLang", async () => {
    authMock.mockResolvedValue({ id: "bob", name: "Bob" });
    frFindUnique.mockResolvedValue({
      id: "r1",
      ownerId: "alice",
      relatedUserId: "bob",
      relationship: "spouse",
      owner: { id: "alice", email: "alice@x.com" },
    });
    frUpdate.mockResolvedValue({ relationship: "spouse" });
    userFind.mockResolvedValue({ preferredLang: "en", language: null });

    const res: any = await familyPATCH(
      mockReq({ consentStatus: "accepted" }),
      { params: Promise.resolve({ id: "r1" }) },
    );
    expect(res.body.ok).toBe(true);
    expect(emailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "alice@x.com",
        kind: "family.accepted",
        actorName: "Bob",
        locale: "en", // ← preferredLang respected
      }),
    );
  });
});

describe("DELETE /api/account/family/[id]", () => {
  it("only owner can delete", async () => {
    authMock.mockResolvedValue({ id: "bob" }); // related, not owner
    frFindUnique.mockResolvedValue({
      id: "r1",
      ownerId: "alice",
      relatedUserId: "bob",
    });
    const res: any = await familyDELETE({} as any, {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.status).toBe(403);
    expect(frDelete).not.toHaveBeenCalled();
  });

  it("owner delete succeeds", async () => {
    authMock.mockResolvedValue({ id: "alice" });
    frFindUnique.mockResolvedValue({
      id: "r1",
      ownerId: "alice",
      relatedUserId: "bob",
    });
    frDelete.mockResolvedValue({});
    const res: any = await familyDELETE({} as any, {
      params: Promise.resolve({ id: "r1" }),
    });
    expect(res.body.ok).toBe(true);
    expect(frDelete).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
