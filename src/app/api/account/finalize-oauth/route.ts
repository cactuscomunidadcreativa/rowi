/**
 * POST /api/account/finalize-oauth
 * Finaliza el setup de un usuario que se registró vía OAuth (Google/Facebook).
 * Aplica plan elegido, idioma, país y otros datos guardados antes del redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

interface FinalizeBody {
  planSlug?: string;
  language?: string;
  country?: string;
  wantsSei?: boolean;
  referralCode?: string;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: FinalizeBody = await req.json().catch(() => ({}));
    const { planSlug, language, country, referralCode } = body;

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        planId: true,
        language: true,
        country: true,
        onboardingStatus: true,
        trialEndsAt: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "user_not_found" },
        { status: 404 },
      );
    }

    // Resolver plan (solo si el usuario no tiene plan asignado todavía)
    let planId = user.planId;
    let onboardingStatus = user.onboardingStatus;
    let trialEndsAt = user.trialEndsAt;

    if (!planId && planSlug) {
      const plan = await prisma.plan.findFirst({
        where: { slug: planSlug, isActive: true },
        select: { id: true, priceCents: true, trialDays: true },
      });
      if (plan) {
        planId = plan.id;
        if (plan.priceCents > 0) {
          onboardingStatus = "PAYMENT_PENDING";
        }
        if (plan.trialDays > 0) {
          trialEndsAt = new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000);
        }
      }
    }

    // Resolver referrer si corresponde
    let referredBy: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findFirst({
        where: { OR: [{ id: referralCode }, { email: referralCode }] },
        select: { id: true },
      });
      referredBy = referrer?.id ?? null;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        planId: planId ?? undefined,
        language: language ?? user.language ?? "es",
        country: country ?? user.country ?? "Unknown",
        onboardingStatus,
        trialStartedAt: trialEndsAt && !user.trialEndsAt ? new Date() : undefined,
        trialEndsAt,
        ...(referredBy ? { referredBy } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        onboardingStatus: true,
        planId: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: updated,
      nextStep:
        updated.onboardingStatus === "PAYMENT_PENDING"
          ? "payment"
          : "onboarding",
    });
  } catch (err) {
    console.error("❌ Error finalizing OAuth registration:", err);
    return NextResponse.json(
      { ok: false, error: "finalize_failed" },
      { status: 500 },
    );
  }
}
