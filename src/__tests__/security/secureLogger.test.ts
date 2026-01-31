/**
 * Tests de seguridad para Secure Logger
 *
 * Verifica que el logger sanitiza información sensible correctamente.
 */

import {
  sanitize,
  sanitizeHeaders,
  sanitizeQueryParams,
} from "@/lib/logging/secureLogger";

describe("Secure Logger", () => {
  describe("sanitize", () => {
    it("should redact password fields", () => {
      const data = { username: "john", password: "secret123" };
      const sanitized = sanitize(data);
      expect(sanitized.username).toBe("john");
      expect(sanitized.password).toBe("[REDACTED]");
    });

    it("should redact token fields", () => {
      const data = {
        userId: "123",
        accessToken: "abc123xyz",
        refreshToken: "refresh456",
      };
      const sanitized = sanitize(data);
      expect(sanitized.userId).toBe("123");
      expect(sanitized.accessToken).toBe("[REDACTED]");
      expect(sanitized.refreshToken).toBe("[REDACTED]");
    });

    it("should redact API keys", () => {
      const data = {
        name: "Service",
        apiKey: "fake_api_key_12345",
        api_secret: "secret123",
      };
      const sanitized = sanitize(data);
      expect(sanitized.name).toBe("Service");
      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.api_secret).toBe("[REDACTED]");
    });

    it("should redact nested sensitive fields", () => {
      const data = {
        user: {
          name: "John",
          auth: {
            password: "secret",
            token: "jwt123",
          },
        },
      };
      const sanitized = sanitize(data) as any;
      expect(sanitized.user.name).toBe("John");
      // "auth" object itself is not sensitive, but its fields are
      expect(sanitized.user.auth.password).toBe("[REDACTED]");
      expect(sanitized.user.auth.token).toBe("[REDACTED]");
    });

    it("should redact entire credentials object when key is sensitive", () => {
      const data = {
        user: {
          name: "John",
          credentials: { username: "john", password: "secret" },
        },
      };
      const sanitized = sanitize(data) as any;
      expect(sanitized.user.name).toBe("John");
      // "credentials" key is sensitive, so entire object is redacted
      expect(sanitized.user.credentials).toBe("[REDACTED]");
    });

    it("should redact arrays with sensitive data", () => {
      const data = {
        users: [
          { name: "John", password: "pass1" },
          { name: "Jane", password: "pass2" },
        ],
      };
      const sanitized = sanitize(data);
      expect(sanitized.users[0].name).toBe("John");
      expect(sanitized.users[0].password).toBe("[REDACTED]");
      expect(sanitized.users[1].password).toBe("[REDACTED]");
    });

    it("should redact JWT tokens in strings", () => {
      const data = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const sanitized = sanitize(data);
      expect(sanitized).toBe("Bearer [REDACTED]");
    });

    it("should redact Stripe keys in strings", () => {
      // Using fake pattern that looks like Stripe key format
      const data = "Using key sk_test_FAKE_KEY_FOR_TESTING_1234 for payment";
      const sanitized = sanitize(data);
      expect(sanitized).toContain("[REDACTED]");
      expect(sanitized).not.toContain("sk_test");
    });

    it("should redact connection strings", () => {
      const data = "Connecting to postgres://user:password@localhost:5432/db";
      const sanitized = sanitize(data);
      expect(sanitized).toContain("[REDACTED]");
      expect(sanitized).not.toContain("password");
    });

    it("should handle null and undefined", () => {
      expect(sanitize(null)).toBe(null);
      expect(sanitize(undefined)).toBe(undefined);
    });

    it("should handle primitives", () => {
      expect(sanitize(123)).toBe(123);
      expect(sanitize(true)).toBe(true);
      expect(sanitize("normal string")).toBe("normal string");
    });
  });

  describe("sanitizeHeaders", () => {
    it("should redact authorization header", () => {
      const headers = new Headers({
        "content-type": "application/json",
        "authorization": "Bearer secret-token",
      });
      const sanitized = sanitizeHeaders(headers);
      expect(sanitized["content-type"]).toBe("application/json");
      expect(sanitized["authorization"]).toBe("[REDACTED]");
    });

    it("should redact cookie header", () => {
      const headers = new Headers({
        cookie: "session=abc123; token=xyz789",
      });
      const sanitized = sanitizeHeaders(headers);
      expect(sanitized["cookie"]).toBe("[REDACTED]");
    });

    it("should redact x-api-key header", () => {
      const headers = new Headers({
        "x-api-key": "secret-api-key",
        "x-request-id": "req-123",
      });
      const sanitized = sanitizeHeaders(headers);
      expect(sanitized["x-api-key"]).toBe("[REDACTED]");
      expect(sanitized["x-request-id"]).toBe("req-123");
    });

    it("should work with plain objects", () => {
      const headers = {
        "Content-Type": "text/plain",
        Authorization: "Basic abc123",
      };
      const sanitized = sanitizeHeaders(headers);
      expect(sanitized["Authorization"]).toBe("[REDACTED]");
    });
  });

  describe("sanitizeQueryParams", () => {
    it("should redact token parameter", () => {
      const params = new URLSearchParams("token=secret123&page=1");
      const sanitized = sanitizeQueryParams(params);
      expect(sanitized["token"]).toBe("[REDACTED]");
      expect(sanitized["page"]).toBe("1");
    });

    it("should redact password parameter", () => {
      const params = new URLSearchParams("username=john&password=secret");
      const sanitized = sanitizeQueryParams(params);
      expect(sanitized["username"]).toBe("john");
      expect(sanitized["password"]).toBe("[REDACTED]");
    });

    it("should redact code parameter (OAuth)", () => {
      const params = new URLSearchParams("code=oauth_code_123&state=random");
      const sanitized = sanitizeQueryParams(params);
      expect(sanitized["code"]).toBe("[REDACTED]");
      expect(sanitized["state"]).toBe("[REDACTED]");
    });

    it("should work with plain objects", () => {
      const params = {
        key: "api_key_123",
        format: "json",
      };
      const sanitized = sanitizeQueryParams(params);
      expect(sanitized["key"]).toBe("[REDACTED]");
      expect(sanitized["format"]).toBe("json");
    });
  });
});

describe("Sensitive Key Detection", () => {
  const sensitiveKeys = [
    "password",
    "Password",
    "PASSWORD",
    "passwordHash",
    "secret",
    "apiKey",
    "api_key",
    "token",
    "accessToken",
    "access_token",
    "refreshToken",
    "clientSecret",
    "client_secret",
    "privateKey",
    "private_key",
    "jwt",
    "bearer",
    "authorization",
    "credential",
    "credentials",
  ];

  it("should redact all sensitive key variations", () => {
    for (const key of sensitiveKeys) {
      const data = { [key]: "sensitive_value" };
      const sanitized = sanitize(data);
      expect(sanitized[key]).toBe("[REDACTED]");
    }
  });
});

describe("Pattern Detection", () => {
  // Using obviously fake values that match the pattern format
  // but are clearly test data (not real secrets)
  const patterns = [
    { name: "Stripe test key pattern", value: "sk_test_FAKEFAKEFAKEFAKE" },
    { name: "Stripe live key pattern", value: "sk_live_FAKEFAKEFAKEFAKE" },
    { name: "Stripe pub key pattern", value: "pk_test_FAKEFAKEFAKEFAKE" },
    { name: "JWT token", value: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abc123" },
    { name: "Bearer token", value: "Bearer eyJhbGciOiJIUzI1NiJ9" },
    { name: "PostgreSQL URL", value: "postgres://user:pass@host:5432/db" },
    { name: "MySQL URL", value: "mysql://user:pass@host:3306/db" },
    { name: "MongoDB URL", value: "mongodb+srv://user:pass@cluster.mongodb.net/db" },
  ];

  it("should redact known sensitive patterns in strings", () => {
    for (const { name, value } of patterns) {
      const sanitized = sanitize(value);
      expect(sanitized).toContain("[REDACTED]");
    }
  });
});
