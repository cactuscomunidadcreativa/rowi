import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

/**
 * Obtiene el número de semana ISO y el año
 */
function getISOWeekData(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { weekNumber, year: d.getUTCFullYear() };
}

/**
 * Obtiene el inicio y fin de la semana (lunes a domingo)
 */
function getWeekBounds(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { weekStart, weekEnd };
}

/**
 * Resuelve un hubId que puede ser un Hub ID o un RowiCommunity ID
 * y devuelve el Hub ID real, tenantId y nombre para WeekFlowConfig.
 * WeekFlowConfig.hubId tiene FK a Hub, así que nunca debe recibir un communityId.
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
    // Comunidad sin hub asociado — buscar hub del tenant
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
 * GET /api/weekflow/sessions?hubId=xxx
 * Lista sesiones de un hub (hubId puede ser Hub ID o RowiCommunity ID)
 *
 * GET /api/weekflow/sessions?hubId=xxx&current=true
 * Obtiene o crea la sesión de la semana actual
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
    const current = searchParams.get("current") === "true";

    if (!rawHubId) {
      return NextResponse.json({ ok: false, error: "hubId required" }, { status: 400 });
    }

    // Resolver el Hub ID real (puede venir como Hub ID o RowiCommunity ID)
    const resolved = await resolveHubId(rawHubId);
    if (!resolved) {
      return NextResponse.json({ ok: false, error: "Hub/Community not found" }, { status: 404 });
    }

    const { hubId, tenantId, name } = resolved;

    // Obtener o auto-crear configuración
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

    if (current) {
      // Obtener o crear sesión actual
      const now = new Date();
      const { weekNumber, year } = getISOWeekData(now);
      const { weekStart, weekEnd } = getWeekBounds(now);

      let session = await prisma.weekFlowSession.findFirst({
        where: {
          configId: config.id,
          year,
          weekNumber,
        },
        include: {
          contributions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          moodCheckins: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      });

      if (!session) {
        // Crear sesión automáticamente
        session = await prisma.weekFlowSession.create({
          data: {
            configId: config.id,
            tenantId: config.tenantId,
            hubId: config.hubId,
            year,
            weekNumber,
            weekStart,
            weekEnd,
          },
          include: {
            contributions: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
            moodCheckins: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        });
      }

      // Verificar si el usuario ya hizo check-in
      const userCheckin = session.moodCheckins.find((c) => c.userId === auth.id);

      return NextResponse.json({
        ok: true,
        session,
        userCheckin,
        requiresCheckin: config.requireMoodCheckin && !userCheckin,
      });
    }

    // Listar todas las sesiones
    const sessions = await prisma.weekFlowSession.findMany({
      where: { configId: config.id },
      orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
      take: 12, // Últimas 12 semanas
      include: {
        _count: {
          select: {
            contributions: true,
            moodCheckins: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, sessions });
  } catch (error) {
    console.error("[WeekFlow Sessions GET]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
