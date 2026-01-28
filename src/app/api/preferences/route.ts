// src/app/api/upload-csv/self/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";
export const maxDuration = 120; // permite hasta 2 minutos de parsing

// =========================================================
// 🔧 Helpers
// =========================================================
const decoder = new TextDecoder("utf-8");

function toNum(v: any) {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const toInt = (v: number | null | undefined) =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;

// =========================================================
// 📤 POST — Importa CSV con control de usuario, dataset y tiempo
// =========================================================
export async function POST(req: NextRequest) {
  const user = await getServerAuthUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const dataset = form.get("dataset")?.toString() || "default";

    // 🔍 Validación inicial
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo no válido o ausente." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx. 10 MB)." }, { status: 413 });
    }

    // 🧠 Lectura y decodificación del archivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = decoder.decode(buffer);

    // ✅ Parser CSV asincrónico
    const records: any[] = [];
    const parser = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    for await (const record of parser) {
      records.push(record);
      if (records.length > 10000) break; // 🔒 evita sobrecarga
    }

    const totalRows = records.length;
    const preview = records.slice(0, 5);

    // =====================================================
    // 💾 Guardar registro en la base de datos
    // =====================================================
    const upload = await prisma.csvUpload.create({
      data: {
        userEmail: user.email,
        dataset,
        rowCount: totalRows,
        meta: {
          fileName: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // =====================================================
    // 🔗 Actualiza relación con User (opcional)
    // =====================================================
    await prisma.user.update({
      where: { email: user.email },
      data: {
        csvUploads: {
          connect: { id: upload.id },
        },
      },
    });

    // =====================================================
    // 🧩 Respuesta
    // =====================================================
    return NextResponse.json({
      ok: true,
      message: `✅ CSV importado correctamente (${totalRows} filas)`,
      meta: {
        dataset,
        uploadId: upload.id,
        fileName: file.name,
      },
      preview,
    });
  } catch (err: any) {
    console.error("❌ Error al procesar CSV:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error procesando CSV." },
      { status: 500 }
    );
  }
}

// =========================================================
// 🩵 GET — Estado del servicio
// =========================================================
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "🚀 Endpoint activo y listo para recibir CSVs.",
    info: {
      maxSizeMB: 10,
      mode: "streaming",
      example: "/api/upload-csv/self (POST form-data: file, dataset)",
    },
  });
}