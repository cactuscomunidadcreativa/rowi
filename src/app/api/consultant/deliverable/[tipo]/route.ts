/**
 * POST /api/consultant/deliverable/[tipo]
 *
 * Genera y devuelve un entregable del módulo consultor (PDF o PPTX) listo para
 * descargar. Recibe el `report` y/o `findings` YA computados (el cliente los
 * tiene del flujo del consultor); no recalcula nada — solo mapea y maqueta.
 *
 * tipo:
 *  - perfil-integral   (PDF, necesita report)
 *  - guia-confidencial (PDF, necesita report)
 *  - propuesta         (PPTX, necesita report [+ findings opcional])
 *  - hallazgos         (PPTX, necesita findings)
 *
 * Acceso: requireCapability("consultant.profile"). Lenguaje espejo: estos son
 * material del consultor (diagnóstico permitido), no del usuario final.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/core/capabilities/requireCapability";
import type { Lang } from "@/lib/deliverables/pdf-kit";
import {
  toPerfilIntegral, toGuiaConfidencial, toHallazgos, toPropuesta,
  type ConsultantReportShape,
} from "@/lib/deliverables/from-consultant-report";
import type { MultiLeaderAnalysisResult } from "@/lib/consultant/cross-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ tipo: string }>;
}

const VALID = new Set(["perfil-integral", "guia-confidencial", "propuesta", "hallazgos"]);
const LANGS = new Set(["es", "en", "pt"]);

export async function POST(req: NextRequest, { params }: RouteParams) {
  const gate = await requireCapability("consultant.profile");
  if (gate.error) return gate.error;

  const { tipo } = await params;
  if (!VALID.has(tipo)) {
    return NextResponse.json({ ok: false, error: "unknown_deliverable" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    lang?: string;
    client?: string;
    report?: ConsultantReportShape;
    findings?: MultiLeaderAnalysisResult;
  };
  const lang = (LANGS.has(body.lang || "") ? body.lang : "es") as Lang;
  const client = (body.client || "").trim() || body.report?.subjectLabel || "Cliente";

  try {
    // Import dinámico de los generadores (pesados): solo el que se necesita.
    let buffer: Buffer;
    let contentType: string;
    let ext: string;

    if (tipo === "perfil-integral") {
      if (!body.report) return NextResponse.json({ ok: false, error: "report_required" }, { status: 400 });
      const { buildPerfilIntegral } = await import("@/lib/deliverables/perfil-integral");
      buffer = await buildPerfilIntegral(toPerfilIntegral(body.report, lang), lang, await owlBuffer());
      contentType = "application/pdf"; ext = "pdf";
    } else if (tipo === "guia-confidencial") {
      if (!body.report) return NextResponse.json({ ok: false, error: "report_required" }, { status: 400 });
      const { buildGuiaConfidencial } = await import("@/lib/deliverables/guia-confidencial");
      buffer = await buildGuiaConfidencial(toGuiaConfidencial(body.report, lang), lang, await owlBuffer());
      contentType = "application/pdf"; ext = "pdf";
    } else if (tipo === "propuesta") {
      if (!body.report) return NextResponse.json({ ok: false, error: "report_required" }, { status: 400 });
      const { buildPropuestaCliente } = await import("@/lib/deliverables/propuesta-cliente");
      buffer = await buildPropuestaCliente(toPropuesta(body.report, body.findings ?? null, client, lang), lang, await owlBuffer());
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"; ext = "pptx";
    } else {
      // hallazgos
      if (!body.findings) return NextResponse.json({ ok: false, error: "findings_required" }, { status: 400 });
      const { buildHallazgos } = await import("@/lib/deliverables/hallazgos");
      buffer = await buildHallazgos(toHallazgos(body.findings, client, lang), lang, await owlBuffer());
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation"; ext = "pptx";
    }

    const filename = `${slug(client)}-${tipo}-${lang}.${ext}`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: unknown) {
    console.error(`/api/consultant/deliverable/${tipo} error:`, e);
    return NextResponse.json({ ok: false, error: "generation_failed" }, { status: 500 });
  }
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "entregable";
}

/** Lee el búho de marca (public/owl.png) una vez por invocación. */
async function owlBuffer(): Promise<Buffer | undefined> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    return await readFile(join(process.cwd(), "public", "owl.png"));
  } catch {
    return undefined;
  }
}
