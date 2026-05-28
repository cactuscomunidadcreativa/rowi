export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * GET /api/admin/vital-signs/cross-instrument
 * Summary of paired cohorts + top VS↔SEI correlations for the admin panel.
 */
export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const [cohorts, correlations] = await Promise.all([
    prisma.vsSeiCohort.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        vsScope: true,
        source: true,
        country: true,
        sector: true,
        vsSampleSize: true,
        seiSampleSize: true,
        createdAt: true,
        _count: { select: { metrics: true } },
      },
    }),
    prisma.vsSeiCorrelation.findMany({
      orderBy: [{ vsScope: "asc" }, { correlation: "desc" }],
      select: { vsScope: true, vsKey: true, seiKey: true, correlation: true, n: true, calculatedAt: true },
    }),
  ]);

  return NextResponse.json({ ok: true, cohorts, correlations });
}
