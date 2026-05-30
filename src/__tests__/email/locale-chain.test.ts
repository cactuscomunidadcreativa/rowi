/**
 * Unit tests for the transactional-email locale resolution + send guards.
 *
 * Per CLAUDE.md every transactional email resolves a supported locale and
 * falls back to "es"; an unknown/empty locale must NEVER throw or send a blank
 * template. These helpers are also the single Resend wiring (callers must not
 * duplicate it), so the env-gated "skipped" contract matters: with no
 * RESEND_API_KEY they return { ok: true, skipped: true } so callers can fall
 * back to in-app notifications instead of erroring.
 *
 * This pins, for both sendInviteEmail and sendContextNotification:
 * - Required-field validation (to / url) fails closed.
 * - No RESEND_API_KEY → skipped (no network).
 * - Locale fallback: a supported locale is honored; an unknown one degrades to
 *   "es" (observed through the payload sent to a mocked Resend fetch).
 */

jest.mock("@/lib/logging", () => ({
  secureLog: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { sendInviteEmail } from "@/lib/email/sendInviteEmail";
import { sendContextNotification } from "@/lib/email/sendContextNotification";

const OLD_ENV = { ...process.env };

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.RESEND_API_KEY;
});

afterEach(() => {
  process.env = { ...OLD_ENV };
  // @ts-expect-error cleanup the fetch stub between tests
  delete global.fetch;
});

describe("sendInviteEmail — guards + skipped", () => {
  it("fails closed when `to` is missing", async () => {
    const r = await sendInviteEmail({ to: "", inviteUrl: "https://x/invite/t" } as any);
    expect(r).toEqual({ ok: false, error: "Recipient email is required" });
  });

  it("fails closed when `inviteUrl` is missing", async () => {
    const r = await sendInviteEmail({ to: "a@b.com", inviteUrl: "  " } as any);
    expect(r).toEqual({ ok: false, error: "inviteUrl is required" });
  });

  it("returns { skipped: true } and sends nothing when RESEND_API_KEY is unset", async () => {
    const fetchSpy = jest.fn();
    // @ts-expect-error test stub
    global.fetch = fetchSpy;

    const r = await sendInviteEmail({ to: "a@b.com", inviteUrl: "https://x/invite/t" } as any);
    expect(r).toEqual({ ok: true, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("sendContextNotification — guards + skipped", () => {
  it("fails closed when `to` is missing", async () => {
    const r = await sendContextNotification({
      to: "", kind: "family.requested", ctaUrl: "https://x/settings/family",
    } as any);
    expect(r).toEqual({ ok: false, error: "Recipient email is required" });
  });

  it("fails closed when `ctaUrl` is missing", async () => {
    const r = await sendContextNotification({
      to: "a@b.com", kind: "family.requested", ctaUrl: "",
    } as any);
    expect(r).toEqual({ ok: false, error: "ctaUrl is required" });
  });

  it("returns { skipped: true } when RESEND_API_KEY is unset", async () => {
    const r = await sendContextNotification({
      to: "a@b.com", kind: "family.requested", ctaUrl: "https://x/settings/family",
    } as any);
    expect(r).toEqual({ ok: true, skipped: true });
  });
});

describe("locale resolution (observed via Resend payload)", () => {
  function mockResendOk() {
    const calls: any[] = [];
    const fetchSpy = jest.fn(async (_url: string, init: any) => {
      calls.push(JSON.parse(init.body));
      return { ok: true, json: async () => ({ id: "email_1" }) } as any;
    });
    // @ts-expect-error test stub
    global.fetch = fetchSpy;
    return calls;
  }

  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test";
  });

  it("honors a supported invite locale (it) in the rendered subject", async () => {
    const calls = mockResendOk();
    const r = await sendInviteEmail({
      to: "a@b.com", inviteUrl: "https://x/invite/t", workspaceName: "Acme", locale: "it",
    } as any);

    expect(r.ok).toBe(true);
    // Italian subject is "Sei stato invitato a "Acme" su Rowi" — the "su Rowi"
    // tail is IT-specific (ES says "en Rowi"), so it proves the locale stuck.
    expect(calls[0].subject).toContain("su Rowi");
    expect(calls[0].tags[0]).toEqual({ name: "kind", value: "invite" });
  });

  it("falls back to es for an unknown invite locale (never throws / blank)", async () => {
    const calls = mockResendOk();
    const r = await sendInviteEmail({
      to: "a@b.com", inviteUrl: "https://x/invite/t", locale: "zz",
    } as any);

    expect(r.ok).toBe(true);
    expect(calls[0].subject.length).toBeGreaterThan(0);
    expect(calls[0].html).toContain("Rowi");
  });

  it("tags an invite reminder distinctly", async () => {
    const calls = mockResendOk();
    await sendInviteEmail({
      to: "a@b.com", inviteUrl: "https://x/invite/t", kind: "reminder", locale: "es",
    } as any);
    expect(calls[0].tags[0]).toEqual({ name: "kind", value: "invite_reminder" });
  });

  it("renders context notification html with the resolved lang attribute (en)", async () => {
    const calls = mockResendOk();
    const r = await sendContextNotification({
      to: "a@b.com", kind: "family.accepted", actorName: "Ana",
      ctaUrl: "https://x/settings/family", locale: "en",
    } as any);

    expect(r.ok).toBe(true);
    expect(calls[0].html).toContain('lang="en"');
  });

  it("falls back to es lang for an unknown context locale", async () => {
    const calls = mockResendOk();
    await sendContextNotification({
      to: "a@b.com", kind: "family.accepted", actorName: "Ana",
      ctaUrl: "https://x/settings/family", locale: "zz",
    } as any);
    expect(calls[0].html).toContain('lang="es"');
  });

  it("surfaces a Resend non-2xx as a structured error", async () => {
    const fetchSpy = jest.fn(async () => ({
      ok: false, status: 422, text: async () => "bad", json: async () => ({}),
    }));
    // @ts-expect-error test stub
    global.fetch = fetchSpy;

    const r = await sendInviteEmail({
      to: "a@b.com", inviteUrl: "https://x/invite/t", locale: "es",
    } as any);
    expect(r).toEqual({ ok: false, error: "Resend 422" });
  });
});
