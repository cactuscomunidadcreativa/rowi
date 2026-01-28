import { NextResponse } from "next/server";
import { ensureSystemBootstrap } from "@/core/startup/ensureSystemBootstrap";

export async function POST() {
  try {
    console.log("🚀 Ejecutando inicialización completa del ecosistema...");
    await ensureSystemBootstrap();

    return NextResponse.json({
      ok: true,
      message: "🌍 Ecosistema Rowi/Cactus inicializado correctamente.",
    });
  } catch (err: any) {
    console.error("❌ Error en /api/admin/init:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}