import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * POST /api/admin/agents/clone
 * Clona un agente IA (prompt, modelo, tipo, etc.)
 * a otro contexto (Tenant, SuperHub u Organización)
 * sin duplicar globalmente.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, targetType, targetId } = body || {};

    if (!id || !targetType || !targetId) {
      return NextResponse.json(
        { ok: false, error: "Faltan parámetros requeridos (id, targetType, targetId)" },
        { status: 400 }
      );
    }

    // 🔍 Buscar el agente base
    const baseAgent = await prisma.agentConfig.findUnique({ where: { id } });
    if (!baseAgent)
      return NextResponse.json(
        { ok: false, error: "Agente base no encontrado" },
        { status: 404 }
      );

    // 🔁 Preparar relación según el tipo de destino
    const contextData =
      targetType === "tenant"
        ? { tenantId: targetId, superHubId: null, organizationId: null }
        : targetType === "superhub"
        ? { superHubId: targetId, tenantId: null, organizationId: null }
        : targetType === "organization"
        ? { organizationId: targetId, tenantId: null, superHubId: null }
        : null;

    if (!contextData)
      return NextResponse.json(
        { ok: false, error: "Tipo de destino no válido" },
        { status: 400 }
      );

    // 🔍 Verificar si ya existe una copia del mismo slug en ese contexto
    const existing = await prisma.agentConfig.findFirst({
      where: {
        slug: baseAgent.slug,
        ...contextData,
      },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: `⚠️ Ya existe un agente "${baseAgent.slug}" en ese contexto.`,
      });
    }

    // 🧬 Crear la copia del agente
    const clone = await prisma.agentConfig.create({
      data: {
        slug: baseAgent.slug,
        name: baseAgent.name,
        type: baseAgent.type,
        model: baseAgent.model,
        description: baseAgent.description,
        prompt: baseAgent.prompt,
        tone: baseAgent.tone,
        accessLevel: baseAgent.accessLevel,
        visibility: baseAgent.visibility,
        autoLearn: baseAgent.autoLearn,
        isActive: true,
        ...contextData,
      },
    });

    console.log(
      `✅ Agente "${baseAgent.slug}" clonado a ${targetType.toUpperCase()} (${targetId})`
    );

    return NextResponse.json({
      ok: true,
      message: `✅ Agente "${baseAgent.name}" clonado correctamente en ${targetType}.`,
      clone,
    });
  } catch (error: any) {
    console.error("❌ Error POST /api/admin/agents/clone:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno al clonar agente" },
      { status: 500 }
    );
  }
}