import { NextRequest, NextResponse } from "next/server";
import { normalizeProject } from "../utils";
import { to100, clamp, seiLevel135 } from "../utils"; // 🧠 usamos utils del motor central
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/**
 * ⚙️ COMPOSITE AFFINITY
 * ---------------------------------------------------------
 * Calcula la afinidad total del usuario con un miembro
 * integrando los tres submódulos principales:
 * - Growth (competencias)
 * - Collaboration (estilos cerebrales + relacionales)
 * - Understanding (outcomes/subfactores)
 *
 * Este endpoint fusiona los resultados de los submódulos
 * para entregar un "Affinity Global" ponderado.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const project = normalizeProject(url.searchParams.get("project"));
    const memberId = url.searchParams.get("memberId");
    const userId = url.searchParams.get("userId");

    if (!userId || !memberId) {
      return NextResponse.json(
        { ok: false, error: "Parámetros requeridos: userId y memberId" },
        { status: 400 }
      );
    }

    // ===============================================
    // 🔹 Llamadas internas a los submódulos
    // ===============================================
    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    const [growthRes, collabRes, understandRes] = await Promise.all([
      fetch(
        `${baseURL}/api/affinity/growth?userId=${userId}&memberId=${memberId}&project=${project}`,
        { cache: "no-store" }
      ).then((r) => r.json()),
      fetch(
        `${baseURL}/api/affinity/collaboration?userId=${userId}&memberId=${memberId}&project=${project}`,
        { cache: "no-store" }
      ).then((r) => r.json()),
      fetch(
        `${baseURL}/api/affinity/understanding?userId=${userId}&memberId=${memberId}&project=${project}`,
        { cache: "no-store" }
      ).then((r) => r.json()),
    ]);

    // ===============================================
    // 📊 Composición ponderada de afinidades
    // ===============================================
    const W = { growth: 0.35, collab: 0.35, understand: 0.30 };

    const growthScore = growthRes.score ?? 0;
    const collabScore = collabRes.score ?? 0;
    const understandScore = understandRes.score ?? 0;

    // 🔧 Calibración global (reduce dispersión)
    const composite135 = clamp(
      (W.growth * growthScore +
        W.collab * collabScore +
        W.understand * understandScore) * 0.95,
      0,
      135
    );

    const heat = to100(composite135);
    const level = seiLevel135(composite135);

    // ===============================================
    // 💾 Persistencia del snapshot
    // ===============================================
    await prisma.affinitySnapshot.upsert({
      where: {
        userId_memberId_context: {
          userId,
          memberId,
          context: `composite:${project}`,
        },
      },
      update: {
        lastHeat135: Math.round(composite135),
      },
      create: {
        userId,
        memberId,
        context: `composite:${project}`,
        lastHeat135: Math.round(composite135),
      },
    });

    // ===============================================
    // 📦 Respuesta final
    // ===============================================
    return NextResponse.json({
      ok: true,
      project,
      userId,
      memberId,
      heat,
      level,
      weights: W,
      submodules: {
        growth: growthScore,
        collaboration: collabScore,
        understanding: understandScore,
      },
      composite135: Math.round(composite135),
      message: "✅ Afinidad global calculada correctamente.",
    });
  } catch (e: any) {
    console.error("❌ Composite error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}