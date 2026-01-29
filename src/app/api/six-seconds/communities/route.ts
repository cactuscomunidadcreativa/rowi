/**
 * 🔐 Six Seconds Partner Communities API
 * =======================================
 * Permite a partners y distribuidores de Six Seconds gestionar
 * sus comunidades en Rowi usando autenticación SSO.
 *
 * Endpoints:
 * - GET: Lista comunidades del partner
 * - POST: Crea una nueva comunidad para el partner
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import {
  verifySSOToken,
  extractUserFromSSOToken,
} from "@/lib/six-seconds/sso";

// =========================================================
// Helper: Get SSO Token from request
// =========================================================
function getSSOTokenFromRequest(req: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Try cookie
  const cookieName =
    process.env.NODE_ENV === "production" ? "ss_token" : "ss_dev_token";
  return req.cookies.get(cookieName)?.value || null;
}

// =========================================================
// Helper: Validate partner access
// =========================================================
async function validatePartnerAccess(req: NextRequest) {
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

  // Only admins and superadmins can manage communities
  if (!["Admin", "SuperAdmin"].includes(userInfo.role)) {
    return { error: "Insufficient permissions", status: 403 };
  }

  // Find or create Rowi user linked to this SSO user
  const email = userInfo.email.toLowerCase();
  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      primaryTenant: true,
    },
  });

  if (!user) {
    // Create user if doesn't exist
    user = await prisma.user.create({
      data: {
        email,
        name: userInfo.name || email.split("@")[0],
        organizationRole: userInfo.role === "SuperAdmin" ? "SUPERADMIN" : "ADMIN",
        ssoProvider: "six-seconds",
        ssoProviderId: userInfo.ssoUserId,
        emailVerified: new Date(),
      },
      include: {
        primaryTenant: true,
      },
    });
  }

  return { user, userInfo };
}

// =========================================================
// GET /api/six-seconds/communities
// Lista las comunidades del partner autenticado
// =========================================================
export async function GET(req: NextRequest) {
  const validation = await validatePartnerAccess(req);

  if ("error" in validation) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status }
    );
  }

  const { user, userInfo } = validation;

  try {
    // Get communities where this user is creator or admin member
    const communities = await prisma.rowiCommunity.findMany({
      where: {
        OR: [
          { createdById: user.id },
          {
            members: {
              some: {
                userId: user.id,
                role: { in: ["admin", "owner"] },
              },
            },
          },
          // SuperAdmins can see all
          ...(userInfo.role === "SuperAdmin"
            ? [{ id: { not: "" } }]
            : []),
        ],
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      communities: communities.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        type: c.type,
        visibility: c.visibility,
        membersCount: c._count.members,
        owner: c.createdBy,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}

// =========================================================
// POST /api/six-seconds/communities
// Crea una nueva comunidad para el partner
// =========================================================
export async function POST(req: NextRequest) {
  const validation = await validatePartnerAccess(req);

  if ("error" in validation) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: validation.status }
    );
  }

  const { user } = validation;

  try {
    const body = await req.json();
    const { name, description, visibility = "public", language = "es" } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: "Community name is required (min 2 chars)" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (await prisma.rowiCommunity.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Create community
    const community = await prisma.rowiCommunity.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        visibility,
        language,
        createdById: user.id,
        owner: user.name || user.email, // Text field for owner name
        type: "six-seconds-partner",
        // Also add creator as admin member
        members: {
          create: {
            userId: user.id,
            role: "owner",
            status: "active",
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      community: {
        id: community.id,
        name: community.name,
        slug: community.slug,
        description: community.description,
        visibility: community.visibility,
        membersCount: community._count.members,
        owner: community.createdBy,
        createdAt: community.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating community:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create community" },
      { status: 500 }
    );
  }
}
