import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";

/* =========================================================
   🎯 Job Profiles — playbook de hiring (Fase 5)
   ---------------------------------------------------------
   Plataforma-level → SuperAdmin only.
   Define el patrón objetivo de un rol ("para Sales Manager
   busca este patrón de competencias / talentos / brain style").
   Convierte el team-fit on-demand en un playbook persistido y
   calibrable: el fit predicho se compara luego con el desempeño
   real del contratado (ground-truth de hiring).
   ========================================================= */

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? undefined;

  let profiles: any[] = [];
  try {
    profiles = await prisma.jobProfile.findMany({
      where: scope ? { scope } : undefined,
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    profiles = [];
  }
  return NextResponse.json({ ok: true, profiles });
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const {
    scope = "global",
    scopeId = null,
    roleName,
    description,
    idealCompetencies,
    idealTalents,
    preferredStyles,
    minOverall,
  } = body || {};

  if (!roleName) {
    return NextResponse.json({ ok: false, error: "roleName requerido" }, { status: 400 });
  }

  const created = await prisma.jobProfile.create({
    data: {
      scope,
      scopeId,
      roleName,
      description: description ?? null,
      idealCompetencies: idealCompetencies ?? undefined,
      idealTalents: idealTalents ?? undefined,
      preferredStyles: preferredStyles ?? undefined,
      minOverall: typeof minOverall === "number" ? minOverall : null,
      source: "hypothesis_v0",
    },
  });

  return NextResponse.json({ ok: true, profile: created });
}

/* =========================================================
   PATCH — registrar el resultado real de una contratación
   (cierra el loop: fit predicho vs desempeño real).
   Se guarda como AffinityGroundTruth con outcomeKind "hiring".
   ========================================================= */
export async function PATCH(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { ownerUserId, memberId, predictedFit, realPerformance, context = "hiring", notes } = body || {};

  if (!ownerUserId || !memberId || typeof predictedFit !== "number" || typeof realPerformance !== "number") {
    return NextResponse.json(
      { ok: false, error: "ownerUserId, memberId, predictedFit y realPerformance requeridos" },
      { status: 400 }
    );
  }

  const record = await prisma.affinityGroundTruth.create({
    data: {
      ownerUserId,
      memberId,
      context,
      predicted135: predictedFit,
      outcomeReal: realPerformance,
      outcomeKind: "hiring",
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ ok: true, record });
}
