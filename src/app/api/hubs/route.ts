import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const hubs = await prisma.hub.findMany({
    include: {
      _count: { select: { memberships: true, posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(hubs);
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body?.tenantId || !body?.name) {
    return NextResponse.json({ error: "tenantId and name are required" }, { status: 400 });
  }
  const hub = await prisma.hub.create({
    data: {
      tenantId: body.tenantId,
      name: body.name,
      description: body.description ?? null,
    },
  });
  return NextResponse.json(hub, { status: 201 });
}
