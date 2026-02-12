// src/app/api/social/messages/threads/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   📩 Enviar Mensaje

   POST — Enviar mensaje al thread
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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });
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

    const { content, type = "text", metadata } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "El mensaje no puede estar vacío" },
        { status: 400 }
      );
    }

    // Crear mensaje y actualizar thread
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          threadId: id,
          senderId: user.id,
          content: content.trim(),
          type,
          metadata: metadata || undefined,
          readBy: [user.id], // El sender ya lo "leyó"
        },
        include: {
          sender: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      await tx.messageThread.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      });

      return msg;
    });

    // Notificar a otros participantes
    const otherParticipants = await prisma.messageParticipant.findMany({
      where: { threadId: id, userId: { not: user.id } },
      select: { userId: true, mutedUntil: true },
    });

    for (const other of otherParticipants) {
      // Skip si está silenciado
      if (other.mutedUntil && new Date(other.mutedUntil) > new Date()) continue;

      try {
        await prisma.notificationQueue.create({
          data: {
            userId: other.userId,
            type: "MESSAGE_RECEIVED",
            channel: "IN_APP",
            title: "Nuevo mensaje",
            message: `${user.name || "Alguien"}: ${content.trim().slice(0, 50)}`,
            priority: 1,
            status: "PENDING",
            actionUrl: `/social/messages?thread=${id}`,
            metadata: { threadId: id, senderId: user.id },
          },
        });
      } catch (err) {
        console.error("⚠️ Error creating message notification:", err);
      }
    }

    return NextResponse.json({ ok: true, message }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /social/messages/threads/[id]/messages error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al enviar mensaje" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
