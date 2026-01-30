/**
 * Zod validation schemas for Rowi
 * Pure schemas without Next.js dependencies - can be used in tests
 */

import { z } from "zod";

// ============================================
// Common Schemas
// ============================================

/** Valid email format */
export const emailSchema = z.string().email("Invalid email format");

/** UUID v4 format */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/** URL-safe slug (lowercase letters, numbers, hyphens) */
export const slugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(50, "Slug must be at most 50 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

/** EQ score (0-100) */
export const eqScoreSchema = z
  .number()
  .min(0, "Score must be at least 0")
  .max(100, "Score must be at most 100");

/** Pagination parameters */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Date string (ISO format) */
export const dateSchema = z.string().datetime({ message: "Invalid date format" });

/** Non-empty string */
export const nonEmptyString = z.string().min(1, "This field is required");

/** Safe string (prevents XSS by limiting characters) */
export const safeStringSchema = z
  .string()
  .max(1000)
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    "Invalid characters detected"
  );

// ============================================
// Utility Functions (no Next.js deps)
// ============================================

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate that a string is a safe ID (alphanumeric, underscores, hyphens)
 */
export function isSafeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T extends z.ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    return { success: false, errors: result.error };
  }

  return { success: true, data: result.data };
}

// ============================================
// Common API Schemas
// ============================================

/** Schema for creating a user */
export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(2).max(100),
  language: z.enum(["es", "en", "pt", "it"]).optional(),
  country: z.string().min(2).max(100).optional(),
});

/** Schema for updating user profile */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  language: z.enum(["es", "en", "pt", "it"]).optional(),
  country: z.string().min(2).max(100).optional(),
  bio: safeStringSchema.optional(),
});

/** Schema for community creation */
export const createCommunitySchema = z.object({
  name: nonEmptyString.max(100),
  slug: slugSchema,
  description: safeStringSchema.optional(),
});

/** Schema for WeekFlow check-in */
export const weekflowCheckinSchema = z.object({
  mood: z.number().int().min(1).max(5),
  emotion: z.string().max(50).optional(),
  showAndTell: safeStringSchema.optional(),
  toDiscuss: safeStringSchema.optional(),
  focus: safeStringSchema.optional(),
});

/** Schema for EQ snapshot */
export const eqSnapshotSchema = z.object({
  K: eqScoreSchema.optional(),
  C: eqScoreSchema.optional(),
  G: eqScoreSchema.optional(),
  brainStyle: z.string().max(50).optional(),
});
