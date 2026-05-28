export const runtime = "nodejs";
export const maxDuration = 300; // recompute may take a while as the rowiverse grows

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { recomputeAll } from "@/lib/vital-signs/benchmark-recompute";

/**
 * POST /api/admin/vital-signs/benchmark/recompute
 * Body: { scope?: "OVS" | "TVS" | "LVS" | "FVS" }
 *
 * Recomputes VitalSignsBenchmarkStat + VitalSignsBenchmarkCorrelation
 * from the current set of contributing ScoreSource rows. Idempotent.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  let body: { scope?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine — recompute everything
  }

  const scope =
    body.scope && ["OVS", "TVS", "LVS", "FVS"].includes(body.scope)
      ? (body.scope as "OVS" | "TVS" | "LVS" | "FVS")
      : undefined;

  const t0 = Date.now();
  const result = await recomputeAll({ scope });
  const ms = Date.now() - t0;

  return NextResponse.json({
    ok: true,
    scope: scope ?? "ALL",
    durationMs: ms,
    ...result,
  });
}
