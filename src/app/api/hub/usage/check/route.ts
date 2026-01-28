import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   🧠 /api/hub/usage/check
   Verifica o registra uso IA por tenant + feature + día
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      feature,
      model,
      tokensInput = 0,
      tokensOutput = 0,
      costUsd = 0,
    } = body;

    if (!tenantId || !feature) {
      return NextResponse.json(
        { error: "Faltan parámetros obligatorios (tenantId, feature)." },
        { status: 400 }
      );
    }

    /* ======================================================
       🧭 Resolver tenant real (acepta slug o ID)
    ====================================================== */
    let tenantRef = tenantId;

    // Detectar si es ID válido de Rowi (cmh*, cmg*, cmd*)
    const isId =
      tenantId.startsWith("cmh") ||
      tenantId.startsWith("cmg") ||
      tenantId.startsWith("cmd");

    // Si NO es ID → lo tratamos como SLUG
    if (!isId) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantId },
      });

      if (!tenant) {
        return NextResponse.json(
          { ok: false, error: `Tenant no encontrado: ${tenantId}` },
          { status: 404 }
        );
      }

      tenantRef = tenant.id;
    }

    /* ======================================================
       🔄 Mapear features al ENUM UsageFeature válido
    ====================================================== */
    const featureMap: Record<string, "AFFINITY" | "ECO" | "ROWI_CHAT" | "OTHER"> = {
      AFFINITY: "AFFINITY",
      ECO: "ECO",
      EQ: "ROWI_CHAT",
      SUPER: "ROWI_CHAT",
      ROWI_COACH: "ROWI_CHAT",
      ROWI_CHAT: "ROWI_CHAT",
      SALES: "OTHER",
      TRAINER: "OTHER",
      TTS: "OTHER",
      STT: "OTHER",
      IMPORT: "OTHER",
      EXPORT: "OTHER",
    };

    const safeFeature =
      featureMap[feature?.toUpperCase() as keyof typeof featureMap] || "OTHER";

    /* ======================================================
       📅 Normalizar fecha a las 00:00 (día actual UTC)
    ====================================================== */
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    /* ======================================================
       🔹 Verificar si ya existe registro de hoy
    ====================================================== */
    const usageToday = await prisma.usageDaily.findFirst({
      where: { tenantId: tenantRef, feature: safeFeature, day: today },
    });

    if (usageToday) {
      // 🧮 Actualizar acumulando tokens y costo
      const updated = await prisma.usageDaily.update({
        where: { id: usageToday.id },
        data: {
          tokensInput: usageToday.tokensInput + tokensInput,
          tokensOutput: usageToday.tokensOutput + tokensOutput,
          calls: usageToday.calls + 1,
          // 👇 FIX: convertir ambos a número antes de sumar
          costUsd:
            Number(usageToday.costUsd ?? 0) + Number(costUsd ?? 0),
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Uso actualizado correctamente.",
        data: updated,
      });
    }

    /* ======================================================
       ➕ Crear nuevo registro si no existe
    ====================================================== */
    const created = await prisma.usageDaily.create({
      data: {
        tenantId: tenantRef,
        feature: safeFeature,
        model: model || "gpt-4o-mini",
        tokensInput,
        tokensOutput,
        calls: 1,
        costUsd: Number(costUsd ?? 0), // ✅ FIX: asegurar tipo numérico
        day: today,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Uso registrado correctamente.",
      data: created,
    });
  } catch (err: any) {
    console.error("❌ Error en check usage:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Error desconocido en check usage",
      },
      { status: 500 }
    );
  }
}