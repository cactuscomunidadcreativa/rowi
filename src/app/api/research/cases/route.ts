export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { canSeePII, logResearchAccess, pseudonymize, requireResearchUser } from "@/lib/research/access";

/**
 * List of case studies — one per user who has consented to research_lens.
 * Founder + scientific_lead see real names; teams see Case-XXXXXX codes.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireResearchUser(req);
    if ("error" in auth) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }
    const { user } = auth;

    // Users who explicitly granted research_lens consent in its current version.
    // CONSENTS catalog is source of truth — if we bump the version, users on the
    // previous version stop being included until they re-consent.
    const researchLensDescriptor = (await import("@/lib/privacy/consents")).CONSENTS.find(
      (c) => c.key === "research_lens",
    );
    const requiredVersion = researchLensDescriptor?.version ?? 1;
    const consents = await prisma.userConsent.findMany({
      where: {
        consentKey: "research_lens",
        granted: true,
        revokedAt: null,
        version: { gte: requiredVersion },
      },
      select: { userId: true, grantedAt: true },
    });

    const userIds = Array.from(new Set(consents.map((c) => c.userId)));
    if (userIds.length === 0) {
      return NextResponse.json({ ok: true, cases: [], totalConsented: 0 });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const piiVisible = canSeePII(user.researchAccessLevel);

    // Per-user latest EQ snapshot timestamp + counts
    const userIdSet = new Set(userIds);
    const [snaps, inferences, feedbacks] = await Promise.all([
      prisma.eqSnapshot.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, at: true },
        orderBy: { at: "desc" },
      }),
      prisma.pulsePointInference.groupBy({
        by: ["subjectUserId"],
        where: { subjectUserId: { in: userIds } },
        _count: { _all: true },
      }),
      prisma.hypothesisFeedback.groupBy({
        by: ["respondentId"],
        where: { respondentId: { in: userIds } },
        _count: { _all: true },
      }),
    ]);

    const latestSnap = new Map<string, Date>();
    for (const s of snaps) {
      if (s.userId && !latestSnap.has(s.userId)) latestSnap.set(s.userId, s.at);
    }
    const infCount = new Map<string, number>();
    for (const r of inferences) {
      if (r.subjectUserId) infCount.set(r.subjectUserId, r._count._all);
    }
    const fbCount = new Map<string, number>();
    for (const r of feedbacks) {
      if (r.respondentId) fbCount.set(r.respondentId, r._count._all);
    }

    const cases = users
      .filter((u) => userIdSet.has(u.id))
      .map((u) => ({
        caseCode: pseudonymize(u.id),
        userId: piiVisible ? u.id : null,
        name: piiVisible ? u.name : null,
        email: piiVisible ? u.email : null,
        consentedAt: consents.find((c) => c.userId === u.id)?.grantedAt ?? null,
        latestSnapshotAt: latestSnap.get(u.id) ?? null,
        inferenceCount: infCount.get(u.id) ?? 0,
        feedbackCount: fbCount.get(u.id) ?? 0,
      }))
      .sort((a, b) => {
        const aT = a.latestSnapshotAt ? new Date(a.latestSnapshotAt).getTime() : 0;
        const bT = b.latestSnapshotAt ? new Date(b.latestSnapshotAt).getTime() : 0;
        return bT - aT;
      });

    await logResearchAccess({
      viewerUserId: user.id,
      action: "list_cases",
      contextPath: "/research/cases",
      metadata: { count: cases.length, piiVisible },
    });

    return NextResponse.json({
      ok: true,
      viewerLevel: user.researchAccessLevel,
      piiVisible,
      cases,
      totalConsented: userIds.length,
    });
  } catch (e: unknown) {
    console.error("/api/research/cases error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
