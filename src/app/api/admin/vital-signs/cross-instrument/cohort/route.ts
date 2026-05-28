export const runtime = "nodejs";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";
import { parseOvsTvsCsv, aggregateOvsTvs, type OvsTvsScope } from "@/lib/vital-signs/parsers/ovs";
import { parseLvsXlsx, aggregateLvs } from "@/lib/vital-signs/parsers/lvs";
import { aggregateSeiCsv, type AggregateMetric } from "@/lib/vital-signs/vs-sei";

/**
 * POST /api/admin/vital-signs/cross-instrument/cohort
 *
 * multipart/form-data:
 *   - vsFile: OVS/TVS CSV or LVS xlsx for the cohort
 *   - seiFile: SEI CSV for the SAME cohort
 *   - label, vsScope (OVS|TVS|LVS), source (study|live), country?, sector?
 *
 * Parses + aggregates both instruments and stores one paired cohort with its
 * VS + SEI aggregate metrics. Recompute correlations separately afterwards.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    const form = await req.formData();
    const vsFile = form.get("vsFile");
    const seiFile = form.get("seiFile");
    const label = String(form.get("label") ?? "").trim();
    const vsScope = String(form.get("vsScope") ?? "").toUpperCase();
    const source = String(form.get("source") ?? "study");
    const country = (form.get("country") as string | null)?.trim() || null;
    const sector = (form.get("sector") as string | null)?.trim() || null;

    if (!label) return NextResponse.json({ ok: false, error: "label es requerido" }, { status: 400 });
    if (!["OVS", "TVS", "LVS"].includes(vsScope)) {
      return NextResponse.json({ ok: false, error: "vsScope debe ser OVS, TVS o LVS" }, { status: 400 });
    }
    if (!vsFile || typeof vsFile === "string") {
      return NextResponse.json({ ok: false, error: "vsFile es requerido" }, { status: 400 });
    }
    if (!seiFile || typeof seiFile === "string") {
      return NextResponse.json({ ok: false, error: "seiFile es requerido" }, { status: 400 });
    }

    // ---- VS aggregate ----
    const vsMetrics: AggregateMetric[] = [];
    let vsSampleSize = 0;
    if (vsScope === "OVS" || vsScope === "TVS") {
      const text = await vsFile.text();
      const parsed = parseOvsTvsCsv(text, vsScope as OvsTvsScope);
      if (parsed.errors.length > 0) {
        return NextResponse.json({ ok: false, error: "Errores en VS", details: parsed.errors }, { status: 422 });
      }
      vsSampleSize = parsed.sampleSize;
      const agg = aggregateOvsTvs(parsed.respondents);
      for (const d of agg.drivers) vsMetrics.push({ key: d.code, level: "driver", mean: d.mean, n: d.n });
      for (const o of agg.outcomes) vsMetrics.push({ key: o.code, level: "outcome", mean: o.mean, n: o.n });
    } else {
      const buf = await vsFile.arrayBuffer();
      const parsed = parseLvsXlsx(buf);
      if (parsed.errors.length > 0) {
        return NextResponse.json({ ok: false, error: "Errores en VS (LVS)", details: parsed.errors }, { status: 422 });
      }
      vsSampleSize = parsed.sampleSize;
      const agg = aggregateLvs(parsed.respondents);
      for (const d of agg.overallDrivers) vsMetrics.push({ key: d.code, level: "driver", mean: d.mean, n: d.n });
      for (const o of agg.overallOutcomes) vsMetrics.push({ key: o.code, level: "outcome", mean: o.mean, n: o.n });
    }

    // ---- SEI aggregate ----
    const seiText = await seiFile.text();
    const sei = aggregateSeiCsv(seiText);
    if (sei.errors.length > 0) {
      return NextResponse.json({ ok: false, error: "Errores en SEI", details: sei.errors }, { status: 422 });
    }

    if (vsMetrics.length === 0 || sei.metrics.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No se pudieron agregar métricas de ambos instrumentos." },
        { status: 422 },
      );
    }

    // ---- Persist cohort + metrics ----
    const cohort = await prisma.vsSeiCohort.create({
      data: {
        label,
        vsScope,
        source,
        country,
        sector,
        vsSampleSize,
        seiSampleSize: sei.sampleSize,
        createdById: auth.user?.id ?? null,
        metrics: {
          create: [
            ...vsMetrics.map((m) => ({ instrument: "VS", key: m.key, level: m.level, mean: m.mean, n: m.n })),
            ...sei.metrics.map((m) => ({ instrument: "SEI", key: m.key, level: m.level, mean: m.mean, n: m.n })),
          ],
        },
      },
      select: { id: true, label: true, vsScope: true },
    });

    return NextResponse.json({
      ok: true,
      cohort,
      vsMetrics: vsMetrics.length,
      seiMetrics: sei.metrics.length,
      vsSampleSize,
      seiSampleSize: sei.sampleSize,
      note: "Cohorte guardada. Ejecuta recompute para actualizar las correlaciones cruzadas.",
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error interno";
    console.error("/api/admin/vital-signs/cross-instrument/cohort error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
