import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  // Trae módulos activos por tenant (más adelante filtraremos por sesión)
  const rows = await prisma.tenantModule.findMany({
    where: { enabled: true },
    select: { key: true, tenantId: true }
  });
  return NextResponse.json(rows);
}

export async function PATCH(req: Request) {
  const { id, enabled } = await req.json();
  const mod = await prisma.tenantModule.update({
    where: { id },
    data: { enabled }
  });
  return NextResponse.json(mod);
}
