import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import { requireAuth, requireSuperAdmin } from "@/core/auth/requireAdmin";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Trae módulos activos por tenant (más adelante filtraremos por sesión)
    const rows = await prisma.tenantModule.findMany({
      where: { enabled: true },
      select: { key: true, tenantId: true }
    });
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("❌ Error GET /api/hub/modules:", err);
    return NextResponse.json(
      { error: err.message || "Error al listar módulos" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id, enabled } = await req.json();
    const mod = await prisma.tenantModule.update({
      where: { id },
      data: { enabled }
    });
    return NextResponse.json(mod);
  } catch (err: any) {
    console.error("❌ Error PATCH /api/hub/modules:", err);
    return NextResponse.json(
      { error: err.message || "Error al actualizar módulo" },
      { status: 500 }
    );
  }
}
