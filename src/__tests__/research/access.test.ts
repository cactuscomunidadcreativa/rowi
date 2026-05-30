/**
 * Unit tests for the research-lens access guard + helpers.
 *
 * PII visibility is a hard privacy boundary: only `founder` and
 * `scientific_lead` may see real names/emails; everyone else gets codes. The
 * guard resolves the caller from the session token, denies `none`/unknown
 * users with the right status, and audit logging must never throw into the
 * caller. Prisma + the auth token are mocked at the seam.
 */

import {
  canSeePII,
  requireResearchUser,
  logResearchAccess,
  pseudonymize,
} from "@/lib/research/access";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

jest.mock("next/server", () => ({ NextRequest: class {} }));

jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));

jest.mock("@/core/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    researchAccessAudit: { create: jest.fn() },
  },
}));

const mockToken = getToken as jest.Mock;
const mockUser = prisma.user.findUnique as jest.Mock;
const mockAudit = prisma.researchAccessAudit.create as jest.Mock;

const req = {} as Parameters<typeof requireResearchUser>[0];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("canSeePII", () => {
  it("grants PII visibility only to founder + scientific_lead", () => {
    expect(canSeePII("founder")).toBe(true);
    expect(canSeePII("scientific_lead")).toBe(true);
  });

  it("denies PII visibility to teams, invited, observers, and none", () => {
    expect(canSeePII("rowi_team")).toBe(false);
    expect(canSeePII("six_seconds_team")).toBe(false);
    expect(canSeePII("invited_personal")).toBe(false);
    expect(canSeePII("invited_observer")).toBe(false);
    expect(canSeePII("none")).toBe(false);
  });
});

describe("requireResearchUser", () => {
  it("returns 401 when the session token has no email", async () => {
    mockToken.mockResolvedValue(null);
    await expect(requireResearchUser(req)).resolves.toEqual({
      error: "Unauthorized",
      status: 401,
    });
    expect(mockUser).not.toHaveBeenCalled();
  });

  it("returns 404 when the user is not found", async () => {
    mockToken.mockResolvedValue({ email: "ghost@x.com" });
    mockUser.mockResolvedValue(null);
    await expect(requireResearchUser(req)).resolves.toEqual({
      error: "User not found",
      status: 404,
    });
  });

  it("returns 403 when the user has research level 'none'", async () => {
    mockToken.mockResolvedValue({ email: "a@b.com" });
    mockUser.mockResolvedValue({
      id: "u1", name: "A", email: "a@b.com", researchAccessLevel: "none",
    });
    await expect(requireResearchUser(req)).resolves.toEqual({
      error: "No research access level",
      status: 403,
    });
  });

  it("returns the research user for a granted level and looks them up by lowercased email", async () => {
    mockToken.mockResolvedValue({ email: "Eduardo@X.com" });
    mockUser.mockResolvedValue({
      id: "u1", name: "Eduardo", email: "eduardo@x.com", researchAccessLevel: "founder",
    });

    const res = await requireResearchUser(req);
    expect(res).toEqual({
      user: { id: "u1", name: "Eduardo", email: "eduardo@x.com", researchAccessLevel: "founder" },
    });
    expect(mockUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "eduardo@x.com" } }),
    );
  });
});

describe("logResearchAccess", () => {
  it("writes an audit row, defaulting optional fields to null", async () => {
    mockAudit.mockResolvedValue({});
    await logResearchAccess({
      viewerUserId: "v1",
      action: "view",
      contextPath: "/research/cases",
      subjectUserId: "u9",
    });
    expect(mockAudit).toHaveBeenCalledWith({
      data: {
        viewerUserId: "v1",
        subjectUserId: "u9",
        subjectTeamId: null,
        subjectOrgId: null,
        action: "view",
        contextPath: "/research/cases",
        reason: null,
        metadata: undefined,
      },
    });
  });

  it("swallows audit-write failures so the read is never blocked", async () => {
    mockAudit.mockRejectedValue(new Error("db down"));
    await expect(
      logResearchAccess({ viewerUserId: "v1", action: "view", contextPath: "/x" }),
    ).resolves.toBeUndefined();
  });
});

describe("pseudonymize", () => {
  it("produces a stable Case- code from the last 6 chars, uppercased", () => {
    expect(pseudonymize("abcdef123456")).toBe("Case-123456");
  });

  it("is deterministic for the same id", () => {
    expect(pseudonymize("user-123")).toBe(pseudonymize("user-123"));
  });

  it("yields different codes for ids with different tails", () => {
    expect(pseudonymize("abcdef111111")).not.toBe(pseudonymize("abcdef222222"));
  });
});
