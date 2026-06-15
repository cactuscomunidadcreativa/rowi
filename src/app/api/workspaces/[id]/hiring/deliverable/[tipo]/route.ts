/**
 * POST /api/workspaces/[id]/hiring/deliverable/[tipo]
 *
 * Genera y devuelve un entregable de HIRING (PDF) de un proceso de selección
 * dentro de un workspace. Carga líder + candidatos (CommunityMember+EqSnapshot),
 * invoca los motores reales (afinidad/benchmark/LVS) vía el orquestador, y
 * maqueta con el generador correspondiente.
 *
 * tipo:
 *  - reporte-full     (PDF, todo el proceso)
 *  - perfil-candidato (PDF, un candidato — requiere ?candidate=<name>)
 *  - guia-presentador (PDF, cómo presentar el reporte)
 *
 * Body: { leaderMemberId, candidateMemberIds[], process?, lang?, candidateName?, mode? }
 * Acceso: token + canManageWorkspace.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { canManageWorkspace } from "@/lib/workspace/permissions";
import { loadHiringPeople } from "@/lib/hiring/load-people";
import { buildHiringReportData } from "@/lib/hiring/build-report-data";
import type { Lang } from "@/lib/deliverables/pdf-kit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ id: string; tipo: string }>;
}

const VALID = new Set(["reporte-full", "perfil-candidato", "guia-presentador"]);
const LANGS = new Set(["es", "en", "pt"]);

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: communityId, tipo } = await params;
  if (!VALID.has(tipo)) {
    return NextResponse.json({ ok: false, error: "unknown_deliverable" }, { status: 404 });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!(await canManageWorkspace(token.sub, communityId))) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    leaderMemberId?: string;
    candidateMemberIds?: string[];
    process?: string;
    lang?: string;
    candidateName?: string;
    mode?: "compacto" | "completo";
  };
  const lang = (LANGS.has(body.lang || "") ? body.lang : "es") as Lang;
  if (!body.leaderMemberId || !Array.isArray(body.candidateMemberIds) || body.candidateMemberIds.length === 0) {
    return NextResponse.json({ ok: false, error: "leader_and_candidates_required" }, { status: 400 });
  }

  try {
    const loaded = await loadHiringPeople({
      leaderMemberId: body.leaderMemberId,
      candidateMemberIds: body.candidateMemberIds,
      process: body.process || "Proceso de selección",
    });
    if (!loaded) {
      return NextResponse.json({ ok: false, error: "no_snapshots" }, { status: 422 });
    }
    const report = buildHiringReportData(loaded.leader, loaded.candidates, loaded.options);

    const owl = await owlBuffer();
    let buffer: Buffer;
    if (tipo === "reporte-full") {
      const { buildReporteFullHiring } = await import("@/lib/deliverables/reporte-full-hiring");
      buffer = await buildReporteFullHiring(report, lang, owl);
    } else if (tipo === "perfil-candidato") {
      const name = body.candidateName || report.candidates[0]?.name;
      if (!name) return NextResponse.json({ ok: false, error: "candidate_required" }, { status: 400 });
      const { buildPerfilCandidato } = await import("@/lib/deliverables/perfil-candidato");
      buffer = await buildPerfilCandidato(report, name, lang, owl, { mode: body.mode ?? "compacto" });
    } else {
      // guia-presentador
      const { buildGuiaPresentador } = await import("@/lib/deliverables/guia-presentador");
      buffer = await buildGuiaPresentador({ report }, lang, owl);
    }

    const filename = `${slug(report.process)}-${tipo}-${lang}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    console.error(`/api/workspaces/${communityId}/hiring/deliverable/${tipo} error:`, e);
    return NextResponse.json({ ok: false, error: "generation_failed" }, { status: 500 });
  }
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "proceso";
}

async function owlBuffer(): Promise<Buffer | undefined> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    return await readFile(join(process.cwd(), "public", "owl.png"));
  } catch {
    return undefined;
  }
}
