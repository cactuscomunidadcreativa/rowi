// apps/rowi/src/lib/kernel/alerts.service.ts
import { prisma } from "../db";
import type { EmitAlertInput } from "./types";

// NOTE: `prisma.alert` corresponds to a model that was removed/renamed
// during the schema consolidation. Cast keeps this file compilable
// until the kernel feature is either re-wired to WorkspaceAlert or
// removed entirely.
const p = prisma as unknown as any;

export async function emitAlert(input: EmitAlertInput) {
  const alert = await p.alert.create({
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