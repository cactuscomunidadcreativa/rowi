/**
 * 🚀 API: Onboarding
 * GET /api/onboarding - Obtener estado del onboarding
 * PATCH /api/onboarding - Actualizar paso del onboarding
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";

// =========================================================
// GET - Obtener estado del onboarding
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        country: true,
        language: true,
        onboardingStatus: true,
        onboardingStep: true,
        onboardingData: true,
        seiRequested: true,
        seiCompletedAt: true,
        trialStartedAt: true,
        trialEndsAt: true,
        planId: true,
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            seiIncluded: true,
            trialDays: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verificar si hay SEI pendiente
    const pendingSeiRequest = await prisma.seiRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "SENT", "IN_PROGRESS"] },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular días restantes de trial
    let trialDaysRemaining: number | null = null;
    if (user.trialEndsAt) {
      const now = new Date();
      const diff = user.trialEndsAt.getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      ok: true,
      onboarding: {
        status: user.onboardingStatus,
        step: user.onboardingStep,
        data: user.onboardingData,
        seiRequested: user.seiRequested,
        seiCompleted: !!user.seiCompletedAt,
        pendingSeiRequest: pendingSeiRequest
          ? {
              id: pendingSeiRequest.id,
              status: pendingSeiRequest.status,
              seiLink: pendingSeiRequest.seiLink,
            }
          : null,
        trial: {
          started: user.trialStartedAt,
          ends: user.trialEndsAt,
          daysRemaining: trialDaysRemaining,
        },
        plan: user.plan,
      },
    });
  } catch (error) {
    telemetry.captureException(error, { route: "/api/onboarding", op: "GET" });
    return NextResponse.json(
      { error: "Error getting onboarding status" },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH - Actualizar paso del onboarding
// =========================================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { step, data, requestSei, seiLanguage } = body;

    const updateData: Record<string, unknown> = {};

    // Actualizar paso
    if (step !== undefined) {
      updateData.onboardingStep = step;
    }

    // Actualizar datos del onboarding
    if (data) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboardingData: true },
      });

      const mergedOnboarding: Record<string, unknown> = {
        ...(user?.onboardingData && typeof user.onboardingData === "object"
          ? (user.onboardingData as Record<string, unknown>)
          : {}),
        ...data,
      };

      // Si hay datos de perfil, actualizarlos también
      if (data.name) updateData.name = data.name;
      if (data.country) updateData.country = data.country;
      if (data.language) updateData.language = data.language;
      if (data.sector) mergedOnboarding.sector = data.sector;
      if (data.jobRole) mergedOnboarding.jobRole = data.jobRole;

      updateData.onboardingData = mergedOnboarding;
    }

    // Solicitar SEI
    if (requestSei === true) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true, country: true, language: true },
      });

      // Crear solicitud de SEI
      await prisma.seiRequest.create({
        data: {
          userId: session.user.id,
          email: user?.email || "",
          name: user?.name || "",
          country: user?.country,
          language: seiLanguage || user?.language || "es",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        },
      });

      updateData.seiRequested = true;
      updateData.seiRequestedAt = new Date();
      updateData.onboardingStatus = "PENDING_SEI";
    }

    // Completar onboarding (sin SEI)
    if (data?.completeWithoutSei === true) {
      updateData.onboardingStatus = "ACTIVE";
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData as Prisma.UserUpdateInput,
      select: {
        onboardingStatus: true,
        onboardingStep: true,
        onboardingData: true,
        seiRequested: true,
      },
    });

    return NextResponse.json({
      ok: true,
      onboarding: updatedUser,
    });
  } catch (error) {
    telemetry.captureException(error, { route: "/api/onboarding", op: "PATCH" });
    return NextResponse.json(
      { error: "Error updating onboarding" },
      { status: 500 }
    );
  }
}
