// src/app/api/admin/agents/active/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export async function PATCH(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, isActive } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "Falta ID" }, { status: 400 });

    const updated = await prisma.agentConfig.update({
      where: { id },
      data: { isActive: !!isActive },
    });

    return NextResponse.json({
      ok: true,
      message: `Agente ${updated.name} ${
        updated.isActive ? "activado ✅" : "desactivado ⛔"
      }`,
      agent: updated,
    });
  } catch (err: any) {
    console.error("❌ Error PATCH /admin/agents/active:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}