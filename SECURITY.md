# Security Policy - Rowi

## Overview

This document outlines the security measures implemented in Rowi to protect user data, prevent unauthorized access, and maintain system integrity.

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation](#input-validation)
4. [CSRF Protection](#csrf-protection)
5. [SQL Injection Prevention](#sql-injection-prevention)
6. [XSS Prevention](#xss-prevention)
7. [Secure Logging](#secure-logging)
8. [API Security](#api-security)
9. [Encryption](#encryption)
10. [Security Headers](#security-headers)
11. [Reporting Vulnerabilities](#reporting-vulnerabilities)

---

## Authentication & Authorization

### NextAuth.js Implementation

- **Session Strategy**: JWT-based sessions with automatic refresh rotation
- **Token Expiration**: 7 days with 24-hour refresh cycles
- **OAuth Providers**: Google (with `allowDangerousEmailAccountLinking: false`)
- **Credentials**: bcrypt hashing with cost factor 12

### Authorization Helpers

```typescript
import { requireAuth, requireAdmin, requireSuperAdmin } from '@/lib/auth';

// API route protection
const authResult = await requireAdmin();
if (!authResult.success) return authResult.error;
```

**Available helpers:**
- `requireAuth()` - Requires any authenticated user
- `requireAdmin()` - Requires admin permissions
- `requireSuperAdmin()` - Requires superadmin role
- `requireHubAccess(hubId)` - Requires access to specific hub
- `requireTenantAccess(tenantId)` - Requires access to specific tenant

### JWT Refresh Rotation

Tokens are automatically refreshed every 24 hours to limit the window of exposure if a token is compromised:

```typescript
session: {
  strategy: "jwt",
  maxAge: 7 * 24 * 60 * 60,    // 7 days
  updateAge: 24 * 60 * 60,     // Refresh every 24h
}
```

---

## Rate Limiting

### In-Memory Rate Limiting (Middleware)

Applied globally via `middleware.ts`:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth` | 10 | 1 min |
| `/api/rowi` (AI) | 30 | 1 min |
| `/api/admin` | 50 | 1 min |
| `/api/stripe` | 10 | 1 min |
| Default | 100 | 1 min |

### Redis Rate Limiting (Production)

For distributed environments, use Upstash Redis:

```typescript
import { rateLimit } from '@/lib/security/rateLimitRedis';

const { success, remaining } = await rateLimit(identifier, 'ai');
if (!success) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
}
```

**Configuration:**
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

---

## Input Validation

### Zod Schemas

All admin endpoints use centralized Zod schemas:

```typescript
import { userCreateSchema, parseBody } from '@/lib/validation';

const validation = parseBody(body, userCreateSchema);
if (!validation.success) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

### Available Schemas

- `userCreateSchema`, `userUpdateSchema`, `userDeleteSchema`
- `tenantCreateSchema`, `tenantUpdateSchema`
- `planCreateSchema`, `planUpdateSchema`
- `hubCreateSchema`, `hubUpdateSchema`
- `agentCreateSchema`, `agentUpdateSchema`
- See `/src/lib/validation/adminSchemas.ts` for complete list

### Validation Features

- **Email normalization**: Lowercase + trim
- **Slug validation**: Lowercase, alphanumeric with hyphens only
- **ID validation**: Max 50 characters
- **Enum validation**: Strict role/type checking
- **Pagination limits**: Max 100 items per page

---

## CSRF Protection

### Implementation

CSRF protection is applied in `middleware.ts` for all mutation requests (POST, PUT, PATCH, DELETE):

```typescript
const CSRF_EXEMPT_PATHS = [
  "/api/stripe/webhook",
  "/api/webhooks",
  "/api/cron",
  "/api/auth",
];
```

### How It Works

1. Extracts `Origin` or `Referer` header
2. Compares against allowed hosts
3. Blocks requests from unknown origins

**Allowed Hosts:**
- `localhost`, `localhost:3000`
- `rowi.app`, `www.rowi.app`
- `*.rowi.app` (subdomains)
- `NEXT_PUBLIC_APP_URL` environment variable

---

## SQL Injection Prevention

### Prisma ORM

All database queries use Prisma's parameterized queries:

```typescript
// SAFE - Prisma handles parameterization
const user = await prisma.user.findUnique({
  where: { email: userInput }
});
```

### Raw Queries

When raw SQL is necessary, use `Prisma.sql` tagged templates:

```typescript
// SAFE - Parameters are escaped
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE id = ${userId}
`;
```

### Column Whitelisting

For dynamic column names, use strict whitelisting:

```typescript
const ALLOWED_COLUMNS = new Set(['name', 'email', 'status']);

if (!ALLOWED_COLUMNS.has(columnName)) {
  throw new Error('Invalid column');
}
```

---

## XSS Prevention

### Content Security Policy

Defined in `next.config.ts`:

```javascript
"Content-Security-Policy": [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: http:",
  "connect-src 'self' https://api.stripe.com https://api.openai.com",
  "frame-src 'self' https://js.stripe.com",
  "object-src 'none'",
]
```

### Input Sanitization

```typescript
import { sanitizeString, safeStringSchema } from '@/lib/security/validation';

// Escape HTML characters
const safe = sanitizeString(userInput);

// Validate no XSS patterns
const result = safeStringSchema.safeParse(input);
```

---

## Secure Logging

### Usage

```typescript
import { secureLog, sanitize } from '@/lib/logging';

// Automatic redaction of sensitive data
secureLog.info("User action", { userId, email });
secureLog.error("Failed operation", error, { context });
secureLog.security("Access attempt blocked", { ip, path });

// Manual sanitization
const safeData = sanitize(potentiallySensitiveObject);
```

### Redacted Fields

The logger automatically redacts:
- `password`, `passwordHash`, `secret`
- `token`, `accessToken`, `refreshToken`, `jwt`
- `apiKey`, `api_secret`, `clientSecret`
- `privateKey`, `encryptionKey`
- JWT patterns (`eyJ...`)
- Stripe keys (`sk_test_...`, `pk_live_...`)
- Database connection strings

---

## API Security

### Authentication Check

All protected endpoints must verify authentication:

```typescript
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.error;

  // Proceed with authorized logic
}
```

### Response Headers

API responses include security headers:

```typescript
{
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-RateLimit-Remaining": "99",
  "X-RateLimit-Reset": "1706723000"
}
```

### Error Handling

Use centralized error handling to prevent information leakage:

```typescript
import { handleApiError, ApiError } from '@/lib/api/errorHandler';

try {
  // API logic
} catch (error) {
  return handleApiError(error); // Safe, sanitized response
}
```

---

## Encryption

### Configuration Storage

Sensitive configuration is encrypted using AES-256-GCM:

```typescript
import { setSystemConfig, getSystemConfig } from '@/lib/config/systemConfig';

// Encrypts sensitive values automatically
await setSystemConfig('STRIPE_SECRET', value, true);

// Decrypts when retrieving
const secret = await getSystemConfig('STRIPE_SECRET');
```

**Requirements:**
- `NEXTAUTH_SECRET` must be set (no fallback)
- Encryption key derived from NEXTAUTH_SECRET

---

## Security Headers

Configured in `next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Enable browser XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | `camera=(), microphone=()...` | Disable sensitive APIs |
| `Content-Security-Policy` | See above | Control resource loading |

---

## Audit Logging

Security events are logged for forensics:

```typescript
import { logSecurityEvent, logUnauthorizedAccess } from '@/lib/audit/auditLog';

await logSecurityEvent("LOGIN_FAILED", {
  email: userEmail,
  reason: "Invalid password",
  ipAddress,
});

await logUnauthorizedAccess(path, reason, req);
```

### Logged Events

- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`
- `UNAUTHORIZED_ACCESS`, `SUSPICIOUS_ACTIVITY`
- `RATE_LIMIT_EXCEEDED`, `CSRF_BLOCKED`
- `PASSWORD_CHANGED`, `PERMISSION_GRANTED`

---

## Environment Variables

### Required Secrets

```env
# Authentication (REQUIRED)
NEXTAUTH_SECRET=<min 32 chars>
NEXTAUTH_URL=https://app.rowi.app

# Database
DATABASE_URL=postgresql://...

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...
```

### Optional Security Configs

```env
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Admin Access
HUB_ADMINS=admin@rowi.app,cto@rowi.app
```

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email security details to: **security@rowi.app**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

---

## Security Checklist for Developers

Before deploying code:

- [ ] All user inputs validated with Zod schemas
- [ ] Database queries use Prisma (no raw SQL with user input)
- [ ] Authentication checked on protected endpoints
- [ ] Sensitive data not logged (use `secureLog`)
- [ ] Rate limiting applied to new endpoints
- [ ] Security tests pass (`npm test -- --testPathPatterns=security`)
- [ ] No hardcoded secrets in code

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-31 | 1.0 | Initial security documentation |

---

*Last updated: January 2026*
