import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { parse } from "csv-parse/sync";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   ➕ POST — Subir CSV y crear ImportBatch temporal
   ---------------------------------------------------------
   - Se almacena el CSV como registros en ImportBatch / ImportRow
   - No crea usuarios todavía (solo lectura y validación)
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser().catch(() => null);

    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file)
      return NextResponse.json(
        { error: "Archivo CSV requerido" },
        { status: 400 }
      );

    // Leer y parsear el CSV
    const buffer = Buffer.from(await file.arrayBuffer());
    const csvText = buffer.toString("utf8");
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    if (!records.length)
      return NextResponse.json(
        { error: "El archivo CSV está vacío o mal formateado." },
        { status: 400 }
      );

    // Crear el batch principal
    const batch = await prisma.importBatch.create({
      data: {
        name: file.name.replace(".csv", ""),
        uploadedBy: auth.email || "unknown",
        totalRows: records.length,
      },
    });

    // Guardar filas (ImportRow)
    const chunkSize = 100;
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await prisma.importRow.createMany({
        data: chunk.map((row) => ({
          batchId: batch.id,
          email: row["Email"]?.toLowerCase() || null,
          name: row["Test Taker Name"] || null,
          surname: row["Test Taker Surname"] || null,
          country: row["Country"] || null,
          jobRole: row["Job Role"] || null,
          sector: row["Sector"] || null,
          data: row,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      message: `✅ ${records.length} filas importadas correctamente.`,
      batchId: batch.id,
    });
  } catch (e: any) {
    console.error("❌ Error POST /api/admin/imports:", e);
    return NextResponse.json(
      { error: e.message || "Error al procesar CSV" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🔍 GET — Listar todos los lotes cargados (ImportBatch)
   ---------------------------------------------------------
   - Devuelve todos los batches con conteo de filas
========================================================= */
export async function GET() {
  try {
    const batches = await prisma.importBatch.findMany({
      orderBy: { uploadedAt: "desc" },
      include: {
        rows: {
          select: { id: true, email: true, name: true, country: true, status: true },
        },
      },
    });

    const summary = batches.map((b) => ({
      id: b.id,
      name: b.name,
      uploadedBy: b.uploadedBy,
      uploadedAt: b.uploadedAt,
      totalRows: b.totalRows,
      processed: b.processed,
      pending: b.rows.filter((r) => r.status === "pending").length,
      done: b.rows.filter((r) => r.status === "done").length,
    }));

    return NextResponse.json(summary);
  } catch (e: any) {
    console.error("❌ Error GET /api/admin/imports:", e);
    return NextResponse.json(
      { error: e.message || "Error al listar lotes" },
      { status: 500 }
    );
  }
}