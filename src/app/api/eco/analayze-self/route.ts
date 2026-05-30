// src/app/api/eco/analyze-self/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAuth } from "@/core/auth/requireAdmin";

export async function GET() {
  // 🔐 Opera sobre el usuario autenticado, NO sobre un email hardcodeado.
  // Antes servía el EqSnapshot del owner a cualquier usuario logueado.
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { eqSnapshots: { orderBy: { at: "desc" }, take: 1 } },
    });

    if (!user) return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });

    // brainStyle lives on EqSnapshot, not on User directly.
    const eq = user.eqSnapshots?.[0];
    const brainStyle = eq?.brainStyle || "Strategist";
    const tone = brainStyle === "Guardian"
      ? "calmado y estructurado"
      : brainStyle === "Energizer"
      ? "enérgico y entusiasta"
      : "neutral y reflexivo";

    return NextResponse.json({
      ok: true,
      userId: user.id,
      brainStyle,
      tone,
      eq,
      summary: `Tu comunicación natural es ${tone}, con estilo ${brainStyle}.`,
    });
  } catch (e: any) {
    console.error("ECO analyze-self error:", e);
    return NextResponse.json({ ok: false, error: e.message });
  }
}