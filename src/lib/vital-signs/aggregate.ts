/**
 * Agregador inferido de Vital Signs para team / org / family.
 *
 * Hasta que tengamos CSVs OVS/TVS oficiales cargados, este helper proyecta
 * los 15 PPs y 5 drivers de un grupo combinando los EqSnapshot+TalentSnapshot
 * más recientes de sus miembros y promediando. El resultado se etiqueta como
 * "Inferencia v0 — no es OVS/TVS oficial" en la UI.
 *
 * Reglas:
 * - Privacidad floor N≥5: si menos de 5 miembros tienen snapshot + consent
 *   analytics, devuelve `suppressed: true` sin scores.
 * - Pesos calibrados v1 se aplican si están activos (PulsePointWeights.active).
 * - Engagement Index y cohesion bands reusan los helpers existentes.
 */
import { prisma } from "@/core/prisma";
import { filterByConsent } from "@/lib/privacy/checkConsent";
import {
  calculateVitalSigns,
  calculateVitalSignsCalibrated,
  type InputBrainTalents,
  type InputSeiCompetencies,
  type WeightsByPp,
} from "./calculate";
import {
  DRIVERS,
  PULSE_POINTS,
  type BrainTalentKey,
  type DriverCode,
  type PulsePointCode,
} from "./catalog";
import { cohesionBand, engagementIndexFromDriverMean } from "./engagement";

export type AggregateScope = "team" | "org" | "family";

const TALENT_KEY_MAP: Record<string, BrainTalentKey> = {
  datamining: "datamining",
  modeling: "modeling",
  prioritizing: "prioritizing",
  connection: "connection",
  emotionalinsight: "emotionalinsight",
  collaboration: "collaboration",
  reflecting: "reflecting",
  reflection: "reflecting",
  adaptability: "adaptability",
  criticalthinking: "criticalthinking",
  resilience: "resilience",
  risktolerance: "risktolerance",
  imagination: "imagination",
  proactivity: "proactivity",
  commitment: "commitment",
  problemsolving: "problemsolving",
  vision: "vision",
  designing: "designing",
  design: "designing",
  entrepreneurship: "entrepreneurship",
};

export interface AggregatedPulsePoint {
  code: PulsePointCode;
  driver: DriverCode;
  esName: string;
  enName: string;
  esFunction: string;
  enFunction: string;
  scoreMean: number | null;
  scoreSD: number | null;
  n: number;
}

export interface AggregatedDriver {
  code: DriverCode;
  esName: string;
  enName: string;
  esNeed: string;
  enNeed: string;
  scoreMean: number | null;
  scoreSD: number | null;
  cohesion: ReturnType<typeof cohesionBand>;
  n: number;
}

export interface AggregateResult {
  ok: true;
  scope: AggregateScope;
  subjectId: string;
  subjectName: string;
  suppressed: boolean;
  /** Miembros que contribuyeron al agregado (con snapshot + consent). */
  n: number;
  /** Miembros totales del grupo (denominador). */
  nTotal: number;
  drivers: AggregatedDriver[];
  pulsePoints: AggregatedPulsePoint[];
  engagementIndex: number | null;
  overallMean: number | null;
}

const N_MIN = 5;

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sd(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - m) * (v - m), 0) / values.length;
  return Math.sqrt(variance);
}

function round1(n: number | null): number | null {
  if (n === null) return null;
  return Math.round(n * 10) / 10;
}

async function userIdsForScope(scope: AggregateScope, subjectId: string): Promise<string[]> {
  if (scope === "team") {
    const rows = await prisma.rowiCommunityUser.findMany({
      where: { communityId: subjectId, userId: { not: null } },
      select: { userId: true },
    });
    return rows.map((r) => r.userId!).filter(Boolean);
  }
  if (scope === "org") {
    const rows = await prisma.membership.findMany({
      where: { tenantId: subjectId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }
  // family
  const rows = await prisma.familyRelation.findMany({
    where: {
      OR: [{ ownerId: subjectId }, { relatedUserId: subjectId }],
      consentStatus: "accepted",
    },
    select: { ownerId: true, relatedUserId: true },
  });
  const ids = new Set<string>([subjectId]);
  for (const r of rows) {
    ids.add(r.ownerId);
    if (r.relatedUserId) ids.add(r.relatedUserId);
  }
  return Array.from(ids);
}

function suppressed(
  scope: AggregateScope,
  subjectId: string,
  subjectName: string,
  n: number,
  nTotal: number,
): AggregateResult {
  return {
    ok: true,
    scope,
    subjectId,
    subjectName,
    suppressed: true,
    n,
    nTotal,
    drivers: [],
    pulsePoints: [],
    engagementIndex: null,
    overallMean: null,
  };
}

export async function aggregateInferredVitalSigns(args: {
  scope: AggregateScope;
  subjectId: string;
  subjectName: string;
}): Promise<AggregateResult> {
  const { scope, subjectId, subjectName } = args;

  const userIds = await userIdsForScope(scope, subjectId);
  const nTotal = userIds.length;
  if (nTotal === 0) return suppressed(scope, subjectId, subjectName, 0, 0);

  const consenting = await filterByConsent(userIds, "analytics");
  if (consenting.length < N_MIN) {
    return suppressed(scope, subjectId, subjectName, consenting.length, nTotal);
  }

  // Latest EqSnapshot per user (one row per user)
  const snapshots = await prisma.eqSnapshot.findMany({
    where: { userId: { in: consenting } },
    orderBy: { at: "desc" },
  });
  const latestByUser = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) {
    if (s.userId && !latestByUser.has(s.userId)) latestByUser.set(s.userId, s);
  }
  const snapshotIds = Array.from(latestByUser.values()).map((s) => s.id);
  const nWithSnapshot = snapshotIds.length;

  if (nWithSnapshot < N_MIN) {
    return suppressed(scope, subjectId, subjectName, nWithSnapshot, nTotal);
  }

  const talentRows = await prisma.talentSnapshot.findMany({
    where: { snapshotId: { in: snapshotIds } },
  });
  const talentsBySnap = new Map<string, typeof talentRows>();
  for (const t of talentRows) {
    const arr = talentsBySnap.get(t.snapshotId) ?? [];
    arr.push(t);
    talentsBySnap.set(t.snapshotId, arr);
  }

  const activeWeights = await prisma.pulsePointWeights.findMany({
    where: { active: true },
    select: { pulsePointCode: true, predictor: true, weight: true },
  });
  let weightsByPp: WeightsByPp | null = null;
  if (activeWeights.length > 0) {
    weightsByPp = {};
    for (const w of activeWeights) {
      const code = w.pulsePointCode as PulsePointCode;
      (weightsByPp[code] ??= []).push({ predictor: w.predictor, weight: w.weight });
    }
  }

  const ppValues = new Map<PulsePointCode, number[]>();
  const driverValues = new Map<DriverCode, number[]>();

  for (const snap of latestByUser.values()) {
    const sei: InputSeiCompetencies = {
      EL: snap.EL,
      RP: snap.RP,
      ACT: snap.ACT,
      NE: snap.NE,
      IM: snap.IM,
      OP: snap.OP,
      EMP: snap.EMP,
      NG: snap.NG,
    };
    const tlist = talentsBySnap.get(snap.id) ?? [];
    const talents: InputBrainTalents = {};
    for (const t of tlist) {
      if (typeof t.score !== "number") continue;
      const normalized = t.key.replace(/\s+/g, "").toLowerCase();
      const mapped = TALENT_KEY_MAP[normalized];
      if (mapped) talents[mapped] = t.score;
    }
    const r = weightsByPp
      ? calculateVitalSignsCalibrated(sei, talents, weightsByPp)
      : calculateVitalSigns(sei, talents);
    for (const pp of r.pulsePoints) {
      if (pp.score !== null) {
        const arr = ppValues.get(pp.code) ?? [];
        arr.push(pp.score);
        ppValues.set(pp.code, arr);
      }
    }
    for (const d of r.drivers) {
      if (d.score !== null) {
        const arr = driverValues.get(d.code) ?? [];
        arr.push(d.score);
        driverValues.set(d.code, arr);
      }
    }
  }

  const pulsePoints: AggregatedPulsePoint[] = PULSE_POINTS.map((pp) => {
    const xs = ppValues.get(pp.code) ?? [];
    return {
      code: pp.code,
      driver: pp.driver,
      esName: pp.esName,
      enName: pp.enName,
      esFunction: pp.esFunction,
      enFunction: pp.enFunction,
      scoreMean: round1(mean(xs)),
      scoreSD: round1(sd(xs)),
      n: xs.length,
    };
  });

  const drivers: AggregatedDriver[] = DRIVERS.map((d) => {
    const xs = driverValues.get(d.code) ?? [];
    const m = mean(xs);
    const s = sd(xs);
    return {
      code: d.code,
      esName: d.esName,
      enName: d.enName,
      esNeed: d.esNeed,
      enNeed: d.enNeed,
      scoreMean: round1(m),
      scoreSD: round1(s),
      cohesion: cohesionBand(s),
      n: xs.length,
    };
  });

  const driverMeans = drivers
    .map((d) => d.scoreMean)
    .filter((v): v is number => typeof v === "number");
  const overallMean = driverMeans.length > 0 ? mean(driverMeans) : null;
  const engagementIndex =
    overallMean !== null ? engagementIndexFromDriverMean(overallMean) : null;

  return {
    ok: true,
    scope,
    subjectId,
    subjectName,
    suppressed: false,
    n: nWithSnapshot,
    nTotal,
    drivers,
    pulsePoints,
    engagementIndex,
    overallMean: round1(overallMean),
  };
}
