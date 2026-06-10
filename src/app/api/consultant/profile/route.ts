/**
 * POST /api/consultant/profile
 * ---------------------------------------------------------
 * El "agente lee todo y da feedback": recibe el SEI (competencias + talentos) y
 * el Vital Signs (pulse points) de un sujeto — individuo o cohorte — y devuelve
 * el PERFIL INTEGRAL formato Rowi: mapa de puntos ciegos (cruce SEI↔VS) +
 * diagnóstico-espejo narrado por IA.
 *
 * Solo admin con scope (consultor). El cruce individual es categoría especial:
 * el caller decide qué exponer (la guía del partner: cliente = solo agregado).
 *
 * Body:
 *   {
 *     subjectLabel: string,
 *     scope: "individual" | "cohort",
 *     vsInstrument: "LVS" | "TVS" | "OVS",
 *     competencies: { EL, RP, ACT, NE, IM, OP, EMP, NG },   // 70-130
 *     talents: { criticalthinking, vision, ... },           // 70-130
 *     pulses: { MOTIVATION_MEANING, ... },                  // LVS 1-5 o TVS/OVS 70-130
 *     locale?: "es" | "en",
 *     withNarrative?: boolean
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import {
  generateIntegralProfile,
  type IntegralProfileInput,
} from "@/lib/consultant/profile-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await requireAdminWithScope();
  if (admin.error) return admin.error;

  let body: Partial<IntegralProfileInput> & { withNarrative?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body.competencies || !body.pulses) {
    return NextResponse.json(
      { ok: false, error: "competencies and pulses are required" },
      { status: 400 },
    );
  }

  const scope = body.scope === "cohort" ? "cohort" : "individual";
  const vsInstrument =
    body.vsInstrument === "TVS" || body.vsInstrument === "OVS" ? body.vsInstrument : "LVS";

  try {
    const profile = await generateIntegralProfile(
      {
        subjectLabel: body.subjectLabel || (scope === "cohort" ? "Cohorte" : "Sujeto"),
        scope,
        vsInstrument,
        competencies: body.competencies,
        talents: body.talents ?? {},
        pulses: body.pulses,
        outcomes: body.outcomes,
        locale: body.locale === "en" ? "en" : "es",
      },
      { withNarrative: body.withNarrative !== false },
    );

    return NextResponse.json({ ok: true, profile });
  } catch (e: unknown) {
    console.error("/api/consultant/profile error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
