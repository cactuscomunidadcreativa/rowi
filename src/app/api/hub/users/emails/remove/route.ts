// src/app/api/hub/users/emails/remove/route.ts
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { id } = await req.json();
    if (!id)
      return NextResponse.json({ ok: false, error: "Falta id del correo" }, { status: 400 });

    await prisma.userEmail.delete({ where: { id } });

    return NextResponse.json({ ok: true, message: "Correo eliminado correctamente" });
  } catch (error: any) {
    console.error("❌ Error DELETE /api/hub/users/emails/remove:", error);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar correo" },
      { status: 500 }
    );
  }
}