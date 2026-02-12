// src/app/api/admin/prompts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * 🧠 GET — Listar todos los prompts IA registrados
 * Devuelve siempre JSON, incluso si no hay agentes.
 */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const agents = await prisma.agentConfig.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        model: true,
        type: true,
        prompt: true,
        tenant: { select: { id: true, name: true, slug: true } },
        superHub: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ slug: "asc" }, { createdAt: "asc" }],
    });

    // ✅ Devuelve siempre JSON válido, aunque no haya nada
    return NextResponse.json({
      ok: true,
      total: agents.length,
      agents,
    });
  } catch (error: any) {
    console.error("❌ Error GET /admin/prompts:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Error al obtener los prompts IA",
        agents: [],
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 HEAD — para testear si la ruta responde
 * (útil cuando Next.js mantiene un cache roto)
 */
export async function HEAD() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  return new Response("ok", { status: 200 });
}