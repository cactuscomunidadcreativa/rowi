// src/app/api/community/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/* =========================================================
   GET → Listar miembros (ownerId o userId)
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({
      where: { email },
      select: { id: true, primaryTenantId: true },
    });
    if (!owner) return NextResponse.json({ ok: true, members: [] });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;

    // Build OR conditions for member lookup
    const ownerConditions: any[] = [
      { ownerId: owner.id }, // 👈 miembros que tú creaste
      { userId: owner.id },  // 👈 por compatibilidad con versiones previas
    ];

    // Si el usuario tiene tenant, también mostrar miembros del tenant
    if (owner.primaryTenantId) {
      ownerConditions.push({ tenantId: owner.primaryTenantId });
    }

    const where = {
      AND: [
        { OR: ownerConditions },
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { email: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {},
      ],
    };

    const membersDB = await prisma.communityMember.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 500,
      include: {
        affinitySnapshots: {
          where: { userId: owner.id },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            lastHeat135: true,
            aiSummary: true,
            context: true,
            updatedAt: true,
          },
        },
        // Include linked user's eqSnapshots for tenant_link members
        user: {
          select: {
            id: true,
            eqSnapshots: {
              orderBy: { at: "desc" },
              take: 1,
              select: {
                brainStyle: true,
                K: true,
                C: true,
                G: true,
              },
            },
          },
        },
      },
    });

    const members = membersDB.map((m) => {
      const affinity = m.affinitySnapshots?.[0];
      let heat = affinity?.lastHeat135 ?? null;

      // For tenant_link members without affinitySnapshots, use linked user's eqSnapshots
      if (heat === null && m.userId && (m as any).user?.eqSnapshots?.[0]) {
        const snap = (m as any).user.eqSnapshots[0];
        heat = snap ? Math.round(((snap.K || 0) + (snap.C || 0) + (snap.G || 0)) / 3) : null;
      }

      let level = null;
      if (typeof heat === "number") {
        if (heat >= 118) level = "Experto";
        else if (heat >= 108) level = "Diestro";
        else if (heat >= 92) level = "Funcional";
        else if (heat >= 82) level = "Emergente";
        else level = "Desafío";
      }

      // Get brainStyle from member or linked user
      const brainStyle = m.brainStyle || (m as any).user?.eqSnapshots?.[0]?.brainStyle;

      return {
        id: m.id,
        name: m.name,
        email: m.email || undefined,
        country: m.country || undefined,
        brainStyle: brainStyle || undefined,
        group: m.group || "Trabajo",
        closeness: m.closeness || "Neutral",
        connectionType: m.connectionType || undefined,
        tenantId: m.tenantId,
        ownerId: m.ownerId,
        affinityHeat135: heat,
        affinityPercent:
          typeof heat === "number"
            ? Math.round((heat / 135) * 100)
            : null,
        affinityLevel: level,
        aiSummary: affinity?.aiSummary ?? null,
        updatedAt: m.updatedAt,
        source: "community_member",
      };
    });

    // 🆕 También incluir Users del mismo tenant como "compañeros de equipo"
    let teammates: any[] = [];
    if (owner.primaryTenantId) {
      const tenantUsers = await prisma.user.findMany({
        where: {
          primaryTenantId: owner.primaryTenantId,
          id: { not: owner.id }, // Excluir al usuario actual
          active: true,
        },
        include: {
          eqSnapshots: {
            orderBy: { at: "desc" },
            take: 1,
            select: {
              brainStyle: true,
              K: true,
              C: true,
              G: true,
            },
          },
        },
        take: 200,
      });

      // Filtrar usuarios que ya están en members (por email o userId)
      const existingEmails = new Set(members.map((m) => m.email?.toLowerCase()).filter(Boolean));
      const existingUserIds = new Set(membersDB.filter((m) => m.userId).map((m) => m.userId));

      teammates = tenantUsers
        .filter((u) => !existingEmails.has(u.email?.toLowerCase()) && !existingUserIds.has(u.id))
        .map((u) => {
          const snap = u.eqSnapshots?.[0];
          const avgScore = snap ? Math.round(((snap.K || 0) + (snap.C || 0) + (snap.G || 0)) / 3) : null;

          return {
            id: `user_${u.id}`,
            name: u.name || u.email?.split("@")[0] || "Unknown",
            email: u.email || undefined,
            country: u.country || undefined,
            brainStyle: snap?.brainStyle || undefined,
            group: "Trabajo", // Compañeros de trabajo
            closeness: "Neutral",
            connectionType: "teammate",
            tenantId: owner.primaryTenantId,
            ownerId: null,
            affinityHeat135: avgScore,
            affinityPercent: avgScore ? Math.round((avgScore / 135) * 100) : null,
            affinityLevel: null,
            aiSummary: null,
            updatedAt: u.updatedAt,
            source: "tenant_user",
          };
        });
    }

    const allMembers = [...members, ...teammates];

    return NextResponse.json({
      ok: true,
      total: allMembers.length,
      members: allMembers,
    });
  } catch (e: any) {
    console.error("❌ GET /community/members error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al listar miembros" },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST → Crear nuevo miembro manual
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({
      where: { email },
      select: { id: true, primaryTenantId: true },
    });
    if (!owner)
      return NextResponse.json({ ok: false, error: "Owner not found" }, { status: 404 });

    const data = await req.json();
    if (!data.name?.trim())
      return NextResponse.json({ ok: false, error: "Nombre requerido" }, { status: 400 });

    const newMember = await prisma.communityMember.create({
      data: {
        ownerId: owner.id,
        tenantId: owner.primaryTenantId, // ✅ siempre vinculado al tenant
        name: data.name.trim(),
        email: data.email || null,
        country: data.country || null,
        brainStyle: data.brainStyle || null,
        group: data.group || "Trabajo",
        closeness: data.closeness || "Neutral",
        connectionType: data.connectionType || null,
        source: "manual",
        status: "ACTIVE",
      },
    });

    // 🔁 Lanza cálculo de afinidad (sin bloquear)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      fetch(`${baseUrl}/api/affinity?memberId=${newMember.id}`, {
        method: "GET",
        headers: { "x-trigger": "auto" },
      });
    } catch (err: any) {
      console.warn("⚠️ Auto affinity trigger failed:", err);
    }

    return NextResponse.json({ ok: true, member: newMember });
  } catch (e: any) {
    console.error("❌ POST /community/members error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error creando miembro" },
      { status: 500 }
    );
  }
}