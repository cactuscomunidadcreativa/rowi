import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import { cloneAgentsForContext } from "@/core/startup/cloneAgents";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export async function GET() {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const allowedTenantIds = await tenantIdsForScope(auth.scope);
  const hubs = await prisma.hub.findMany({
    where: allowedTenantIds === null ? undefined : { tenantId: { in: allowedTenantIds } },
    include: {
      _count: { select: { memberships: true, posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(hubs);
}

export async function POST(req: Request) {
  // 🔐 Crear un hub clona agentes y consume recursos: solo admins, y solo
  // dentro de su scope de tenant.
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const body = await req.json();
  if (!body?.tenantId || !body?.name) {
    return NextResponse.json({ error: "tenantId and name are required" }, { status: 400 });
  }

  const allowedTenantIds = await tenantIdsForScope(auth.scope);
  if (allowedTenantIds !== null && !allowedTenantIds.includes(body.tenantId)) {
    return NextResponse.json({ error: "No autorizado para este tenant" }, { status: 403 });
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
  await cloneAgentsForContext({ hubId: hub.id });
  return NextResponse.json(hub, { status: 201 });
}
