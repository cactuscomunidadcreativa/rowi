// src/app/api/hub/communities/route.ts
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerAuthUser } from "@/core/auth";
import { propagateMemberToParents } from "@/lib/communities/propagate-member";

export const runtime = "nodejs";

/* =========================================================
   🔹 GET — Listar comunidades (RowiCommunity)
   Incluye jerarquía padre/hijos
========================================================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rowiVerseId = searchParams.get("rowiVerseId") || undefined;

    const communities = await prisma.rowiCommunity.findMany({
      where: rowiVerseId ? { rowiVerseId } : {},
      include: {
        _count: { select: { members: true, posts: true, subCommunities: true } },
        hub: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
        superHub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, unitType: true } },
        superCommunity: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(communities ?? [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
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
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const auth = await getServerAuthUser();
    if (!auth?.id)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      name,
      slug: customSlug,
      description,
      visibility,
      category,
      teamType,
      bannerUrl,
      // Jerarquía padre/hijo
      superId: explicitSuperId,
      // Jerarquía explícita (override)
      hubId: explicitHubId,
      tenantId: explicitTenantId,
      superHubId: explicitSuperHubId,
      organizationId: explicitOrganizationId,
    } = body;

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
       🔹 JERARQUÍA (explícita o automática)
    --------------------------------------------------------- */

    // 1️⃣ Hub (explícito o del usuario)
    const hubMembership = user.hubMemberships?.[0] || null;
    const hubId = explicitHubId || hubMembership?.hubId || null;

    // 2️⃣ SuperHub (explícito o desde el Hub)
    let superHubId = explicitSuperHubId || null;
    if (!superHubId && hubId) {
      const hub = await prisma.hub.findUnique({
        where: { id: hubId },
        select: { superHubId: true },
      });
      superHubId = hub?.superHubId || null;
    }

    // 3️⃣ Tenant (explícito o del usuario)
    const tenantId = explicitTenantId || user.primaryTenantId || null;

    // 4️⃣ Organización (explícita o del usuario)
    const organizationId = explicitOrganizationId || user.orgMemberships?.[0]?.organizationId || null;

    // 5️⃣ RowiVerse raíz — buscar dinámicamente en vez de hardcodear
    const rowiverse = await prisma.rowiVerse.findFirst({
      where: { slug: "rowiverse" },
      select: { id: true },
    });
    const rowiVerseId = rowiverse?.id || "rowiverse_root";

    /* ---------------------------------------------------------
       🔹 Crear comunidad con toda la jerarquía
    --------------------------------------------------------- */
    // Generar slug con deduplicación automática
    let baseSlug = customSlug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.rowiCommunity.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 100) {
        return NextResponse.json(
          { error: "No se pudo generar un slug único" },
          { status: 409 }
        );
      }
    }

    const community = await prisma.rowiCommunity.create({
      data: {
        name,
        slug,
        description,
        visibility: visibility || "public",
        category: category || "general",
        teamType: teamType || null,
        bannerUrl: bannerUrl || null,
        createdById: user.id,

        // 🔥 Jerarquía padre/hijo
        superId: explicitSuperId || null,

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

    /* ---------------------------------------------------------
       🔹 Propagar a comunidades padre (herencia automática)
    --------------------------------------------------------- */
    await propagateMemberToParents({
      communityId: community.id,
      userId: user.id,
      rowiverseUserId: rv.id,
      email: user.email,
      name: user.name,
      language: user.language || "es",
    });

    return NextResponse.json({
      ok: true,
      message: "Comunidad creada correctamente",
      community,
    });
  } catch (err: any) {
    const message = err?.message || "Error al crear comunidad";
    console.error("❌ Error POST /hub/communities:", message, err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}