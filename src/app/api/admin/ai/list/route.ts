import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * 📋 Lista todos los agentes IA con sus estados actuales.
 * Incluye: nombre, tipo, modelo, nivel jerárquico y si tienen autoaprendizaje.
 */
export async function GET() {
  try {
    const agents = await prisma.agentConfig.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        model: true,
        type: true,
        autoLearn: true,
        isActive: true,
        createdAt: true,
        tenant: { select: { name: true, slug: true } },
        superHub: { select: { name: true } },
        organization: { select: { name: true } },
      },
      orderBy: { slug: "asc" },
    });

    const formatted = agents.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      slug: a.slug,
      model: a.model,
      nivel:
        a.organization?.name
          ? `🏢 Org: ${a.organization.name}`
          : a.superHub?.name
          ? `🌐 SuperHub: ${a.superHub.name}`
          : a.tenant?.name
          ? `🧱 Tenant: ${a.tenant.name}`
          : "🌍 Global",
      autoLearn: a.autoLearn,
      activo: a.isActive,
      creado: a.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json({ ok: true, total: formatted.length, agents: formatted });
  } catch (e: any) {
    console.error("❌ Error en GET /admin/ai/list:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}