// apps/rowi/src/app/api/logs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const log = await prisma.userActivityLog.create({
    data: {
      userId: body.userId ?? null,
      tenantId: body.tenantId ?? null,
      hubId: body.hubId ?? null,
      sessionId: body.sessionId ?? null,
      ipAddress: body.ipAddress ?? null,
      userAgent: body.userAgent ?? null,
      page: body.page ?? null,
      action: body.action ?? null,
      metadata: body.metadata ?? {},
      emotionTag: body.emotionTag ?? null,
      confidence: body.confidence ?? null,
    },
  });
  return NextResponse.json({ ok: true, logId: log.id });
}