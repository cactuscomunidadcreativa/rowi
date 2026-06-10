/**
 * 👥 API: Personas de un benchmark agrupadas por equipo (cohorte)
 * GET /api/consultant/people/[benchmarkId]
 *
 * PRIVACIDAD — punto clave: BenchmarkDataPoint es ANÓNIMO. No guarda nombre
 * ni email; solo el pseudónimo `sourceId` = hash sha256 del email. Por eso el
 * sistema NO puede mostrar nombres ni dejar elegir un líder de una lista de
 * personas identificables. Aquí devolvemos, por equipo (`projectCohort`), la
 * lista de personas representadas por su hash + su eqTotal + si tienen
 * re-medición (2+ tomas).
 *
 * Cómo identifica el consultor a un líder pese al anonimato: NO lo elige de
 * esta lista. Escribe el EMAIL del líder en POST /api/consultant/leaders/...,
 * que lo hashea y verifica contra estos mismos hashes. Este GET le sirve para
 * ver cuántas personas/equipos hay y cuántas tienen re-medición.
 *
 * Query params:
 *   - search (opcional): texto que se hashea (sha256 del email) y se compara
 *     contra los hashes presentes. Si coincide una persona, se marca
 *     `searchMatch: true` en su entrada y en su equipo. Búsqueda por email
 *     exacto — nunca por nombre, porque el nombre no existe en los datos.
 *
 * Respuesta:
 *   {
 *     ok: true,
 *     benchmarkId: string,
 *     totalPeople: number,        // personas distintas (hashes con sha256:)
 *     totalDataPoints: number,    // filas totales (incluye re-tomas)
 *     teams: [{
 *       projectCohort: string,    // "General" si la fila no traía cohorte
 *       count: number,            // personas distintas en el equipo
 *       searchMatch: boolean,     // el search cayó en este equipo
 *       people: [{
 *         personHash: string,     // = BenchmarkDataPoint.sourceId
 *         eqTotal: number | null, // de la toma más reciente
 *         hasRetest: boolean,     // 2+ tomas de la misma persona
 *         searchMatch: boolean,   // coincide con ?search=
 *       }]
 *     }]
 *   }
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

type Row = {
  sourceId: string | null;
  projectCohort: string | null;
  eqTotal: number | null;
  sourceDate: Date | null;
};

type PersonAcc = {
  personHash: string;
  cohort: string;
  takes: number;
  latestDate: number; // epoch ms; 0 si sin fecha
  latestEq: number | null;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const gate = await requireCapability("consultant.cross");
  if (gate.error) return gate.error;

  const { benchmarkId } = await params;
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  // El search se hashea: solo email exacto coincide. El nombre no se guarda.
  const searchHash = search ? hashPersonId(search) : null;

  try {
    const rows: Row[] = await prisma.benchmarkDataPoint.findMany({
      where: { benchmarkId },
      select: {
        sourceId: true,
        projectCohort: true,
        eqTotal: true,
        sourceDate: true,
      },
    });

    // Agrupar por persona (hash). Solo hashes válidos (pseudónimo estable).
    const byPerson = new Map<string, PersonAcc>();
    let totalDataPoints = 0;

    for (const r of rows) {
      const id = r.sourceId;
      if (!id || typeof id !== "string" || !id.startsWith("sha256:")) continue;
      totalDataPoints++;
      const cohort = r.projectCohort || "General";
      const date = r.sourceDate ? new Date(r.sourceDate).getTime() : 0;

      const existing = byPerson.get(id);
      if (!existing) {
        byPerson.set(id, {
          personHash: id,
          cohort,
          takes: 1,
          latestDate: date,
          latestEq: r.eqTotal ?? null,
        });
      } else {
        existing.takes++;
        // La cohorte y el eqTotal "oficiales" salen de la toma más reciente.
        if (date >= existing.latestDate) {
          existing.latestDate = date;
          existing.cohort = cohort;
          existing.latestEq = r.eqTotal ?? null;
        }
      }
    }

    // Agrupar personas por equipo.
    const byCohort = new Map<
      string,
      Array<{ personHash: string; eqTotal: number | null; hasRetest: boolean; searchMatch: boolean }>
    >();

    for (const person of byPerson.values()) {
      const isMatch = !!searchHash && person.personHash === searchHash;
      if (!byCohort.has(person.cohort)) byCohort.set(person.cohort, []);
      byCohort.get(person.cohort)!.push({
        personHash: person.personHash,
        eqTotal: person.latestEq,
        hasRetest: person.takes >= 2,
        searchMatch: isMatch,
      });
    }

    const teams = [...byCohort.entries()]
      .map(([projectCohort, people]) => {
        people.sort((a, b) => (b.eqTotal ?? 0) - (a.eqTotal ?? 0));
        return {
          projectCohort,
          count: people.length,
          searchMatch: people.some((p) => p.searchMatch),
          people,
        };
      })
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      ok: true,
      benchmarkId,
      totalPeople: byPerson.size,
      totalDataPoints,
      teams,
    });
  } catch (error) {
    console.error("❌ Error listando personas del benchmark:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error al listar personas",
      },
      { status: 500 }
    );
  }
}
