/**
 * Seed del catálogo de intervenciones (Fase 2 del knowledge layer).
 *
 * Deriva una intervención semilla por cada pulse point de la matriz BE2GROW
 * (src/lib/vital-signs/catalog.ts). Cada una es una HIPÓTESIS v0:
 * "practicar este micro-pulso mueve este outcome". El efecto esperado es
 * conservador y se calibra después con InterventionOutcome (ground-truth).
 *
 * Idempotente: usa upsert por `key`. No pisa measuredEffect ya acumulado.
 *
 * Ejecutar: `tsx prisma/seed-interventions.ts`
 */

import { PrismaClient } from "@prisma/client";
import { PULSE_POINTS } from "@/lib/vital-signs/catalog";

const prisma = new PrismaClient();

const OUTCOME_MAP: Record<string, string> = {
  Effectiveness: "effectiveness",
  Relationships: "relationships",
  Wellbeing: "wellbeing",
  QualityOfLife: "quality_of_life",
};

async function main() {
  let created = 0;
  let updated = 0;

  for (const pp of PULSE_POINTS) {
    const primaryOutcome = OUTCOME_MAP[pp.successFactors[0]] ?? "effectiveness";
    const primaryComp = pp.competencies[0] ?? null;
    const key = `${pp.code}_ritual_v0`;

    const existing = await prisma.intervention.findUnique({ where: { key } });

    await prisma.intervention.upsert({
      where: { key },
      create: {
        key,
        kind: "ritual",
        title: `Ritual de práctica: ${pp.code}`,
        description:
          `Micro-pulso semilla derivado de BE2GROW para el pulse point ${pp.code}. ` +
          `Hipótesis v0: practicar esto mueve ${primaryOutcome}. Calibrable con datos reales.`,
        targetOutcome: primaryOutcome,
        targetPulse: pp.code,
        targetComp: primaryComp,
        segment: undefined,
        // Efecto esperado conservador (hipótesis, NO claim validado).
        expectedEffect: 0.15,
        effectSource: "hypothesis_v0",
        confidence: "low",
        active: true,
        version: 0,
      },
      update: {
        // No tocar measuredEffect/sampleSize: son ground-truth acumulado.
        targetOutcome: primaryOutcome,
        targetPulse: pp.code,
        targetComp: primaryComp,
        description:
          `Micro-pulso semilla derivado de BE2GROW para el pulse point ${pp.code}. ` +
          `Hipótesis v0: practicar esto mueve ${primaryOutcome}. Calibrable con datos reales.`,
      },
    });

    if (existing) updated++;
    else created++;
  }

  console.log(
    `[seed-interventions] catálogo sembrado: ${created} creadas, ${updated} actualizadas (${PULSE_POINTS.length} pulse points).`
  );
}

main()
  .catch((e) => {
    console.error("[seed-interventions] error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
