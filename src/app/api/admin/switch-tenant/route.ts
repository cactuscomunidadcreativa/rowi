// src/app/api/admin/switch-tenant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export async function POST(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ ok: false, error: "Unauthorized" });

  const { tenantId } = await req.json();
  if (!tenantId) return NextResponse.json({ ok: false, error: "Falta tenantId" });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ ok: false, error: "Tenant no encontrado" });

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