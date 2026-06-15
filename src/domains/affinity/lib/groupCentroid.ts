/**
 * 🎯 Brecha de GRUPO por centro de gravedad (centroide).
 *
 * Generaliza la brecha de díada 1:1 a 3+ personas: se calcula el perfil PROMEDIO
 * del grupo (centroide) y la brecha de cada persona es su distancia (heat135) al
 * centro, con el MISMO motor 1:1 (compAffinity135 / collaboration135 /
 * understanding135) tratando el centroide como "persona B". La brecha del grupo
 * es la media de esas distancias.
 *
 * Puro y determinista (sin Prisma). Reusa el affinityEngine — no inventa fórmula.
 *
 * ⚠️ El centroide y su brecha agregada son HIPÓTESIS v0 calibrable, igual que los
 * pesos por contexto del motor. No es verdad validada; calibrar con ground-truth.
 */
import {
  compAffinity135, collaboration135, understanding135, talentSynergyFactor,
  closenessMultiplier, CTX, clamp, to100, avg,
  type Project, type CompKey,
} from "./affinityEngine";

const COMP_KEYS: CompKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

/** Perfil de afinidad de una persona (lo que consumen las funciones del motor). */
export interface AffinityProfile {
  name?: string;
  comp: Record<CompKey, number | null>;
  tals: Record<string, number | null>;
  outs: { key: string; score: number | null }[];
  brain: string | null;
}

/** Centroide: perfil promedio del grupo sobre competencias, talentos y outcomes. */
export function buildCentroid(profiles: AffinityProfile[]): AffinityProfile {
  const comp = Object.fromEntries(
    COMP_KEYS.map((k) => [k, avg(profiles.map((p) => p.comp[k]))]),
  ) as Record<CompKey, number | null>;

  // talentos: unión de claves, promediadas.
  const talKeys = new Set<string>();
  for (const p of profiles) for (const k of Object.keys(p.tals)) talKeys.add(k);
  const tals: Record<string, number | null> = {};
  for (const k of talKeys) tals[k] = avg(profiles.map((p) => p.tals[k] ?? null));

  // outcomes: unión de claves, promediadas.
  const outKeys = new Set<string>();
  for (const p of profiles) for (const o of p.outs) outKeys.add(o.key);
  const outs = [...outKeys].map((key) => ({
    key,
    score: avg(profiles.flatMap((p) => p.outs.filter((o) => o.key === key).map((o) => o.score))),
  }));

  // brain style del centroide = moda (o null → el motor usa neutral 60).
  const brain = modeBrain(profiles.map((p) => p.brain));

  return { name: "__centroid__", comp, tals, outs, brain };
}

function modeBrain(brains: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const b of brains) if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
  let best: string | null = null;
  let bestN = 0;
  for (const [b, n] of counts) if (n > bestN) { best = b; bestN = n; }
  return best;
}

/** Brecha (heat135) de una persona vs el centroide, en un contexto. Mismo cálculo
 * que /api/affinity/[context] 1:1, con el centroide como "persona B". */
export function personGapToCentroid(person: AffinityProfile, centroid: AffinityProfile, project: Project): number {
  const { score: growth } = compAffinity135(person.comp, centroid.comp, project);
  const tFactor = talentSynergyFactor(project, person.tals, centroid.tals);
  const collab = collaboration135(person.brain, centroid.brain, person.comp, centroid.comp, tFactor);
  const understand = understanding135(person.outs, centroid.outs, project);
  const W = CTX[project];
  const composite = (W.growth * growth + W.collab * collab + W.understand * understand) * closenessMultiplier("neutral");
  return clamp(composite, 0, 135);
}

export interface GroupGapSummary {
  heat135: number; // media de las distancias de cada persona al centro
  heat100: number;
  context: Project;
  groupSize: number;
  perPerson: { name: string; heat135: number }[];
}

/** Brecha agregada del grupo: media de las brechas persona→centroide. La forma
 * es análoga a RelationshipDyad.lastGapSummary para que affinityAsGap la consuma. */
export function groupGapSummary(profiles: AffinityProfile[], project: Project = "relationship"): GroupGapSummary | null {
  if (profiles.length < 2) return null;
  const centroid = buildCentroid(profiles);
  const perPerson = profiles.map((p, i) => ({
    name: p.name ?? `#${i + 1}`,
    heat135: Math.round(personGapToCentroid(p, centroid, project)),
  }));
  const meanHeat = Math.round(perPerson.reduce((s, x) => s + x.heat135, 0) / perPerson.length);
  return {
    heat135: meanHeat,
    heat100: to100(meanHeat),
    context: project,
    groupSize: profiles.length,
    perPerson,
  };
}
