export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

/**
 * Bidirectional coach/mentor invitations.
 *
 * - User invites their own external coach to access their VS data: direction = user_to_coach
 * - Coach reaches out to a prospective coachee: direction = coach_to_user
 * - In both cases, both parties must confirm before access activates.
 * - User can choose a coach from the marketplace, which kicks off user_to_coach with target = marketplace coach.
 */

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

    const [sent, received] = await Promise.all([
      prisma.personalResearchInvite.findMany({
        where: { subjectUserId: user.id },
        orderBy: { invitedAt: "desc" },
        include: { invitee: { select: { name: true, email: true } } },
      }),
      prisma.personalResearchInvite.findMany({
        where: { OR: [{ inviteeUserId: user.id }, { inviteeEmail: email }] },
        orderBy: { invitedAt: "desc" },
        include: { subject: { select: { name: true, email: true } } },
      }),
    ]);

    return NextResponse.json({ ok: true, sent, received });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/account/invites/coach GET error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      direction,
      serviceRole = "coach",
      scope = "vital_signs",
      inviteeUserId,
      inviteeEmail,
      message,
      expiresInDays = 30,
    } = body as {
      direction: "user_to_coach" | "coach_to_user";
      serviceRole?: string;
      scope?: string;
      inviteeUserId?: string;
      inviteeEmail?: string;
      message?: string;
      expiresInDays?: number;
    };

    if (direction !== "user_to_coach" && direction !== "coach_to_user") {
      return NextResponse.json({ ok: false, error: "Invalid direction" }, { status: 400 });
    }
    if (!inviteeUserId && !inviteeEmail) {
      return NextResponse.json(
        { ok: false, error: "Either inviteeUserId or inviteeEmail required" },
        { status: 400 },
      );
    }

    const subjectUserId = direction === "user_to_coach" ? user.id : inviteeUserId ?? null;
    if (!subjectUserId) {
      return NextResponse.json(
        { ok: false, error: "Subject user required for coach_to_user direction" },
        { status: 400 },
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Math.min(Math.max(expiresInDays, 1), 365));

    const invite = await prisma.personalResearchInvite.create({
      data: {
        subjectUserId,
        inviteeUserId: direction === "user_to_coach" ? inviteeUserId ?? null : user.id,
        inviteeEmail: direction === "user_to_coach" ? inviteeEmail ?? null : null,
        direction,
        serviceRole,
        scope,
        status: "pending",
        message: message ?? null,
        expiresAt,
      },
    });

    return NextResponse.json({ ok: true, invite });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/account/invites/coach POST error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { inviteId, action } = body as { inviteId: string; action: "accept" | "revoke" };

    const invite = await prisma.personalResearchInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite) {
      return NextResponse.json({ ok: false, error: "Invite not found" }, { status: 404 });
    }

    const isSubject = invite.subjectUserId === user.id;
    const isInvitee = invite.inviteeUserId === user.id || invite.inviteeEmail === email;
    if (!isSubject && !isInvitee) {
      return NextResponse.json({ ok: false, error: "Not authorized" }, { status: 403 });
    }

    if (action === "accept") {
      const acceptableBy =
        invite.direction === "user_to_coach" ? isInvitee : isSubject;
      if (!acceptableBy) {
        return NextResponse.json(
          { ok: false, error: "The other party must accept this invite" },
          { status: 403 },
        );
      }
      await prisma.personalResearchInvite.update({
        where: { id: inviteId },
        data: { status: "accepted", acceptedAt: new Date() },
      });
    } else if (action === "revoke") {
      await prisma.personalResearchInvite.update({
        where: { id: inviteId },
        data: { status: "revoked", revokedAt: new Date() },
      });
    } else {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("/api/account/invites/coach PATCH error:", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
