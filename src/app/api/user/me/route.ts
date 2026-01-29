/**
 * 👤 API: User Me
 * GET /api/user/me - Obtener datos del usuario actual
 * PATCH /api/user/me - Actualizar configuración del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

// =========================================================
// GET - Obtener datos del usuario actual
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        headline: true,
        bio: true,
        country: true,
        region: true,
        language: true,
        timezone: true,
        allowAI: true,
        contributeToRowiverse: true,
        active: true,
        organizationRole: true,
        primaryTenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    console.error("❌ Error GET /api/user/me:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH - Actualizar configuración del usuario
// =========================================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      headline,
      bio,
      image,
      country,
      region,
      language,
      timezone,
      allowAI,
      contributeToRowiverse,
    } = body;

    // Solo actualizar campos que fueron enviados
    const data: Record<string, any> = {};

    if (name !== undefined) data.name = name;
    if (headline !== undefined) data.headline = headline;
    if (bio !== undefined) data.bio = bio;
    if (image !== undefined) data.image = image;
    if (country !== undefined) data.country = country;
    if (region !== undefined) data.region = region;
    if (language !== undefined) data.language = language;
    if (timezone !== undefined) data.timezone = timezone;
    if (allowAI !== undefined) data.allowAI = allowAI;
    if (contributeToRowiverse !== undefined)
      data.contributeToRowiverse = contributeToRowiverse;

    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        headline: true,
        bio: true,
        country: true,
        region: true,
        language: true,
        timezone: true,
        allowAI: true,
        contributeToRowiverse: true,
        active: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: updated,
    });
  } catch (error) {
    console.error("❌ Error PATCH /api/user/me:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}
