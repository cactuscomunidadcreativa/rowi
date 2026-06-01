// src/lib/communities/adminGuard.ts
// ============================================================
// 🔐 Guards de autorización para endpoints de comunidades.
// El caller debe ser admin y la comunidad debe pertenecer a un
// tenant dentro de su scope (SuperAdmin/rowiverse pasa siempre).
// Extraído de [communityId]/members/route.ts para reuso compartido
// (no duplicar). Devuelven un NextResponse de error, o null si OK.
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

/**
 * Autoriza por communityId. Devuelve NextResponse de error o null.
 */
export async function ensureCanAdminCommunity(communityId: string) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const community = await prisma.rowiCommunity.findUnique({
    where: { id: communityId },
    select: { id: true, tenantId: true },
  });
  if (!community) {
    return NextResponse.json({ error: "Comunidad no encontrada" }, { status: 404 });
  }

  const allowedTenantIds = await tenantIdsForScope(auth.scope);
  // null → SuperAdmin/rowiverse, acceso total.
  if (allowedTenantIds !== null) {
    if (!community.tenantId || !allowedTenantIds.includes(community.tenantId)) {
      return NextResponse.json(
        { error: "No autorizado para esta comunidad" },
        { status: 403 }
      );
    }
  }
  return null;
}

/**
 * Autoriza por memberId (RowiCommunityUser.id): resuelve la comunidad
 * del miembro y delega en ensureCanAdminCommunity. Para endpoints que
 * operan sobre un miembro concreto (link, GET/PATCH/DELETE por member id).
 */
export async function ensureCanAdminMember(memberId: string) {
  const member = await prisma.rowiCommunityUser.findUnique({
    where: { id: memberId },
    select: { communityId: true },
  });
  if (!member?.communityId) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }
  return ensureCanAdminCommunity(member.communityId);
}
