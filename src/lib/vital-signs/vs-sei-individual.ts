/**
 * Per-individual Vital Signs ↔ SEI linking + correlation.
 *
 * SPECIAL-CATEGORY DATA (GDPR). Every function here is gated on the subject's
 * explicit `vs_sei_individual_linking` consent. Nothing links, computes, or
 * surfaces unless the subject opted in; exposure to anyone other than the
 * subject additionally requires research_lens consent and is audited by the
 * caller.
 *
 * Statistical honesty: a single person's correlation across instruments is only
 * defined when they have ≥2 PAIRED assessment occasions (a VS response and an
 * SEI snapshot from the same period). With one occasion each you can only report
 * the paired values, not a correlation — so `recomputeIndividualVsSei` writes
 * correlations only for subjects with enough repeated measurements.
 */

import { prisma } from "@/core/prisma";
import { EQ_COMPETENCIES } from "@/lib/benchmarks/column-mapping";
import {
  canLinkVsSeiIndividual,
  hasResearchLensConsent,
} from "@/lib/privacy/checkConsent";
import { getConsentDescriptor } from "@/lib/privacy/consents";

// VS outcome/driver keys we read off a response's outcomesRaw, keyed the same
// way the cohort engine keys them (uppercased driver/outcome codes).
const VS_DRIVER_KEYS = ["TRUST", "MOTIVATION", "TEAMWORK", "EXECUTION", "CHANGE"] as const;

const MIN_PAIRED_OCCASIONS = 2;

function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const d = Math.sqrt(dx * dy);
  return d === 0 ? 0 : num / d;
}

/**
 * Link a consented subject's identified Vital Signs responses to their SEI
 * snapshots, by shared User.id. Idempotent (unique on responseId+snapshotId).
 *
 * Returns 0 immediately when the subject has not granted consent — the gate is
 * here, not just at the call site, so no path can create a link without it.
 *
 * Note: CSV-imported VS responses carry respondentId=null (anonymous by
 * construction), so they are never linked. Only responses with a real
 * respondentId (native survey, or a future self-claim that sets it) qualify.
 */
export async function linkIndividualVsSei(userId: string): Promise<number> {
  if (!(await canLinkVsSeiIndividual(userId))) return 0;

  const descriptor = getConsentDescriptor("vs_sei_individual_linking");
  const consentVersion = descriptor?.version ?? 1;

  const [responses, snapshots] = await Promise.all([
    prisma.vitalSignsResponse.findMany({
      where: { respondentId: userId },
      select: { id: true },
    }),
    prisma.eqSnapshot.findMany({
      where: { userId },
      select: { id: true },
    }),
  ]);

  if (responses.length === 0 || snapshots.length === 0) return 0;

  let linked = 0;
  for (const r of responses) {
    for (const s of snapshots) {
      await prisma.vsSeiIndividualLink.upsert({
        where: {
          vitalSignsResponseId_eqSnapshotId: {
            vitalSignsResponseId: r.id,
            eqSnapshotId: s.id,
          },
        },
        create: {
          userId,
          vitalSignsResponseId: r.id,
          eqSnapshotId: s.id,
          method: "native",
          confidence: 1,
          consentVersion,
        },
        update: { consentVersion },
      });
      linked++;
    }
  }
  return linked;
}

/**
 * Recompute the per-subject VS↔SEI correlations for one consented subject.
 * Clears and rebuilds that subject's rows only. No-op (and clears any stale
 * rows) when consent is absent or the subject lacks ≥2 paired occasions.
 */
export async function recomputeIndividualVsSei(userId: string): Promise<{ written: number }> {
  // Revoked/absent consent → purge any previously computed rows and stop.
  if (!(await canLinkVsSeiIndividual(userId))) {
    await prisma.vsSeiIndividualCorrelation.deleteMany({ where: { userId } });
    return { written: 0 };
  }

  const links = await prisma.vsSeiIndividualLink.findMany({
    where: { userId },
    select: { vitalSignsResponseId: true, eqSnapshotId: true },
  });
  if (links.length < MIN_PAIRED_OCCASIONS) {
    await prisma.vsSeiIndividualCorrelation.deleteMany({ where: { userId } });
    return { written: 0 };
  }

  const responseIds = [...new Set(links.map((l) => l.vitalSignsResponseId))];
  const snapshotIds = [...new Set(links.map((l) => l.eqSnapshotId))];

  const [responses, snapshots] = await Promise.all([
    prisma.vitalSignsResponse.findMany({
      where: { id: { in: responseIds } },
      select: { id: true, outcomesRaw: true, createdAt: true, assessment: { select: { scope: true } } },
    }),
    prisma.eqSnapshot.findMany({
      where: { id: { in: snapshotIds } },
      select: { id: true, K: true, C: true, G: true, EL: true, RP: true, ACT: true, NE: true, IM: true, OP: true, EMP: true, NG: true },
    }),
  ]);

  const respById = new Map(responses.map((r) => [r.id, r]));
  const snapById = new Map(snapshots.map((s) => [s.id, s]));

  // Build paired occasions: each link is one (VS, SEI) occasion for this person.
  type Occasion = { vsScope: string; vs: Map<string, number>; sei: Map<string, number> };
  const occasions: Occasion[] = [];
  for (const l of links) {
    const r = respById.get(l.vitalSignsResponseId);
    const s = snapById.get(l.eqSnapshotId);
    if (!r || !s) continue;

    const vs = new Map<string, number>();
    const outcomes = (r.outcomesRaw ?? {}) as Record<string, unknown>;
    for (const k of VS_DRIVER_KEYS) {
      const v = outcomes[k];
      if (typeof v === "number" && Number.isFinite(v)) vs.set(k, v);
    }

    const sei = new Map<string, number>();
    for (const k of EQ_COMPETENCIES) {
      const v = (s as Record<string, unknown>)[k];
      if (typeof v === "number" && Number.isFinite(v)) sei.set(k, v);
    }

    occasions.push({ vsScope: r.assessment?.scope ?? "ALL", vs, sei });
  }

  await prisma.vsSeiIndividualCorrelation.deleteMany({ where: { userId } });

  if (occasions.length < MIN_PAIRED_OCCASIONS) return { written: 0 };

  const vsKeys = new Set<string>();
  const seiKeys = new Set<string>();
  for (const o of occasions) {
    o.vs.forEach((_, k) => vsKeys.add(k));
    o.sei.forEach((_, k) => seiKeys.add(k));
  }

  let written = 0;
  for (const vk of vsKeys) {
    for (const sk of seiKeys) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const o of occasions) {
        const x = o.vs.get(vk);
        const y = o.sei.get(sk);
        if (x !== undefined && y !== undefined) {
          xs.push(x);
          ys.push(y);
        }
      }
      if (xs.length < MIN_PAIRED_OCCASIONS) continue;
      await prisma.vsSeiIndividualCorrelation.create({
        data: { userId, vsScope: "ALL", vsKey: vk, seiKey: sk, correlation: pearson(xs, ys), n: xs.length },
      });
      written++;
    }
  }
  return { written };
}

export interface IndividualVsSeiRow {
  vsKey: string;
  seiKey: string;
  correlation: number;
  n: number;
}

/**
 * Read a subject's individual VS↔SEI correlations on behalf of a viewer,
 * enforcing the visibility gate and writing an audit row for non-self access.
 *
 * Gate:
 *  - Viewer === subject (`self`): always allowed.
 *  - Viewer !== subject: allowed only if (a) the subject granted
 *    `vs_sei_individual_linking` AND (b) the viewer granted `research_lens`.
 *    Any cross-subject read is logged to ResearchAccessAudit.
 *
 * Returns null when the gate denies access (caller maps to 403). Returns [] when
 * access is allowed but the subject has no computed correlations.
 */
export async function getIndividualVsSeiForViewer(params: {
  viewerUserId: string;
  subjectUserId: string;
  contextPath: string;
}): Promise<IndividualVsSeiRow[] | null> {
  const { viewerUserId, subjectUserId, contextPath } = params;
  const isSelf = viewerUserId === subjectUserId;

  if (!isSelf) {
    const [subjectConsented, viewerHasResearch] = await Promise.all([
      canLinkVsSeiIndividual(subjectUserId),
      hasResearchLensConsent(viewerUserId),
    ]);
    if (!subjectConsented || !viewerHasResearch) return null;

    await prisma.researchAccessAudit.create({
      data: {
        viewerUserId,
        subjectUserId,
        action: "view_individual_vs_sei",
        contextPath,
      },
    });
  } else if (!(await canLinkVsSeiIndividual(subjectUserId))) {
    // Even the subject only sees this once they've opted into the linking.
    return null;
  }

  const rows = await prisma.vsSeiIndividualCorrelation.findMany({
    where: { userId: subjectUserId },
    orderBy: { correlation: "desc" },
    select: { vsKey: true, seiKey: true, correlation: true, n: true },
  });
  return rows;
}
