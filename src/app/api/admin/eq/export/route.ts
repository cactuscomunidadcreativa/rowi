/**
 * =========================================================
 * 🧠 API: EQ Export — Exportar snapshots de EQ
 * =========================================================
 * GET /api/admin/eq/export
 *
 * Devuelve todos los snapshots para exportación
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

/**
 * Verifica si el usuario es administrador del sistema
 */
async function isSystemAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function GET(req: NextRequest) {
  try {
    // 🔐 Verificar autenticación y permisos
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    if (!(await isSystemAdmin(session.user.email))) {
      return NextResponse.json({ ok: false, error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const hubId = searchParams.get("hubId");
    const period = searchParams.get("period");
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Construir filtro de fecha
    let dateFilter = {};
    if (period) {
      const now = new Date();
      switch (period) {
        case "month":
          now.setMonth(now.getMonth() - 1);
          dateFilter = { at: { gte: now } };
          break;
        case "quarter":
          now.setMonth(now.getMonth() - 3);
          dateFilter = { at: { gte: now } };
          break;
        case "year":
          now.setFullYear(now.getFullYear() - 1);
          dateFilter = { at: { gte: now } };
          break;
      }
    }

    // Obtener snapshots
    const snapshots = await prisma.eqSnapshot.findMany({
      where: {
        ...dateFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        competencies: {
          select: {
            key: true,
            score: true,
          },
        },
      },
      orderBy: { at: "desc" },
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      snapshots,
      total: snapshots.length,
    });
  } catch (err: any) {
    console.error("❌ Error en GET /api/admin/eq/export:", err);
    return NextResponse.json(
      { ok: false, error: "Error al exportar: " + err.message },
      { status: 500 }
    );
  }
}
