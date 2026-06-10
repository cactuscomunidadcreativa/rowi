/**
 * POST /api/consultant/report
 * ---------------------------------------------------------
 * EL flujo que pidió Eduardo: subes SEI (CSV) + VS (LVS/TVS/OVS, CSV) y el
 * agente devuelve el ENTREGABLE formato Rowi (modelo: perfil de Carolina):
 *   - SEI agregado de la cohorte (8 competencias + 18 talentos)
 *   - VS real del CSV subido (pulse points vía secret map; inferencia de respaldo)
 *   - Cruce SEI↔VS = mapa de puntos ciegos
 *   - Diagnóstico-espejo narrado por IA
 *
 * Nivel por instrumento:
 *   - LVS  → individual (líder; usa la fila "self" si la hay)
 *   - TVS/OVS → cohorte AGREGADO y anónimo (clima de equipo, sin "quién es quién")
 *
 * Stateless: parsea ambos CSV en memoria, no persiste nada. El consultor sube y
 * obtiene el informe; los datos crudos no se guardan aquí (privacidad).
 *
 * Body (multipart o JSON con strings):
 *   { seiCsv: string, vsCsv: string, scope: "LVS"|"TVS"|"OVS", subjectLabel?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/core/capabilities/requireCapability";
import { SOH_COLUMN_MAPPING, EQ_COMPETENCIES, BRAIN_TALENTS } from "@/lib/benchmarks/column-mapping";
import { parseOvsTvsCsv } from "@/lib/vital-signs/parsers/ovs";
import { applyPulseMapCohort, applyPulseMap, hasSecretPulseMap } from "@/lib/vital-signs/secret-map";
import { calculateVitalSigns } from "@/lib/vital-signs/calculate";
import { generateIntegralProfile } from "@/lib/consultant/profile-generator";
import type { SeiKey, PulsePointCode } from "@/lib/vital-signs/catalog";
import Papa from "papaparse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SEI_8: SeiKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Promedia competencias SEI (8) + talentos (18) de un CSV SEI de la cohorte. */
function aggregateSeiFull(csv: string): {
  competencies: Partial<Record<SeiKey, number>>;
  talents: Record<string, number>;
  sampleSize: number;
} {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const headers = parsed.meta.fields ?? [];

  // header CSV → clave interna (solo competencias y talentos que nos importan).
  const wanted = new Set<string>([...EQ_COMPETENCIES, ...BRAIN_TALENTS]);
  const headerToKey: Record<string, string> = {};
  for (const h of headers) {
    const mapped = SOH_COLUMN_MAPPING[h];
    if (mapped && wanted.has(mapped)) headerToKey[h] = mapped;
  }

  const sums: Record<string, { sum: number; n: number }> = {};
  let rowCount = 0;
  for (const row of parsed.data) {
    let any = false;
    for (const [h, key] of Object.entries(headerToKey)) {
      const v = toNum(row[h]);
      if (v !== null) {
        const acc = sums[key] ?? (sums[key] = { sum: 0, n: 0 });
        acc.sum += v;
        acc.n += 1;
        any = true;
      }
    }
    if (any) rowCount++;
  }

  const competencies: Partial<Record<SeiKey, number>> = {};
  for (const k of SEI_8) {
    if (sums[k]?.n) competencies[k] = Math.round((sums[k].sum / sums[k].n) * 100) / 100;
  }
  const talents: Record<string, number> = {};
  for (const t of BRAIN_TALENTS) {
    if (sums[t]?.n) talents[t.toLowerCase()] = Math.round((sums[t].sum / sums[t].n) * 100) / 100;
  }
  return { competencies, talents, sampleSize: rowCount };
}

/**
 * Extrae los 15 pulse points del VS subido. Intenta el secret map (pulse points
 * REALES); si no hay mapa, infiere desde el SEI agregado (respaldo).
 */
function resolvePulses(
  vsCsv: string,
  scope: "LVS" | "TVS" | "OVS",
  fallbackSei: Partial<Record<SeiKey, number>>,
  fallbackTalents: Record<string, number>,
): { pulses: Partial<Record<PulsePointCode, number>>; source: "real" | "inferred"; sampleSize: number } {
  // LVS viene en xlsx normalmente; aquí soportamos el CSV de OVS/TVS y, para LVS,
  // el mismo parser de items si el CSV trae q1..qN. Para robustez usamos OVS/TVS
  // parser (mismo esquema de items estandarizados) salvo LVS individual.
  const parseScope = scope === "LVS" ? "TVS" : scope; // items estandarizados igual
  const parsed = parseOvsTvsCsv(vsCsv, parseScope as "TVS" | "OVS");
  const respondents = parsed.respondents;

  // 1) Pulse points REALES vía secret map (si está provisto para el scope).
  if (hasSecretPulseMap(scope) && respondents.length > 0) {
    if (scope === "LVS") {
      // individual: tomar el primer respondent (self) o el promedio si no hay rol.
      const items = respondents[0]?.itemScoresST ?? {};
      const pp = applyPulseMap(items as Record<string, number | null>, scope);
      if (pp) {
        const pulses: Partial<Record<PulsePointCode, number>> = {};
        for (const p of pp) pulses[p.code] = p.score;
        return { pulses, source: "real", sampleSize: 1 };
      }
    } else {
      const cohort = applyPulseMapCohort(
        respondents.map((r) => r.itemScoresST as Record<string, number | null>),
        scope,
      );
      if (cohort) {
        const pulses: Partial<Record<PulsePointCode, number>> = {};
        for (const p of cohort) pulses[p.code] = p.score;
        return { pulses, source: "real", sampleSize: respondents.length };
      }
    }
  }

  // 2) Respaldo: inferir pulse points desde el SEI agregado.
  const vs = calculateVitalSigns(
    SEI_8.reduce((acc, k) => ({ ...acc, [k]: fallbackSei[k] ?? null }), {} as Record<SeiKey, number | null>),
    fallbackTalents,
  );
  const pulses: Partial<Record<PulsePointCode, number>> = {};
  for (const p of vs.pulsePoints) {
    if (typeof p.score === "number") pulses[p.code] = p.score;
  }
  return { pulses, source: "inferred", sampleSize: respondents.length };
}

export async function POST(req: NextRequest) {
  // Capability: consultor con plan, scoped a sus clientes.
  const gate = await requireCapability("consultant.profile");
  if (gate.error) return gate.error;

  const body = (await req.json().catch(() => ({}))) as {
    seiCsv?: string;
    vsCsv?: string;
    scope?: string;
    subjectLabel?: string;
  };

  const seiCsv = body.seiCsv || "";
  const vsCsv = body.vsCsv || "";
  const scope = (["LVS", "TVS", "OVS"].includes(body.scope || "") ? body.scope : "TVS") as
    | "LVS"
    | "TVS"
    | "OVS";

  if (!seiCsv.trim()) {
    return NextResponse.json({ ok: false, error: "sei_csv_required" }, { status: 400 });
  }

  try {
    // 1) SEI agregado de la cohorte (competencias + talentos).
    const sei = aggregateSeiFull(seiCsv);
    if (Object.keys(sei.competencies).length === 0) {
      return NextResponse.json(
        { ok: false, error: "no_sei_columns" },
        { status: 422 },
      );
    }

    // 2) VS real (secret map) o inferido de respaldo.
    const vs = vsCsv.trim()
      ? resolvePulses(vsCsv, scope, sei.competencies, sei.talents)
      : { pulses: {}, source: "inferred" as const, sampleSize: 0 };

    // Si no había VS subido, inferir del SEI (respaldo total).
    if (Object.keys(vs.pulses).length === 0) {
      const inferred = resolvePulses("", scope, sei.competencies, sei.talents);
      vs.pulses = inferred.pulses;
      vs.source = "inferred";
    }

    // 3) Entregable: mapa de puntos ciegos + diagnóstico IA.
    const scopeLevel = scope === "LVS" ? "individual" : "cohort";
    const profile = await generateIntegralProfile(
      {
        subjectLabel: body.subjectLabel || (scopeLevel === "cohort" ? "Cohorte" : "Líder"),
        scope: scopeLevel,
        vsInstrument: scope,
        competencies: sei.competencies,
        talents: sei.talents,
        pulses: vs.pulses,
        locale: "es",
      },
      { withNarrative: true },
    );

    return NextResponse.json({
      ok: true,
      report: {
        ...profile,
        sei: {
          competencies: sei.competencies,
          talents: sei.talents,
          sampleSize: sei.sampleSize,
        },
        pulses: vs.pulses,
        vsSource: vs.source, // "real" (secret map) | "inferred" (respaldo SEI)
        vsSampleSize: vs.sampleSize,
      },
    });
  } catch (e: unknown) {
    console.error("/api/consultant/report error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
