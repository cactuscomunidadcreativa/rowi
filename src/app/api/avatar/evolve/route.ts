// src/app/api/avatar/evolve/route.ts
// ============================================================
// POST /api/avatar/evolve - Verificar y aplicar evolucion
// ============================================================

import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { checkAndEvolve, getEvolutionState } from "@/services/avatar-evolution";

export async function POST() {
  try {
    const user = await getServerAuthUser();

    if (!user?.id) {
      return NextResponse.json(
        { ok: false, error: "auth.unauthorized" },
        { status: 401 }
      );
    }

    // Verificar y aplicar evolucion
    const result = await checkAndEvolve(user.id);

    // Obtener estado actualizado
    const evolutionState = await getEvolutionState(user.id);

    return NextResponse.json({
      ok: true,
      data: {
        evolved: result.evolved,
        hatched: result.hatched,
        previousStage: result.previousStage,
        newStage: result.newStage,
        evolutionScore: result.evolutionScore,
        currentState: evolutionState,
      },
    });
  } catch (error) {
    console.error("[API] POST /api/avatar/evolve error:", error);
    return NextResponse.json(
      { ok: false, error: "server.error" },
      { status: 500 }
    );
  }
}
