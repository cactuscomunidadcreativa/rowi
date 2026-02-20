import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
   🧠 AgentContext API
   ---------------------------------------------------------
   Controla la activación, desactivación y personalización
   de agentes IA en distintos contextos (Global, SuperHub, Tenant, Hub, Org)
========================================================= */

/**
 * 🔍 GET — Listar todos los contextos de un agente
 * /api/admin/agents/context?agentId=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");

    if (!agentId)
      return NextResponse.json(
        { ok: false, error: "Falta agentId" },
        { status: 400 }
      );

    const contexts = await prisma.agentContext.findMany({
      where: { agentId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ ok: true, contexts });
  } catch (err: any) {
    console.error("❌ Error GET /agents/context:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error cargando contextos" },
      { status: 500 }
    );
  }
}

/**
 * ➕ POST — Crear o activar un contexto
 * body: { agentId, contextType, contextId?, customPrompt?, autoLearn? }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();
    const { agentId, contextType, contextId = null, customPrompt = null, autoLearn = false } =
      data;

    if (!agentId || !contextType)
      return NextResponse.json(
        { ok: false, error: "agentId y contextType son requeridos" },
        { status: 400 }
      );

    // 🔍 Buscar si ya existe
    const existing = await prisma.agentContext.findUnique({
      where: { agentId_contextType_contextId: { agentId, contextType, contextId } },
    });

    if (existing) {
      const updated = await prisma.agentContext.update({
        where: { id: existing.id },
        data: { isActive: true, customPrompt, autoLearn },
      });
      return NextResponse.json({ ok: true, updated, message: "Contexto reactivado" });
    }

    const created = await prisma.agentContext.create({
      data: {
        agentId,
        contextType,
        contextId,
        isActive: true,
        customPrompt,
        autoLearn,
      },
    });

    return NextResponse.json({ ok: true, created, message: "Contexto creado y activado" });
  } catch (err: any) {
    console.error("❌ Error POST /agents/context:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error creando contexto" },
      { status: 500 }
    );
  }
}

/**
 * ✏️ PATCH — Actualizar estado o personalización del contexto
 * body: { id?, agentId?, contextType?, contextId?, isActive?, customPrompt?, autoLearn? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();
    const { id, agentId, contextType, contextId, isActive, customPrompt, autoLearn } = data;

    if (!id && (!agentId || !contextType))
      return NextResponse.json(
        { ok: false, error: "Debe enviar id o combinación agentId/contextType/contextId" },
        { status: 400 }
      );

    const whereClause = id
      ? { id }
      : { agentId_contextType_contextId: { agentId, contextType, contextId: contextId || null } };

    const updated = await prisma.agentContext.update({
      where: whereClause,
      data: { isActive, customPrompt, autoLearn },
    });

    return NextResponse.json({ ok: true, updated, message: "Contexto actualizado" });
  } catch (err: any) {
    console.error("❌ Error PATCH /agents/context:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error actualizando contexto" },
      { status: 500 }
    );
  }
}

/**
 * 🗑️ DELETE — Desactivar un contexto
 * body: { id? | agentId, contextType, contextId? }
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const data = await req.json();
    const { id, agentId, contextType, contextId = null } = data;

    if (!id && (!agentId || !contextType))
      return NextResponse.json(
        { ok: false, error: "Debe enviar id o combinación agentId/contextType/contextId" },
        { status: 400 }
      );

    const whereClause = id
      ? { id }
      : { agentId_contextType_contextId: { agentId, contextType, contextId } };

    const updated = await prisma.agentContext.update({
      where: whereClause,
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true, updated, message: "Contexto desactivado" });
  } catch (err: any) {
    console.error("❌ Error DELETE /agents/context:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al desactivar contexto" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";