import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const dynamic = "force-dynamic";

/* =========================================================
   💞 GET — Afinidad emocional y conexiones recientes
========================================================= */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const snapshots = await prisma.affinitySnapshot.findMany({
      where: { userId: id },
      include: {
        member: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ ok: true, snapshots });
  } catch (e: any) {
    console.error("❌ Error GET /affinity:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error cargando afinidad" },
      { status: 500 }
    );
  }
}