// src/app/api/admin/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/* ============================================
   GET — Lista de planes (UI Admin)
=============================================== */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();

    // solo superadmin puede ver todos los planes
    if (!auth?.isSuperAdmin) {
      return NextResponse.json([]);
    }

    const plans = await prisma.plan.findMany({
      orderBy: { priceUsd: "asc" },
    });

    return NextResponse.json(plans);
  } catch (err: any) {
    console.error("❌ Error GET /api/admin/plans:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* ============================================
   POST — Crear plan
=============================================== */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.isSuperAdmin)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const data = await req.json();

    const plan = await prisma.plan.create({ data });

    return NextResponse.json(plan, { status: 201 });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/plans:", err);
    return NextResponse.json({ error: "Error creando plan" }, { status: 500 });
  }
}

/* ============================================
   PUT — Editar plan
=============================================== */
export async function PUT(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.isSuperAdmin)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { id, ...data } = await req.json();

    const updated = await prisma.plan.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("❌ Error PUT /api/admin/plans:", err);
    return NextResponse.json({ error: "Error actualizando plan" }, { status: 500 });
  }
}

/* ============================================
   DELETE — Eliminar plan
=============================================== */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.isSuperAdmin)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { id } = await req.json();

    await prisma.plan.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/admin/plans:", err);
    return NextResponse.json({ error: "Error eliminando plan" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";