// apps/rowi/src/lib/kernel/alerts.service.ts
import { prisma } from "../db";
import type { EmitAlertInput } from "./types";

export async function emitAlert(input: EmitAlertInput) {
  const alert = await prisma.alert.create({
    data: {
      tenantId: input.tenantId ?? null,
      hubId: input.hubId ?? null,
      userId: input.userId ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      severity: input.severity ?? 1,
      emotionTag: input.emotionTag ?? null,
      expiresAt: input.expiresAt ?? null,
      metadata: input.metadata ?? {},
    },
  });
  return alert;
}