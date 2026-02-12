import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   🔍 GET — Detalle del batch y filas
========================================================= */
export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const batch = await prisma.importBatch.findUnique({
      where: { id },
      include: { rows: true },
    });

    if (!batch) return NextResponse.json({ error: "Batch no encontrado" }, { status: 404 });

    return NextResponse.json(batch);
  } catch (err: any) {
    console.error("❌ Error GET /imports/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =========================================================
   ✏️ PATCH — Actualizar asignaciones (Tenant / Hub / Org)
========================================================= */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { tenantId, hubId, organizationId, selectedIds } = await req.json();

    if (!selectedIds?.length)
      return NextResponse.json({ error: "No hay filas seleccionadas" }, { status: 400 });

    await prisma.importRow.updateMany({
      where: { batchId: id, id: { in: selectedIds } },
      data: {
        data: {
          tenantId,
          hubId,
          organizationId,
        },
      },
    });

    return NextResponse.json({ ok: true, message: "Asignación actualizada ✅" });
  } catch (err: any) {
    console.error("❌ Error PATCH /imports/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =========================================================
   🚀 POST — Procesar filas seleccionadas (crear usuarios reales)
========================================================= */
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const { selectedIds } = await req.json();

    const rows = await prisma.importRow.findMany({
      where: { batchId: id, id: { in: selectedIds }, selected: true },
    });

    let created = 0;
    for (const row of rows) {
      const data = row.data as any;
      const email = data.Email?.toLowerCase();
      if (!email) continue;

      const user = await prisma.user.upsert({
        where: { email },
        update: { name: `${data["Test Taker Name"] || ""} ${data["Test Taker Surname"] || ""}`.trim() },
        create: {
          email,
          name: `${data["Test Taker Name"] || ""} ${data["Test Taker Surname"] || ""}`.trim(),
          active: true,
          allowAI: true,
          organizationRole: "VIEWER",
        },
      });

      await prisma.eqSnapshot.create({
        data: {
          userId: user.id,
          dataset: data.Project || "Import Batch",
          context: data["Job Role"] || null,
          brainStyle: data["Profile"] || null,
          overall4: parseFloat(data["Overall 4 Outcome"] || "0"),
          K: parseInt(data["Know Yourself Score"] || "0"),
          C: parseInt(data["Choose Yourself Score"] || "0"),
          G: parseInt(data["Give Yourself Score"] || "0"),
        },
      });

      created++;
    }

    await prisma.importBatch.update({ where: { id }, data: { processed: true } });

    return NextResponse.json({
      ok: true,
      message: `✅ ${created} usuarios creados.`,
    });
  } catch (err: any) {
    console.error("❌ Error procesando batch:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}