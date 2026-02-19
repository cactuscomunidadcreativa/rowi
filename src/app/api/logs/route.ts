// src/app/api/logs/route.ts
// Migrado de userActivityLog → activityLog (modelo unificado)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const log = await prisma.activityLog.create({
      data: {
        userId: body.userId ?? token.sub ?? null,
        action: body.action ?? "PAGE_VIEW",
        entity: body.page ?? null,
        details: {
          tenantId: body.tenantId ?? null,
          hubId: body.hubId ?? null,
          sessionId: body.sessionId ?? null,
          metadata: body.metadata ?? {},
          emotionTag: body.emotionTag ?? null,
          confidence: body.confidence ?? null,
        },
        ipAddress: body.ipAddress ?? null,
        userAgent: body.userAgent ?? null,
      },
    });
    return NextResponse.json({ ok: true, logId: log.id });
  } catch (error: any) {
    console.error("❌ Error POST /api/logs:", error);
    return NextResponse.json(
      { error: "Error al crear log" },
      { status: 500 }
    );
  }
}
