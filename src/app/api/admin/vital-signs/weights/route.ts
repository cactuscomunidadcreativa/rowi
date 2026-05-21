export const runtime = "nodejs";

/**
 * GET    /api/admin/vital-signs/weights?pp=CODE
 *   Lists all versions of weights for a pulse point (or all PPs if no `pp`).
 *
 * POST   /api/admin/vital-signs/weights
 *   Body: { pulsePointCode, version, predictor, weight, notes? }
 *   Creates or upserts a single weight row (manual override). SuperAdmin only.
 *
 * PATCH  /api/admin/vital-signs/weights
 *   Body: { pulsePointCode, version, active: true }
 *   Marks the given version active and deactivates all other versions for that PP.
 *   SuperAdmin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export async function GET(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!auth.isSuperAdmin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const pp = url.searchParams.get("pp");

  const rows = await prisma.pulsePointWeights.findMany({
    where: pp ? { pulsePointCode: pp } : {},
    orderBy: [{ pulsePointCode: "asc" }, { version: "desc" }, { predictor: "asc" }],
    take: 5000,
  });

  // Group by pulsePointCode → version → predictor[]
  const grouped: Record<string, Record<number, typeof rows>> = {};
  for (const r of rows) {
    grouped[r.pulsePointCode] ??= {};
    grouped[r.pulsePointCode][r.version] ??= [];
    grouped[r.pulsePointCode][r.version].push(r);
  }

  return NextResponse.json({ ok: true, weights: grouped });
}

export async function POST(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!auth.isSuperAdmin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { pulsePointCode, version, predictor, weight, notes } = body as {
    pulsePointCode: string;
    version: number;
    predictor: string;
    weight: number;
    notes?: string;
  };
  if (!pulsePointCode || typeof version !== "number" || !predictor || typeof weight !== "number") {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const row = await prisma.pulsePointWeights.upsert({
    where: {
      pulsePointCode_version_predictor: { pulsePointCode, version, predictor },
    },
    update: { weight, notes: notes ?? null },
    create: {
      pulsePointCode,
      version,
      predictor,
      weight,
      notes: notes ?? null,
      active: false,
      createdById: auth.id,
    },
  });

  return NextResponse.json({ ok: true, row });
}

export async function PATCH(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!auth.isSuperAdmin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { pulsePointCode, version, active } = body as {
    pulsePointCode: string;
    version: number;
    active: boolean;
  };
  if (!pulsePointCode || typeof version !== "number") {
    return NextResponse.json({ ok: false, error: "pulsePointCode and version required" }, { status: 400 });
  }

  if (active) {
    // Activate this version and deactivate all others for the same PP, atomically
    await prisma.$transaction([
      prisma.pulsePointWeights.updateMany({
        where: { pulsePointCode, version: { not: version } },
        data: { active: false },
      }),
      prisma.pulsePointWeights.updateMany({
        where: { pulsePointCode, version },
        data: { active: true },
      }),
    ]);
  } else {
    await prisma.pulsePointWeights.updateMany({
      where: { pulsePointCode, version },
      data: { active: false },
    });
  }

  return NextResponse.json({ ok: true, pulsePointCode, version, active });
}
