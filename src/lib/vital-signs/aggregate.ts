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
  OVS_OUTCOMES,
  PULSE_POINTS,
  SEI_COMPETENCIES,
  type BrainTalentKey,
  type DriverCode,
  type OvsOutcomeCode,
  type PulsePointCode,
  type Quadrant,
  type SeiKey,
} from "./catalog";
import { cohesionBand, engagementIndexFromDriverMean } from "./engagement";

export type AggregateScope = "team" | "org" | "family" | "world";

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

export interface AggregatedOutcome {
  code: OvsOutcomeCode;
  esName: string;
  enName: string;
  scoreMean: number | null;
}

export interface AggregatedSei {
  key: SeiKey;
  esName: string;
  enName: string;
  pursuit: "know" | "choose" | "give";
  scoreMean: number | null;
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
  /** Cuadrante dominante del agregado (Map / Lantern / First Aid / Boots). */
  dominantQuadrant: Quadrant | null;
  /**
   * Proyección de los 4 OVS outcomes (Future Success / Customer Focus /
   * Productivity / Retention) calculados como media de los drivers
   * relacionados según el modelo Six Seconds.
   */
  outcomes: AggregatedOutcome[];
  /**
   * Orientación organizacional (Trailblazing / Expedition / Base Camp /
   * Logistics) derivada del dominantQuadrant. Útil para describir CÓMO
   * opera la organización agregada (no qué rol aporta una persona).
   */
  orientation: Quadrant | null;
  /**
   * Perfil completo de orientación: primaria + secundaria + si están
   * combinadas (delta ≤ 3 puntos). Cuando hay dominancia clara, solo
   * primaria. Real-world orgs raramente son puro un cuadrante.
   */
  orientationPrimary: Quadrant | null;
  orientationSecondary: Quadrant | null;
  orientationCombined: boolean;
  orientationDelta: number | null;
  /**
   * Media de las 8 competencias SEI (EL/RP/ACT/NE/IM/OP/EMP/NG) de los
   * miembros del scope. Forma parte del "capital emocional" inventariable
   * que el contexto tiene disponible.
   */
  seiCompetencies: AggregatedSei[];
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
  if (scope === "world") {
    // Toda la base Rowi (consent analytics se aplica después).
    const rows = await prisma.user.findMany({ select: { id: true } });
    return rows.map((r) => r.id);
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
    dominantQuadrant: null,
    outcomes: [],
    orientation: null,
    orientationPrimary: null,
    orientationSecondary: null,
    orientationCombined: false,
    orientationDelta: null,
    seiCompetencies: [],
  };
}

/** Media por SEI competency a partir de los EqSnapshots crudos. */
function computeSeiCompetencies(
  snapshots: Array<{
    EL: number | null;
    RP: number | null;
    ACT: number | null;
    NE: number | null;
    IM: number | null;
    OP: number | null;
    EMP: number | null;
    NG: number | null;
  }>,
): AggregatedSei[] {
  return SEI_COMPETENCIES.map((c) => {
    const xs = snapshots
      .map((s) => s[c.key])
      .filter((v): v is number => typeof v === "number");
    const m = xs.length > 0 ? mean(xs) : null;
    return {
      key: c.key,
      esName: c.esName,
      enName: c.enName,
      pursuit: c.pursuit,
      scoreMean: round1(m),
      n: xs.length,
    };
  });
}

function computeOutcomes(drivers: AggregatedDriver[]): AggregatedOutcome[] {
  const driverMean = new Map<DriverCode, number>();
  for (const d of drivers) {
    if (d.scoreMean !== null) driverMean.set(d.code, d.scoreMean);
  }
  return OVS_OUTCOMES.map((o) => {
    const xs: number[] = [];
    for (const dc of o.relatedDrivers) {
      const v = driverMean.get(dc);
      if (typeof v === "number") xs.push(v);
    }
    return {
      code: o.code,
      esName: o.esName,
      enName: o.enName,
      scoreMean: xs.length > 0 ? round1(mean(xs)) : null,
    };
  });
}

/**
 * Ranking de los 4 cuadrantes (Motivation→MAPA, Change→LINTERNA,
 * Teamwork→BOTIQUIN, Execution→BOTAS) ordenados por media descendente.
 * Trust es el pivote del modelo y no genera cuadrante.
 */
function rankQuadrants(drivers: AggregatedDriver[]): Array<{ q: Quadrant; v: number }> {
  const candidates: Array<{ q: Quadrant; v: number }> = [];
  for (const d of drivers) {
    if (d.scoreMean === null) continue;
    if (d.code === "MOTIVATION") candidates.push({ q: "MAPA", v: d.scoreMean });
    else if (d.code === "CHANGE") candidates.push({ q: "LINTERNA", v: d.scoreMean });
    else if (d.code === "TEAMWORK") candidates.push({ q: "BOTIQUIN", v: d.scoreMean });
    else if (d.code === "EXECUTION") candidates.push({ q: "BOTAS", v: d.scoreMean });
  }
  candidates.sort((a, b) => b.v - a.v);
  return candidates;
}

function dominantQuadrantOf(drivers: AggregatedDriver[]): Quadrant | null {
  const ranked = rankQuadrants(drivers);
  return ranked[0]?.q ?? null;
}

const COMBINED_DELTA_THRESHOLD = 3;

/**
 * Computa el perfil de orientación: primaria, secundaria y si están lo
 * suficientemente cerca para mostrarse como combinada (delta ≤ 3 puntos).
 * Cuando hay dominancia clara (delta > 3) solo se reporta la primaria.
 */
function orientationProfileOf(drivers: AggregatedDriver[]): {
  primary: Quadrant | null;
  secondary: Quadrant | null;
  combined: boolean;
  delta: number | null;
} {
  const ranked = rankQuadrants(drivers);
  if (ranked.length === 0) return { primary: null, secondary: null, combined: false, delta: null };
  const primary = ranked[0].q;
  if (ranked.length < 2) return { primary, secondary: null, combined: false, delta: null };
  const delta = Math.round((ranked[0].v - ranked[1].v) * 10) / 10;
  const combined = delta <= COMBINED_DELTA_THRESHOLD;
  return {
    primary,
    secondary: combined ? ranked[1].q : null,
    combined,
    delta,
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
    dominantQuadrant: dominantQuadrantOf(drivers),
    outcomes: computeOutcomes(drivers),
    orientation: dominantQuadrantOf(drivers),
    ...(() => {
      const p = orientationProfileOf(drivers);
      return {
        orientationPrimary: p.primary,
        orientationSecondary: p.secondary,
        orientationCombined: p.combined,
        orientationDelta: p.delta,
      };
    })(),
    seiCompetencies: computeSeiCompetencies(Array.from(latestByUser.values())),
  };
}
