import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import { requireAuth, requireSuperAdmin } from "@/core/auth/requireAdmin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const rows = await prisma.membership.findMany({
      include: { user: true, tenant: true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("❌ Error GET /api/hub/memberships:", err);
    return NextResponse.json(
      { error: err.message || "Error al listar memberships" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

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
  } catch (err: any) {
    console.error("❌ Error POST /api/hub/memberships:", err);
    return NextResponse.json(
      { error: err.message || "Error al crear membership" },
      { status: 500 }
    );
  }
}
