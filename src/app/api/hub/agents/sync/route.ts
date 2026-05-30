// apps/rowi/src/app/api/hub/agents/sync/route.ts
import { NextResponse } from "next/server";
import { ensureBaseAgents } from "@/core/startup/ensureAgents";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * =========================================================
 * 🔁 Sincroniza agentes con el Tenant Global (six-seconds-global)
 * =========================================================
 * - Verifica el tenant global
 * - Ejecuta ensureBaseAgents() para crear/sincronizar agentes desde código
 * - Reasigna huérfanos al tenant correcto
 * - Devuelve lista actualizada
 */
export async function POST() {
  // 🔐 Re-sincroniza y reasigna agentes en TODA la plataforma: SuperAdmin.
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    console.log("🚀 Ejecutando /api/hub/agents/sync ...");

    const tenant = await prisma.tenant.findUnique({
      where: { slug: "six-seconds-global" },
    });

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant 'six-seconds-global' no existe." },
        { status: 404 }
      );
    }

    // 1️⃣ Asegurar que los agentes base existan (código fuente)
    console.log("🧩 Llamando ensureBaseAgents() ...");
    await ensureBaseAgents();

    // 2️⃣ Reasignar cualquier agente huérfano al tenant global
    const orphanAgents = await prisma.agentConfig.findMany({
      where: {
        OR: [{ tenantId: null }, { tenantId: { not: tenant.id } }],
      },
    });

    if (orphanAgents.length > 0) {
      console.log(`♻️ Reasignando ${orphanAgents.length} agentes huérfanos.`);
      await Promise.all(
        orphanAgents.map((a) =>
          prisma.agentConfig.update({
            where: { id: a.id },
            data: { tenantId: tenant.id, isActive: true },
          })
        )
      );
    }

    // 3️⃣ Obtener lista completa actualizada
    const updated = await prisma.agentConfig.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Sincronización completa. Total: ${updated.length} agentes.`);

    return NextResponse.json({
      ok: true,
      count: updated.length,
      tenant: tenant.slug,
      agents: updated,
    });
  } catch (e: any) {
    console.error("❌ Error en /api/hub/agents/sync:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}