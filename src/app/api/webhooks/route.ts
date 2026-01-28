// apps/rowi/src/app/api/webhooks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/** Receptor genérico: persiste payload y dispara alertas si se configura */
export async function POST(req: Request) {
  const body = await req.json();
  // Aquí puedes validar firma/secret si usas Webhook.secret
  // y/o enrutar por tipo de evento a BackgroundTask.
  const created = await prisma.backgroundTask.create({
    data: {
      type: "analysis",
      status: "pending",
      tenantId: body.tenantId ?? null,
      hubId: body.hubId ?? null,
      payload: body,
    },
  });
  return NextResponse.json({ ok: true, taskId: created.id });
}