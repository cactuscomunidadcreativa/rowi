import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const verse = await prisma.rowiVerse.findFirst({
      include: {
        communities: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!verse)
      return NextResponse.json({
        ok: false,
        message: "No se encontró RowiVerse global.",
      });

    // 🔹 Métricas globales
    const [usersCount, affinitiesCount, avgEQGlobal, avgAffinityGlobal, countries] =
      await Promise.all([
        prisma.user.count({ where: { active: true } }),
        prisma.affinitySnapshot.count(),
        prisma.eqSnapshot.aggregate({
          _avg: { K: true, C: true, G: true },
        }),
        prisma.affinitySnapshot.aggregate({
          _avg: { lastHeat135: true },
        }),
        prisma.user.groupBy({
          by: ["country"],
          where: { country: { not: null }, active: true },
        }),
      ]);

    return NextResponse.json({
      ok: true,
      id: verse.id,
      name: verse.name,
      description: verse.description,
      createdBy: verse.createdById,
      createdAt: verse.createdAt,
      updatedAt: verse.updatedAt,
      communitiesCount: verse.communities.length,
      usersCount,
      countriesCount: countries.length,
      affinitiesCount,
      avgEQGlobal: avgEQGlobal._avg,
      avgAffinityGlobal: avgAffinityGlobal._avg.lastHeat135,
    });
  } catch (err: any) {
    console.error("❌ Error GET /hub/rowiverse:", err);
    return NextResponse.json(
      { error: "Error al obtener RowiVerse global" },
      { status: 500 }
    );
  }
}