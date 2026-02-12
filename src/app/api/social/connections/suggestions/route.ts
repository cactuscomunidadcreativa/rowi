// src/app/api/social/connections/suggestions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   💡 Sugerencias de Conexiones

   GET — Usuarios sugeridos para conectar
   Criterios: misma comunidad, mismo tenant, afinidad alta
========================================================= */

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        primaryTenantId: true,
      },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Obtener IDs de usuarios con los que ya tiene relación (cualquier status)
    const existingRelations = await prisma.rowiRelation.findMany({
      where: {
        OR: [{ initiatorId: user.id }, { receiverId: user.id }],
      },
      select: { initiatorId: true, receiverId: true },
    });

    const excludeIds = new Set<string>([user.id]);
    existingRelations.forEach((r) => {
      excludeIds.add(r.initiatorId);
      excludeIds.add(r.receiverId);
    });

    // Obtener comunidades del usuario
    const userCommunities = await prisma.rowiCommunityUser.findMany({
      where: { userId: user.id },
      select: { communityId: true },
    });
    const communityIds = userCommunities.map((c) => c.communityId);

    // Buscar usuarios sugeridos por comunidad compartida
    const communityMembers = communityIds.length > 0
      ? await prisma.rowiCommunityUser.findMany({
          where: {
            communityId: { in: communityIds },
            userId: { notIn: [...excludeIds] },
            NOT: { userId: null },
          },
          select: {
            userId: true,
            communityId: true,
            affinityLevel: true,
          },
          distinct: ["userId"],
        })
      : [];

    // Buscar usuarios del mismo tenant
    const tenantUsers = user.primaryTenantId
      ? await prisma.user.findMany({
          where: {
            primaryTenantId: user.primaryTenantId,
            id: { notIn: [...excludeIds] },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            headline: true,
            bio: true,
          },
          take: limit * 2,
        })
      : [];

    // Obtener afinidad para los usuarios de comunidades
    const communityUserIds = communityMembers
      .filter((m) => m.userId)
      .map((m) => m.userId!);

    const communityUserDetails = communityUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: communityUserIds } },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            headline: true,
            bio: true,
          },
        })
      : [];

    // Obtener snapshots de afinidad si existen
    const affinitySnapshots = communityUserIds.length > 0
      ? await prisma.affinitySnapshot.findMany({
          where: {
            userId: user.id,
            memberId: { in: communityUserIds },
          },
          select: { memberId: true, lastHeat135: true },
        })
      : [];

    const affinityMap = new Map<string, number>();
    affinitySnapshots.forEach((s) => {
      affinityMap.set(s.memberId, s.lastHeat135 || 0);
    });
    communityMembers.forEach((m) => {
      if (m.userId && m.affinityLevel && !affinityMap.has(m.userId)) {
        affinityMap.set(m.userId, m.affinityLevel);
      }
    });

    // Combinar y deduplicar sugerencias
    const suggestedMap = new Map<string, any>();

    // Primero agregar miembros de comunidad (mayor prioridad)
    communityUserDetails.forEach((u) => {
      suggestedMap.set(u.id, {
        user: u,
        reason: "community",
        affinity: affinityMap.get(u.id) || 0,
        sharedCommunities: communityMembers.filter((m) => m.userId === u.id).length,
      });
    });

    // Luego agregar del mismo tenant
    tenantUsers.forEach((u) => {
      if (!suggestedMap.has(u.id)) {
        suggestedMap.set(u.id, {
          user: u,
          reason: "tenant",
          affinity: affinityMap.get(u.id) || 0,
          sharedCommunities: 0,
        });
      }
    });

    // Ordenar por afinidad descendente, luego por comunidades compartidas
    const suggestions = [...suggestedMap.values()]
      .sort((a, b) => {
        if (b.affinity !== a.affinity) return b.affinity - a.affinity;
        return b.sharedCommunities - a.sharedCommunities;
      })
      .slice(0, limit);

    return NextResponse.json({
      ok: true,
      total: suggestions.length,
      suggestions,
    });
  } catch (e: any) {
    console.error("❌ GET /social/connections/suggestions error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener sugerencias" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
