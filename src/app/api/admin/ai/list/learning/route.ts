import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * 🧠 PATCH — Activa o desactiva el aprendizaje automático (autoLearn)
 * body: { id: string, autoLearn: boolean }
 */
export async function PATCH(req: Request) {
  try {
    const { id, autoLearn } = await req.json();

    if (!id || typeof autoLearn !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "Campos requeridos: id y autoLearn (boolean)" },
        { status: 400 }
      );
    }

    const updated = await prisma.agentConfig.update({
      where: { id },
      data: { autoLearn },
    });

    return NextResponse.json({
      ok: true,
      message: `✅ Agente ${updated.name} ${autoLearn ? "activado" : "desactivado"} para aprendizaje.`,
      agent: updated,
    });
  } catch (e: any) {
    console.error("❌ Error PATCH /admin/ai/learning:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error al actualizar aprendizaje" },
      { status: 500 }
    );
  }
}