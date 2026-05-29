// src/app/api/user/subscription/route.ts
// ============================================================
// Devuelve el plan y la suscripción del usuario actual, en la forma que espera
// /settings/subscription. Antes este endpoint NO existía (404), así que la
// página caía a "Plan Gratuito" SIEMPRE, aunque el plan real fuera otro.
// ============================================================

import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await getServerAuthUser();
    if (!auth?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        stripeSubscriptionId: true,
        planExpiresAt: true,
        plan: {
          select: {
            name: true,
            slug: true,
            priceCents: true,
            priceYearlyCents: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      plan: user.plan
        ? {
            name: user.plan.name,
            slug: user.plan.slug,
            priceCents: user.plan.priceCents,
            interval: "month",
            features: [],
          }
        : null,
      subscription: user.stripeSubscriptionId
        ? {
            status: "active",
            currentPeriodEnd: user.planExpiresAt ? user.planExpiresAt.toISOString() : null,
            cancelAtPeriodEnd: false,
          }
        : null,
      trialEndsAt: null,
      usage: {
        conversations: 0,
        conversationsLimit: null,
        invites: 0,
        invitesLimit: null,
      },
    });
  } catch (error) {
    console.error("[user/subscription]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
