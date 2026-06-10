export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

/**
 * Returns the user-facing audit log: who accessed this user's data via research lens.
 * GDPR Art. 15 transparency requirement.
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

    const audits = await prisma.researchAccessAudit.findMany({
      where: { subjectUserId: user.id },
      orderBy: { at: "desc" },
      take: 200,
      include: {
        viewer: { select: { name: true, email: true, researchAccessLevel: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      audits: audits.map((a) => ({
        id: a.id,
        at: a.at,
        action: a.action,
        contextPath: a.contextPath,
        reason: a.reason,
        viewer: {
          name: a.viewer?.name ?? "—",
          accessLevel: a.viewer?.researchAccessLevel ?? "unknown",
        },
      })),
    });
  } catch (e: unknown) {
    console.error("/api/account/privacy/audit-log error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
