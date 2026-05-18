import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    // 📅 Día actual UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 🔹 Traer todos los registros de uso de hoy
    const usage = await prisma.usageDaily.findMany({
      where: { day: today },
      include: { tenant: true },
      orderBy: { tokensInput: "desc" },
    });

    // 🔹 Estado actual de agentes
    const agents = await prisma.agentConfig.findMany({
      select: { id: true, name: true, isActive: true, tenantId: true },
    });

    // 🔹 Mapear con estado
    const data = usage.map((u) => {
      const agent = agents.find(
        (a) => u.feature.toUpperCase().includes(a.name.split(" ")[1]?.toUpperCase())
      );
      return {
        id: u.id,
        tenant: u.tenant?.name || u.tenantId,
        feature: u.feature,
        model: u.model,
        tokensIn: u.tokensInput,
        tokensOut: u.tokensOutput,
        calls: u.calls,
        // costUsd is Decimal; normalize to number for arithmetic below.
        cost: Number(u.costUsd ?? 0),
        // UsageDaily has no `updatedAt` column — use day as the
        // last-touched proxy.
        updatedAt: u.day,
        active: agent?.isActive ?? false,
      };
    });

    const totals = {
      tokensIn: data.reduce((s, d) => s + d.tokensIn, 0),
      tokensOut: data.reduce((s, d) => s + d.tokensOut, 0),
      calls: data.reduce((s, d) => s + d.calls, 0),
      cost: data.reduce((s, d) => s + (d.cost ?? 0), 0),
    };

    return NextResponse.json({ ok: true, totals, data });
  } catch (e: any) {
    console.error("❌ Error en /usage/summary:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}