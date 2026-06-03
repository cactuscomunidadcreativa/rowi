/**
 * Tests for POST /api/relationships/invite (the SIA HOOK).
 *
 * Pins: requires name or email, blocks self-invite, is NOT gated by plan (it's
 * acquisition), creates a dyad + invite with a deep-link token, and enforces a
 * soft anti-abuse cap on pending invites. Prisma, next/server and next-auth are
 * mocked at the seam.
 */
jest.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));
jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("@/core/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    relationshipInvite: { count: jest.fn(), create: jest.fn() },
    relationshipDyad: { findFirst: jest.fn(), create: jest.fn() },
  },
}));

import { POST } from "@/app/api/relationships/invite/route";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

const mockToken = getToken as jest.Mock;
const mockUser = prisma.user.findUnique as jest.Mock;
const mockCount = prisma.relationshipInvite.count as jest.Mock;
const mockInviteCreate = prisma.relationshipInvite.create as jest.Mock;
const mockDyadFind = prisma.relationshipDyad.findFirst as jest.Mock;
const mockDyadCreate = prisma.relationshipDyad.create as jest.Mock;

function req(body: unknown) {
  return { json: async () => body } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockToken.mockResolvedValue({ email: "owner@x.com" });
  mockUser.mockResolvedValue({ id: "user-1", rowiverseId: null, name: "Owner" });
  mockCount.mockResolvedValue(0);
  mockDyadFind.mockResolvedValue(null);
  mockDyadCreate.mockResolvedValue({ id: "dyad-1" });
  mockInviteCreate.mockResolvedValue({ id: "inv-1" });
  process.env.NEXT_PUBLIC_APP_URL = "https://www.rowiia.com";
});

describe("POST /api/relationships/invite", () => {
  it("401 sin sesión", async () => {
    mockToken.mockResolvedValue(null);
    const res = await POST(req({ name: "Ana" }));
    expect(res.status).toBe(401);
  });

  it("400 si no hay ni nombre ni email", async () => {
    const res = await POST(req({ relationType: "partner" }));
    expect(res.status).toBe(400);
    expect(mockDyadCreate).not.toHaveBeenCalled();
  });

  it("400 al invitarse a sí mismo", async () => {
    const res = await POST(req({ email: "owner@x.com" }));
    expect(res.status).toBe(400);
  });

  it("crea díada + invitación y devuelve deep link (sin gating de plan)", async () => {
    const res = await POST(req({ name: "Ana", relationType: "partner", locale: "es" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.dyadId).toBe("dyad-1");
    expect(json.inviteUrl).toMatch(/^https:\/\/www\.rowiia\.com\/r\//);
    // Nunca consultó el plan del usuario (no gated).
    const inviteArg = mockInviteCreate.mock.calls[0][0].data;
    expect(inviteArg.relationType).toBe("partner");
    expect(inviteArg.status).toBeUndefined(); // usa el default "pending" del schema
    expect(inviteArg.token).toBeTruthy();
  });

  it("reusa la díada existente por email en vez de duplicar", async () => {
    mockDyadFind.mockResolvedValue({ id: "dyad-existing" });
    const res = await POST(req({ email: "ana@x.com", relationType: "friend" }));
    const json = await res.json();
    expect(json.dyadId).toBe("dyad-existing");
    expect(mockDyadCreate).not.toHaveBeenCalled();
  });

  it("429 al superar el límite blando de invitaciones pendientes", async () => {
    mockCount.mockResolvedValue(25);
    const res = await POST(req({ name: "Ana" }));
    expect(res.status).toBe(429);
    expect(mockInviteCreate).not.toHaveBeenCalled();
  });

  it("normaliza relationType inválido a 'other'", async () => {
    await POST(req({ name: "Ana", relationType: "enemy" }));
    expect(mockDyadCreate.mock.calls[0][0].data.relationType).toBe("other");
  });
});
