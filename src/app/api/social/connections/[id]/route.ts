// src/app/api/social/connections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   👥 API de Conexión Individual

   PATCH  — Aceptar/rechazar/bloquear solicitud
   DELETE — Eliminar conexión
========================================================= */

/* =========================================================
   ✏️ PATCH — Actualizar estado de conexión
   Body: { action: "accept" | "reject" | "block" }
========================================================= */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { action } = await req.json();

    if (!["accept", "reject", "block"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Acción inválida. Usa: accept, reject, block" },
        { status: 400 }
      );
    }

    // Buscar la relación
    const relation = await prisma.rowiRelation.findUnique({ where: { id } });
    if (!relation) {
      return NextResponse.json(
        { ok: false, error: "Conexión no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es parte de esta relación
    const isInitiator = relation.initiatorId === user.id;
    const isReceiver = relation.receiverId === user.id;
    if (!isInitiator && !isReceiver) {
      return NextResponse.json(
        { ok: false, error: "No tienes permiso para modificar esta conexión" },
        { status: 403 }
      );
    }

    // Solo el receptor puede aceptar/rechazar solicitudes pending
    if (action === "accept" || action === "reject") {
      if (relation.status !== "pending") {
        return NextResponse.json(
          { ok: false, error: "Solo se pueden aceptar/rechazar solicitudes pendientes" },
          { status: 400 }
        );
      }
      if (!isReceiver) {
        return NextResponse.json(
          { ok: false, error: "Solo el receptor puede aceptar/rechazar la solicitud" },
          { status: 403 }
        );
      }
    }

    const statusMap: Record<string, string> = {
      accept: "active",
      reject: "rejected",
      block: "blocked",
    };

    const updated = await prisma.rowiRelation.update({
      where: { id },
      data: { status: statusMap[action] },
    });

    // Si se aceptó, notificar al initiator y otorgar puntos a ambos
    if (action === "accept") {
      // Notificar al que envió la solicitud
      await prisma.notificationQueue.create({
        data: {
          userId: relation.initiatorId,
          type: "NEW_CONNECTION",
          channel: "IN_APP",
          title: "¡Conexión aceptada!",
          message: `${user.name || "Alguien"} aceptó tu solicitud de conexión`,
          priority: 1,
          status: "PENDING",
          actionUrl: `/social/connections`,
          metadata: { fromUserId: user.id, action: "accepted" },
        },
      });

      // Otorgar puntos a ambos usuarios
      try {
        const { awardPoints } = await import("@/services/gamification");
        await Promise.all([
          awardPoints({
            userId: relation.initiatorId,
            amount: 15,
            reason: "CONNECTION",
            reasonId: updated.id,
            description: "Conexión aceptada",
          }),
          awardPoints({
            userId: relation.receiverId,
            amount: 15,
            reason: "CONNECTION",
            reasonId: updated.id,
            description: "Conexión aceptada",
          }),
        ]);
      } catch (err) {
        console.error("⚠️ Error awarding connection points:", err);
      }
    }

    // Registrar actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        targetUserId: isInitiator ? relation.receiverId : relation.initiatorId,
        action: `CONNECTION_${action.toUpperCase()}`,
        entity: "RowiRelation",
        targetId: updated.id,
        details: { previousStatus: relation.status, newStatus: updated.status },
      },
    });

    console.log(`👥 Conexión ${action}: ${id}`);
    return NextResponse.json({ ok: true, connection: updated });
  } catch (e: any) {
    console.error("❌ PATCH /social/connections/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al actualizar conexión" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE — Eliminar conexión
========================================================= */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const relation = await prisma.rowiRelation.findUnique({ where: { id } });
    if (!relation) {
      return NextResponse.json(
        { ok: false, error: "Conexión no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es parte de esta relación
    if (relation.initiatorId !== user.id && relation.receiverId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "No tienes permiso para eliminar esta conexión" },
        { status: 403 }
      );
    }

    await prisma.rowiRelation.delete({ where: { id } });

    // Registrar actividad
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        targetUserId: relation.initiatorId === user.id ? relation.receiverId : relation.initiatorId,
        action: "CONNECTION_REMOVED",
        entity: "RowiRelation",
        targetId: id,
        details: { previousStatus: relation.status },
      },
    });

    console.log(`🗑️ Conexión eliminada: ${id}`);
    return NextResponse.json({ ok: true, message: "Conexión eliminada" });
  } catch (e: any) {
    console.error("❌ DELETE /social/connections/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al eliminar conexión" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
