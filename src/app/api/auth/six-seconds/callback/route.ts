/**
 * 🔐 Six Seconds SSO Callback Handler
 * ====================================
 * Maneja el redirect de vuelta desde el SSO de Six Seconds.
 *
 * Flow:
 * 1. Six Seconds redirige con ?token=JWT&state=returnPath
 * 2. Verificamos el token JWT
 * 3. Creamos/vinculamos el usuario en Rowi
 * 4. Iniciamos sesión con NextAuth
 * 5. Redirigimos al returnPath
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import {
  verifySSOToken,
  extractUserFromSSOToken,
  ssoTokenStore,
  SSO_CONFIG,
} from "@/lib/six-seconds/sso";
import { encode } from "next-auth/jwt";

// =========================================================
// GET /api/auth/six-seconds/callback
// =========================================================
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token");
  const state = searchParams.get("state") || "/dashboard";
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // ─────────────────────────────────────────────────────────
  // Handle errors from SSO
  // ─────────────────────────────────────────────────────────
  if (error) {
    console.error("❌ SSO Error from Six Seconds:", error);
    return NextResponse.redirect(
      new URL(`/hub/login?error=sso_${error}`, baseUrl)
    );
  }

  // ─────────────────────────────────────────────────────────
  // Validate token presence
  // ─────────────────────────────────────────────────────────
  if (!token) {
    console.error("❌ No token received from Six Seconds SSO");
    return NextResponse.redirect(
      new URL("/hub/login?error=sso_no_token", baseUrl)
    );
  }

  // ─────────────────────────────────────────────────────────
  // Verify JWT token
  // ─────────────────────────────────────────────────────────
  const ssoUser = verifySSOToken(token);
  if (!ssoUser) {
    console.error("❌ Invalid Six Seconds token");
    return NextResponse.redirect(
      new URL("/hub/login?error=sso_invalid_token", baseUrl)
    );
  }

  // ─────────────────────────────────────────────────────────
  // Extract user info
  // ─────────────────────────────────────────────────────────
  const userInfo = extractUserFromSSOToken(token);
  if (!userInfo) {
    console.error("❌ Could not extract user info from token");
    return NextResponse.redirect(
      new URL("/hub/login?error=sso_extract_failed", baseUrl)
    );
  }

  // ─────────────────────────────────────────────────────────
  // Check access permissions
  // ─────────────────────────────────────────────────────────
  if (!userInfo.hasRowiAccess) {
    console.warn("⚠️ User does not have Rowi access:", userInfo.email);
    return NextResponse.redirect(
      new URL("/hub/login?error=sso_no_access", baseUrl)
    );
  }

  try {
    // ─────────────────────────────────────────────────────────
    // Find or create user in Rowi
    // ─────────────────────────────────────────────────────────
    const email = userInfo.email.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        primaryTenant: { select: { id: true, slug: true, name: true } },
      },
    });

    if (!user) {
      // Create new user from Six Seconds data
      console.log("📝 Creating new user from Six Seconds SSO:", email);

      // First, create the RowiVerseUser (global identity)
      const rowiverseUser = await prisma.rowiVerseUser.create({
        data: {
          email,
          name: userInfo.name || email.split("@")[0],
          language: mapSSOLanguage(userInfo.language),
          verified: true, // SSO users are pre-verified
          active: true,
          status: "active",
        },
      });

      // Then create the User linked to RowiVerse
      user = await prisma.user.create({
        data: {
          email,
          name: userInfo.name || email.split("@")[0],
          organizationRole: mapSSORole(userInfo.role),
          ssoProvider: "six-seconds",
          ssoProviderId: userInfo.ssoUserId,
          preferredLang: mapSSOLanguage(userInfo.language),
          // Mark as verified since they came from SSO
          emailVerified: new Date(),
          // Link to RowiVerse
          rowiverseId: rowiverseUser.id,
        },
        include: {
          primaryTenant: { select: { id: true, slug: true, name: true } },
        },
      });

      // Update RowiVerseUser with userId
      await prisma.rowiVerseUser.update({
        where: { id: rowiverseUser.id },
        data: { userId: user.id },
      });

      console.log("✅ Created user with RowiVerse identity:", user.id, rowiverseUser.id);
    } else {
      // Update SSO link if not already linked
      if (!user.ssoProviderId) {
        console.log("🔗 Linking existing user to Six Seconds SSO:", email);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            ssoProvider: "six-seconds",
            ssoProviderId: userInfo.ssoUserId,
            // Update name if not set
            name: user.name || userInfo.name || email.split("@")[0],
          },
        });
      }

      // Ensure RowiVerseUser exists for existing users
      if (!user.rowiverseId) {
        console.log("🌐 Creating RowiVerse identity for existing user:", email);

        const rowiverseUser = await prisma.rowiVerseUser.create({
          data: {
            email: user.email,
            name: user.name || email.split("@")[0],
            language: user.preferredLang || mapSSOLanguage(userInfo.language),
            verified: true,
            active: true,
            status: "active",
            userId: user.id,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { rowiverseId: rowiverseUser.id },
        });

        // Refresh user object
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            primaryTenant: { select: { id: true, slug: true, name: true } },
          },
        }) as typeof user;
      }
    }

    // ─────────────────────────────────────────────────────────
    // Create NextAuth session token
    // ─────────────────────────────────────────────────────────
    const sessionToken = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        primaryTenantId: user.primaryTenantId,
        organizationRole: user.organizationRole,
        primaryTenant: user.primaryTenant,
        // SSO metadata
        ssoProvider: "six-seconds",
        ssoUserId: userInfo.ssoUserId,
      },
      secret: process.env.NEXTAUTH_SECRET || "rowi_dev_secret",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // ─────────────────────────────────────────────────────────
    // Set cookies and redirect
    // ─────────────────────────────────────────────────────────
    const response = NextResponse.redirect(
      new URL(decodeURIComponent(state), baseUrl)
    );

    // Set NextAuth session cookie
    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    // Also store Six Seconds token for API calls to their system
    const ssTokenName =
      process.env.NODE_ENV === "production" ? "ss_token" : "ss_dev_token";

    response.cookies.set(ssTokenName, token, {
      httpOnly: false, // Accessible from JS for API calls
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours (matches Six Seconds token expiry)
    });

    console.log("✅ Six Seconds SSO login successful:", email);

    return response;
  } catch (error) {
    console.error("❌ Error processing Six Seconds SSO callback:", error);
    return NextResponse.redirect(
      new URL("/hub/login?error=sso_processing_failed", baseUrl)
    );
  }
}

// =========================================================
// Helper: Map SSO role to Rowi role
// =========================================================
function mapSSORole(
  ssoRole: string
): "VIEWER" | "MEMBER" | "ADMIN" | "SUPERADMIN" {
  switch (ssoRole) {
    case "SuperAdmin":
      return "SUPERADMIN";
    case "Admin":
      return "ADMIN";
    case "User":
    default:
      return "MEMBER";
  }
}

// =========================================================
// Helper: Map SSO language preference
// =========================================================
function mapSSOLanguage(lang?: string): string {
  if (!lang) return "es";

  const langMap: Record<string, string> = {
    en: "en",
    "en-US": "en",
    "en-GB": "en",
    es: "es",
    "es-ES": "es",
    "es-MX": "es",
    pt: "pt",
    "pt-BR": "pt",
    it: "it",
    "it-IT": "it",
  };

  return langMap[lang] || "es";
}
