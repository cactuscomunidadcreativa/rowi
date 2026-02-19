import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    // Autenticación requerida
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Migrado de auditLog → activityLog (modelo unificado)
    const rows = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("❌ Error GET /hub/logs/interactions:", error);
    return NextResponse.json(
      { error: "Error al obtener logs de interacciones" },
      { status: 500 }
    );
  }
}
