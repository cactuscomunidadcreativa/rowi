/**
 * 🏢 POST /api/account/create-organization
 * ============================================================
 * Self-service: cualquier usuario autenticado crea SU organización
 * (tenant) y se vuelve admin de ella. NO requiere SuperAdmin.
 *
 * Seguridad: el usuario obtiene scope admin SOLO sobre el tenant que
 * crea (UserPermission scopeType="tenant"). No puede tocar otros
 * tenants — el modelo scope-aware lo limita. Esto es alta self-service,
 * no escalada de privilegios.
 *
 * Crea en una transacción: Tenant + Membership(ADMIN) + UserPermission.
 *
 * Nota: las permissions se cargan en la sesión al autenticar, así que
 * el scope admin nuevo aplica tras refrescar sesión (devolvemos
 * needsSessionRefresh:true para que el cliente fuerce el refresh).
 * ============================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAuth } from "@/core/auth/requireAdmin";
import { secureLog } from "@/lib/logging";
import { cloneAgentsForContext } from "@/core/startup/cloneAgents";

export const dynamic = "force-dynamic";

// Tope anti-abuso: cuántas orgs puede crear un mismo usuario.
const MAX_ORGS_PER_USER = 5;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos (marcas combinantes)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const user = auth.user;

  const body = await req.json().catch(() => ({}));
  const name = (body?.name || "").trim();
  let slug = (body?.slug || "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, error: "El nombre de la organización es obligatorio" },
      { status: 400 },
    );
  }

  slug = slug ? slugify(slug) : slugify(name);
  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "No se pudo derivar un slug válido del nombre" },
      { status: 400 },
    );
  }

  // Tope anti-abuso: cuántos tenants ya creó/administra este usuario.
  const ownedCount = await prisma.userPermission.count({
    where: { userId: user.id, scopeType: "tenant", role: { in: ["admin", "owner"] } },
  });
  if (ownedCount >= MAX_ORGS_PER_USER) {
    return NextResponse.json(
      { ok: false, error: "Alcanzaste el máximo de organizaciones que puedes crear." },
      { status: 429 },
    );
  }

  // Slug único.
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { ok: false, error: "tenant_slug_taken", message: "Ya existe una organización con ese identificador." },
      { status: 409 },
    );
  }

  try {
    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          name,
          slug,
          billingEmail: user.email || null,
        },
      });

      // Relación de membresía (rol admin a nivel tenant).
      await tx.membership.create({
        data: { userId: user.id, tenantId: t.id, role: "ADMIN" },
      });

      // Permiso que OTORGA el scope admin (lo que lee requireAdminWithScope).
      await tx.userPermission.create({
        data: {
          userId: user.id,
          scopeType: "tenant",
          scopeId: t.id,
          role: "admin",
          // Campos legacy para compatibilidad.
          tenantId: t.id,
          scope: "tenant",
        },
      });

      return t;
    });

    secureLog.info(
      `[create-org] user=${user.id} created tenant=${tenant.id} slug=${tenant.slug}`,
    );

    // Provisiona los agentes de usuario para el nuevo tenant (best-effort).
    await cloneAgentsForContext({ tenantId: tenant.id });

    return NextResponse.json({
      ok: true,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      // El cliente debe refrescar la sesión para que el scope admin entre.
      needsSessionRefresh: true,
    });
  } catch (err: any) {
    // Carrera en el unique de slug → 409.
    if (err?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "tenant_slug_taken" },
        { status: 409 },
      );
    }
    console.error("[create-org] error:", err);
    return NextResponse.json(
      { ok: false, error: "No se pudo crear la organización" },
      { status: 500 },
    );
  }
}
