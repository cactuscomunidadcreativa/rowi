/**
 * =========================================================
 * 🛡️ Admin API Schemas (Zod)
 * =========================================================
 *
 * Schemas centralizados para validación de inputs en endpoints admin.
 * Usar estos schemas para garantizar validación consistente.
 *
 * USO:
 * ```ts
 * import { userCreateSchema, parseBody } from "@/lib/validation/adminSchemas";
 *
 * const result = userCreateSchema.safeParse(body);
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
 * }
 * const { name, email, tenantId } = result.data;
 * ```
 */

import { z } from "zod";

// =========================================================
// Helpers & Common Types
// =========================================================

/** ID de Prisma (CUID) */
export const idSchema = z.string().min(1, "ID es requerido").max(50);

/** Email normalizado */
export const emailSchema = z
  .string()
  .email("Email inválido")
  .transform((e) => e.toLowerCase().trim());

/** Slug (URL-safe) */
export const slugSchema = z
  .string()
  .min(2, "Slug muy corto")
  .max(100, "Slug muy largo")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug debe ser lowercase con guiones")
  .transform((s) => s.toLowerCase().trim());

/** Nombre genérico */
export const nameSchema = z
  .string()
  .min(2, "Nombre muy corto (mínimo 2 caracteres)")
  .max(100, "Nombre muy largo (máximo 100 caracteres)")
  .transform((n) => n.trim());

/** Paginación */
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  q: z.string().optional(),
});

// =========================================================
// Users
// =========================================================

export const userCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  tenantId: idSchema.optional().nullable(),
  planId: idSchema.optional().nullable(),
});

export const userUpdateSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  organizationRole: z.enum(["VIEWER", "MEMBER", "ADMIN", "OWNER", "SUPERADMIN"]).optional(),
  primaryTenantId: idSchema.optional().nullable(),
  planId: idSchema.optional().nullable(),
  allowAI: z.boolean().optional(),
  active: z.boolean().optional(),
  organizationId: idSchema.optional().nullable(),
  hubId: idSchema.optional().nullable(),
  orgRole: z.enum(["MEMBER", "ADMIN", "OWNER"]).optional(),
});

export const userDeleteSchema = z.object({
  id: idSchema,
});

export const userInviteSchema = z.object({
  email: emailSchema,
  name: nameSchema.optional(),
  tenantId: idSchema,
  role: z.enum(["VIEWER", "MEMBER", "ADMIN"]).default("MEMBER"),
  hubIds: z.array(idSchema).optional(),
  expiresIn: z.coerce.number().min(1).max(30).default(7), // días
});

export const userMergeSchema = z.object({
  sourceUserId: idSchema,
  targetUserId: idSchema,
  preserveSource: z.boolean().default(false),
});

// =========================================================
// Tenants
// =========================================================

export const tenantCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  planId: idSchema.optional().nullable(),
  superHubId: idSchema.optional().nullable(),
});

export const tenantUpdateSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  planId: idSchema.optional().nullable(),
  superHubId: idSchema.optional().nullable(),
  settings: z.record(z.string(), z.any()).optional(),
});

export const tenantDeleteSchema = z.object({
  id: idSchema,
});

// =========================================================
// Plans
// =========================================================

export const planCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  priceUsd: z.coerce.number().min(0).default(0),
  priceCents: z.coerce.number().min(0).default(0),
  durationDays: z.coerce.number().min(1).default(30),
  aiEnabled: z.boolean().default(true),
  // Stripe
  stripePriceIdMonthly: z.string().optional().nullable(),
  stripeProductId: z.string().optional().nullable(),
  // Trial
  trialDays: z.coerce.number().min(0).default(0),
  // Features
  seiIncluded: z.boolean().default(false),
  maxCommunities: z.coerce.number().min(1).default(1),
  maxMembers: z.coerce.number().min(1).default(10),
  maxUsers: z.coerce.number().min(1).default(1),
  benchmarkAccess: z.boolean().default(false),
  apiAccess: z.boolean().default(false),
  // Display
  badge: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isPublic: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const planUpdateSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  priceUsd: z.coerce.number().min(0).optional(),
  priceCents: z.coerce.number().min(0).optional(),
  durationDays: z.coerce.number().min(1).optional(),
  aiEnabled: z.boolean().optional(),
  stripePriceIdMonthly: z.string().optional().nullable(),
  stripeProductId: z.string().optional().nullable(),
  trialDays: z.coerce.number().min(0).optional(),
  seiIncluded: z.boolean().optional(),
  maxCommunities: z.coerce.number().min(1).optional(),
  maxMembers: z.coerce.number().min(1).optional(),
  maxUsers: z.coerce.number().min(1).optional(),
  benchmarkAccess: z.boolean().optional(),
  apiAccess: z.boolean().optional(),
  badge: z.string().optional().nullable(),
  sortOrder: z.coerce.number().optional(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const planDeleteSchema = z.object({
  id: idSchema,
});

// =========================================================
// Hubs
// =========================================================

export const hubCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  superHubId: idSchema,
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const hubUpdateSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  superHubId: idSchema.optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

export const hubDeleteSchema = z.object({
  id: idSchema,
});

export const hubMemberSchema = z.object({
  hubId: idSchema,
  userId: idSchema,
  role: z.enum(["member", "moderator", "admin", "owner"]).default("member"),
});

// =========================================================
// SuperHubs
// =========================================================

export const superHubCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  tenantId: idSchema,
  colorTheme: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(500).optional(),
});

export const superHubUpdateSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  colorTheme: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(500).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

// =========================================================
// Agents (AI)
// =========================================================

export const agentCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().max(500).optional(),
  type: z.enum(["chat", "assistant", "tool", "workflow"]).default("chat"),
  model: z.string().default("gpt-4o-mini"),
  prompt: z.string().min(10, "Prompt muy corto").max(50000),
  tone: z.enum(["professional", "friendly", "casual", "formal"]).default("professional"),
  isActive: z.boolean().default(true),
  // Scope (optional - global by default)
  tenantId: idSchema.optional().nullable(),
  superHubId: idSchema.optional().nullable(),
  organizationId: idSchema.optional().nullable(),
  hubId: idSchema.optional().nullable(),
  accessLevel: z.enum(["global", "tenant", "superhub", "organization", "hub"]).default("global"),
});

export const agentUpdateSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  type: z.enum(["chat", "assistant", "tool", "workflow"]).optional(),
  model: z.string().optional(),
  prompt: z.string().min(10).max(50000).optional(),
  tone: z.enum(["professional", "friendly", "casual", "formal"]).optional(),
  isActive: z.boolean().optional(),
});

export const agentToggleSchema = z.object({
  id: idSchema,
  isActive: z.boolean(),
});

export const agentCloneSchema = z.object({
  sourceId: idSchema,
  targetScope: z.object({
    tenantId: idSchema.optional().nullable(),
    superHubId: idSchema.optional().nullable(),
    organizationId: idSchema.optional().nullable(),
    hubId: idSchema.optional().nullable(),
  }),
  newName: nameSchema.optional(),
});

// =========================================================
// Organizations
// =========================================================

export const organizationCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  tenantId: idSchema,
  unitType: z.enum(["INDIVIDUAL", "SCHOOL", "COMPANY", "NGO", "GOVERNMENT", "OTHER"]).default("COMPANY"),
  description: z.string().max(500).optional(),
});

export const organizationUpdateSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  unitType: z.enum(["INDIVIDUAL", "SCHOOL", "COMPANY", "NGO", "GOVERNMENT", "OTHER"]).optional(),
  description: z.string().max(500).optional(),
});

// =========================================================
// Memberships
// =========================================================

export const membershipCreateSchema = z.object({
  userId: idSchema,
  tenantId: idSchema,
  role: z.enum(["VIEWER", "MEMBER", "ADMIN", "OWNER"]).default("MEMBER"),
  planId: idSchema.optional().nullable(),
});

export const membershipUpdateSchema = z.object({
  id: idSchema,
  role: z.enum(["VIEWER", "MEMBER", "ADMIN", "OWNER"]).optional(),
  planId: idSchema.optional().nullable(),
  isActive: z.boolean().optional(),
});

// =========================================================
// Benchmarks
// =========================================================

export const benchmarkCreateSchema = z.object({
  name: nameSchema,
  description: z.string().max(1000).optional(),
  tenantId: idSchema.optional(),
  superHubId: idSchema.optional(),
  hubId: idSchema.optional(),
  isPublic: z.boolean().default(false),
});

export const benchmarkUploadSchema = z.object({
  benchmarkId: idSchema,
  fileType: z.enum(["csv", "xlsx", "json"]),
  mapping: z.record(z.string(), z.string()).optional(),
});

// =========================================================
// Roles & Permissions
// =========================================================

export const roleCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  hubId: idSchema,
  permissions: z.array(z.string()).default([]),
  description: z.string().max(200).optional(),
});

export const roleUpdateSchema = z.object({
  id: idSchema,
  name: nameSchema.optional(),
  permissions: z.array(z.string()).optional(),
  description: z.string().max(200).optional(),
});

// =========================================================
// Invites
// =========================================================

export const inviteCreateSchema = z.object({
  email: emailSchema,
  tenantId: idSchema,
  role: z.enum(["VIEWER", "MEMBER", "ADMIN"]).default("MEMBER"),
  hubIds: z.array(idSchema).optional(),
  message: z.string().max(500).optional(),
  expiresInDays: z.coerce.number().min(1).max(30).default(7),
});

// =========================================================
// Settings
// =========================================================

export const settingsUpdateSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.string(), z.any())]),
  scope: z.enum(["system", "tenant", "user"]).default("system"),
  scopeId: idSchema.optional(),
});

// =========================================================
// Gamification
// =========================================================

export const achievementCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().max(500),
  icon: z.string().optional(),
  points: z.coerce.number().min(0).default(10),
  category: z.string().optional(),
  criteria: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().default(true),
});

export const levelCreateSchema = z.object({
  number: z.coerce.number().min(1),
  name: nameSchema,
  minPoints: z.coerce.number().min(0),
  maxPoints: z.coerce.number().min(1),
  badge: z.string().optional(),
  benefits: z.array(z.string()).optional(),
});

// =========================================================
// AI Knowledge Base
// =========================================================

export const knowledgeCreateSchema = z.object({
  title: nameSchema,
  content: z.string().min(10, "Contenido muy corto"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scope: z.object({
    tenantId: idSchema.optional(),
    superHubId: idSchema.optional(),
    hubId: idSchema.optional(),
  }).optional(),
  isActive: z.boolean().default(true),
});

// =========================================================
// CMS / Content
// =========================================================

export const contentCreateSchema = z.object({
  title: nameSchema,
  slug: slugSchema,
  type: z.enum(["page", "post", "article", "section"]).default("page"),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isPublished: z.boolean().default(false),
  tenantId: idSchema.optional(),
});

export const contentUpdateSchema = z.object({
  id: idSchema,
  title: nameSchema.optional(),
  slug: slugSchema.optional(),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  isPublished: z.boolean().optional(),
});

// =========================================================
// Layouts & Pages
// =========================================================

export const layoutCreateSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  type: z.enum(["dashboard", "profile", "landing", "custom"]).default("custom"),
  config: z.record(z.string(), z.any()).optional(),
  tenantId: idSchema.optional(),
  isDefault: z.boolean().default(false),
});

export const pageCreateSchema = z.object({
  title: nameSchema,
  slug: slugSchema,
  layoutId: idSchema.optional(),
  content: z.record(z.string(), z.any()).optional(),
  tenantId: idSchema.optional(),
  isPublished: z.boolean().default(false),
});

// =========================================================
// Utility Functions
// =========================================================

/**
 * Parsear y validar body con un schema
 * Retorna { success, data, error }
 */
export function parseBody<T extends z.ZodSchema>(
  body: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    const path = firstError.path.length > 0 ? `${firstError.path.join(".")}: ` : "";
    return { success: false, error: `${path}${firstError.message}` };
  }
  return { success: true, data: result.data };
}

/**
 * Parsear query params de paginación
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
  q?: string;
} {
  const result = paginationSchema.safeParse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
    q: searchParams.get("q"),
  });

  const data = result.success ? result.data : { page: 1, limit: 50, q: undefined };
  return {
    ...data,
    skip: (data.page - 1) * data.limit,
  };
}

// =========================================================
// Type Exports
// =========================================================

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type TenantCreate = z.infer<typeof tenantCreateSchema>;
export type TenantUpdate = z.infer<typeof tenantUpdateSchema>;
export type PlanCreate = z.infer<typeof planCreateSchema>;
export type PlanUpdate = z.infer<typeof planUpdateSchema>;
export type HubCreate = z.infer<typeof hubCreateSchema>;
export type HubUpdate = z.infer<typeof hubUpdateSchema>;
export type AgentCreate = z.infer<typeof agentCreateSchema>;
export type AgentUpdate = z.infer<typeof agentUpdateSchema>;
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>;
