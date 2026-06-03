/**
 * Pre-SEI — materialización ("claim") a los modelos normados existentes.
 *
 * El Pre-SEI no tiene tablas propias de resultado: cuando un usuario reclama una
 * sesión anónima (al registrarse) o hace el intake interno (logueado), los datos
 * se escriben en los modelos que YA existen:
 *   - EqSnapshot(dataset:"pre_sei") con las 8 competencias en escala 70-130,
 *   - 8 PulsePointSignal(source:"pre_sei", value 1-5) que alimentan el motor VS.
 *
 * Mismo patrón "claim" que `register/route.ts` usa para usuarios importados.
 * Es idempotente: reclamar dos veces no duplica.
 */
import { prisma } from "@/core/prisma";
import { SEI_ORDER, PRE_SEI_QUESTIONS } from "@/lib/pre-sei/questions";
import { seiScore, scorePreSei, type PreSeiAnswers } from "@/lib/pre-sei/scoring";
import { SEI_COMPETENCIES, type SeiKey } from "@/lib/vital-signs/catalog";

const PRE_SEI_DATASET = "pre_sei";
const PRE_SEI_SOURCE = "pre_sei";

interface Demographics {
  ageRange?: string | null;
  gender?: string | null;
  sector?: string | null;
  country?: string | null;
}

/** Promedia las competencias 70-130 de un pursuit a un Int (para K/C/G). */
function pursuitInt(competencies: Record<SeiKey, number>, pursuit: "know" | "choose" | "give"): number {
  const keys = SEI_COMPETENCIES.filter((c) => c.pursuit === pursuit).map((c) => c.key);
  const vals = keys.map((k) => competencies[k]);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/**
 * Escribe EqSnapshot(pre_sei) + 8 PulsePointSignal(pre_sei) para un usuario.
 * Idempotente vía la clave de sesión en metadata; si ya existe snapshot pre_sei
 * para esta sesión, no duplica. Devuelve el id del snapshot.
 */
export async function materializePreSei(
  userId: string,
  answers: PreSeiAnswers,
  opts: { demographics?: Demographics; preSeiSessionId?: string } = {},
): Promise<{ snapshotId: string; created: boolean }> {
  const { demographics = {}, preSeiSessionId } = opts;

  // Idempotencia: ¿ya materializamos este intake?
  const existing = await prisma.eqSnapshot.findFirst({
    where: {
      userId,
      dataset: PRE_SEI_DATASET,
      ...(preSeiSessionId ? { context: preSeiSessionId } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    return { snapshotId: existing.id, created: false };
  }

  const result = scorePreSei(answers);
  const comp = result.competencies;

  const snapshot = await prisma.eqSnapshot.create({
    data: {
      userId,
      dataset: PRE_SEI_DATASET,
      context: preSeiSessionId ?? null,
      country: demographics.country ?? null,
      sector: demographics.sector ?? null,
      gender: demographics.gender ?? null,
      // age es Int? y el Pre-SEI recoge rangos → lo dejamos null; el rango se
      // usa solo para la normativa, no se fuerza a Int.
      K: Math.round(result.kcg.K),
      C: Math.round(result.kcg.C),
      G: Math.round(result.kcg.G),
      EL: Math.round(comp.EL),
      RP: Math.round(comp.RP),
      ACT: Math.round(comp.ACT),
      NE: Math.round(comp.NE),
      IM: Math.round(comp.IM),
      OP: Math.round(comp.OP),
      EMP: Math.round(comp.EMP),
      NG: Math.round(comp.NG),
    },
    select: { id: true },
  });

  // 8 señales (una por competencia → su pulse point), value 1-5 cruda.
  await prisma.pulsePointSignal.createMany({
    data: SEI_ORDER.map((sei) => ({
      userId,
      pulsePointCode: PRE_SEI_QUESTIONS[sei].pulsePointCode,
      source: PRE_SEI_SOURCE,
      value: answers[sei],
      metadata: { sei, preSeiSessionId: preSeiSessionId ?? null },
    })),
  });

  return { snapshotId: snapshot.id, created: true };
}

/**
 * Reclama una sesión anónima del Pre-SEI para un usuario recién registrado.
 * Marca la sesión como reclamada y materializa los datos. Idempotente.
 */
export async function claimPreSeiSession(
  token: string,
  userId: string,
): Promise<{ ok: boolean; snapshotId?: string }> {
  const session = await prisma.preSeiSession.findUnique({ where: { token } });
  if (!session) return { ok: false };

  // Ya reclamada por este mismo usuario → no-op idempotente.
  if (session.claimedByUserId && session.claimedByUserId !== userId) {
    return { ok: false };
  }

  const answers = session.answers as PreSeiAnswers;

  const { snapshotId } = await materializePreSei(userId, answers, {
    demographics: {
      ageRange: session.ageRange,
      gender: session.gender,
      sector: session.sector,
      country: session.country,
    },
    preSeiSessionId: session.id,
  });

  if (!session.claimedByUserId) {
    await prisma.preSeiSession.update({
      where: { id: session.id },
      data: { claimedByUserId: userId, claimedAt: new Date() },
    });
  }

  return { ok: true, snapshotId };
}

/** Intake interno (usuario logueado): salta la sesión anónima. */
export async function writePreSeiIntake(
  userId: string,
  answers: PreSeiAnswers,
  demographics?: Demographics,
): Promise<{ snapshotId: string; created: boolean }> {
  return materializePreSei(userId, answers, { demographics });
}

/** Re-exporta el mapeo lineal por si el caller necesita persistir 70-130. */
export { seiScore };
