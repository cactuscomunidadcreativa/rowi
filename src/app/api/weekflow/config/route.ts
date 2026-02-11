import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * Resuelve un hubId que puede ser un Hub ID o un RowiCommunity ID
 * y devuelve el Hub ID real para WeekFlowConfig (FK a Hub).
 */
async function resolveHubId(rawId: string): Promise<{
  hubId: string;
  tenantId: string | null;
  name: string;
} | null> {
  // 1. Intentar como Hub directamente
  const hub = await prisma.hub.findUnique({
    where: { id: rawId },
    select: { id: true, tenantId: true, name: true },
  });
  if (hub) {
    return { hubId: hub.id, tenantId: hub.tenantId, name: hub.name };
  }

  // 2. Intentar como RowiCommunity — usar su hubId real
  const community = await prisma.rowiCommunity.findUnique({
    where: { id: rawId },
    select: { tenantId: true, name: true, hubId: true },
  });
  if (community) {
    if (community.hubId) {
      return { hubId: community.hubId, tenantId: community.tenantId, name: community.name };
    }
    if (community.tenantId) {
      const tenantHub = await prisma.hub.findFirst({
        where: { tenantId: community.tenantId },
        select: { id: true },
      });
      if (tenantHub) {
        return { hubId: tenantHub.id, tenantId: community.tenantId, name: community.name };
      }
    }
  }
  return null;
}

/**
 * GET /api/weekflow/config?hubId=xxx
 * Obtiene la configuración de WeekFlow para un hub
 * hubId puede ser Hub ID o RowiCommunity ID (se resuelve automáticamente)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users

    const { searchParams } = new URL(req.url);
    const rawHubId = searchParams.get("hubId");

    if (!rawHubId) {
      return NextResponse.json({ ok: false, error: "hubId required" }, { status: 400 });
    }

    // Resolver Hub ID real (puede venir como Hub ID o RowiCommunity ID)
    const resolved = await resolveHubId(rawHubId);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: "Hub/Community not found" }, { status: 404 });
    }

    const { hubId, tenantId, name } = resolved;

    // Buscar o crear configuración
    let config = await prisma.weekFlowConfig.findFirst({
      where: { hubId },
    });

    if (!config) {
      config = await prisma.weekFlowConfig.create({
        data: {
          hubId,
          tenantId,
          name: `WeekFlow - ${name}`,
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

    // Plan check bypassed — WeekFlow open for all users

    const body = await req.json();
    const { hubId: rawHubId, tenantId: _tenantId, name, ...settings } = body;

    if (!rawHubId) {
      return NextResponse.json({ ok: false, error: "hubId required" }, { status: 400 });
    }

    // Resolver Hub ID real
    const resolved = await resolveHubId(rawHubId);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: "Hub/Community not found" }, { status: 404 });
    }

    // Verificar si ya existe
    const existing = await prisma.weekFlowConfig.findFirst({
      where: { hubId: resolved.hubId },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Config already exists for this hub" },
        { status: 409 }
      );
    }

    const config = await prisma.weekFlowConfig.create({
      data: {
        hubId: resolved.hubId,
        tenantId: resolved.tenantId,
        name: name || `WeekFlow - ${resolved.name}`,
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

    // Plan check bypassed — WeekFlow open for all users

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
