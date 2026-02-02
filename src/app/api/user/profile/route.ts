/**
 * 📊 User Profile Extended API
 * GET - Obtener perfil completo del usuario con estado SEI, emails adicionales y datos para Affinity
 * PATCH - Actualizar perfil del usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

// =========================================================
// GET — Obtener perfil completo del usuario
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Obtener usuario con todos los datos necesarios
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        emails: {
          orderBy: { primary: "desc" },
        },
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            seiIncluded: true,
          },
        },
        eqSnapshots: {
          orderBy: { at: "desc" },
          take: 5,
          select: {
            id: true,
            at: true,
            K: true,
            C: true,
            G: true,
            brainStyle: true,
          },
        },
        affinityProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Obtener links SEI disponibles según idioma del usuario
    const language = user.language || "es";
    const seiLinks = await prisma.seiLink.findMany({
      where: {
        isActive: true,
        OR: [
          { language },
          { language: "es" }, // Fallback a español
        ],
      },
      orderBy: [{ language: "desc" }, { isDefault: "desc" }],
    });

    // Calcular estado SEI
    const lastSei = user.eqSnapshots?.[0];
    const seiCount = user.eqSnapshots?.length || 0;
    const maxRetakes = 1; // Default, could be from plan in future
    const hasFreeSei = seiCount < maxRetakes;

    // Calcular total del EQ (K + C + G)
    const lastSeiTotal = lastSei ? (lastSei.K || 0) + (lastSei.C || 0) + (lastSei.G || 0) : null;

    // Calcular si puede retomar (6 meses desde última evaluación)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const canRetakeFreely = !lastSei || new Date(lastSei.at) < sixMonthsAgo;

    // Calcular próxima fecha recomendada (3 meses)
    let nextRecommendedDate = null;
    if (lastSei) {
      const threeMonthsFromLast = new Date(lastSei.at);
      threeMonthsFromLast.setMonth(threeMonthsFromLast.getMonth() + 3);
      nextRecommendedDate = threeMonthsFromLast;
    }

    // Días desde solicitud
    let daysSinceRequest = null;
    if (user.seiRequested && user.seiRequestedAt) {
      daysSinceRequest = Math.floor(
        (Date.now() - new Date(user.seiRequestedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        headline: user.headline,
        bio: user.bio,
        language: user.language,
        country: user.country,
        region: user.region,
        city: user.city,
        timezone: user.timezone,
        allowAI: user.allowAI,
        contributeToRowiverse: user.contributeToRowiverse,
        createdAt: user.createdAt,
      },
      emails: user.emails || [],
      plan: user.plan,
      sei: {
        requested: user.seiRequested,
        requestedAt: user.seiRequestedAt,
        completedAt: user.seiCompletedAt,
        daysSinceRequest,
        pendingArrival: user.seiRequested && !user.seiCompletedAt && daysSinceRequest !== null && daysSinceRequest < 3,
        lastSnapshot: lastSei ? { ...lastSei, total: lastSeiTotal } : null,
        snapshotCount: seiCount,
        hasFreeSei,
        canRetakeFreely,
        retakeCost: canRetakeFreely ? 0 : 50,
        nextRecommendedDate,
        maxRetakes,
      },
      seiLinks: seiLinks.map((l) => ({
        id: l.id,
        code: l.code,
        name: l.name,
        url: l.url,
        language: l.language,
        isDefault: l.isDefault,
        description: l.description,
      })),
      affinity: {
        hasProfile: !!user.affinityProfile,
        traits: user.affinityProfile?.traits || {},
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error("❌ Error GET /api/user/profile:", error);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH — Actualizar perfil del usuario
// =========================================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      // Datos básicos
      name,
      headline,
      bio,
      image,
      language,
      country,
      region,
      city,
      timezone,
      allowAI,
      contributeToRowiverse,

      // Emails adicionales
      addEmail,
      removeEmailId,

      // Solicitar SEI
      requestSei,

      // Datos para Affinity
      affinityData,
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Construir datos de actualización
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (name !== undefined) updateData.name = name;
    if (headline !== undefined) updateData.headline = headline;
    if (bio !== undefined) updateData.bio = bio;
    if (image !== undefined) updateData.image = image;
    if (language !== undefined) updateData.language = language;
    if (country !== undefined) updateData.country = country;
    if (region !== undefined) updateData.region = region;
    if (city !== undefined) updateData.city = city;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (allowAI !== undefined) updateData.allowAI = allowAI;
    if (contributeToRowiverse !== undefined) updateData.contributeToRowiverse = contributeToRowiverse;

    // Marcar solicitud de SEI
    if (requestSei === true) {
      updateData.seiRequested = true;
      updateData.seiRequestedAt = new Date();
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    // Manejar emails adicionales
    if (addEmail) {
      // Verificar que no existe ya
      const existingEmail = await prisma.userEmail.findFirst({
        where: { userId: user.id, email: addEmail.email },
      });

      if (!existingEmail) {
        await prisma.userEmail.create({
          data: {
            userId: user.id,
            email: addEmail.email,
            label: addEmail.label || "work",
            verified: false,
            primary: false,
          },
        });
      }
    }

    if (removeEmailId) {
      await prisma.userEmail.delete({
        where: { id: removeEmailId },
      }).catch(() => null);
    }

    // Actualizar datos de Affinity
    if (affinityData) {
      await prisma.affinityProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          traits: affinityData,
          clusters: {},
          scores: {},
        },
        update: {
          traits: affinityData,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error("❌ Error PATCH /api/user/profile:", error);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
