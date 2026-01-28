// apps/rowi/src/lib/kernel/patterns.service.ts
import { prisma } from "../db";

/** Analiza señales (EQ, logs, productividad) y crea EmotionalPattern */
export async function detectPatternsForEngine(params: { engineId?: string }) {
  if (!params.engineId) return { ok: false, reason: "engineId requerido" };

  // Ejemplo mínimo: detecta “baja valencia promedio 7 días”
  const engineId = params.engineId;
  const recentEvents = await prisma.emotionalEvent.findMany({
    where: { createdAt: { gte: daysAgo(7) } },
    select: { valence: true },
  });
  const vals = recentEvents.flatMap((e) => (e.valence ?? null) as number | null).filter((x): x is number => x !== null);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  let insight: string | undefined;
  let action: string | undefined;
  let confidence: number | undefined;

  if (avg !== null && avg < 0.35) {
    insight = "Patrón de valencia baja en la última semana.";
    action = "Sugerir intervención breve de respiración y journaling guiado.";
    confidence = 0.7;

    await prisma.emotionalPattern.create({
      data: {
        engineId,
        patternType: "mood_cycle",
        periodDays: 7,
        metrics: { avg_valence: avg, samples: vals.length },
        insight,
        actionPlan: action,
        confidence,
      },
    });
  }

  return { ok: true, avgValence: avg, count: vals.length };
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}