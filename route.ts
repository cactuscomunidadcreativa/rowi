import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ROWI_API = process.env.ROWI_API_BASE;
const ROWI_KEY = process.env.ROWI_API_KEY;

async function notifyRowi(action: string, agent: any) {
  if (!ROWI_API || !ROWI_KEY) return;
  try {
    const res = await fetch(`${ROWI_API}/agents/${agent.id}/control`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ROWI_KEY}`
      },
      body: JSON.stringify({
        action,
        name: agent.name,
        type: agent.type,
        tenant: agent.tenantId,
        model: agent.model
      })
    });
    if (!res.ok) console.error("❌ Error comunicando con Rowi Core:", await res.text());
  } catch (err) {
    console.error("❌ Falla de conexión Rowi Core:", err);
  }
}

export async function GET() {
  const rows = await prisma.agentConfig.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json(rows);
}

// 🔌 Encender / apagar / reiniciar IA
export async function PATCH(req: Request) {
  const { id, action } = await req.json();
  if (!id || !action)
    return NextResponse.json({ error: "id/action required" }, { status: 400 });

  const agent = await prisma.agentConfig.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (action === "toggle") {
    const updated = await prisma.agentConfig.update({
      where: { id },
      data: { isActive: !agent.isActive }
    });
    await notifyRowi(updated.isActive ? "start" : "stop", agent);
    return NextResponse.json(updated);
  }

  if (action === "restart") {
    await prisma.agentConfig.update({
      where: { id },
      data: { status: "restarting" } as any
    });
    await notifyRowi("restart", agent);
    return NextResponse.json({ ok: true, restarted: id });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
