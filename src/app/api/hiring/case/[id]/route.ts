/**
 * GET /api/hiring/case/[id]            → reabre un caso archivado (HiringCase).
 * GET /api/hiring/case/[id]?pdf=<tipo>&lang=<lang>
 *     → re-renderiza el PDF del caso (reporte-full | guia-presentador) en el
 *       idioma pedido, SIN recalcular (usa el reportData guardado).
 * DELETE /api/hiring/case/[id]         → borra el caso (no afecta Rowiverse).
 *
 * Solo el owner del caso puede acceder. El caso es análisis archivado: no toca
 * comunidad ni relaciones.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/core/prisma";
import { buildReporteFullHiring, type HiringReportData } from "@/lib/deliverables/reporte-full-hiring";
import { buildGuiaPresentador } from "@/lib/deliverables/guia-presentador";
import type { Lang } from "@/lib/deliverables/pdf-kit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LANGS = new Set(["es", "en", "pt"]);
const PDFS = new Set(["reporte-full", "guia-presentador"]);

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function loadOwned(caseId: string, userId: string) {
  const c = await prisma.hiringCase.findUnique({ where: { id: caseId } });
  if (!c || c.ownerUserId !== userId) return null;
  return c;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const c = await loadOwned(id, token.sub);
  if (!c) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const url = new URL(req.url);
  const pdf = url.searchParams.get("pdf");
  const lang = (LANGS.has(url.searchParams.get("lang") || "") ? url.searchParams.get("lang") : c.lang) as Lang;

  // Sin ?pdf → devolver el caso (datos) para reabrirlo en la UI.
  if (!pdf) {
    return NextResponse.json({
      ok: true,
      case: {
        id: c.id, process: c.process, managerName: c.managerName, lang: c.lang,
        candidateCount: c.candidateCount, createdAt: c.createdAt,
        report: c.reportData,
      },
    });
  }

  // Con ?pdf → re-renderizar SIN recalcular (usa el reportData guardado).
  if (!PDFS.has(pdf)) {
    return NextResponse.json({ ok: false, error: "unknown_pdf" }, { status: 404 });
  }

  let owl: Buffer | undefined;
  try {
    owl = await readFile(path.join(process.cwd(), "public", "owl.png"));
  } catch {
    owl = undefined; // el búho es opcional
  }

  const report = c.reportData as unknown as HiringReportData;
  let buf: Buffer;
  if (pdf === "reporte-full") {
    buf = await buildReporteFullHiring(report, lang, owl);
  } else {
    buf = await buildGuiaPresentador({ report }, lang, owl);
  }

  const safe = c.process.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "caso";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rowi-hiring-${safe}-${pdf}-${lang}.pdf"`,
    },
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const c = await loadOwned(id, token.sub);
  if (!c) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  await prisma.hiringCase.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
