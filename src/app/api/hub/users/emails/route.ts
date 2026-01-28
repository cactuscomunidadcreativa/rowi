// src/app/api/hub/users/emails/route.ts
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId)
      return NextResponse.json({ ok: false, error: "Falta userId" }, { status: 400 });

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