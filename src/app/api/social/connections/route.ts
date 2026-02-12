// src/app/api/social/connections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   👥 API de Conexiones Sociales

   GET  — Listar conexiones del usuario (filtrar por status)
   POST — Enviar solicitud de conexión
========================================================= */

/* =========================================================
   🔍 GET — Listar conexiones
   Query params: ?status=active|pending|blocked&direction=sent|received
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // active | pending | blocked | rejected
    const direction = searchParams.get("direction"); // sent | received (solo para pending)
    const search = searchParams.get("q");

    // Construir query según filtros
    const where: any = {
      OR: [{ initiatorId: user.id }, { receiverId: user.id }],
    };

    if (status) {
      where.status = status;
    }

    if (direction === "sent" && status === "pending") {
      where.OR = [{ initiatorId: user.id }];
    } else if (direction === "received" && status === "pending") {
      where.OR = [{ receiverId: user.id }];
    }

    const relations = await prisma.rowiRelation.findMany({
      where,
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            headline: true,
            bio: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            headline: true,
            bio: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Mapear para que "otherUser" sea siempre la otra persona
    const connections = relations.map((rel) => {
      const isInitiator = rel.initiatorId === user.id;
      const otherUser = isInitiator ? rel.receiver : rel.initiator;
      return {
        id: rel.id,
        status: rel.status,
        type: rel.type,
        strength: rel.strength,
        context: rel.context,
        direction: isInitiator ? "sent" : "received",
        createdAt: rel.createdAt,
        updatedAt: rel.updatedAt,
        user: otherUser,
      };
    });

    // Filtrar por búsqueda si aplica
    const filtered = search
      ? connections.filter(
          (c) =>
            c.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.user.email?.toLowerCase().includes(search.toLowerCase())
        )
      : connections;

    // Agrupar por status para el dashboard
    const counts = {
      active: connections.filter((c) => c.status === "active").length,
      pending_sent: connections.filter((c) => c.status === "pending" && c.direction === "sent").length,
      pending_received: connections.filter((c) => c.status === "pending" && c.direction === "received").length,
      blocked: connections.filter((c) => c.status === "blocked").length,
    };

    return NextResponse.json({
      ok: true,
      total: filtered.length,
      counts,
      connections: filtered,
    });
  } catch (e: any) {
    console.error("❌ GET /social/connections error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener conexiones" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Enviar solicitud de conexión
   Body: { receiverId, context?, message? }
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { receiverId, context, message } = await req.json();

    if (!receiverId) {
      return NextResponse.json(
        { ok: false, error: "receiverId es obligatorio" },
        { status: 400 }
      );
    }

    if (receiverId === user.id) {
      return NextResponse.json(
        { ok: false, error: "No puedes enviarte una solicitud a ti mismo" },
        { status: 400 }
      );
    }

    // Verificar que el receptor existe
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true },
    });
    if (!receiver) {
      return NextResponse.json(
        { ok: false, error: "Usuario receptor no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no exista ya una relación
    const existing = await prisma.rowiRelation.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId },
          { initiatorId: receiverId, receiverId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { ok: false, error: "Ya están conectados" },
          { status: 409 }
        );
      }
      if (existing.status === "pending") {
        return NextResponse.json(
          { ok: false, error: "Ya existe una solicitud pendiente" },
          { status: 409 }
        );
      }
      if (existing.status === "blocked") {
        return NextResponse.json(
          { ok: false, error: "No se puede enviar solicitud a este usuario" },
          { status: 403 }
        );
      }
      // Si fue rejected, permitir re-enviar (actualizar la existente)
      if (existing.status === "rejected") {
        const updated = await prisma.rowiRelation.update({
          where: { id: existing.id },
          data: {
            initiatorId: user.id,
            receiverId,
            status: "pending",
            context: context || existing.context,
          },
        });

        // Crear notificación
        await createConnectionNotification(user.id, user.name || "Alguien", receiverId);

        // Registrar actividad
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            targetUserId: receiverId,
            action: "CONNECTION_REQUEST",
            entity: "RowiRelation",
            targetId: updated.id,
            details: { context, message, reRequest: true },
          },
        });

        return NextResponse.json({ ok: true, connection: updated });
      }
    }

    // Crear nueva relación
    const relation = await prisma.rowiRelation.create({
      data: {
        initiatorId: user.id,
        receiverId,
        type: "connection",
        status: "pending",
        context: context || null,
      },
    });

    // Crear notificación para el receptor
    await createConnectionNotification(user.id, user.name || "Alguien", receiverId);

    // Registrar actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        targetUserId: receiverId,
        action: "CONNECTION_REQUEST",
        entity: "RowiRelation",
        targetId: relation.id,
        details: { context, message },
      },
    });

    console.log(`👥 Solicitud de conexión: ${user.id} → ${receiverId}`);
    return NextResponse.json({ ok: true, connection: relation }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /social/connections error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al enviar solicitud" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🔔 Helper — Crear notificación de conexión
========================================================= */
async function createConnectionNotification(
  fromUserId: string,
  fromName: string,
  toUserId: string
) {
  try {
    await prisma.notificationQueue.create({
      data: {
        userId: toUserId,
        type: "NEW_CONNECTION",
        channel: "IN_APP",
        title: "Nueva solicitud de conexión",
        message: `${fromName} quiere conectar contigo`,
        priority: 1,
        status: "PENDING",
        actionUrl: "/social/connections?tab=pending",
        metadata: { fromUserId },
      },
    });
  } catch (err) {
    console.error("⚠️ Error creating connection notification:", err);
  }
}

export const dynamic = "force-dynamic";
