// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    // Autenticación obligatoria
    const token = await getToken({ req });
    if (!token?.sub || !token?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    // Usar senderId del token autenticado, NO del body (previene suplantación)
    const senderId = token.sub;

    let thread = body.threadId
      ? await prisma.messageThread.findUnique({ where: { id: body.threadId } })
      : null;

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: {
          type: body.type ?? "direct",
          name: body.subject ?? null,
        },
      });
    }

    const msg = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId,
        content: body.content,
        type: body.messageType ?? "text",
        metadata: {
          emotionTag: body.emotionTag ?? null,
          intent: body.intent ?? null,
          sentiment: body.sentiment ?? null,
          ...(body.meta ?? {}),
        },
      },
    });

    // Asegurar participante
    await prisma.messageParticipant.upsert({
      where: {
        threadId_userId: { threadId: thread.id, userId: senderId },
      },
      update: { lastReadAt: new Date() },
      create: {
        threadId: thread.id,
        userId: senderId,
        role: "member",
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, threadId: thread.id, message: msg });
  } catch (error: any) {
    console.error("❌ Error POST /api/messages:", error);
    return NextResponse.json(
      { error: "Error al enviar mensaje" },
      { status: 500 }
    );
  }
}
