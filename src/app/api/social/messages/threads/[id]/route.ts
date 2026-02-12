// src/app/api/social/messages/threads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

/* =========================================================
   💬 Thread Individual — Obtener mensajes paginados

   GET — Mensajes del thread (cursor pagination)
========================================================= */

export async function GET(
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

    // Verificar que el usuario es participante
    const participant = await prisma.messageParticipant.findUnique({
      where: { threadId_userId: { threadId: id, userId: user.id } },
    });
    if (!participant) {
      return NextResponse.json(
        { ok: false, error: "No eres parte de esta conversación" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const where: any = { threadId: id };
    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore
      ? items[items.length - 1]?.createdAt.toISOString()
      : undefined;

    return NextResponse.json({
      ok: true,
      messages: items.reverse(), // Cronológico
      nextCursor,
    });
  } catch (e: any) {
    console.error("❌ GET /social/messages/threads/[id] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error al obtener mensajes" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
