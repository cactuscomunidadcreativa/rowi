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
    // Plan SEI — el ancla comercial individual. Mensual $9.95; semestral $49
    // (un pago por 6 meses, ≈ $8.16/mes) que DESBLOQUEA el SEI completo + un
    // re-test SEI cada 6 meses. El SEI suelto cuesta $150-600 en el mercado,
    // así que el semestral es el gancho de valor.
    name: "ROWI SEI",
    slug: "sei",
    description:
      "Tu inteligencia emocional medida y en acción: SEI completo + seguimiento Vital Signs. Paga 6 meses y tu SEI va incluido, con re-test cada 6 meses.",
    descriptionEN:
      "Your emotional intelligence, measured and in action: full SEI + Vital Signs tracking. Pay 6 months and your SEI is included, re-tested every 6 months.",
    priceUsd: 9.95,
    priceCents: 995,
    priceYearlyUsd: 49,
    priceYearlyCents: 4900,
    durationDays: 30,
    aiEnabled: true,
    trialDays: 7,
    seiIncluded: true,
    maxCommunities: 1,
    maxMembers: 5,
    benchmarkAccess: true,
    apiAccess: false,
    badge: "SEI",
    sortOrder: 2,
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
    sortOrder: 3,
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
    sortOrder: 4,
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
    sortOrder: 5,
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
    sortOrder: 6,
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
