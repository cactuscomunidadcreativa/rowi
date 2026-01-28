// apps/rowi/src/app/api/alerts/route.ts
import { NextResponse } from "next/server";
import { getAlerts } from "@/lib/kernel/alerts.service";

export async function POST(req: Request) {
  const body = await req.json();
  const alert = await emitAlert({
    tenantId: body.tenantId,
    hubId: body.hubId,
    userId: body.userId,
    type: body.type ?? "system",
    title: body.title,
    message: body.message,
    severity: body.severity,
    emotionTag: body.emotionTag,
    metadata: body.metadata,
  });
  return NextResponse.json({ ok: true, alert });
}