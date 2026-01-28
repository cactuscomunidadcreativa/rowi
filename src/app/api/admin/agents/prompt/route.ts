// src/app/api/admin/agents/prompt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, prompt, model, tone, tenantId, superHubId, organizationId } = body;

    if (!slug) {
      return NextResponse.json({ ok: false, error: "Falta el slug del agente" }, { status: 400 });
    }

    // Buscar agente base global (para heredar metadatos si no existe a este nivel)
    const baseAgent = await prisma.agentConfig.findFirst({
      where: {
        slug,
        tenantId: null,
        superHubId: null,
        organizationId: null,
      },
    });

    if (!baseAgent) {
      return NextResponse.json({ ok: false, error: "Agente base no encontrado" }, { status: 404 });
    }

    // Buscar si ya existe una versión en el nivel seleccionado
    const existing = await prisma.agentConfig.findFirst({
      where: {
        slug,
        tenantId: tenantId ?? null,
        superHubId: superHubId ?? null,
        organizationId: organizationId ?? null,
      },
    });

    // Datos de actualización / creación
    const data = {
      prompt,
      model: model || baseAgent.model,
      tone: tone || baseAgent.tone,
      name: baseAgent.name,
      description: baseAgent.description,
      isActive: true,
      tenantId: tenantId ?? null,
      superHubId: superHubId ?? null,
      organizationId: organizationId ?? null,
    };

    // Crear o actualizar
    if (existing) {
      await prisma.agentConfig.update({
        where: { id: existing.id },
        data,
      });
      return NextResponse.json({ ok: true, message: "Agente actualizado correctamente ✅" });
    } else {
      await prisma.agentConfig.create({
        data: { ...data, slug, type: baseAgent.type },
      });
      return NextResponse.json({ ok: true, message: "Agente personalizado creado ✅" });
    }
  } catch (err: any) {
    console.error("❌ Error PATCH /admin/agents/prompt:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Error interno" }, { status: 500 });
  }
}