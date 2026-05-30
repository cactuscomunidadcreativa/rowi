/**
 * Unit tests for the invite-expiry-reminder cron route.
 *
 * Like all crons this is internet-reachable, so the Bearer CRON_SECRET gate is
 * a real boundary. Beyond auth, the route's value is its "send exactly one
 * nudge" guarantee, so this pins the branching that controls re-sends:
 *
 * - Already-accepted invitees (a User exists with that email) are skipped but
 *   still stamped reminderSentAt so they stop being scanned daily.
 * - A genuine send stamps reminderSentAt and counts as `sent`.
 * - A failed send (result.ok === false) is counted as `failed` and is NOT
 *   stamped — so tomorrow's run retries it.
 * - Empty candidate set short-circuits.
 *
 * prisma, email, base-url, logging, NextResponse mocked at the seam.
 */

jest.mock("next/server", () => {
  const json = jest.fn((body: any, init?: any) => ({
    status: init?.status ?? 200,
    body,
    json: async () => body,
  }));
  return { NextRequest: class {}, NextResponse: { json } };
});

jest.mock("@/core/prisma", () => ({
  prisma: {
    inviteToken: { findMany: jest.fn(), update: jest.fn() },
    user: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/email/sendInviteEmail", () => ({
  sendInviteEmail: jest.fn(),
}));

jest.mock("@/core/utils/base-url", () => ({
  getServerAppBaseUrl: jest.fn(() => "https://www.rowiia.com"),
}));

jest.mock("@/lib/logging", () => ({
  secureLog: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { GET } from "@/app/api/cron/invite-expiry-reminder/route";
import { prisma } from "@/core/prisma";
import { sendInviteEmail } from "@/lib/email/sendInviteEmail";

const inviteFindMany = prisma.inviteToken.findMany as jest.Mock;
const inviteUpdate = prisma.inviteToken.update as jest.Mock;
const userFindMany = prisma.user.findMany as jest.Mock;
const sendMock = sendInviteEmail as jest.Mock;

const OLD_ENV = process.env.CRON_SECRET;

function req(authHeader?: string): any {
  return {
    headers: { get: (k: string) => (k === "authorization" ? authHeader ?? null : null) },
  };
}

function invite(over: Record<string, any> = {}): any {
  return {
    id: "inv1",
    email: "invitee@example.com",
    token: "tok123",
    role: "member",
    // 30h out so daysLeft rounds up to 2.
    expiresAt: new Date(Date.now() + 30 * 60 * 60 * 1000),
    user: { id: "u1", name: "Inviter", email: "boss@x.com", language: "es", preferredLang: null },
    tenant: { id: "t1", name: "Acme" },
    ...over,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = "topsecret";
  userFindMany.mockResolvedValue([]);
  inviteUpdate.mockResolvedValue({});
  sendMock.mockResolvedValue({ ok: true });
});

afterAll(() => {
  process.env.CRON_SECRET = OLD_ENV;
});

describe("authorization", () => {
  it("401s without a valid Bearer token", async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(inviteFindMany).not.toHaveBeenCalled();
  });

  it("401s when CRON_SECRET is unset (fail closed)", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req("Bearer topsecret"));
    expect(res.status).toBe(401);
  });
});

describe("reminder logic", () => {
  it("short-circuits with zero counts when there are no candidates", async () => {
    inviteFindMany.mockResolvedValue([]);
    const res = await GET(req("Bearer topsecret"));
    expect(res.body).toMatchObject({ ok: true, sent: 0, skipped: 0, failed: 0, candidates: 0 });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends a reminder and stamps reminderSentAt", async () => {
    inviteFindMany.mockResolvedValue([invite()]);
    const res = await GET(req("Bearer topsecret"));

    expect(sendMock).toHaveBeenCalledTimes(1);
    const arg = sendMock.mock.calls[0][0];
    expect(arg.kind).toBe("reminder");
    expect(arg.to).toBe("invitee@example.com");
    expect(arg.expiresInDays).toBe(2); // 30h rounds up
    expect(arg.inviteUrl).toBe("https://www.rowiia.com/invite/tok123");

    expect(inviteUpdate).toHaveBeenCalledWith({
      where: { id: "inv1" },
      data: { reminderSentAt: expect.any(Date) },
    });
    expect(res.body.sent).toBe(1);
    expect(res.body.failed).toBe(0);
  });

  it("skips an already-accepted invitee but still stamps it to stop daily scans", async () => {
    inviteFindMany.mockResolvedValue([invite()]);
    userFindMany.mockResolvedValue([{ email: "invitee@example.com" }]);

    const res = await GET(req("Bearer topsecret"));

    expect(sendMock).not.toHaveBeenCalled();
    expect(inviteUpdate).toHaveBeenCalledWith({
      where: { id: "inv1" },
      data: { reminderSentAt: expect.any(Date) },
    });
    expect(res.body.skipped).toBe(1);
    expect(res.body.sent).toBe(0);
  });

  it("counts a failed send and does NOT stamp it (so tomorrow retries)", async () => {
    inviteFindMany.mockResolvedValue([invite()]);
    sendMock.mockResolvedValue({ ok: false, error: "resend 500" });

    const res = await GET(req("Bearer topsecret"));

    expect(res.body.failed).toBe(1);
    expect(res.body.sent).toBe(0);
    expect(inviteUpdate).not.toHaveBeenCalled();
  });

  it("counts a thrown send as failed without aborting the batch", async () => {
    inviteFindMany.mockResolvedValue([invite({ id: "a" }), invite({ id: "b" })]);
    sendMock
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ ok: true });

    const res = await GET(req("Bearer topsecret"));

    expect(res.body.failed).toBe(1);
    expect(res.body.sent).toBe(1);
  });

  it("500s when the candidate query throws", async () => {
    inviteFindMany.mockRejectedValueOnce(new Error("db down"));
    const res = await GET(req("Bearer topsecret"));
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
  });
});
