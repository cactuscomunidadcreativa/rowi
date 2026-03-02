import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

const VALID_TYPES = ["like", "dislike", "bug"];

export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, messageId, messageText, comment, locale, metadata } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { ok: false, error: "Invalid type. Must be: like, dislike, or bug" },
        { status: 400 }
      );
    }

    if (type === "bug" && (!comment || !comment.trim())) {
      return NextResponse.json(
        { ok: false, error: "Comment is required for bug reports" },
        { status: 400 }
      );
    }

    await prisma.rowiChatFeedback.create({
      data: {
        userId: user.id,
        type,
        messageId: messageId || null,
        messageText: messageText ? String(messageText).slice(0, 500) : null,
        comment: comment ? String(comment).trim() : null,
        locale: locale || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] POST /api/rowi/feedback error:", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
