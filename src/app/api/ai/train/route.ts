// apps/rowi/src/app/api/ai/train/route.ts
import { NextResponse } from "next/server";
import { train } from "@/lib/kernel/training.service";

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.agentId) return NextResponse.json({ ok: false, error: "agentId requerido" }, { status: 400 });

  const job = await scheduleTrainingJob({
    agentId: body.agentId,
    datasetId: body.datasetId,
    tenantId: body.tenantId,
    hubId: body.hubId,
  });
  return NextResponse.json({ ok: true, jobId: job.id });
}