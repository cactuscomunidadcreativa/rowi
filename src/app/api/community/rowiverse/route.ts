// src/app/api/community/rowiverse/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/* =========================================================
   🌍 Rowiverse Search - Buscar perfiles públicos
   ---------------------------------------------------------
   GET → Buscar usuarios con perfil público en el Rowiverse
========================================================= */

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, primaryTenantId: true },
    });
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const country = searchParams.get("country");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Construir filtros
    const where: any = {
      // Perfil público: contributeToRowiverse = true
      contributeToRowiverse: true,
      // No incluir al usuario actual
      id: { not: currentUser.id },
      // Activo
      active: true,
    };

    // Búsqueda por texto
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { headline: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    // Filtro por país
    if (country) {
      where.country = country;
    }

    // Buscar usuarios con perfil público
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          headline: true,
          bio: true,
          image: true,
          country: true,
          city: true,
          language: true,
          createdAt: true,
          // EQ Snapshots para mostrar nivel — EqSnapshot uses `at`
          // for the timestamp and `overall4` as the headline score.
          eqSnapshots: {
            orderBy: { at: "desc" },
            take: 1,
            select: {
              overall4: true,
              // K/C/G are the three pursuit axes; consumer below
              // synthesizes pursuitAverages from them.
              K: true,
              C: true,
              G: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Formatear respuesta
    const profiles = users.map((u) => {
      const latestEQ = u.eqSnapshots?.[0];
      // Synthesize pursuitAverages from K/C/G — the legacy `pursuitAverages`
      // JSON column was removed; downstream code still expects this shape.
      const pursuits = latestEQ
        ? { K: latestEQ.K ?? 0, C: latestEQ.C ?? 0, G: latestEQ.G ?? 0 }
        : null;

      return {
        id: u.id,
        name: u.name || "Usuario Rowi",
        headline: u.headline || null,
        bio: u.bio ? (u.bio.length > 150 ? u.bio.slice(0, 150) + "..." : u.bio) : null,
        image: u.image || null,
        country: u.country || null,
        city: u.city || null,
        language: u.language || "es",
        // EqSnapshot.overall4 is the headline score (legacy "eqTotal").
        eqLevel: latestEQ?.overall4
          ? latestEQ.overall4 >= 118
            ? "Expert"
            : latestEQ.overall4 >= 108
            ? "Skilled"
            : latestEQ.overall4 >= 92
            ? "Functional"
            : latestEQ.overall4 >= 82
            ? "Emerging"
            : "Challenge"
          : null,
        // pursuits is the synthesized {K, C, G} object; map to legacy
        // knowYourself / chooseYourself / giveYourself names the UI
        // expects.
        pursuits: pursuits
          ? {
              knowYourself: pursuits.K || null,
              chooseYourself: pursuits.C || null,
              giveYourself: pursuits.G || null,
            }
          : null,
        memberSince: u.createdAt?.toISOString(),
      };
    });

    // Obtener lista de países para filtros
    const countries = await prisma.user.groupBy({
      by: ["country"],
      where: { contributeToRowiverse: true, active: true, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 30,
    });

    return NextResponse.json({
      ok: true,
      profiles,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
      filters: {
        countries: countries
          .filter((c) => c.country)
          .map((c) => ({
            code: c.country,
            count: c._count.country,
          })),
      },
    });
  } catch (e: any) {
    console.error("❌ GET /api/community/rowiverse error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

/* =========================================================
   POST → Conectar con un usuario del Rowiverse
   ---------------------------------------------------------
   Agrega un usuario público como miembro de tu comunidad
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, primaryTenantId: true, name: true },
    });
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const targetUserId = body.userId as string;

    if (!targetUserId) {
      return NextResponse.json({ ok: false, error: "userId required" }, { status: 400 });
    }

    // Verificar que el usuario objetivo existe y tiene perfil público
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        country: true,
        contributeToRowiverse: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (!targetUser.contributeToRowiverse) {
      return NextResponse.json(
        { ok: false, error: "Este usuario no tiene perfil público" },
        { status: 403 }
      );
    }

    // Verificar si ya existe como miembro de la comunidad
    const existingMember = await prisma.communityMember.findFirst({
      where: {
        ownerId: currentUser.id,
        OR: [
          { userId: targetUserId },
          { email: targetUser.email },
        ],
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { ok: false, error: "Este usuario ya está en tu comunidad", memberId: existingMember.id },
        { status: 409 }
      );
    }

    // Crear el miembro de comunidad vinculado al usuario del Rowiverse
    const newMember = await prisma.communityMember.create({
      data: {
        ownerId: currentUser.id,
        tenantId: currentUser.primaryTenantId!,
        userId: targetUserId,
        name: targetUser.name || "Usuario Rowi",
        email: targetUser.email,
        country: targetUser.country,
        group: "Rowiverse",
        closeness: "Neutral",
        source: "rowiverse",
        status: "ACTIVE",
      },
    });

    // Registrar en ActivityLog
    try {
      await prisma.activityLog.create({
        data: {
          userId: currentUser.id,
          action: "ROWIVERSE_CONNECT",
          entity: "CommunityMember",
          targetId: newMember.id,
          details: {
            targetUserId,
            targetName: targetUser.name,
            method: "rowiverse_search",
          },
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Error logging rowiverse connect:", logErr);
    }

    return NextResponse.json({
      ok: true,
      member: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        country: newMember.country,
        group: newMember.group,
        source: newMember.source,
      },
    });
  } catch (e: any) {
    console.error("❌ POST /api/community/rowiverse error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
