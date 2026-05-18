/**
 * Unit tests for the telemetry adapter.
 *
 * The adapter has three observable behaviors:
 *   1. captureException always mirrors to secureLog
 *   2. captureMessage always mirrors to secureLog as info
 *   3. forwardToBackend is a no-op when no provider env is set
 *
 * We don't test the SaaS-bound branches because they're behind a lazy
 * import and only activate when env vars are set in production.
 */

jest.mock("@/lib/logging", () => ({
  secureLog: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { telemetry } from "@/lib/telemetry";
import { secureLog } from "@/lib/logging";

const secureLogMock = secureLog as unknown as {
  error: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
};

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.TELEMETRY_PROVIDER;
  delete process.env.SENTRY_DSN;
  delete process.env.AXIOM_TOKEN;
});

describe("telemetry.captureException", () => {
  it("mirrors the error to secureLog.error with context", () => {
    const err = new Error("test failure");
    telemetry.captureException(err, { route: "/api/x", userId: "u1" });
    expect(secureLogMock.error).toHaveBeenCalledWith(
      "telemetry.exception",
      err,
      expect.objectContaining({
        route: "/api/x",
        userId: "u1",
        error: err,
      }),
    );
  });

  it("attaches an env/signature payload", () => {
    const err = new Error("boom");
    telemetry.captureException(err);
    const [, , payload] = secureLogMock.error.mock.calls[0];
    expect(payload).toHaveProperty("env");
    expect(payload).toHaveProperty("deploy");
    expect(typeof payload.signature).toBe("string");
  });

  it("never throws even with weird inputs", () => {
    expect(() => telemetry.captureException(null)).not.toThrow();
    expect(() => telemetry.captureException("string error")).not.toThrow();
    expect(() => telemetry.captureException(undefined)).not.toThrow();
  });
});

describe("telemetry.captureMessage", () => {
  it("logs a notable event as info", () => {
    telemetry.captureMessage("manager.cycle_detected", {
      employeeId: "emp1",
      candidateManagerId: "emp2",
    });
    expect(secureLogMock.info).toHaveBeenCalledWith(
      "telemetry.message",
      expect.objectContaining({
        message: "manager.cycle_detected",
        employeeId: "emp1",
      }),
    );
  });
});

describe("telemetry.isEnabled", () => {
  it("returns false when no provider env set", () => {
    expect(telemetry.isEnabled()).toBe(false);
  });

  it("returns true when provider=sentry and DSN is set", () => {
    process.env.TELEMETRY_PROVIDER = "sentry";
    process.env.SENTRY_DSN = "https://test@sentry.io/1";
    expect(telemetry.isEnabled()).toBe(true);
  });

  it("returns false when provider=sentry but no DSN (misconfigured)", () => {
    process.env.TELEMETRY_PROVIDER = "sentry";
    // no SENTRY_DSN
    expect(telemetry.isEnabled()).toBe(false);
  });
});
