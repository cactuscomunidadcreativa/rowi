export const runtime = "nodejs";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { recomputeVsSeiCorrelations } from "@/lib/vital-signs/vs-sei";

/**
 * POST /api/admin/vital-signs/cross-instrument/recompute
 * Recomputes VS↔SEI correlations across all cohorts. Idempotent.
 */
export async function POST() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const t0 = Date.now();
  const result = await recomputeVsSeiCorrelations();
  return NextResponse.json({ ok: true, durationMs: Date.now() - t0, ...result });
}
