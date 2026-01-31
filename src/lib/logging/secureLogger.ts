/**
 * =========================================================
 * 🔐 Secure Logger
 * =========================================================
 *
 * Logger que sanitiza información sensible antes de loguear.
 * Previene exposición accidental de secrets, tokens, passwords, etc.
 *
 * USO:
 * ```ts
 * import { secureLog, sanitize } from '@/lib/logging/secureLogger';
 *
 * // Log seguro
 * secureLog.info("User logged in", { userId, email });
 * secureLog.error("Auth failed", error, { email });
 *
 * // Sanitizar objetos manualmente
 * const safe = sanitize(potentiallySensitiveData);
 * ```
 */

// =========================================================
// Patrones de información sensible
// =========================================================

const SENSITIVE_KEYS = new Set([
  // Autenticación
  "password",
  "passwordHash",
  "hashedPassword",
  "secret",
  "privateKey",
  "private_key",
  "apiKey",
  "api_key",
  "apiSecret",
  "api_secret",

  // Tokens
  "token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "idToken",
  "id_token",
  "sessionToken",
  "session_token",
  "jwt",
  "bearer",
  "authorization",

  // OAuth
  "clientSecret",
  "client_secret",
  "code",
  "state",

  // Credenciales
  "credential",
  "credentials",
  "pin",
  "cvv",
  "cvc",
  "ssn",
  "socialSecurity",

  // Stripe
  "stripeKey",
  "stripeSecret",
  "stripe_secret",
  "webhookSecret",
  "webhook_secret",

  // Base de datos
  "databaseUrl",
  "database_url",
  "connectionString",
  "connection_string",

  // Otros
  "encryptionKey",
  "encryption_key",
  "signingKey",
  "signing_key",
]);

const SENSITIVE_PATTERNS = [
  // API Keys (formato común)
  /sk_[a-zA-Z0-9_]+/gi,
  /pk_[a-zA-Z0-9_]+/gi,
  /api[_-]?key[_-]?[a-zA-Z0-9]+/gi,

  // JWT tokens
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,

  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9_.-]+/gi,

  // Passwords en strings
  /password[=:]\s*['"]?[^'"&\s]+/gi,
  /pwd[=:]\s*['"]?[^'"&\s]+/gi,

  // Connection strings
  /postgres(ql)?:\/\/[^@]+@[^\s]+/gi,
  /mysql:\/\/[^@]+@[^\s]+/gi,
  /mongodb(\+srv)?:\/\/[^@]+@[^\s]+/gi,

  // Emails (parcialmente ocultar)
  // No ocultar completamente, solo mostrar inicio y dominio
];

// =========================================================
// Funciones de sanitización
// =========================================================

/**
 * Sanitiza un valor individual
 */
function sanitizeValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) return value;

  // Verificar si la key es sensible
  if (key && isSensitiveKey(key)) {
    return "[REDACTED]";
  }

  // Strings: buscar patrones sensibles
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  // Arrays
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v));
  }

  // Objetos
  if (typeof value === "object") {
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
}

/**
 * Verifica si una key es sensible
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.has(lowerKey) ||
    SENSITIVE_KEYS.has(key) ||
    lowerKey.includes("password") ||
    lowerKey.includes("secret") ||
    lowerKey.includes("token") ||
    lowerKey.includes("api_key") ||
    lowerKey.includes("apikey") ||
    lowerKey.includes("private");
}

/**
 * Sanitiza un string buscando patrones sensibles
 */
function sanitizeString(str: string): string {
  let result = str;

  for (const pattern of SENSITIVE_PATTERNS) {
    // Reset lastIndex para regex global
    pattern.lastIndex = 0;
    result = result.replace(pattern, "[REDACTED]");
  }

  return result;
}

/**
 * Sanitiza un objeto recursivamente
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value, key);
  }

  return sanitized;
}

/**
 * Sanitiza cualquier dato antes de loguear
 */
export function sanitize<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return sanitizeString(data) as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item)) as T;
  }

  if (typeof data === "object") {
    return sanitizeObject(data as Record<string, unknown>) as T;
  }

  return data;
}

/**
 * Sanitiza un error para logging
 */
function sanitizeError(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeString(error.message),
      stack: process.env.NODE_ENV === "development"
        ? sanitizeString(error.stack || "")
        : undefined,
    };
  }

  if (typeof error === "string") {
    return { message: sanitizeString(error) };
  }

  return { message: String(error) };
}

// =========================================================
// Logger seguro
// =========================================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const safeContext = context ? sanitize(context) : undefined;

  if (safeContext && Object.keys(safeContext).length > 0) {
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${JSON.stringify(safeContext)}`;
  }

  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const secureLog = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatLog("debug", message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    console.log(formatLog("info", message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatLog("warn", message, context));
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    const safeError = error ? sanitizeError(error) : undefined;
    const fullContext = { ...context, error: safeError };
    console.error(formatLog("error", message, fullContext));
  },

  /**
   * Log de seguridad - siempre incluye timestamp y nivel SECURITY
   */
  security(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const safeContext = context ? sanitize(context) : {};
    console.warn(
      `[${timestamp}] [SECURITY] ${message}`,
      JSON.stringify(safeContext)
    );
  },
};

// =========================================================
// Middleware para Express/Next.js
// =========================================================

/**
 * Crea headers sanitizados para logging
 */
export function sanitizeHeaders(headers: Headers | Record<string, string>): Record<string, string> {
  const sensitiveHeaders = new Set([
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
  ]);

  const result: Record<string, string> = {};

  const entries = headers instanceof Headers
    ? Array.from(headers.entries())
    : Object.entries(headers);

  for (const [key, value] of entries) {
    if (sensitiveHeaders.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = sanitizeString(value);
    }
  }

  return result;
}

/**
 * Sanitiza query parameters para logging
 */
export function sanitizeQueryParams(params: URLSearchParams | Record<string, string>): Record<string, string> {
  const sensitiveParams = new Set([
    "token",
    "code",
    "state",
    "password",
    "secret",
    "key",
  ]);

  const result: Record<string, string> = {};

  const entries = params instanceof URLSearchParams
    ? Array.from(params.entries())
    : Object.entries(params);

  for (const [key, value] of entries) {
    if (sensitiveParams.has(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = sanitizeString(value);
    }
  }

  return result;
}

// =========================================================
// Exports
// =========================================================

export default secureLog;
