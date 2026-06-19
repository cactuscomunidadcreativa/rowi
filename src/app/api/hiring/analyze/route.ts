/**
 * POST /api/hiring/analyze
 * ---------------------------------------------------------
 * El "proceso de hiring" como lo describe Eduardo: subes un CSV SEI, dices quién
 * es el manager, y devuelve el análisis COMPLETO (afinidad/benchmark/LVS) +
 * GUARDA el caso (HiringCase) para reabrirlo después. Multi-idioma (es/pt/en).
 *
 * NO crea comunidad, NO crea relaciones, NO crea CommunityMember. Efectos
 * colaterales (sin comunidad): contribuye la data SEI anónima al Rowiverse y
 * crea un EqSnapshot "puente" por persona (email, sin userId) para el linking
 * futuro. Ver docs/entregables/HIRING_PROCESO_Y_ROWIVERSE.md.
 *
 * Body (JSON):
 *   { seiCsv: string, managerName: string, process?: string, lang?: "es"|"pt"|"en",
 *     contributeToRowiverse?: boolean }
 *
 * GET /api/hiring/analyze        → lista los HiringCase del usuario (su historial).
 *
 * Acceso: usuario autenticado (token). El caso queda bajo su propiedad.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import Papa from "papaparse";
import { prisma } from "@/core/prisma";
import { analyzeHiringCase } from "@/lib/hiring/analyze-case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LANGS = new Set(["es", "en", "pt"]);

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    seiCsv?: string;
    managerName?: string;
    process?: string;
    lang?: string;
    contributeToRowiverse?: boolean;
  };

  const seiCsv = (body.seiCsv || "").trim();
  const managerName = (body.managerName || "").trim();
  const lang = (LANGS.has(body.lang || "") ? body.lang : "es") as "es" | "pt" | "en";

  if (!seiCsv) {
    return NextResponse.json({ ok: false, error: "sei_csv_required" }, { status: 400 });
  }
  if (!managerName) {
    return NextResponse.json({ ok: false, error: "manager_name_required" }, { status: 400 });
  }

  // Parseo SIN header: las columnas "Profile" duplicadas (Brain Brief + Influence)
  // se colapsarían con header:true. parse-sei-csv las resuelve por índice.
  const grid = (Papa.parse(seiCsv, { skipEmptyLines: true }).data as string[][]) ?? [];
  if (grid.length < 2) {
    return NextResponse.json({ ok: false, error: "csv_empty_or_invalid" }, { status: 422 });
  }

  // Tenant del usuario (opcional, para trazabilidad — NO crea workspace).
  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { primaryTenantId: true },
  });

  try {
    const result = await analyzeHiringCase({
      grid,
      managerName,
      ownerUserId: token.sub,
      tenantId: user?.primaryTenantId ?? null,
      process: body.process,
      lang,
      contributeToRowiverse: body.contributeToRowiverse,
    });

    return NextResponse.json({
      ok: true,
      caseId: result.caseId,
      report: result.reportData,
      meta: {
        contributedToRowiverse: result.contributedToRowiverse,
        snapshotsCreated: result.snapshotsCreated,
        createdCommunities: result.createdCommunities, // siempre 0
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "internal_error";
    // Errores de negocio conocidos → 422; el resto → 500.
    const known = new Set([
      "csv_needs_at_least_2_people",
      "manager_not_found_in_csv",
      "no_candidates",
    ]);
    if (known.has(msg)) {
      return NextResponse.json({ ok: false, error: msg }, { status: 422 });
    }
    console.error("/api/hiring/analyze error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const cases = await prisma.hiringCase.findMany({
    where: { ownerUserId: token.sub },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, process: true, managerName: true, lang: true,
      candidateCount: true, contributedToRowiverse: true, createdAt: true,
    },
    take: 100,
  });
  return NextResponse.json({ ok: true, cases });
}
