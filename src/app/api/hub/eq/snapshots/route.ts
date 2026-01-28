import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * =========================================================
 * 🔹 GET — Listar snapshots SEI (por memberId o userId)
 * ---------------------------------------------------------
 * /api/hub/eq/snapshots?memberId=xxx
 * /api/hub/eq/snapshots?userId=yyy
 * =========================================================
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const userIdParam = searchParams.get("userId");

    if (!memberId && !userIdParam) {
      return NextResponse.json(
        { error: "Debe especificar memberId o userId" },
        { status: 400 }
      );
    }

    // 🧩 Si tenemos un memberId, buscamos el userId asociado
    let userId: string | undefined = userIdParam || undefined;
    if (memberId) {
      const member = await prisma.rowiCommunityUser.findUnique({
        where: { id: memberId },
        select: { userId: true },
      });
      if (member?.userId) userId = member.userId;
    }

    const snapshots = await prisma.eqSnapshot.findMany({
      where: {
        OR: [
          memberId ? { memberId } : undefined,
          userId ? { userId } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { at: "asc" },
      include: {
        competencies: { select: { key: true, label: true, score: true } },
        subfactors: { select: { key: true, label: true, score: true } },
        outcomes: { select: { key: true, label: true, score: true } },
        success: { select: { key: true, label: true, score: true } },
        talents: { select: { key: true, label: true, score: true } },
        moods: { select: { mood: true, intensity: true, valence: true } },
      },
    });

    return NextResponse.json(snapshots);
  } catch (err: any) {
    console.error("❌ Error GET /hub/eq/snapshots:", err);
    return NextResponse.json(
      { error: "Error al obtener snapshots" },
      { status: 500 }
    );
  }
}