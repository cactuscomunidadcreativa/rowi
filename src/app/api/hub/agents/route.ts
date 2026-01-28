// src/app/api/hub/agents/route.ts
import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

/* =========================================================
 🔍 GET – Listar agentes IA (globales + tenant)
========================================================= */
export async function GET() {
  const rows = await prisma.agentConfig.findMany({
    orderBy: { createdAt: "desc" },
  });

  // ✅ Etiquetar alcance
  const formatted = rows.map((a) => ({
    ...a,
    scope: a.tenantId === "rowi-master" ? "Global" : "Tenant",
  }));

  return NextResponse.json(formatted);
}

/* =========================================================
 ➕ POST – Crear nuevo agente IA
========================================================= */
export async function POST(req: Request) {
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
}

/* =========================================================
 🧩 PATCH – Actualizar agente IA
========================================================= */
export async function PATCH(req: Request) {
  const { id, name, model, prompt, temperature, maxTokens, isActive } = await req.json();

  if (!id)
    return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const updated = await prisma.agentConfig.update({
    where: { id },
    data: { name, model, prompt, temperature, maxTokens, isActive },
  });

  return NextResponse.json(updated);
}