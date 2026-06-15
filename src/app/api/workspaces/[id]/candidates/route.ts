import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";
import { getToken } from "next-auth/jwt";
import { canManageWorkspace } from "@/lib/workspace/permissions";

export const runtime = "nodejs";
export const preferredRegion = "iad1";

/**
 * POST /api/workspaces/[id]/candidates
 *
 * Adds a single candidate (focused hiring flow). Creates a CommunityMember
 * tagged with source="candidate", plus an EqSnapshot if SEI scores were
 * provided. Different from /upload-csv (bulk) and /invite (sends email).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: communityId } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canManage = await canManageWorkspace(token.sub, communityId);
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const workspace = await prisma.rowiCommunity.findUnique({
      where: { id: communityId },
      select: { id: true, tenantId: true, workspaceType: true },
    });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { id: true, email: true, primaryTenantId: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const tenantId = workspace.tenantId || user.primaryTenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant" }, { status: 400 });
    }

    const body = await req.json();
    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const country = body.country ? String(body.country).trim() : null;
    const jobRole = body.jobRole ? String(body.jobRole).trim() : null;
    const brainStyle = body.brainStyle ? String(body.brainStyle).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;

    const name =
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      firstName ||
      email ||
      "—";
    if (!firstName && !email) {
      return NextResponse.json(
        { error: "Either name or email is required" },
        { status: 400 },
      );
    }

    if (email) {
      const existing = await prisma.communityMember.findFirst({
        where: { tenantId, email, communityId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "duplicate", message: "A candidate with this email already exists in the workspace.", memberId: existing.id },
          { status: 409 },
        );
      }
    }

    const member = await prisma.communityMember.create({
      data: {
        tenantId,
        communityId,
        ownerId: user.id,
        name,
        firstName: firstName || null,
        lastName: lastName || null,
        email,
        country,
        brainStyle,
        role: jobRole,
        source: "candidate",
        status: "ACTIVE",
      },
    });

    const num = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    };

    const sei = body.sei || {};
    const hasSei =
      sei.K != null ||
      sei.C != null ||
      sei.G != null ||
      sei.EL != null ||
      sei.RP != null ||
      sei.ACT != null ||
      sei.NE != null ||
      sei.IM != null ||
      sei.OP != null ||
      sei.EMP != null ||
      sei.NG != null ||
      sei.overall4 != null;

    let snapshotId: string | null = null;
    if (hasSei) {
      const snap = await prisma.eqSnapshot.create({
        data: {
          memberId: member.id,
          dataset: "actual",
          owner: user.email,
          email,
          country,
          K: num(sei.K),
          C: num(sei.C),
          G: num(sei.G),
          EL: num(sei.EL),
          RP: num(sei.RP),
          ACT: num(sei.ACT),
          NE: num(sei.NE),
          IM: num(sei.IM),
          OP: num(sei.OP),
          EMP: num(sei.EMP),
          NG: num(sei.NG),
          overall4: num(sei.overall4),
          brainStyle,
        },
      });
      snapshotId = snap.id;
    }

    return NextResponse.json({ ok: true, member, snapshotId, notes });
  } catch (e) {
    telemetry.captureException(e, { route: "/api/workspaces/[id]/candidates", op: "POST" });
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 },
    );
  }
}
