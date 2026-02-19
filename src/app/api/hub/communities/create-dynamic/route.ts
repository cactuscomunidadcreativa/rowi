// src/app/api/hub/communities/create-dynamic/route.ts
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // Autenticación requerida
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { context, payload } = await req.json();

    // Usar el userId del token, no del body (previene suplantación)
    const userId = token.sub;

    // Determinar tipo de comunidad
    let type = "interest";
    if (context === "registration") type = "private";
    if (context === "purchase") type = "work";
    if (context === "event") type = "interest";

    const name = payload?.name || `Comunidad ${context}`;
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Buscar o crear con slug deduplicado
    let community = await prisma.rowiCommunity.findUnique({ where: { slug: baseSlug } });
    if (!community) {
      let slug = baseSlug;
      let counter = 1;
      let exists = await prisma.rowiCommunity.findUnique({ where: { slug } });
      while (exists) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        exists = await prisma.rowiCommunity.findUnique({ where: { slug } });
      }

      community = await prisma.rowiCommunity.create({
        data: {
          name,
          slug,
          type,
          visibility: payload?.visibility || "private",
          description: payload?.description || null,
          rowiVerseId: payload?.rowiVerseId || "rowiverse_root",
          createdById: userId,
        },
      });
    }

    // Vincular usuario como miembro + crear RowiVerseUser si falta
    let rv = await prisma.rowiVerseUser.findUnique({ where: { userId } });
    if (!rv) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        rv = await prisma.rowiVerseUser.create({
          data: {
            userId,
            rowiVerseId: "rowiverse_root",
            email: user.email,
            name: user.name,
            active: true,
          },
        });
      }
    }

    await prisma.rowiCommunityUser.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId: community.id,
        },
      },
      update: {},
      create: {
        userId,
        communityId: community.id,
        rowiverseUserId: rv?.id || null,
        role: context === "registration" ? "owner" : "member",
        status: "active",
      },
    });

    return NextResponse.json({ ok: true, community });
  } catch (err: any) {
    console.error("❌ Error create-dynamic:", err);
    return NextResponse.json({ error: "Error al crear comunidad" }, { status: 500 });
  }
}
