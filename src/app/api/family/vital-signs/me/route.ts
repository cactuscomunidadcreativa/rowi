export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import {
  calculateVitalSigns,
  type InputBrainTalents,
  type InputSeiCompetencies,
} from "@/lib/vital-signs/calculate";
import type { BrainTalentKey } from "@/lib/vital-signs/catalog";

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

interface MemberVS {
  relationship: string;
  displayName: string;
  consentStatus: string;
  hasData: boolean;
  drivers?: ReturnType<typeof calculateVitalSigns>["drivers"];
  pulsePoints?: ReturnType<typeof calculateVitalSigns>["pulsePoints"];
}

async function computeUserVS(userId: string) {
  const snap = await prisma.eqSnapshot.findFirst({
    where: { userId },
    orderBy: { at: "desc" },
  });
  if (!snap) return null;

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

  return calculateVitalSigns(sei, talents);
}

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

    const familyRelations = await prisma.familyRelation.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const selfVS = await computeUserVS(user.id);

    const members: MemberVS[] = [];
    let aggregateAccumulator: Record<string, number[]> = {};

    if (selfVS) {
      for (const pp of selfVS.pulsePoints) {
        if (typeof pp.score === "number") {
          aggregateAccumulator[pp.code] = [pp.score];
        }
      }
    }

    for (const rel of familyRelations) {
      const member: MemberVS = {
        relationship: rel.relationship,
        displayName: rel.relatedName ?? rel.relatedEmail ?? "Miembro",
        consentStatus: rel.consentStatus,
        hasData: false,
      };

      if (rel.consentStatus === "accepted" && rel.relatedUserId) {
        const vs = await computeUserVS(rel.relatedUserId);
        if (vs) {
          member.hasData = true;
          member.drivers = vs.drivers;
          member.pulsePoints = vs.pulsePoints;
          for (const pp of vs.pulsePoints) {
            if (typeof pp.score === "number") {
              if (!aggregateAccumulator[pp.code]) aggregateAccumulator[pp.code] = [];
              aggregateAccumulator[pp.code].push(pp.score);
            }
          }
        }
      }

      members.push(member);
    }

    const aggregate = Object.entries(aggregateAccumulator).map(([code, scores]) => ({
      pulsePointCode: code,
      mean: scores.reduce((a, b) => a + b, 0) / scores.length,
      n: scores.length,
    }));

    return NextResponse.json({
      ok: true,
      user: { name: user.name ?? "", email: user.email ?? "" },
      familySize: familyRelations.length + 1,
      acceptedCount: familyRelations.filter((r) => r.consentStatus === "accepted").length,
      pendingCount: familyRelations.filter((r) => r.consentStatus === "pending").length,
      self: selfVS,
      members,
      aggregate,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/family/vital-signs/me error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
