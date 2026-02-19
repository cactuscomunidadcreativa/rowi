// src/app/api/hub/users/emails/add/route.ts
import { prisma } from "@/core/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { userId, email, label } = await req.json();

    if (!userId || !email)
      return NextResponse.json({ ok: false, error: "Faltan campos obligatorios" }, { status: 400 });

    const existing = await prisma.userEmail.findUnique({
      where: { userId_email: { userId, email } },
    });

    if (existing)
      return NextResponse.json(
        { ok: false, error: "Ese correo ya está vinculado" },
        { status: 409 }
      );

    const newEmail = await prisma.userEmail.create({
      data: { userId, email, label },
    });

    return NextResponse.json({ ok: true, email: newEmail });
  } catch (error: any) {
    console.error("❌ Error POST /api/hub/users/emails/add:", error);
    return NextResponse.json(
      { ok: false, error: "Error al agregar correo" },
      { status: 500 }
    );
  }
}