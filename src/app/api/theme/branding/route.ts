import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { ThemeTokens, defaultTokens } from "@/lib/theme/tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 🎨 GET /api/theme/branding
 * ---------------------------------------------------------
 * Obtiene el branding de un Tenant o Hub específico
 *
 * Query params:
 * - tenantId: ID del tenant
 * - hubId: ID del hub (opcional, para override)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId");
    const hubId = url.searchParams.get("hubId");

    if (!tenantId) {
      return NextResponse.json({
        ok: true,
        branding: null,
        source: "default",
      });
    }

    // Buscar branding del tenant
    const tenantBranding = await prisma.tenantBranding.findUnique({
      where: { tenantId },
    });

    if (!tenantBranding || !tenantBranding.isActive) {
      return NextResponse.json({
        ok: true,
        branding: null,
        source: "default",
      });
    }

    // Construir tokens personalizados desde el branding
    const customTokens: Partial<ThemeTokens> = {
      colors: {
        ...defaultTokens.colors,
        primary: tenantBranding.primaryColor || defaultTokens.colors.primary,
        secondary: tenantBranding.secondaryColor || defaultTokens.colors.secondary,
        accent: tenantBranding.accentColor || defaultTokens.colors.accent,
        background: tenantBranding.backgroundColor || defaultTokens.colors.background,
        foreground: tenantBranding.textColor || defaultTokens.colors.foreground,
      },
      sei: {
        k: tenantBranding.colorK || defaultTokens.sei!.k,
        c: tenantBranding.colorC || defaultTokens.sei!.c,
        g: tenantBranding.colorG || defaultTokens.sei!.g,
      },
      fonts: {
        heading: tenantBranding.fontHeading || defaultTokens.fonts.heading,
        body: tenantBranding.fontBody || defaultTokens.fonts.body,
        mono: defaultTokens.fonts.mono,
      },
    };

    // Si hay cssVariables personalizadas en JSON, mergearlas
    if (tenantBranding.cssVariables && typeof tenantBranding.cssVariables === "object") {
      const cssVars = tenantBranding.cssVariables as Record<string, any>;
      if (cssVars.colors) {
        customTokens.colors = { ...customTokens.colors, ...cssVars.colors };
      }
      if (cssVars.radius) {
        customTokens.radius = { ...defaultTokens.radius, ...cssVars.radius };
      }
      if (cssVars.spacing) {
        customTokens.spacing = { ...defaultTokens.spacing, ...cssVars.spacing };
      }
    }

    return NextResponse.json({
      ok: true,
      branding: customTokens,
      logo: tenantBranding.logoUrl,
      logoLight: tenantBranding.logoLightUrl,
      favicon: tenantBranding.faviconUrl,
      customCss: tenantBranding.customCss,
      source: "tenant",
      tenantId,
    });
  } catch (error: any) {
    console.error("❌ Error GET /api/theme/branding:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * 🎨 POST /api/theme/branding
 * ---------------------------------------------------------
 * Crea o actualiza el branding de un tenant
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, ...brandingData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, error: "tenantId requerido" },
        { status: 400 }
      );
    }

    // Verificar que el tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant no encontrado" },
        { status: 404 }
      );
    }

    // Upsert branding
    const branding = await prisma.tenantBranding.upsert({
      where: { tenantId },
      update: {
        ...brandingData,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        ...brandingData,
      },
    });

    return NextResponse.json({
      ok: true,
      branding,
      message: "Branding actualizado",
    });
  } catch (error: any) {
    console.error("❌ Error POST /api/theme/branding:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
