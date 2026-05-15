import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { scopeCanSeeUser } from "@/core/admin/scopedList";

export const dynamic = "force-dynamic";

/* =========================================================
   💞 GET — Afinidad emocional y conexiones recientes (scope-aware)
========================================================= */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminWithScope();
    if (auth.error) return auth.error;

    const { id } = await context.params;
    if (!(await scopeCanSeeUser(auth.scope, id))) {
      return NextResponse.json(
        { ok: false, error: "Usuario fuera de tu scope" },
        { status: 403 },
      );
    }

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