import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

/* =========================================================
   🧩 GET — Listar todos los Planes (Free, Pro, Enterprise, etc.)
========================================================= */
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { priceUsd: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        priceUsd: true,
        durationDays: true,
        aiEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      total: plans.length,
      plans,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/admin/plans:", err);
    return NextResponse.json(
      { ok: false, error: "Error cargando planes" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear un nuevo Plan
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const { name, description, priceUsd, durationDays, aiEnabled } =
      await req.json();

    if (!name)
      return NextResponse.json(
        { ok: false, error: "El campo 'name' es obligatorio" },
        { status: 400 }
      );

    const existing = await prisma.plan.findUnique({ where: { name } });
    if (existing)
      return NextResponse.json(
        { ok: false, error: "Ya existe un plan con ese nombre" },
        { status: 409 }
      );

    const created = await prisma.plan.create({
      data: {
        name,
        description: description || "",
        priceUsd: Number(priceUsd) || 0,
        durationDays: Number(durationDays) || 30,
        aiEnabled: aiEnabled ?? true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "✅ Plan creado correctamente",
      plan: created,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/plans:", err);
    return NextResponse.json(
      { ok: false, error: "Error al crear el plan" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✏️ PATCH — Editar un Plan existente
========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID del plan" },
        { status: 400 }
      );

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        priceUsd: Number(data.priceUsd) || 0,
        durationDays: Number(data.durationDays) || 30,
        aiEnabled: data.aiEnabled ?? true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "✅ Plan actualizado correctamente",
      plan: updated,
    });
  } catch (err: any) {
    console.error("❌ Error PATCH /api/admin/plans:", err);
    return NextResponse.json(
      { ok: false, error: "Error al actualizar el plan" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar un Plan
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id)
      return NextResponse.json(
        { ok: false, error: "Falta el ID del plan" },
        { status: 400 }
      );

    await prisma.plan.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "🗑️ Plan eliminado correctamente",
    });
  } catch (err: any) {
    console.error("❌ Error DELETE /api/admin/plans:", err);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar el plan" },
      { status: 500 }
    );
  }
}