// src/app/api/eco/analyze-self/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "eduardo@cactuscomunidadcreativa.com" },
      include: { eqSnapshots: { orderBy: { at: "desc" }, take: 1 } },
    });

    if (!user) return NextResponse.json({ ok: false, error: "Usuario no encontrado" });

    const brainStyle = user.brainStyle || "Strategist";
    const eq = user.eqSnapshots?.[0];
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