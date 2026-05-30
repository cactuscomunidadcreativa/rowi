// src/app/api/admin/switch-tenant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export async function POST(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { tenantId } = await req.json();
  if (!tenantId) return NextResponse.json({ ok: false, error: "Falta tenantId" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ ok: false, error: "Tenant no encontrado" }, { status: 404 });

  // 🔐 Solo se puede cambiar a un tenant donde el usuario tiene membership
  // (o si es SuperAdmin). Cambiar primaryTenantId amplía la visibilidad de
  // datos, así que no puede apuntar a un tenant ajeno.
  if (!auth.isSuperAdmin) {
    const membership = await prisma.membership.findFirst({
      where: { userId: auth.id, tenantId },
      select: { id: true },
    });
    if (!membership) {
      return NextResponse.json(
        { ok: false, error: "No perteneces a este tenant" },
        { status: 403 }
      );
    }
  }

  await prisma.user.update({
    where: { id: auth.id },
    data: { primaryTenantId: tenantId },
  });

  return NextResponse.json({
    ok: true,
    message: `Tenant cambiado a ${tenant.name}`,
  });
}

export const dynamic = "force-dynamic";