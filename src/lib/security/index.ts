/**
 * Security utilities for Rowi
 *
 * Usage:
 * // For schemas and pure utilities (safe for tests):
 * import { emailSchema, slugSchema, sanitizeString } from '@/lib/security';
 *
 * // For API route helpers (uses Next.js):
 * import { validateBody, unauthorizedResponse } from '@/lib/security/api-helpers';
 *
 * // For rate limiting:
 * import { checkRateLimit, RATE_LIMITS } from '@/lib/security';
 *
 * // For secret validation:
 * import { validateSecrets, getRequiredSecret } from '@/lib/security';
 */

export * from './rate-limit';
export * from './validation';
export * from './secrets';
// Note: api-helpers.ts is NOT exported here to avoid Next.js deps in tests
// Import directly: import { validateBody } from '@/lib/security/api-helpers';
