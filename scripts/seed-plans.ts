/**
 * 🌱 Seed Plans - Crear planes iniciales para Rowi
 *
 * Ejecutar con: npx tsx scripts/seed-plans.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    maxCommunities: -1, // Ilimitado
    maxMembers: -1, // Ilimitado
    benchmarkAccess: true,
    apiAccess: true,
    badge: "ENTERPRISE",
    sortOrder: 5,
    isPublic: false,
    isActive: true,
  },
];

async function main() {
  console.log("🌱 Sembrando planes...\n");

  for (const plan of PLANS) {
    const existing = await prisma.plan.findUnique({
      where: { slug: plan.slug },
    });

    if (existing) {
      // Actualizar plan existente
      await prisma.plan.update({
        where: { slug: plan.slug },
        data: plan,
      });
      console.log(`✅ Plan actualizado: ${plan.name}`);
    } else {
      // Crear nuevo plan
      await prisma.plan.create({
        data: plan,
      });
      console.log(`✅ Plan creado: ${plan.name}`);
    }
  }

  // Mostrar resumen
  const allPlans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log("\n📋 Planes activos:");
  allPlans.forEach((p) => {
    console.log(`   - ${p.name} | $${p.priceUsd}/mes | ${p.badge || "—"}`);
  });

  console.log("\n✅ Seed completado!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
