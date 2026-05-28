/**
 * GET /api/account/employee-profile/manager-suggest?q=...
 *
 * Devuelve sugerencias de manager para el step de onboarding "¿Quién es
 * tu manager?". Retorna users que son miembros del primaryTenant del user
 * actual, con su EmployeeProfile (si existe).
 *
 * - Si el user no tiene primaryTenantId (B2C), retorna lista vacía — el UI
 *   sabe que debe ofrecer skip.
 * - Filtra al propio user para que no se autoasigne como manager.
 * - q (opcional): substring match contra name + email (case-insensitive).
 * - Limita a 10 resultados.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { primaryTenantId: true },
  });

  if (!user?.primaryTenantId) {
    // B2C — no tenant scope to suggest from.
    return NextResponse.json({ ok: true, tenantId: null, results: [] });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  // Members del primaryTenant — busca por nombre/email. Excluimos al user
  // actual (no puedes ser tu propio manager).
  const memberships = await prisma.membership.findMany({
    where: {
      tenantId: user.primaryTenantId,
      userId: { not: auth.id },
      user: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          employeeProfiles: {
            where: { tenantId: user.primaryTenantId },
            select: { id: true, position: true, department: true },
            take: 1,
          },
        },
      },
    },
    take: 10,
  });

  const results = memberships
    .map((m) => {
      const ep = m.user.employeeProfiles?.[0];
      return {
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        employeeProfileId: ep?.id ?? null,
        position: ep?.position ?? null,
        department: ep?.department ?? null,
      };
    })
    // Solo sugerimos personas con EmployeeProfile en el tenant — si no lo
    // tienen, no se puede setear managerId (necesita ser un EP id).
    .filter((r) => r.employeeProfileId !== null);

  return NextResponse.json({ ok: true, tenantId: user.primaryTenantId, results });
}
