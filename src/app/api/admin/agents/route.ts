import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🧠 GET — Listar solo agentes base (globales del sistema)
   ---------------------------------------------------------
   🔐 SEGURIDAD: Requiere permisos de admin
   Útil para panel principal de configuración base.
========================================================= */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;
    const agents = await prisma.agentConfig.findMany({
      // Solo el agente BASE global = el que no está atado a ninguna entidad
      // (todos los *Id null). NO filtrar por accessLevel: las copias clonadas a
      // cada entidad heredan accessLevel "global" del base y aparecerían como
      // tarjetas duplicadas (p.ej. research × N entidades).
      where: {
        tenantId: null,
        superHubId: null,
        organizationId: null,
        hubId: null,
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
        updatedAt: true,
        createdAt: true,
      },
      orderBy: [{ slug: "asc" }],
    });

    const formatted = agents.map((a) => ({
      ...a,
      scope: "🌍 Global (Sistema Base)",
      promptPreview: a.prompt
        ? a.prompt.length > 180
          ? a.prompt.slice(0, 180) + "..."
          : a.prompt
        : "— (sin prompt definido o aún no sincronizado)",
    }));

    return NextResponse.json({ ok: true, total: formatted.length, agents: formatted });
  } catch (error: any) {
    console.error("❌ Error GET /admin/agents/global:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener agentes globales" },
      { status: 500 }
    );
  }
}