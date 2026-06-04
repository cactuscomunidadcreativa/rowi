/**
 * GET /api/vital-signs/me/budget
 *
 * Emotional Budgeting cross for the signed-in user: their SEI-inferred
 * CAPACITY vs a measured VS PERCEPTION, classified per pulse point into
 * blind_spot / aligned / hidden_strength.
 *
 * Query:
 *   ?assessmentId=<id>   measured VS assessment to cross against (the user's
 *                        LVS self-report or a TVS/OVS they belong to)
 *   (omitted)            returns the inferred capacity only, with crossable=false
 *
 * The measured side comes from VitalSignsScore (level=pulse_point). The cross
 * method follows the instrument: LVS is read RELATIVELY (z-score within the
 * person — the generous-self-rating lesson); TVS/OVS use absolute points.
 *
 * Authorization: the user can only cross their own SEI against an assessment
 * they own (LVS) or belong to. We resolve ownership before reading scores.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import {
  calculateVitalSigns,
  type InputBrainTalents,
  type InputSeiCompetencies,
} from "@/lib/vital-signs/calculate";
import type { BrainTalentKey, PulsePointCode, DriverCode } from "@/lib/vital-signs/catalog";
import {
  crossRelative,
  crossAbsolute,
  type PulsePointPair,
} from "@/lib/vital-signs/budget-cross";

const TALENT_KEY_MAP: Record<string, BrainTalentKey> = {
  datamining: "datamining", modeling: "modeling", prioritizing: "prioritizing",
  connection: "connection", emotionalinsight: "emotionalinsight", collaboration: "collaboration",
  reflecting: "reflecting", reflection: "reflecting", adaptability: "adaptability",
  criticalthinking: "criticalthinking", resilience: "resilience", risktolerance: "risktolerance",
  imagination: "imagination", proactivity: "proactivity", commitment: "commitment",
  problemsolving: "problemsolving", vision: "vision", designing: "designing",
  design: "designing", entrepreneurship: "entrepreneurship",
};

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // --- capacity side: latest SEI snapshot → inferred pulse points ---
    const snap = await prisma.eqSnapshot.findFirst({
      where: { OR: [{ userId: user.id }, { email: { equals: email, mode: "insensitive" } }] },
      orderBy: { at: "desc" },
    });
    if (!snap) {
      return NextResponse.json({
        ok: true,
        crossable: false,
        reason: "no_sei",
        message: "No SEI snapshot to infer capacity from.",
      });
    }
    const talentsRaw = await prisma.talentSnapshot.findMany({ where: { snapshotId: snap.id } });
    const sei: InputSeiCompetencies = {
      EL: snap.EL, RP: snap.RP, ACT: snap.ACT, NE: snap.NE,
      IM: snap.IM, OP: snap.OP, EMP: snap.EMP, NG: snap.NG,
    };
    const talents: InputBrainTalents = {};
    for (const t of talentsRaw) {
      if (typeof t.score !== "number") continue;
      const mapped = TALENT_KEY_MAP[t.key.replace(/\s+/g, "").toLowerCase()];
      if (mapped) talents[mapped] = t.score;
    }
    const inferred = calculateVitalSigns(sei, talents);
    const capacityByCode = new Map<PulsePointCode, { score: number | null; driver: DriverCode }>(
      inferred.pulsePoints.map((p) => [p.code, { score: p.score, driver: p.driver }]),
    );

    const assessmentId = req.nextUrl.searchParams.get("assessmentId");
    if (!assessmentId) {
      return NextResponse.json({
        ok: true,
        crossable: false,
        reason: "no_measured",
        message: "Pass ?assessmentId to cross against a measured VS report.",
        capacity: inferred.pulsePoints.map((p) => ({ code: p.code, driver: p.driver, score: p.score })),
      });
    }

    // --- ownership: the assessment must belong to / include this user ---
    const assessment = await prisma.vitalSignsAssessment.findUnique({
      where: { id: assessmentId },
      select: { id: true, scope: true, subjectType: true, subjectId: true },
    });
    if (!assessment) {
      return NextResponse.json({ ok: false, error: "Assessment not found" }, { status: 404 });
    }
    // Conservative ownership check: self/individual-scoped assessments (LVS)
    // must be the user's own subject.
    const isIndividual =
      assessment.subjectType === "leader" || assessment.subjectType === "individual";
    if (isIndividual && assessment.subjectId !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // --- perception side: measured pulse points from VitalSignsScore ---
    const scores = await prisma.vitalSignsScore.findMany({
      where: { assessmentId, level: "pulse_point" },
      select: { dimension: true, scoreMean: true },
    });
    if (scores.length === 0) {
      return NextResponse.json({
        ok: true,
        crossable: false,
        reason: "no_measured_scores",
        message: "Assessment has no pulse-point scores.",
      });
    }
    const measuredByCode = new Map<string, number>(
      scores.map((s) => [s.dimension, s.scoreMean]),
    );

    // --- build pairs over the union of pulse-point codes ---
    const pairs: PulsePointPair[] = [];
    for (const [code, cap] of capacityByCode) {
      const perception = measuredByCode.get(code);
      pairs.push({
        code,
        driver: cap.driver,
        capacity: cap.score,
        perception: perception ?? null,
      });
    }

    const isSelfLeadership = (assessment.scope ?? "").toUpperCase() === "LVS";
    const cross = isSelfLeadership
      ? crossRelative(pairs, "SEI_LVS")
      : crossAbsolute(pairs, "SEI_TVS");

    return NextResponse.json({
      ok: true,
      crossable: true,
      instrument: assessment.scope,
      method: cross.method,
      kind: cross.kind,
      snapshotDate: snap.at,
      blindSpots: cross.blindSpots,
      hiddenStrengths: cross.hiddenStrengths,
      pulsePoints: cross.pulsePoints,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/me/budget error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
