// apps/rowi/src/app/api/ai/train/route.ts
import { NextResponse } from "next/server";
import { scheduleTrainingJob } from "@/lib/kernel/training.service";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { tenantIdsForScope } from "@/core/admin/scopedList";

export async function POST(req: Request) {
  // 🔐 Agendar training consume recursos de cómputo: solo admins en su scope.
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const body = await req.json();
  if (!body.agentId) return NextResponse.json({ ok: false, error: "agentId requerido" }, { status: 400 });

  const allowedTenantIds = await tenantIdsForScope(auth.scope);
  if (allowedTenantIds !== null && body.tenantId && !allowedTenantIds.includes(body.tenantId)) {
    return NextResponse.json({ ok: false, error: "No autorizado para este tenant" }, { status: 403 });
  }

  const job = await scheduleTrainingJob({
    agentId: body.agentId,
    datasetId: body.datasetId,
    tenantId: body.tenantId,
    hubId: body.hubId,
  });
  return NextResponse.json({ ok: true, jobId: job.id });
}