// src/app/api/hub/agents/route.ts
import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import { requireAuth, requireSuperAdmin } from "@/core/auth/requireAdmin";

/* =========================================================
 🔍 GET – Listar agentes IA (globales + tenant)
========================================================= */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const rows = await prisma.agentConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    // ✅ Etiquetar alcance
    const formatted = rows.map((a) => ({
      ...a,
      scope: a.tenantId === "six-seconds-global" ? "Global" : "Tenant",
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error("❌ Error GET /api/hub/agents:", err);
    return NextResponse.json(
      { error: err.message || "Error al listar agentes" },
      { status: 500 }
    );
  }
}

/* =========================================================
 ➕ POST – Crear nuevo agente IA
========================================================= */
export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { tenantId, name, model, prompt, temperature, maxTokens } = await req.json();

    if (!tenantId || !name)
      return NextResponse.json({ error: "tenantId y name son requeridos" }, { status: 400 });

    // 🚫 Evitar duplicados por nombre dentro del mismo tenant
    const existing = await prisma.agentConfig.findFirst({
      where: { name, tenantId },
    });
    if (existing)
      return NextResponse.json({ error: "Ya existe un agente con ese nombre en este tenant" }, { status: 409 });

    const agent = await prisma.agentConfig.create({
      data: {
        tenantId,
        name,
        type: "CUSTOM",
        model: model || "gpt-4o-mini",
        prompt: prompt || "",
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 512,
        isActive: true,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error POST /api/hub/agents:", err);
    return NextResponse.json(
      { error: err.message || "Error al crear agente" },
      { status: 500 }
    );
  }
}

/* =========================================================
 🧩 PATCH – Actualizar agente IA
========================================================= */
export async function PATCH(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, name, model, prompt, temperature, maxTokens, isActive } = await req.json();

    if (!id)
      return NextResponse.json({ error: "id requerido" }, { status: 400 });

    const updated = await prisma.agentConfig.update({
      where: { id },
      data: { name, model, prompt, temperature, maxTokens, isActive },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ Error PATCH /api/hub/agents:", err);
    return NextResponse.json(
      { error: err.message || "Error al actualizar agente" },
      { status: 500 }
    );
  }
}
