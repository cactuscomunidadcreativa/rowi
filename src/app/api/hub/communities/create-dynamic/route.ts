// src/app/api/hub/communities/create-dynamic/route.ts
import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, context, payload } = await req.json();

    // Determinar tipo de comunidad
    let type = "interest";
    if (context === "registration") type = "private";
    if (context === "purchase") type = "work";
    if (context === "event") type = "interest";

    const name = payload?.name || `Comunidad ${context}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Buscar o crear
    let community = await prisma.rowiCommunity.findUnique({ where: { slug } });
    if (!community) {
      community = await prisma.rowiCommunity.create({
        data: {
          name,
          slug,
          type,
          visibility: payload?.visibility || "private",
          description: payload?.description || null,
          rowiVerseId: payload?.rowiVerseId,
          createdById: userId,
        },
      });
    }

    // Vincular usuario como miembro
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