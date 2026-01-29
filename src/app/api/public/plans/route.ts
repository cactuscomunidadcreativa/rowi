/**
 * 🎯 API: Public Plans
 * GET /api/public/plans - Obtener planes públicos para la página de registro
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceUsd: true,
        priceCents: true,
        durationDays: true,
        aiEnabled: true,
        stripePriceId: true,
        trialDays: true,
        seiIncluded: true,
        maxCommunities: true,
        maxMembers: true,
        benchmarkAccess: true,
        apiAccess: true,
        badge: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({
      ok: true,
      plans,
    });
  } catch (error) {
    console.error("❌ Error GET /api/public/plans:", error);
    return NextResponse.json(
      { ok: false, error: "Error loading plans" },
      { status: 500 }
    );
  }
}
