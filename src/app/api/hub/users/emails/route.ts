// src/app/api/hub/users/emails/route.ts
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.success) return auth.error;

    const requestedUserId = req.nextUrl.searchParams.get("userId");
    const userId = requestedUserId || auth.user.id;

    // 🔐 Ownership check: solo el propio usuario o un super admin
    if (userId !== auth.user.id && !auth.user.isSuperAdmin) {
      return NextResponse.json(
        { ok: false, error: "No autorizado para ver estos correos" },
        { status: 403 }
      );
    }

    const emails = await prisma.userEmail.findMany({
      where: { userId },
      orderBy: [{ primary: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ ok: true, emails });
  } catch (error: any) {
    console.error("❌ Error GET /api/hub/users/emails:", error);
    return NextResponse.json(
      { ok: false, error: "Error al listar correos" },
      { status: 500 }
    );
  }
}
