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

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const caller = await prisma.user.findUnique({ where: { email } });
    if (!caller) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const clientUserId = url.searchParams.get("clientUserId");
    if (!clientUserId) {
      return NextResponse.json({ ok: false, error: "clientUserId required" }, { status: 400 });
    }

    const [engagement, invite, clientUser] = await Promise.all([
      prisma.serviceEngagement.findFirst({
        where: { providerId: caller.id, clientUserId, status: "active" },
      }),
      prisma.personalResearchInvite.findFirst({
        where: {
          subjectUserId: clientUserId,
          inviteeUserId: caller.id,
          status: "accepted",
        },
      }),
      prisma.user.findUnique({
        where: { id: clientUserId },
        select: { id: true, name: true, email: true },
      }),
    ]);

    if (!clientUser) {
      return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
    }
    if (!engagement && !invite) {
      return NextResponse.json(
        { ok: false, error: "No active engagement or accepted invite for this client" },
        { status: 403 },
      );
    }

    const snap = await prisma.eqSnapshot.findFirst({
      where: { userId: clientUserId },
      orderBy: { at: "desc" },
    });
    if (!snap) {
      return NextResponse.json({
        ok: true,
        client: clientUser,
        accessVia: engagement ? "service_engagement" : "personal_invite",
        source: "no-snapshot",
        ...calculateVitalSigns(null, {}),
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

    const result = calculateVitalSigns(sei, talents);

    return NextResponse.json({
      ok: true,
      client: clientUser,
      accessVia: engagement ? "service_engagement" : "personal_invite",
      source: "inferred",
      snapshotDate: snap.at,
      snapshotProject: snap.project ?? null,
      ...result,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/coach/client-vs error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
