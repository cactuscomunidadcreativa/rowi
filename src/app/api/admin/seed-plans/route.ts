/**
 * 🌱 API: Seed Plans
 * POST /api/admin/seed-plans - Crear planes iniciales
 *
 * Solo ejecutar una vez para inicializar los planes en producción.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

const PLANS = [
  {
    name: "ROWI Free",
    slug: "free",
    description: "Plan gratuito para explorar Rowi",
    priceUsd: 0,
    priceCents: 0,
    durationDays: 365,
    aiEnabled: true,
    trialDays: 0,
    seiIncluded: false,
    maxCommunities: 1,
    maxMembers: 5,
    benchmarkAccess: false,
    apiAccess: false,
    badge: "FREE",
    sortOrder: 1,
    isPublic: true,
    isActive: true,
  },
  {
    name: "ROWI+",
    slug: "plus",
    description: "Para individuos que quieren crecer emocionalmente",
    priceUsd: 12,
    priceCents: 1200,
    durationDays: 30,
    aiEnabled: true,
    trialDays: 7,
    seiIncluded: true,
    maxCommunities: 3,
    maxMembers: 20,
    benchmarkAccess: true,
    apiAccess: false,
    badge: "PLUS",
    sortOrder: 2,
    isPublic: true,
    isActive: true,
  },
  {
    name: "ROWI Pro",
    slug: "pro",
    description: "Para profesionales y coaches",
    priceUsd: 25,
    priceCents: 2500,
    durationDays: 30,
    aiEnabled: true,
    trialDays: 14,
    seiIncluded: true,
    maxCommunities: 10,
    maxMembers: 100,
    benchmarkAccess: true,
    apiAccess: true,
    badge: "PRO",
    sortOrder: 3,
    isPublic: true,
    isActive: true,
  },
  {
    name: "ROWI Business",
    slug: "business",
    description: "Para equipos y pequeñas organizaciones",
    priceUsd: 99,
    priceCents: 9900,
    durationDays: 30,
    aiEnabled: true,
    trialDays: 14,
    seiIncluded: true,
    maxCommunities: 50,
    maxMembers: 500,
    benchmarkAccess: true,
    apiAccess: true,
    badge: "BUSINESS",
    sortOrder: 4,
    isPublic: true,
    isActive: true,
  },
  {
    name: "ROWI Enterprise",
    slug: "enterprise",
    description: "Para grandes organizaciones con necesidades personalizadas",
    priceUsd: 499,
    priceCents: 49900,
    durationDays: 365,
    aiEnabled: true,
    trialDays: 30,
    seiIncluded: true,
    maxCommunities: -1,
    maxMembers: -1,
    benchmarkAccess: true,
    apiAccess: true,
    badge: "ENTERPRISE",
    sortOrder: 5,
    isPublic: false,
    isActive: true,
  },
];

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación (solo admin puede hacer esto)
    const auth = await getServerAuthUser().catch(() => null);
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    const results = {
      created: [] as string[],
      updated: [] as string[],
      errors: [] as string[],
    };

    for (const plan of PLANS) {
      try {
        const existing = await prisma.plan.findFirst({
          where: {
            OR: [{ slug: plan.slug }, { name: plan.name }],
          },
        });

        if (existing) {
          await prisma.plan.update({
            where: { id: existing.id },
            data: plan,
          });
          results.updated.push(plan.name);
        } else {
          await prisma.plan.create({
            data: plan,
          });
          results.created.push(plan.name);
        }
      } catch (err: any) {
        results.errors.push(`${plan.name}: ${err.message}`);
      }
    }

    // Obtener todos los planes activos
    const allPlans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        priceUsd: true,
        badge: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "✅ Seed completado",
      results,
      plans: allPlans,
    });
  } catch (err: any) {
    console.error("❌ Error POST /api/admin/seed-plans:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error al sembrar planes" },
      { status: 500 }
    );
  }
}
