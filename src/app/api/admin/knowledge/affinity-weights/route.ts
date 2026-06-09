import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { invalidateAffinityWeightsCache } from "@/ai/learning/affinityWeightsLoader";

export const runtime = "nodejs";

/* =========================================================
   ⚖️ Affinity Weights — versionado + promoción (Fase 6)
   ---------------------------------------------------------
   Plataforma-level → SuperAdmin only.
   El "subir lo aprendido a main" para el motor de afinidad:
   - GET: lista las versiones de pesos por scope.
   - POST: crea una nueva versión (inactiva) con un payload de pesos.
   - PATCH: activa una versión (desactiva las demás del scope) y
            invalida el cache → el motor empieza a usarla.
   ========================================================= */

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const scope = new URL(req.url).searchParams.get("scope") ?? "global";
  let versions: any[] = [];
  try {
    versions = await prisma.affinityWeights.findMany({
      where: { scope },
      orderBy: { version: "desc" },
    });
  } catch {
    versions = [];
  }
  return NextResponse.json({ ok: true, scope, versions });
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { scope = "global", scopeId = null, payload, rSquared, sampleSize, notes } = body || {};

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "payload (pesos) requerido" }, { status: 400 });
  }

  // Siguiente versión monotónica para el scope.
  const last = await prisma.affinityWeights.findFirst({
    where: { scope, scopeId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (last?.version ?? -1) + 1;

  const created = await prisma.affinityWeights.create({
    data: {
      scope,
      scopeId,
      version,
      payload,
      rSquared: typeof rSquared === "number" ? rSquared : null,
      sampleSize: typeof sampleSize === "number" ? sampleSize : 0,
      notes: notes ?? null,
      active: false, // nuevas versiones nacen inactivas; se activan vía PATCH
    },
  });

  return NextResponse.json({ ok: true, weights: created });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { id, scope = "global", scopeId = null } = body || {};
  if (!id) {
    return NextResponse.json({ ok: false, error: "id de la versión requerido" }, { status: 400 });
  }

  // Activar la versión indicada y desactivar el resto del scope (transacción).
  await prisma.$transaction([
    prisma.affinityWeights.updateMany({
      where: { scope, scopeId, active: true },
      data: { active: false },
    }),
    prisma.affinityWeights.update({ where: { id }, data: { active: true } }),
  ]);

  invalidateAffinityWeightsCache(scope);

  return NextResponse.json({ ok: true, activated: id, scope });
}
