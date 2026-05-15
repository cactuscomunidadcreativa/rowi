import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope, type AdminScope } from "@/core/auth/requireAdmin";

type PrismaModel = {
  findMany: (args: object) => Promise<unknown[]>;
  count: (args?: object) => Promise<number>;
};

export interface ScopedListOptions {
  /** Fields the search query (?q=) matches case-insensitively. */
  searchableFields?: string[];
  orderBy?: object;
  include?: object;
  select?: object;
  /**
   * Translates the caller's admin scope (rowiverse/superhub/tenant/hub) into
   * a Prisma `where` fragment. Return `null` to apply no extra filter
   * (typically for rowiverse / SuperAdmin scope).
   */
  scopeWhere: (scope: AdminScope) => Record<string, unknown> | null;
}

/**
 * Drop-in replacement for `paginatedListHandler` that allows tenant-admins,
 * hub-admins and superhub-admins to see only their slice of the data while
 * SuperAdmins continue to see everything globally.
 *
 * Use this for endpoints whose underlying model has a clear tenant/hub
 * boundary. Stick with `paginatedListHandler` (SuperAdmin-only) for cross-
 * tenant operations.
 */
export async function scopedPaginatedListHandler(
  req: NextRequest,
  model: PrismaModel,
  opts: ScopedListOptions,
) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  // Throttle: SuperAdmins with rowiverse scope get the global view; everyone
  // else is scoped via scopeWhere().
  const isGlobal = auth.scope.type === "rowiverse";
  const scopeFilter = isGlobal ? null : opts.scopeWhere(auth.scope);

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10)),
    );
    const q = (url.searchParams.get("q") || "").trim();

    const andClauses: Record<string, unknown>[] = [];
    if (scopeFilter) andClauses.push(scopeFilter);
    if (q && opts.searchableFields?.length) {
      andClauses.push({
        OR: opts.searchableFields.map((field) => ({
          [field]: { contains: q, mode: "insensitive" as const },
        })),
      });
    }

    const where = andClauses.length === 0
      ? undefined
      : andClauses.length === 1
        ? andClauses[0]
        : { AND: andClauses };

    const findArgs: Record<string, unknown> = {
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: opts.orderBy ?? { id: "desc" },
    };
    if (where) findArgs.where = where;
    if (opts.include) findArgs.include = opts.include;
    if (opts.select) findArgs.select = opts.select;

    const [rows, total] = await Promise.all([
      model.findMany(findArgs),
      model.count(where ? { where } : undefined),
    ]);

    return NextResponse.json({
      ok: true,
      rows,
      total,
      page,
      pageSize,
      scope: { type: auth.scope.type, id: auth.scope.id },
    });
  } catch (e) {
    console.error("[scopedPaginatedListHandler] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}

/* =========================================================
   📂 SCOPE HELPERS — convert AdminScope into Prisma WHERE
   fragments for common ownership shapes.
========================================================= */

/** Direct `tenantId` field on the model. */
export function tenantIdWhere(scope: AdminScope): Record<string, unknown> | null {
  if (scope.type === "tenant" && scope.id) return { tenantId: scope.id };
  if (scope.type === "hub" || scope.type === "superhub") {
    // Resolve hub/superhub to their tenants synchronously is impossible here.
    // We expose this via the async resolver below for those callers.
    return null;
  }
  return null;
}

/** Async resolver: for hub/superhub scopes, fetch the tenant IDs they cover. */
export async function resolveScopeTenantIds(scope: AdminScope): Promise<string[]> {
  if (scope.type === "rowiverse") return [];
  if (!scope.id) return [];

  if (scope.type === "tenant") return [scope.id];

  if (scope.type === "hub") {
    const hub = await prisma.hub.findUnique({
      where: { id: scope.id },
      select: { tenantId: true },
    });
    return hub?.tenantId ? [hub.tenantId] : [];
  }

  if (scope.type === "superhub") {
    const sh = await prisma.superHub.findUnique({
      where: { id: scope.id },
      include: { tenants: { select: { id: true } } },
    });
    return sh?.tenants.map((t) => t.id) ?? [];
  }

  return [];
}

/**
 * Variant of `scopedPaginatedListHandler` that resolves hub/superhub scopes
 * to the underlying tenant IDs first. Use when the model has a `tenantId`
 * but the user might be admin at hub or superhub level.
 */
export async function tenantScopedPaginatedListHandler(
  req: NextRequest,
  model: PrismaModel,
  opts: Omit<ScopedListOptions, "scopeWhere"> & {
    /** Path inside the model to the tenantId field. Defaults to `tenantId`. */
    tenantField?: string;
    /**
     * Path to a parent relation that exposes tenantId. Example: for a model
     * accessed via `community`, pass `"community.tenantId"`.
     */
    relationTenantPath?: string;
  },
) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const isGlobal = auth.scope.type === "rowiverse";
  let where: Record<string, unknown> | null = null;

  if (!isGlobal) {
    const tenantIds = await resolveScopeTenantIds(auth.scope);
    if (tenantIds.length === 0) {
      return NextResponse.json({ ok: true, rows: [], total: 0, page: 1, pageSize: 25 });
    }
    if (opts.relationTenantPath) {
      const [rel, field] = opts.relationTenantPath.split(".");
      where = { [rel]: { [field]: { in: tenantIds } } };
    } else {
      const field = opts.tenantField || "tenantId";
      where = { [field]: { in: tenantIds } };
    }
  }

  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10)),
    );
    const q = (url.searchParams.get("q") || "").trim();

    const andClauses: Record<string, unknown>[] = [];
    if (where) andClauses.push(where);
    if (q && opts.searchableFields?.length) {
      andClauses.push({
        OR: opts.searchableFields.map((field) => ({
          [field]: { contains: q, mode: "insensitive" as const },
        })),
      });
    }

    const finalWhere =
      andClauses.length === 0
        ? undefined
        : andClauses.length === 1
          ? andClauses[0]
          : { AND: andClauses };

    const findArgs: Record<string, unknown> = {
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: opts.orderBy ?? { id: "desc" },
    };
    if (finalWhere) findArgs.where = finalWhere;
    if (opts.include) findArgs.include = opts.include;
    if (opts.select) findArgs.select = opts.select;

    const [rows, total] = await Promise.all([
      model.findMany(findArgs),
      model.count(finalWhere ? { where: finalWhere } : undefined),
    ]);

    return NextResponse.json({
      ok: true,
      rows,
      total,
      page,
      pageSize,
      scope: { type: auth.scope.type, id: auth.scope.id },
    });
  } catch (e) {
    console.error("[tenantScopedPaginatedListHandler] error:", e);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}

/**
 * Resolves an admin scope to the set of tenantIds it can administer.
 * Returns null for rowiverse / SuperAdmin scope (no narrowing — they
 * can see everything). Use the null sentinel to skip the where clause
 * entirely instead of falling back to "no results".
 */
export async function tenantIdsForScope(
  scope: AdminScope,
): Promise<string[] | null> {
  if (scope.type === "rowiverse") return null;
  if (scope.type === "tenant") return scope.id ? [scope.id] : [];
  if (scope.type === "hub") {
    const hub = await prisma.hub.findUnique({
      where: { id: scope.id! },
      select: { tenantId: true },
    });
    return hub?.tenantId ? [hub.tenantId] : [];
  }
  if (scope.type === "superhub") {
    const sh = await prisma.superHub.findUnique({
      where: { id: scope.id! },
      select: { tenants: { select: { id: true } } },
    });
    return (sh?.tenants || []).map((t) => t.id);
  }
  return [];
}

/**
 * True if the admin's scope reaches at least one tenant the target
 * user is associated with — via primaryTenant, any Membership, or any
 * RowiCommunityUser membership whose community is in scope.
 *
 * Rowiverse scope always returns true. Used by per-user admin endpoints
 * to gate /api/admin/users/[id]/* without escalating to SuperAdmin.
 */
export async function scopeCanSeeUser(
  scope: AdminScope,
  targetUserId: string,
): Promise<boolean> {
  const allowed = await tenantIdsForScope(scope);
  if (allowed === null) return true;

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      primaryTenantId: true,
      memberships: { select: { tenantId: true } },
      rowiCommunities: {
        select: { community: { select: { tenantId: true } } },
      },
    },
  });
  if (!target) return false;

  const set = new Set<string>();
  if (target.primaryTenantId) set.add(target.primaryTenantId);
  for (const m of target.memberships) if (m.tenantId) set.add(m.tenantId);
  for (const c of target.rowiCommunities) {
    if (c.community?.tenantId) set.add(c.community.tenantId);
  }
  return [...set].some((tid) => allowed.includes(tid));
}
