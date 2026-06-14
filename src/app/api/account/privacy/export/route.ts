export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";
import { getToken } from "next-auth/jwt";

/**
 * GDPR Art. 15 — Right of access by the data subject.
 * Returns a JSON dump of everything we hold about the calling user.
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        emails: true,
        consents: { orderBy: { grantedAt: "desc" } },
        coachProfile: true,
      },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const [
      eqSnapshots,
      talents,
      competencies,
      outcomes,
      moodSnapshots,
      familyOwned,
      familyRelatedTo,
      servicesProvided,
      servicesReceived,
      vsResponses,
      vsInferences,
      vsFeedbacks,
      vsSignals,
      researchViewsOnMe,
      personalInvitesSent,
      personalInvitesRecv,
    ] = await Promise.all([
      prisma.eqSnapshot.findMany({ where: { userId: user.id }, orderBy: { at: "desc" } }),
      prisma.talentSnapshot.findMany({
        where: { snapshot: { userId: user.id } },
      }),
      prisma.eqCompetencySnapshot.findMany({
        where: { snapshot: { userId: user.id } },
      }),
      prisma.eqOutcomeSnapshot.findMany({
        where: { snapshot: { userId: user.id } },
      }),
      prisma.eqMoodSnapshot.findMany({
        where: { snapshot: { userId: user.id } },
      }),
      prisma.familyRelation.findMany({ where: { ownerId: user.id } }),
      prisma.familyRelation.findMany({ where: { relatedUserId: user.id } }),
      prisma.serviceEngagement.findMany({ where: { providerId: user.id } }),
      prisma.serviceEngagement.findMany({ where: { clientUserId: user.id } }),
      prisma.vitalSignsResponse.findMany({ where: { respondentId: user.id } }),
      prisma.pulsePointInference.findMany({ where: { subjectUserId: user.id } }),
      prisma.hypothesisFeedback.findMany({ where: { respondentId: user.id } }),
      prisma.pulsePointSignal.findMany({ where: { userId: user.id } }),
      prisma.researchAccessAudit.findMany({
        where: { subjectUserId: user.id },
        orderBy: { at: "desc" },
      }),
      prisma.personalResearchInvite.findMany({ where: { subjectUserId: user.id } }),
      prisma.personalResearchInvite.findMany({ where: { inviteeUserId: user.id } }),
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      exportFormat: "rowi-dsr-v1",
      gdprBasis: "Article 15 — Right of access",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        researchAccessLevel: user.researchAccessLevel,
      },
      userEmails: user.emails,
      consents: user.consents,
      coachProfile: user.coachProfile,
      eqSnapshots,
      talents,
      competencies,
      outcomes,
      moodSnapshots,
      family: { owned: familyOwned, relatedTo: familyRelatedTo },
      services: { provided: servicesProvided, received: servicesReceived },
      vitalSigns: {
        responses: vsResponses,
        inferences: vsInferences,
        feedbacks: vsFeedbacks,
        signals: vsSignals,
      },
      researchAccessOnMe: researchViewsOnMe,
      personalInvites: { sent: personalInvitesSent, received: personalInvitesRecv },
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="rowi-data-export-${user.id}-${Date.now()}.json"`,
      },
    });
  } catch (e: unknown) {
    telemetry.captureException(e, { route: "/api/account/privacy/export", op: "GET" });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
