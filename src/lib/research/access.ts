/**
 * Research lens access guard + audit logging helpers.
 * Used by every /api/research/* and /research page to enforce the privacy contract
 * documented in docs/EMOTIONAL_BUDGETING.md sections 4-5.
 */

import { prisma } from "@/core/prisma";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export type ResearchLevel =
  | "none"
  | "founder"
  | "scientific_lead"
  | "rowi_team"
  | "six_seconds_team"
  | "invited_personal"
  | "invited_observer";

export interface ResearchUser {
  id: string;
  name: string | null;
  email: string;
  researchAccessLevel: ResearchLevel;
}

const PII_VISIBLE_LEVELS: ResearchLevel[] = ["founder", "scientific_lead"];

export function canSeePII(level: ResearchLevel): boolean {
  return PII_VISIBLE_LEVELS.includes(level);
}

export async function requireResearchUser(
  req: NextRequest,
): Promise<{ user: ResearchUser } | { error: string; status: 401 | 403 | 404 }> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email?.toLowerCase();
  if (!email) return { error: "Unauthorized", status: 401 };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, researchAccessLevel: true },
  });
  if (!user) return { error: "User not found", status: 404 };
  if (user.researchAccessLevel === "none") {
    return { error: "No research access level", status: 403 };
  }
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email!,
      researchAccessLevel: user.researchAccessLevel as ResearchLevel,
    },
  };
}

export async function logResearchAccess(opts: {
  viewerUserId: string;
  subjectUserId?: string;
  subjectTeamId?: string;
  subjectOrgId?: string;
  action: string;
  contextPath: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.researchAccessAudit.create({
      data: {
        viewerUserId: opts.viewerUserId,
        subjectUserId: opts.subjectUserId ?? null,
        subjectTeamId: opts.subjectTeamId ?? null,
        subjectOrgId: opts.subjectOrgId ?? null,
        action: opts.action,
        contextPath: opts.contextPath,
        reason: opts.reason ?? null,
        metadata: opts.metadata ? (opts.metadata as object) : undefined,
      },
    });
  } catch (e) {
    console.error("Failed to log research access:", e);
  }
}

/**
 * Pseudonymize a user identifier into a stable case code.
 * Founder + scientific_lead see real names within Rowi UI; teams see codes only.
 */
export function pseudonymize(userId: string): string {
  const tail = userId.slice(-6).toUpperCase();
  return `Case-${tail}`;
}
