// apps/rowi/src/app/api/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  let thread = body.threadId
    ? await prisma.messageThread.findUnique({ where: { id: body.threadId } })
    : null;

  if (!thread) {
    thread = await prisma.messageThread.create({
      data: {
        tenantId: body.tenantId ?? null,
        hubId: body.hubId ?? null,
        subject: body.subject ?? null,
        type: body.type ?? "user_dm",
      },
    });
  }

  const msg = await prisma.message.create({
    data: {
      threadId: thread.id,
      senderId: body.senderId ?? null,
      senderType: body.senderType ?? "user",
      content: body.content,
      emotionTag: body.emotionTag ?? null,
      intent: body.intent ?? null,
      sentiment: body.sentiment ?? null,
      meta: body.meta ?? {},
    },
  });

  // Asegura que el remitente esté en participantes
  if (body.senderId) {
    await prisma.messageParticipant.upsert({
      where: {
        threadId_userId: { threadId: thread.id, userId: body.senderId },
      },
      update: { lastReadAt: new Date() },
      create: {
        threadId: thread.id,
        userId: body.senderId,
        role: "member",
        lastReadAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true, threadId: thread.id, message: msg });
}