// src/app/api/social/messages/threads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   💬 API de Threads de Mensajería

   GET  — Listar threads del usuario con último mensaje
   POST — Crear/obtener thread con otro usuario
========================================================= */

/* =========================================================
   🔍 GET — Listar threads
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

    const threads = await prisma.messageThread.findMany({
      where: {
        participants: { some: { userId: user.id } },
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true, headline: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            readBy: true,
          },
        },
        _count: { select: { messages: true } },
      },
    });

    // Enriquecer con datos de la otra persona y unread count
    const enrichedThreads = threads.map((thread) => {
      const otherParticipants = thread.participants.filter(
        (p) => p.userId !== user.id
      );
      const myParticipant = thread.participants.find((p) => p.userId === user.id);
      const lastMessage = thread.messages[0];
      const unreadCount = lastMessage && !lastMessage.readBy.includes(user.id)
        ? 1 // Simplificado — en producción contar todos los no leídos
        : 0;

      return {
        id: thread.id,
        type: thread.type,
        name: thread.name,
        lastMessageAt: thread.lastMessageAt,
        otherUser: otherParticipants[0]?.user || null,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content.slice(0, 100),
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.readBy.includes(user.id),
            }
          : null,
        unreadCount,
        isMuted: myParticipant?.mutedUntil
          ? new Date(myParticipant.mutedUntil) > new Date()
          : false,
      };
    });

    return NextResponse.json({ ok: true, threads: enrichedThreads });
  } catch (e: any) {
    console.error("❌ GET /social/messages/threads error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener threads" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST — Crear o obtener thread con otro usuario
   Body: { userId }
========================================================= */
export async function POST(req: NextRequest) {
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

    const { userId: otherUserId } = await req.json();

    if (!otherUserId) {
      return NextResponse.json(
        { ok: false, error: "userId es obligatorio" },
        { status: 400 }
      );
    }

    if (otherUserId === user.id) {
      return NextResponse.json(
        { ok: false, error: "No puedes crear un thread contigo mismo" },
        { status: 400 }
      );
    }

    // Verificar que son conexiones activas
    const relation = await prisma.rowiRelation.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: otherUserId },
          { initiatorId: otherUserId, receiverId: user.id },
        ],
        status: "active",
      },
    });

    if (!relation) {
      return NextResponse.json(
        { ok: false, error: "Solo puedes enviar mensajes a tus conexiones" },
        { status: 403 }
      );
    }

    // Buscar thread existente entre los 2 usuarios
    const existingThread = await prisma.messageThread.findFirst({
      where: {
        type: "direct",
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (existingThread) {
      return NextResponse.json({ ok: true, thread: existingThread, created: false });
    }

    // Crear nuevo thread
    const thread = await prisma.messageThread.create({
      data: {
        type: "direct",
        participants: {
          create: [
            { userId: user.id, role: "member" },
            { userId: otherUserId, role: "member" },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ ok: true, thread, created: true }, { status: 201 });
  } catch (e: any) {
    console.error("❌ POST /social/messages/threads error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al crear thread" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
