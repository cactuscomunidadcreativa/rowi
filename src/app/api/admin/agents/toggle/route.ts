import { NextResponse } from "next/server";
import { ensureSystemBootstrap } from "@/core/startup/ensureSystemBootstrap";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

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