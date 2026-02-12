// src/app/api/social/messages/threads/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   ✓ Marcar mensajes como leídos

   POST — Marcar thread como leído
========================================================= */

export async function POST(
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

    // Verificar participación
    const participant = await prisma.messageParticipant.findUnique({
      where: { threadId_userId: { threadId: id, userId: user.id } },
    });
    if (!participant) {
      return NextResponse.json(
        { ok: false, error: "No eres parte de esta conversación" },
        { status: 403 }
      );
    }

    // Obtener mensajes no leídos por este usuario
    const unreadMessages = await prisma.message.findMany({
      where: {
        threadId: id,
        NOT: { readBy: { has: user.id } },
      },
      select: { id: true, readBy: true },
    });

    // Agregar userId a readBy de cada mensaje
    for (const msg of unreadMessages) {
      await prisma.message.update({
        where: { id: msg.id },
        data: { readBy: { push: user.id } },
      });
    }

    // Actualizar lastReadAt del participante
    await prisma.messageParticipant.update({
      where: { threadId_userId: { threadId: id, userId: user.id } },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({
      ok: true,
      markedAsRead: unreadMessages.length,
    });
  } catch (e: any) {
    console.error("❌ POST /social/messages/threads/[id]/read error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al marcar como leído" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
