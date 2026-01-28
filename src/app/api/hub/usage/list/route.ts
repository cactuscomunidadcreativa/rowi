import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* =========================================================
   📊 GET – Lista todo el uso IA (últimos 30 días)
========================================================= */
export async function GET() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const rows = await prisma.usageDaily.findMany({
      where: { day: { gte: cutoff } },
      include: { tenant: true },
      orderBy: [{ day: "desc" }],
    });

    return NextResponse.json(rows);
  } catch (e: any) {
    console.error("❌ Error en /api/hub/usage/list:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}