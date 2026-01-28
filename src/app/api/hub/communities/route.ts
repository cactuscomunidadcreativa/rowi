// src/app/api/hub/communities/route.ts
import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/* =========================================================
   🔹 GET — Listar comunidades (RowiCommunity)
========================================================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rowiVerseId = searchParams.get("rowiVerseId") || undefined;

    const communities = await prisma.rowiCommunity.findMany({
      where: { rowiVerseId },
      include: {
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(communities ?? []);
  } catch (err: any) {
    console.error("❌ Error GET /hub/communities:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* =========================================================
   🔹 POST — Crear comunidad con JERARQUÍA COMPLETA
      rowiVerseId, superHubId, hubId, tenantId, orgId
      + crear RowiCommunityUser
      + crear RowiVerseUser si falta
========================================================= */
export async function POST(req: Request) {
  try {
    const token = await getToken({ req });
    if (!token?.email)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const auth = await getServerAuthUser();
    if (!auth?.id)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { name, description, visibility, category } = body;

    if (!name)
      return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });

    // Obtener usuario completo
    const user = await prisma.user.findUnique({
      where: { email: token.email.toLowerCase() },
      include: {
        orgMemberships: true,
        hubMemberships: {
          include: {
            hub: true,
          },
        },
      },
    });

    if (!user)
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    /* ---------------------------------------------------------
       🔹 JERARQUÍA AUTOMÁTICA
    --------------------------------------------------------- */

    // 1️⃣ Hub principal del usuario
    const hubMembership = user.hubMemberships?.[0] || null;
    const hubId = hubMembership?.hubId || null;

    // 2️⃣ SuperHub desde el Hub
    let superHubId = null;
    if (hubId) {
      const hub = await prisma.hub.findUnique({
        where: { id: hubId },
        select: { superHubId: true },
      });
      superHubId = hub?.superHubId || null;
    }

    // 3️⃣ Tenant del usuario
    const tenantId = user.primaryTenantId || null;

    // 4️⃣ Organización (si aplica)
    const organizationId = user.orgMemberships?.[0]?.organizationId || null;

    // 5️⃣ RowiVerse raíz
    const rowiVerseId = "rowiverse_root";

    /* ---------------------------------------------------------
       🔹 Crear comunidad con toda la jerarquía
    --------------------------------------------------------- */
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const community = await prisma.rowiCommunity.create({
      data: {
        name,
        slug,
        description,
        visibility: visibility || "public",
        category: category || "general",
        createdById: user.id,

        // 🔥 Enlaces jerárquicos
        rowiVerseId,
        hubId,
        superHubId,
        tenantId,
        organizationId,
      },
    });

    /* ---------------------------------------------------------
       🔹 Crear RowiVerseUser si NO existe
    --------------------------------------------------------- */
    let rv = await prisma.rowiVerseUser.findUnique({
      where: { userId: user.id },
    });

    if (!rv) {
      rv = await prisma.rowiVerseUser.create({
        data: {
          userId: user.id,
          rowiVerseId,
          email: user.email,
          name: user.name,
          language: user.language || "es",
          active: true,
        },
      });
    }

    /* ---------------------------------------------------------
       🔹 Crear vínculo usuario ↔ comunidad
    --------------------------------------------------------- */
    await prisma.rowiCommunityUser.create({
      data: {
        userId: user.id,
        rowiverseUserId: rv.id,
        communityId: community.id,
        role: "owner",
        status: "active",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Comunidad creada correctamente",
      community,
    });
  } catch (err: any) {
    console.error("❌ Error POST /hub/communities:", err);
    return NextResponse.json(
      { error: "Error al crear comunidad" },
      { status: 500 }
    );
  }
}