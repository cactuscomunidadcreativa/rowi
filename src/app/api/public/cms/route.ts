/**
 * 📝 API: Public CMS Content
 * GET /api/public/cms - Obtener contenido CMS público
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const language = searchParams.get("language") || "es";
    const keys = searchParams.get("keys"); // Comma-separated list of keys

    const where: any = {
      isActive: true,
      language,
    };

    if (category) {
      where.category = category;
    }

    if (keys) {
      where.key = { in: keys.split(",") };
    }

    const content = await prisma.cmsContent.findMany({
      where,
      select: {
        key: true,
        value: true,
        valueType: true,
      },
    });

    // Convertir a objeto clave-valor para fácil uso
    const contentMap: Record<string, string> = {};
    for (const item of content) {
      contentMap[item.key] = item.value;
    }

    return NextResponse.json({
      ok: true,
      content: contentMap,
      language,
    });
  } catch (error) {
    console.error("❌ Error GET /api/public/cms:", error);
    return NextResponse.json(
      { ok: false, error: "Error loading CMS content" },
      { status: 500 }
    );
  }
}
