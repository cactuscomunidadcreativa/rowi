// src/app/api/avatar/sync-sei/route.ts
// ============================================================
// POST /api/avatar/sync-sei - Sincronizar nivel Six Seconds desde SEI
// ============================================================

import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { syncSeiLevel, checkAndEvolve, getEvolutionState } from "@/services/avatar-evolution";

export async function POST() {
  try {
    const user = await getServerAuthUser();

    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: "auth.unauthorized" },
        { status: 401 }
      );
    }

    // Sincronizar nivel Six Seconds
    const syncResult = await syncSeiLevel(user.id);

    // Verificar evolucion despues de sincronizar
    const evolveResult = await checkAndEvolve(user.id);

    // Obtener estado actualizado
    const evolutionState = await getEvolutionState(user.id);

    return NextResponse.json({
      ok: true,
      data: {
        seiUpdated: syncResult.updated,
        oldSeiLevel: syncResult.oldLevel,
        newSeiLevel: syncResult.newLevel,
        evolved: evolveResult.evolved,
        currentState: evolutionState,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/avatar/sync-sei error:", error);
    return NextResponse.json(
      { ok: false, error: "server.error" },
      { status: 500 }
    );
  }
}
