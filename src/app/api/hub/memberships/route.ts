import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.membership.findMany({
    include: { user: true, tenant: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { tenantId, userId, role } = await req.json();
  if (!tenantId || !userId)
    return NextResponse.json({ error: "tenantId/userId required" }, { status: 400 });

  const existing = await prisma.membership.findFirst({
    where: { tenantId, userId }
  });
  if (existing) return NextResponse.json(existing);

  const row = await prisma.membership.create({
    data: { tenantId, userId, role: role || "VIEWER" }
  });
  return NextResponse.json(row, { status: 201 });
}
