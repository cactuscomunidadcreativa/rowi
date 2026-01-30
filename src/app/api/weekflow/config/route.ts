import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * GET /api/weekflow/config?hubId=xxx
 * Obtiene la configuración de WeekFlow para un hub
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verificar acceso por plan
    if (!auth.plan?.weekflowAccess) {
      return NextResponse.json(
        { ok: false, error: "weekflow.errors.planRequired" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const hubId = searchParams.get("hubId");

    if (!hubId) {
      return NextResponse.json({ ok: false, error: "hubId required" }, { status: 400 });
    }

    // Buscar o crear configuración
    let config = await prisma.weekFlowConfig.findFirst({
      where: { hubId },
    });

    if (!config) {
      // Auto-crear configuración por defecto
      const hub = await prisma.hub.findUnique({
        where: { id: hubId },
        select: { tenantId: true, name: true },
      });

      if (!hub) {
        return NextResponse.json({ ok: false, error: "Hub not found" }, { status: 404 });
      }

      config = await prisma.weekFlowConfig.create({
        data: {
          hubId,
          tenantId: hub.tenantId,
          name: `WeekFlow - ${hub.name}`,
        },
      });
    }

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error("[WeekFlow Config GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST /api/weekflow/config
 * Crea una nueva configuración de WeekFlow
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.plan?.weekflowAccess) {
      return NextResponse.json(
        { ok: false, error: "weekflow.errors.planRequired" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { hubId, tenantId, name, ...settings } = body;

    if (!hubId) {
      return NextResponse.json({ ok: false, error: "hubId required" }, { status: 400 });
    }

    // Verificar si ya existe
    const existing = await prisma.weekFlowConfig.findFirst({
      where: { hubId },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Config already exists for this hub" },
        { status: 409 }
      );
    }

    const config = await prisma.weekFlowConfig.create({
      data: {
        hubId,
        tenantId,
        name: name || "WeekFlow",
        ...settings,
      },
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error("[WeekFlow Config POST]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

/**
 * PUT /api/weekflow/config
 * Actualiza la configuración de WeekFlow
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.plan?.weekflowAccess) {
      return NextResponse.json(
        { ok: false, error: "weekflow.errors.planRequired" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    }

    const config = await prisma.weekFlowConfig.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ ok: true, config });
  } catch (error) {
    console.error("[WeekFlow Config PUT]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
