/**
 * 🧠 API: Six Seconds SEI Requests
 * GET /api/admin/six-seconds/requests - Listar solicitudes de SEI
 * PATCH /api/admin/six-seconds/requests - Actualizar solicitud (enviar link, marcar como enviado)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

// =========================================================
// GET - Listar solicitudes de SEI
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: Record<string, any> = {};
    if (status) {
      where.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.seiRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          email: true,
          name: true,
          country: true,
          language: true,
          status: true,
          seiLink: true,
          sixSecondsProjectId: true,
          requestedAt: true,
          sentAt: true,
          startedAt: true,
          completedAt: true,
          expiresAt: true,
          adminNotes: true,
          processedBy: true,
        },
      }),
      prisma.seiRequest.count({ where }),
    ]);

    // Agrupar por estado para stats
    const statusCounts = await prisma.seiRequest.groupBy({
      by: ["status"],
      _count: true,
    });

    return NextResponse.json({
      ok: true,
      requests,
      total,
      stats: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error("❌ Error fetching SEI requests:", error);
    return NextResponse.json(
      { error: "fetch_failed" },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH - Actualizar solicitud de SEI
// =========================================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, seiLink, status, sixSecondsProjectId, adminNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "request_id_required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
      processedBy: session.user.email,
    };

    if (seiLink !== undefined) {
      updateData.seiLink = seiLink;
    }

    if (sixSecondsProjectId !== undefined) {
      updateData.sixSecondsProjectId = sixSecondsProjectId;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (status) {
      updateData.status = status;

      // Actualizar timestamps según el estado
      if (status === "SENT" && !updateData.sentAt) {
        updateData.sentAt = new Date();
      }
      if (status === "IN_PROGRESS" && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === "COMPLETED" && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    const updated = await prisma.seiRequest.update({
      where: { id },
      data: updateData,
    });

    // Si se envió el link, actualizar el usuario
    if (status === "SENT" && seiLink) {
      await prisma.user.update({
        where: { id: updated.userId },
        data: {
          onboardingStatus: "PENDING_SEI",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      request: updated,
    });
  } catch (error) {
    console.error("❌ Error updating SEI request:", error);
    return NextResponse.json(
      { error: "update_failed" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE - Cancelar solicitud de SEI
// =========================================================
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "request_id_required" },
        { status: 400 }
      );
    }

    await prisma.seiRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
        processedBy: session.user.email,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error cancelling SEI request:", error);
    return NextResponse.json(
      { error: "cancel_failed" },
      { status: 500 }
    );
  }
}
