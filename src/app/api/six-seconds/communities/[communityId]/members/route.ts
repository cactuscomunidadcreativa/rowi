/**
 * 🔐 Six Seconds Community Members API
 * =====================================
 * Permite a partners gestionar miembros de sus comunidades via SSO.
 *
 * Endpoints:
 * - GET: Lista miembros de una comunidad
 * - POST: Agrega miembros a una comunidad (batch)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { verifySSOToken, extractUserFromSSOToken } from "@/lib/six-seconds/sso";

// =========================================================
// Helper: Get SSO Token from request
// =========================================================
function getSSOTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookieName =
    process.env.NODE_ENV === "production" ? "ss_token" : "ss_dev_token";
  return req.cookies.get(cookieName)?.value || null;
}

// =========================================================
// Helper: Validate community access
// =========================================================
async function validateCommunityAccess(
  req: NextRequest,
  communityId: string
) {
  const token = getSSOTokenFromRequest(req);

  if (!token) {
    return { error: "No SSO token provided", status: 401 };
  }

  const ssoUser = verifySSOToken(token);
  if (!ssoUser) {
    return { error: "Invalid or expired SSO token", status: 401 };
  }

  const userInfo = extractUserFromSSOToken(token);
  if (!userInfo || !userInfo.hasRowiAccess) {
    return { error: "No Rowi access", status: 403 };
  }

  // Find user
  const email = userInfo.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  // Check community exists and user has access
  const community = await prisma.rowiCommunity.findUnique({
    where: { id: communityId },
    include: {
      members: {
        where: {
          userId: user.id,
          role: { in: ["admin", "owner"] },
        },
      },
    },
  });

  if (!community) {
    return { error: "Community not found", status: 404 };
  }

  // Check access: creator, admin member, or SuperAdmin
  const isCreator = community.createdById === user.id;
  const isAdmin = community.members.length > 0;
  const isSuperAdmin = userInfo.role === "SuperAdmin";

  if (!isCreator && !isAdmin && !isSuperAdmin) {
    return { error: "No access to this community", status: 403 };
  }

  return { user, userInfo, community };
}

// =========================================================
// GET /api/six-seconds/communities/[communityId]/members
// Lista miembros de una comunidad
// =========================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await params;
  const validation = await validateCommunityAccess(req, communityId);

  if ("error" in validation) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status }
    );
  }

  const { community } = validation;

  try {
    // Get all RowiCommunityUsers (members) with their user and RowiVerse data
    const members = await prisma.rowiCommunityUser.findMany({
      where: { communityId: community.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        rowiverseUser: {
          select: {
            id: true,
            email: true,
            name: true,
            country: true,
            language: true,
            verified: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
      },
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
        lastActiveAt: m.lastActiveAt,
        linkedUser: m.user,
        // RowiVerse data
        rowiverseId: m.rowiverseUserId,
        rowiverseUser: m.rowiverseUser ? {
          id: m.rowiverseUser.id,
          email: m.rowiverseUser.email,
          name: m.rowiverseUser.name,
          country: m.rowiverseUser.country,
          language: m.rowiverseUser.language,
          verified: m.rowiverseUser.verified,
        } : null,
        hasLinkedUser: !!m.userId,
        hasRowiverse: !!m.rowiverseUserId,
      })),
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// =========================================================
// POST /api/six-seconds/communities/[communityId]/members
// Agrega miembros a una comunidad (batch)
// =========================================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  const { communityId } = await params;
  const validation = await validateCommunityAccess(req, communityId);

  if ("error" in validation) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status }
    );
  }

  const { community } = validation;

  try {
    const body = await req.json();
    const { members } = body;

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Members array is required" },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const member of members) {
      try {
        const { email, name, role = "MEMBER" } = member;

        if (!email || typeof email !== "string") {
          results.errors.push(`Invalid member: missing email`);
          continue;
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if there's a Rowi user with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { rowiverse: true },
        });

        // Check if RowiVerseUser exists (global identity)
        let rowiverseUser = await prisma.rowiVerseUser.findUnique({
          where: { email: normalizedEmail },
        });

        // Create RowiVerseUser if doesn't exist (every member needs one)
        if (!rowiverseUser) {
          rowiverseUser = await prisma.rowiVerseUser.create({
            data: {
              email: normalizedEmail,
              name: name || normalizedEmail.split("@")[0],
              language: community.language || "es",
              verified: false, // Will be verified when they claim their account
              active: true,
              status: "pending",
              userId: existingUser?.id,
            },
          });
          console.log("🌐 Created RowiVerse identity for:", normalizedEmail);
        }

        // Check if RowiCommunityUser exists in this community
        const existingCommunityUser = await prisma.rowiCommunityUser.findFirst({
          where: {
            communityId: community.id,
            email: normalizedEmail,
          },
        });

        if (existingCommunityUser) {
          // Update existing
          await prisma.rowiCommunityUser.update({
            where: { id: existingCommunityUser.id },
            data: {
              name: name || existingCommunityUser.name,
              role: role || existingCommunityUser.role,
              userId: existingUser?.id || existingCommunityUser.userId,
              rowiverseUserId: rowiverseUser.id,
            },
          });
          results.updated++;
        } else {
          // Create new RowiCommunityUser linked to RowiVerse
          await prisma.rowiCommunityUser.create({
            data: {
              communityId: community.id,
              email: normalizedEmail,
              name: name || normalizedEmail.split("@")[0],
              role,
              status: "pending",
              userId: existingUser?.id,
              rowiverseUserId: rowiverseUser.id,
              language: community.language || "es",
            },
          });
          results.created++;
        }
      } catch (memberError) {
        console.error("Error adding member:", memberError);
        results.errors.push(`Failed to add member: ${member.email}`);
      }
    }

    return NextResponse.json({
      ok: true,
      results,
      message: `Created ${results.created}, updated ${results.updated} members`,
    });
  } catch (error) {
    console.error("Error adding members:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to add members" },
      { status: 500 }
    );
  }
}
