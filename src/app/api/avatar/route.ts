// src/app/api/avatar/route.ts
// ============================================================
// GET /api/avatar - Obtener estado del avatar del usuario
// ============================================================

import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { getEvolutionState, createInitialAvatar } from "@/services/avatar-evolution";

export async function GET() {
  try {
    const user = await getServerAuthUser();

    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: "auth.unauthorized" },
        { status: 401 }
      );
    }

    // Crear avatar si no existe
    await createInitialAvatar(user.id);

    // Obtener estado de evolucion
    const evolutionState = await getEvolutionState(user.id);

    if (!evolutionState) {
      return NextResponse.json(
        { ok: false, error: "avatar.not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: evolutionState,
    });
  } catch (error) {
    console.error("[API] GET /api/avatar error:", error);
    return NextResponse.json(
      { ok: false, error: "server.error" },
      { status: 500 }
    );
  }
}
