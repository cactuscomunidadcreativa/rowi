/**
 * 🔗 API: Get SEI Link for User
 * GET /api/sei/link - Obtener link SEI según idioma y plan del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

// =========================================================
// GET — Obtener link SEI para el usuario actual
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const preferredLanguage = searchParams.get("language");

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        language: true,
        plan: {
          select: {
            slug: true,
            seiIncluded: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verificar que el plan incluye SEI
    if (!user.plan?.seiIncluded) {
      return NextResponse.json(
        {
          ok: false,
          error: "Plan does not include SEI",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    const language = preferredLanguage || user.language || "es";
    const planSlug = user.plan?.slug;

    // Buscar link SEI apropiado
    // Prioridad:
    // 1. Link específico para plan + idioma
    // 2. Link default para idioma
    // 3. Link default global (es)

    let seiLink = null;

    // 1. Buscar link específico para plan + idioma
    if (planSlug) {
      seiLink = await prisma.seiLink.findFirst({
        where: {
          language,
          planSlug,
          isActive: true,
        },
      });
    }

    // 2. Buscar link default para idioma
    if (!seiLink) {
      seiLink = await prisma.seiLink.findFirst({
        where: {
          language,
          planSlug: null,
          isDefault: true,
          isActive: true,
        },
      });
    }

    // 3. Buscar cualquier link activo para el idioma
    if (!seiLink) {
      seiLink = await prisma.seiLink.findFirst({
        where: {
          language,
          isActive: true,
        },
        orderBy: { isDefault: "desc" },
      });
    }

    // 4. Fallback: link default en español
    if (!seiLink) {
      seiLink = await prisma.seiLink.findFirst({
        where: {
          language: "es",
          isDefault: true,
          isActive: true,
        },
      });
    }

    // 5. Último recurso: cualquier link activo
    if (!seiLink) {
      seiLink = await prisma.seiLink.findFirst({
        where: { isActive: true },
        orderBy: { isDefault: "desc" },
      });
    }

    if (!seiLink) {
      return NextResponse.json(
        {
          ok: false,
          error: "No SEI link available",
          configurationError: true,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      link: {
        url: seiLink.url,
        language: seiLink.language,
        code: seiLink.code,
      },
    });
  } catch (error) {
    console.error("❌ Error GET /api/sei/link:", error);
    return NextResponse.json(
      { error: "Error getting SEI link" },
      { status: 500 }
    );
  }
}
