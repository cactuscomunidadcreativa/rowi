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
  // Hub schema requires a unique slug; derive from name when missing.
  const slug =
    body.slug ||
    String(body.name)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 60) ||
    `hub-${Date.now()}`;
  const hub = await prisma.hub.create({
    data: {
      tenantId: body.tenantId,
      name: body.name,
      slug,
      description: body.description ?? null,
    },
  });
  return NextResponse.json(hub, { status: 201 });
}
