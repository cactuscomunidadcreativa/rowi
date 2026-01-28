import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const existing = await prisma.rowiVerse.findFirst();
    if (existing) {
      return NextResponse.json({
        ok: true,
        message: "✅ RowiVerse Global ya existe.",
        rowiVerse: existing,
      });
    }

    // Buscamos el usuario principal (Eduardo)
    const admin = await prisma.user.findFirst({
      where: { email: "eduardo@cactuscomunidadcreativa.com" },
    });

    const verse = await prisma.rowiVerse.create({
      data: {
        name: "RowiVerse Global",
        slug: "rowiverse",
        description:
          "Ecosistema emocional mundial — comunidades, usuarios y afinidades activas.",
        visibility: "public",
        createdById: admin?.id || null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "🌍 RowiVerse Global creado correctamente.",
      rowiVerse: verse,
    });
  } catch (err: any) {
    console.error("❌ Error creando RowiVerse:", err);
    return NextResponse.json({ error: "Error creando RowiVerse" }, { status: 500 });
  }
}