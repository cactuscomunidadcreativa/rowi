/**
 * 🚀 API: User Registration
 * POST /api/auth/register - Registrar nuevo usuario
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import bcrypt from "bcryptjs";

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  planId?: string;
  language?: string;
  country?: string;
  // Referral & UTM
  referralCode?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterBody = await req.json();
    const {
      email,
      password,
      name,
      planId,
      language = "es",
      country,
      referralCode,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: "email_password_required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "password_too_short" },
        { status: 400 }
      );
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "email_already_exists" },
        { status: 409 }
      );
    }

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determinar plan inicial
    let selectedPlanId = planId;
    let onboardingStatus: "REGISTERED" | "PAYMENT_PENDING" = "REGISTERED";
    let trialEndsAt: Date | null = null;

    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (plan) {
        // Si el plan tiene precio, el usuario necesita pagar
        if (plan.priceCents > 0) {
          onboardingStatus = "PAYMENT_PENDING";
        }

        // Si el plan tiene trial, calcular fecha de fin
        if (plan.trialDays > 0) {
          trialEndsAt = new Date(
            Date.now() + plan.trialDays * 24 * 60 * 60 * 1000
          );
        }
      }
    } else {
      // Buscar plan free por defecto
      const freePlan = await prisma.plan.findFirst({
        where: {
          OR: [
            { slug: "free-trial" },
            { slug: "free" },
            { priceCents: 0, isActive: true },
          ],
        },
      });
      selectedPlanId = freePlan?.id;

      if (freePlan?.trialDays && freePlan.trialDays > 0) {
        trialEndsAt = new Date(
          Date.now() + freePlan.trialDays * 24 * 60 * 60 * 1000
        );
      }
    }

    // Buscar referente si hay código
    let referredBy: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findFirst({
        where: {
          OR: [{ id: referralCode }, { email: referralCode }],
        },
      });
      referredBy = referrer?.id || null;
    }

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
        language,
        country: country || "Unknown",
        planId: selectedPlanId,
        onboardingStatus,
        onboardingStep: 0,
        trialStartedAt: trialEndsAt ? new Date() : null,
        trialEndsAt,
        contributeToRowiverse: true,
      },
    });

    // Crear registro de adquisición
    await prisma.userAcquisition.create({
      data: {
        userId: user.id,
        source: referredBy
          ? "REFERRAL"
          : utmSource
          ? "PAID_SEARCH"
          : "ORGANIC",
        referredBy,
        referralCode: referralCode || null,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    });

    // Crear cuenta de credentials para login con password
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: normalizedEmail,
        // Guardar password hash en el campo access_token (workaround para NextAuth)
        access_token: hashedPassword,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        onboardingStatus: user.onboardingStatus,
        planId: user.planId,
        trialEndsAt: user.trialEndsAt,
      },
      nextStep:
        onboardingStatus === "PAYMENT_PENDING"
          ? "payment"
          : "onboarding",
    });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    return NextResponse.json(
      { error: "registration_failed" },
      { status: 500 }
    );
  }
}
