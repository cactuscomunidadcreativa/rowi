import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * =========================================================
 * 🎛️ Emotional Config API
 * =========================================================
 * Permite consultar o actualizar las configuraciones emocionales
 * por tenant usando el modelo con key-value JSON.
 */

// 🔹 GET - obtiene configuración actual (por tenant)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const key = searchParams.get("key") || "emotional-settings";

    let config = null;

    if (tenantId) {
      config = await prisma.emotionalConfig.findFirst({
        where: { tenantId, key },
      });
    }

    // Si no encuentra nada, devolvemos un default
    if (!config) {
      config = {
        id: null,
        key,
        value: {
          enabled: true,
          allowedTypes: ["ky", "cy", "gy", "optimism", "empathy", "clarity"],
          aiAutoDetect: true,
          defaultIntensity: 5,
        },
        inherited: true,
      };
    }

    return NextResponse.json(config);
  } catch (error: any) {
    console.error("❌ Error en GET /api/emotional-config:", error);
    return NextResponse.json(
      { error: "Error obteniendo configuración emocional" },
      { status: 500 }
    );
  }
}

// 🔹 POST - crea o actualiza configuración
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, key = "emotional-settings", value, description } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Debe especificarse tenantId" },
        { status: 400 }
      );
    }

    // Busca si existe
    const existing = await prisma.emotionalConfig.findFirst({
      where: { tenantId, key },
    });

    let result;
    if (existing) {
      // 🔄 Actualiza
      result = await prisma.emotionalConfig.update({
        where: { id: existing.id },
        data: { value, description },
      });
    } else {
      // 🆕 Crea nueva
      result = await prisma.emotionalConfig.create({
        data: {
          tenantId,
          key,
          value,
          description,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Error en POST /api/emotional-config:", error);
    return NextResponse.json(
      { error: "Error guardando configuración emocional" },
      { status: 500 }
    );
  }
}
