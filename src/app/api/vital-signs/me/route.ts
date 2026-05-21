export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import {
  calculateVitalSigns,
  calculateVitalSignsCalibrated,
  type InputBrainTalents,
  type InputSeiCompetencies,
  type WeightsByPp,
} from "@/lib/vital-signs/calculate";
import type { BrainTalentKey, PulsePointCode } from "@/lib/vital-signs/catalog";

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

    const memberWhere: Array<Record<string, unknown>> = [{ userId: user.id }];
    if (email) memberWhere.push({ email: { equals: email, mode: "insensitive" } });

    const [members, rvUser] = await Promise.all([
      prisma.communityMember.findMany({
        where: { OR: memberWhere },
        select: { id: true, userId: true },
      }),
      prisma.rowiVerseUser.findUnique({
        where: { userId: user.id },
        select: { id: true },
      }),
    ]);

    const linkedUserIds = new Set<string>([user.id]);
    members.forEach((m) => { if (m.userId) linkedUserIds.add(m.userId); });

    const snapshotWhere: Array<Record<string, unknown>> = [
      { userId: { in: Array.from(linkedUserIds) } },
    ];
    if (members.length > 0) {
      snapshotWhere.push({ memberId: { in: members.map((m) => m.id) } });
    }
    if (rvUser) {
      snapshotWhere.push({ rowiverseUserId: rvUser.id });
    }
    snapshotWhere.push({ email: { equals: email, mode: "insensitive" } });

    const snap = await prisma.eqSnapshot.findFirst({
      where: { OR: snapshotWhere },
      orderBy: { at: "desc" },
    });

    if (!snap) {
      const empty = calculateVitalSigns(null, {});
      return NextResponse.json({
        ok: true,
        source: "no-snapshot",
        user: { name: user.name ?? "", email: user.email ?? "" },
        snapshotDate: null,
        snapshotProject: null,
        ...empty,
      });
    }

    const talentsRaw = await prisma.talentSnapshot.findMany({
      where: { snapshotId: snap.id },
    });

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

    const talents: InputBrainTalents = {};
    for (const t of talentsRaw) {
      if (typeof t.score !== "number") continue;
      const normalized = t.key.replace(/\s+/g, "").toLowerCase();
      const mapped = TALENT_KEY_MAP[normalized];
      if (mapped) talents[mapped] = t.score;
    }

    // Load active calibrated weights (v1+). Falls back per-PP to v0 hardcoded
    // hypothesis when no calibration is active for that pulse point.
    const activeWeights = await prisma.pulsePointWeights.findMany({
      where: { active: true },
      select: { pulsePointCode: true, predictor: true, weight: true },
    });
    let result;
    if (activeWeights.length === 0) {
      result = calculateVitalSigns(sei, talents);
    } else {
      const weightsByPp: WeightsByPp = {};
      for (const w of activeWeights) {
        const code = w.pulsePointCode as PulsePointCode;
        (weightsByPp[code] ??= []).push({ predictor: w.predictor, weight: w.weight });
      }
      result = calculateVitalSignsCalibrated(sei, talents, weightsByPp);
    }

    return NextResponse.json({
      ok: true,
      source: "inferred",
      user: { name: user.name ?? "", email: user.email ?? "" },
      snapshotDate: snap.at,
      snapshotProject: snap.project ?? null,
      ...result,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/vital-signs/me error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
