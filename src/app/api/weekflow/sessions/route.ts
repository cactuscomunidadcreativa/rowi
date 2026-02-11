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
 * GET /api/weekflow/sessions?hubId=xxx
 * Lista sesiones de un hub
 *
 * GET /api/weekflow/sessions/current?hubId=xxx
 * Obtiene o crea la sesión de la semana actual
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Plan check bypassed — WeekFlow open for all users
    // if (!auth.plan?.weekflowAccess) { ... }

    const { searchParams } = new URL(req.url);
    const hubId = searchParams.get("hubId");
    const current = searchParams.get("current") === "true";

    if (!hubId) {
      return NextResponse.json({ ok: false, error: "hubId required" }, { status: 400 });
    }

    // Obtener o auto-crear configuración
    let config = await prisma.weekFlowConfig.findFirst({
      where: { hubId },
    });

    if (!config) {
      // Auto-create config — try Hub first, then RowiCommunity
      const hub = await prisma.hub.findUnique({
        where: { id: hubId },
        select: { tenantId: true, name: true },
      });

      if (hub) {
        config = await prisma.weekFlowConfig.create({
          data: {
            hubId,
            tenantId: hub.tenantId,
            name: `WeekFlow - ${hub.name}`,
          },
        });
      } else {
        // Check if hubId is actually a RowiCommunity ID
        const community = await prisma.rowiCommunity.findUnique({
          where: { id: hubId },
          select: { tenantId: true, name: true, hubId: true },
        });

        if (community) {
          config = await prisma.weekFlowConfig.create({
            data: {
              hubId, // using community ID as hubId
              tenantId: community.tenantId,
              name: `WeekFlow - ${community.name}`,
            },
          });
        } else {
          return NextResponse.json({ ok: false, error: "Hub/Community not found" }, { status: 404 });
        }
      }
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
