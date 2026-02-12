import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🧠 GET — Listar solo agentes base (globales del sistema)
   ---------------------------------------------------------
   - Devuelve únicamente los agentes sin Tenant, SuperHub ni Organización.
   - Ideal para el panel de administración central.
========================================================= */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const agents = await prisma.agentConfig.findMany({
      where: {
        tenantId: null,
        superHubId: null,
        organizationId: null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        model: true,
        type: true,
        prompt: true,
        tone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ slug: "asc" }],
    });

    const formatted = agents.map((a) => ({
      ...a,
      scope: "🌍 Global (Sistema Base)",
      promptPreview:
        a.prompt && a.prompt.trim().length > 0
          ? a.prompt.length > 200
            ? a.prompt.slice(0, 200) + "..."
            : a.prompt
          : "— (sin prompt definido o aún no sincronizado)",
    }));

    return NextResponse.json({
      ok: true,
      total: formatted.length,
      agents: formatted,
    });
  } catch (error: any) {
    console.error("❌ Error GET /api/admin/agents/global:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener agentes globales" },
      { status: 500 }
    );
  }
}