/**
 * 🧭 API: Asignaciones líder↔equipo de un benchmark (consultor)
 * GET  /api/consultant/leaders/[benchmarkId]   — lista las asignaciones
 * POST /api/consultant/leaders/[benchmarkId]   — declara/actualiza líderes
 *
 * PRIVACIDAD — cómo se identifica a un líder pese al anonimato:
 * El benchmark es anónimo (BenchmarkDataPoint solo guarda el hash sha256 del
 * email en `sourceId`, nunca el email/nombre). El consultor NO elige de una
 * lista de personas: ESCRIBE el EMAIL del líder. Este endpoint lo hashea con
 * hashPersonId() y verifica que ese hash exista en los data points del
 * benchmark antes de persistir. Así nunca se guarda email en claro y el
 * benchmark sigue siendo anónimo. Si el email no coincide con nadie, vuelve
 * en `notFound` (estado honesto, sin inventar nada).
 *
 * POST body:
 *   { leaders: [{ email: string, cohort?: string }] }
 *
 * POST respuesta:
 *   {
 *     ok: true,
 *     assigned: number,          // líderes verificados y persistidos (upsert)
 *     notFound: string[],        // emails que no coinciden con el benchmark
 *     assignments: [{ personHash, projectCohort }]  // lo que quedó guardado
 *   }
 *
 * GET respuesta:
 *   {
 *     ok: true,
 *     benchmarkId: string,
 *     leaders: [{
 *       id, personHash, projectCohort, createdAt
 *     }]
 *   }
 *
 * El POST es idempotente: upsert por (benchmarkId, personHash). Re-enviar el
 * mismo email solo actualiza la cohorte; no duplica.
 *
 * Acceso: admin con scope (requireAdminWithScope).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/core/capabilities/requireCapability";
import { prisma } from "@/core/prisma";
import { hashPersonId } from "@/lib/benchmarks/process-benchmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ benchmarkId: string }>;
}

interface LeaderInput {
  email?: unknown;
  cohort?: unknown;
  label?: unknown; // alias legible para mostrar (no es PII de análisis)
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const gate = await requireCapability("consultant.cross");
  if (gate.error) return gate.error;

  const { benchmarkId } = await params;

  try {
    const rows = await prisma.consultantLeaderAssignment.findMany({
      where: { benchmarkId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        personHash: true,
        projectCohort: true,
        label: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, benchmarkId, leaders: rows });
  } catch (error) {
    console.error("❌ Error listando líderes:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error al listar líderes",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const gate = await requireCapability("consultant.cross");
  if (gate.error) return gate.error;

  const { benchmarkId } = await params;

  let body: { leaders?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body inválido (se esperaba JSON)" },
      { status: 400 }
    );
  }

  const rawLeaders = body?.leaders;
  if (!Array.isArray(rawLeaders) || rawLeaders.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Se requiere 'leaders' (array no vacío de { email, cohort? })" },
      { status: 400 }
    );
  }

  try {
    // Mapa hash → cohorte presente en el benchmark (para verificar existencia
    // y, si el consultor no indica cohorte, inferirla de la toma más reciente).
    const points = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId },
      select: { sourceId: true, projectCohort: true, sourceDate: true },
    });

    const cohortByHash = new Map<string, { cohort: string | null; date: number }>();
    for (const p of points) {
      const id = p.sourceId;
      if (!id || typeof id !== "string" || !id.startsWith("sha256:")) continue;
      const date = p.sourceDate ? new Date(p.sourceDate).getTime() : 0;
      const existing = cohortByHash.get(id);
      if (!existing || date >= existing.date) {
        cohortByHash.set(id, { cohort: p.projectCohort ?? null, date });
      }
    }

    const notFound: string[] = [];
    // De-dup por hash dentro del propio request (última gana).
    const toPersist = new Map<
      string,
      { personHash: string; projectCohort: string | null; label: string | null }
    >();

    for (const raw of rawLeaders as LeaderInput[]) {
      const email = typeof raw?.email === "string" ? raw.email.trim() : "";
      if (!email) continue;
      const hash = hashPersonId(email);
      if (!hash || !cohortByHash.has(hash)) {
        notFound.push(email);
        continue;
      }
      const declaredCohort =
        typeof raw?.cohort === "string" && raw.cohort.trim() ? raw.cohort.trim() : null;
      const cohort = declaredCohort ?? cohortByHash.get(hash)!.cohort;
      const label =
        typeof raw?.label === "string" && raw.label.trim() ? raw.label.trim() : null;
      toPersist.set(hash, { personHash: hash, projectCohort: cohort, label });
    }

    const createdById = gate.user?.id ?? null;

    // Upsert idempotente por (benchmarkId, personHash).
    for (const { personHash, projectCohort, label } of toPersist.values()) {
      await prisma.consultantLeaderAssignment.upsert({
        where: { benchmarkId_personHash: { benchmarkId, personHash } },
        create: { benchmarkId, personHash, projectCohort, label, createdById },
        // El label solo se actualiza si vino uno nuevo (no se borra al re-enviar).
        update: { projectCohort, ...(label ? { label } : {}) },
      });
    }

    return NextResponse.json({
      ok: true,
      assigned: toPersist.size,
      notFound,
      assignments: [...toPersist.values()],
    });
  } catch (error) {
    console.error("❌ Error asignando líderes:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error al asignar líderes",
      },
      { status: 500 }
    );
  }
}
