import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.agentConfig.findMany({
    orderBy: { updatedAt: "desc" }
  });
  return NextResponse.json(rows);
}

// Encender / apagar / reiniciar IA
export async function PATCH(req: Request) {
  const { id, action } = await req.json();
  if (!id || !action)
    return NextResponse.json({ error: "id/action required" }, { status: 400 });

  if (action === "toggle") {
    const agent = await prisma.agentConfig.findUnique({ where: { id } });
    const updated = await prisma.agentConfig.update({
      where: { id },
      data: { isActive: !agent?.isActive }
    });
    return NextResponse.json(updated);
  }

  if (action === "restart") {
    const updated = await prisma.agentConfig.update({
      where: { id },
      data: { status: "restarting" } as any
    });
    // aquí podrías lanzar una cola o función que reinicialice prompts / caches
    return NextResponse.json({ ok: true, restarted: id });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
