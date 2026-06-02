/**
 * Tests for the distributed (Upstash) rate limiter fallback contract.
 *
 * The middleware must keep its current in-memory behavior UNCHANGED unless
 * Upstash is configured. So with no `UPSTASH_REDIS_REST_*` env vars present:
 *   - `distributedRateLimitEnabled` is false, and
 *   - `distributedRateLimit()` returns null (signal: "use in-memory").
 * This is the safety contract that makes shipping the feature a no-op until
 * the env is provisioned.
 */

describe("distributed rate limit (Upstash) — disabled by default", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("is disabled when env vars are absent", async () => {
    const mod = await import("@/lib/rate-limit/distributed");
    expect(mod.distributedRateLimitEnabled).toBe(false);
  });

  it("returns null (fall back to in-memory) when disabled", async () => {
    const mod = await import("@/lib/rate-limit/distributed");
    const res = await mod.distributedRateLimit({
      prefix: "/api/rowi",
      key: "1.2.3.4:/api/rowi",
      limit: 20,
      windowMs: 60000,
    });
    expect(res).toBeNull();
  });
});
