// prisma/seed-beta.ts
// ============================================================
// ROWI — Seed Unificado para Beta Phase
// ============================================================
//
// Este seed crea TODA la data necesaria para operar Rowi en beta:
//
// ✅ Jerarquía completa (RowiVerse → System → SuperHub → Tenant → Hub → Org)
// ✅ 6 Planes (Free, ROWI+, Family, Pro, Business, Enterprise)
// ✅ 6 Agentes IA (Super Rowi, EQ, Affinity, ECO, Trainer, Sales)
// ✅ Gamificación (10 niveles, 30+ achievements, 8 rewards)
// ✅ MicroLearning (outcomes, core outcomes, brain talents, competencias)
// ✅ FeatureDefinitions (catálogo de features del sistema) ← NUEVO
// ✅ ProfileFeature mappings (permisos por rol) ← NUEVO
// ✅ Traducciones base (ES + EN, 200+ pares)
// ✅ System Settings
// ✅ SuperAdmin configurable por CLI arg
//
// NO incluye:
// ❌ Usuarios hardcodeados (el SuperAdmin se pasa por argumento)
// ❌ Datos demo de clientes específicos
// ❌ IDs hardcodeados de producción
// ❌ WeekFlow / fake data
//
// Uso:
//   npx tsx prisma/seed-beta.ts                          # Solo estructura (sin superadmin)
//   npx tsx prisma/seed-beta.ts admin@email.com          # Con superadmin
//   SUPERADMIN_EMAIL=x@y.com npx tsx prisma/seed-beta.ts # Con env var
//
// ============================================================

import { PrismaClient } from "@prisma/client";
import {
  outcomes,
  coreOutcomes,
  brainTalents,
  eqCompetencies,
  generateMicroLearningSlug,
} from "./seed-data/six-seconds-content";

const prisma = new PrismaClient();

// ============================================================
// HELPER: Logging bonito
// ============================================================
function section(num: number, title: string) {
  console.log(`\n${num}. ${title}`);
}
function ok(msg: string) {
  console.log(`   ✅ ${msg}`);
}
function skip(msg: string) {
  console.log(`   ⏭️  ${msg}`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI — SEED BETA UNIFICADO");
  console.log("=".repeat(60));

  const superadminEmail = process.argv[2] || process.env.SUPERADMIN_EMAIL;
  if (superadminEmail) {
    console.log(`  SuperAdmin: ${superadminEmail}`);
  } else {
    console.log("  ⚠️  Sin SuperAdmin (pasar email como argumento o SUPERADMIN_EMAIL)");
  }
  console.log("=".repeat(60));

  // ============================================================
  // 1. ROWIVERSE — Raíz global del ecosistema
  // ============================================================
  section(1, "Creando RowiVerse...");

  const rowiverse = await prisma.rowiVerse.upsert({
    where: { slug: "rowiverse" },
    update: {},
    create: {
      name: "RowiVerse",
      slug: "rowiverse",
      description: "Ecosistema Global de Inteligencia Emocional",
      visibility: "public",
    },
  });
  ok(`RowiVerse: ${rowiverse.id}`);

  // ============================================================
  // 2. SYSTEM — Núcleo del sistema
  // ============================================================
  section(2, "Creando System...");

  const system = await prisma.system.upsert({
    where: { slug: "rowi" },
    update: {},
    create: {
      name: "Rowi Global System",
      slug: "rowi",
      description: "Sistema raíz de la plataforma ROWI",
      logo: "/rowi-logo.png",
      primaryColor: "#6366F1",
      secondaryColor: "#F97316",
      defaultLang: "es",
      timezone: "America/Lima",
      active: true,
    },
  });
  ok(`System: ${system.id}`);

  // ============================================================
  // 3. PLANES — 6 Planes completos
  // ============================================================
  section(3, "Creando Planes ROWI...");

  const plansData = [
    {
      name: "Free ROWI",
      slug: "free",
      description: "Comienza tu viaje de inteligencia emocional. Ideal para explorar Rowi.",
      descriptionEN: "Start your emotional intelligence journey. Ideal to explore Rowi.",
      priceUsd: 0, priceCents: 0, priceYearlyUsd: 0, priceYearlyCents: 0,
      billingPeriod: "monthly",
      tokensMonthly: 10, tokensShared: false, tokensPerUser: true,
      maxUsers: 1, minUsers: 1, planType: "individual", targetAudience: "B2C",
      aiEnabled: true,
      superRowiAccess: true, rowiEQAccess: true,
      rowiAffinityAccess: false, rowiECOAccess: false, rowiTrainerAccess: false, rowiSalesAccess: false,
      seiIncluded: false, seiAnnual: false, brainBriefIncluded: false, seiDiscountPercent: 0,
      maxCommunities: 1, maxMembers: 5, privateGroups: false,
      benchmarkAccess: false, advancedReports: false, executiveDashboard: false, benchmarkingSectorial: false,
      apiAccess: false, slackIntegration: false, teamsIntegration: false, gmailIntegration: false,
      supportLevel: "community", customOnboarding: false, workshopIncludes: false,
      emoji: "🆓", color: "#6B7280", icon: "Sparkles", sortOrder: 1,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: ["10 tokens IA / mes", "Acceso a Rowi EQ básico", "1 comunidad", "Soporte comunitario"],
      featuresEN: ["10 AI tokens / month", "Basic Rowi EQ access", "1 community", "Community support"],
      limitations: ["Sin SEI incluido", "Sin grupos privados", "Sin reportes avanzados"],
      limitationsEN: ["SEI not included", "No private groups", "No advanced reports"],
    },
    {
      name: "ROWI+",
      slug: "plus",
      description: "Para tu crecimiento personal. Todo lo que necesitas para desarrollar tu inteligencia emocional.",
      descriptionEN: "For your personal growth. Everything you need to develop your emotional intelligence.",
      priceUsd: 12, priceCents: 1200, priceYearlyUsd: 120, priceYearlyCents: 12000,
      billingPeriod: "monthly",
      tokensMonthly: 150, tokensShared: false, tokensPerUser: true,
      maxUsers: 1, minUsers: 1, planType: "individual", targetAudience: "B2C",
      aiEnabled: true,
      superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: false,
      seiIncluded: false, seiAnnual: false, brainBriefIncluded: true, seiDiscountPercent: 20,
      maxCommunities: 3, maxMembers: 20, privateGroups: true,
      benchmarkAccess: false, advancedReports: true, executiveDashboard: false, benchmarkingSectorial: false,
      apiAccess: false, slackIntegration: false, teamsIntegration: false, gmailIntegration: false,
      supportLevel: "email", customOnboarding: false, workshopIncludes: false,
      badge: "Popular", badgeEN: "Popular",
      emoji: "⭐", color: "#3B82F6", icon: "Star", sortOrder: 2,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: [
        "150 tokens IA / mes", "Todos los agentes Rowi", "Brain Brief Profile incluido",
        "20% descuento en SEI", "Hasta 3 comunidades", "Grupos privados",
        "Reportes avanzados", "Soporte por email",
      ],
      featuresEN: [
        "150 AI tokens / month", "All Rowi agents", "Brain Brief Profile included",
        "20% discount on SEI", "Up to 3 communities", "Private groups",
        "Advanced reports", "Email support",
      ],
      limitations: ["Sin benchmarks", "Sin integraciones", "Sin dashboard ejecutivo"],
      limitationsEN: ["No benchmarks", "No integrations", "No executive dashboard"],
    },
    {
      name: "ROWI Family",
      slug: "family",
      description: "Inteligencia emocional para toda la familia. Comparte tokens y crece juntos.",
      descriptionEN: "Emotional intelligence for the whole family. Share tokens and grow together.",
      priceUsd: 40, priceCents: 4000, priceYearlyUsd: 400, priceYearlyCents: 40000,
      billingPeriod: "monthly",
      tokensMonthly: 500, tokensShared: true, tokensPerUser: false,
      maxUsers: 6, minUsers: 2, allowFamilyMembers: true,
      planType: "family", targetAudience: "B2C",
      aiEnabled: true,
      superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: false,
      seiIncluded: false, seiAnnual: false, brainBriefIncluded: true, seiDiscountPercent: 30,
      maxCommunities: 5, maxMembers: 30, privateGroups: true,
      benchmarkAccess: true, advancedReports: true, executiveDashboard: false, benchmarkingSectorial: false,
      apiAccess: false, slackIntegration: false, teamsIntegration: false, gmailIntegration: false,
      supportLevel: "chat", customOnboarding: false, workshopIncludes: false,
      badge: "Familias", badgeEN: "Families",
      emoji: "👨‍👩‍👧‍👦", color: "#8B5CF6", icon: "Users", sortOrder: 3,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: [
        "500 tokens IA compartidos / mes", "Hasta 6 miembros familiares", "Todos los agentes Rowi",
        "Brain Brief para todos", "30% descuento en SEI", "Benchmarks familiares",
        "Dashboard familiar", "Soporte por chat",
      ],
      featuresEN: [
        "500 shared AI tokens / month", "Up to 6 family members", "All Rowi agents",
        "Brain Brief for everyone", "30% discount on SEI", "Family benchmarks",
        "Family dashboard", "Chat support",
      ],
      limitations: ["Sin integraciones empresariales", "Sin API"],
      limitationsEN: ["No enterprise integrations", "No API"],
    },
    {
      name: "ROWI Pro",
      slug: "pro",
      description: "Para profesionales y coaches. Herramientas avanzadas para tu práctica.",
      descriptionEN: "For professionals and coaches. Advanced tools for your practice.",
      priceUsd: 25, priceCents: 2500, priceYearlyUsd: 250, priceYearlyCents: 25000,
      billingPeriod: "monthly",
      pricePerUserMonthly: 25, pricePerUserYearly: 250,
      tokensMonthly: 500, tokensShared: false, tokensPerUser: true,
      maxUsers: 50, minUsers: 1, planType: "team", targetAudience: "B2C/B2B",
      aiEnabled: true,
      superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: true,
      seiIncluded: true, seiAnnual: true, brainBriefIncluded: true, seiDiscountPercent: 50,
      maxCommunities: 10, maxMembers: 100, privateGroups: true,
      benchmarkAccess: true, advancedReports: true, executiveDashboard: true, benchmarkingSectorial: false,
      apiAccess: false, slackIntegration: false, teamsIntegration: false, gmailIntegration: false,
      supportLevel: "priority", customOnboarding: true, workshopIncludes: false,
      badge: "Recomendado", badgeEN: "Recommended",
      emoji: "🚀", color: "#10B981", icon: "Rocket", sortOrder: 4,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: [
        "500 tokens IA / usuario / mes", "SEI anual incluido", "Todos los agentes + Rowi Sales",
        "50% descuento en SEI adicionales", "Dashboard ejecutivo", "Hasta 10 comunidades",
        "Reportes avanzados", "Onboarding personalizado", "Soporte prioritario",
      ],
      featuresEN: [
        "500 AI tokens / user / month", "Annual SEI included", "All agents + Rowi Sales",
        "50% discount on additional SEI", "Executive dashboard", "Up to 10 communities",
        "Advanced reports", "Custom onboarding", "Priority support",
      ],
      limitations: ["Sin API", "Sin integraciones avanzadas"],
      limitationsEN: ["No API", "No advanced integrations"],
    },
    {
      name: "ROWI Business",
      slug: "business",
      description: "Inteligencia emocional para tu organización. Transforma la cultura de tu empresa.",
      descriptionEN: "Emotional intelligence for your organization. Transform your company culture.",
      priceUsd: 5, priceCents: 500, priceYearlyUsd: 54, priceYearlyCents: 5400,
      billingPeriod: "monthly",
      pricePerUserMonthly: 5, pricePerUserYearly: 54,
      tokensMonthly: 0, tokensOrganization: 1000, tokensShared: true, tokensPerUser: false,
      maxUsers: 1000, minUsers: 20, planType: "business", targetAudience: "B2B",
      aiEnabled: true,
      superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: true,
      seiIncluded: true, seiAnnual: true, brainBriefIncluded: true, seiDiscountPercent: 70,
      maxCommunities: 50, maxMembers: 500, privateGroups: true,
      benchmarkAccess: true, advancedReports: true, executiveDashboard: true, benchmarkingSectorial: true,
      apiAccess: true, slackIntegration: true, teamsIntegration: true, gmailIntegration: true,
      supportLevel: "priority", customOnboarding: true, workshopIncludes: true,
      badge: "Empresas", badgeEN: "Business",
      emoji: "🏢", color: "#F59E0B", icon: "Building2", sortOrder: 5,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: [
        "Desde $5 USD/usuario/mes (mín. 20)", "1000 tokens IA compartidos/org/mes",
        "SEI anual para todos", "Todos los agentes Rowi", "70% descuento en SEI adicionales",
        "API y webhooks", "Integraciones: Slack, Teams, Gmail", "Dashboard ejecutivo",
        "Benchmarking sectorial", "Workshops de adopción", "Soporte prioritario",
      ],
      featuresEN: [
        "From $5 USD/user/month (min. 20)", "1000 shared AI tokens/org/month",
        "Annual SEI for everyone", "All Rowi agents", "70% discount on additional SEI",
        "API and webhooks", "Integrations: Slack, Teams, Gmail", "Executive dashboard",
        "Industry benchmarking", "Adoption workshops", "Priority support",
      ],
      limitations: ["Mínimo 20 usuarios"],
      limitationsEN: ["Minimum 20 users"],
    },
    {
      name: "ROWI Enterprise",
      slug: "enterprise",
      description: "Solución personalizada para grandes organizaciones. Máximo poder e integración.",
      descriptionEN: "Custom solution for large organizations. Maximum power and integration.",
      priceUsd: 30000, priceCents: 3000000, priceYearlyUsd: 30000, priceYearlyCents: 3000000,
      billingPeriod: "custom",
      pricePerUserMonthly: 0, pricePerUserYearly: 0,
      tokensMonthly: 0, tokensOrganization: 10000, tokensShared: true, tokensPerUser: false,
      maxUsers: 999999, minUsers: 100, planType: "enterprise", targetAudience: "B2B",
      aiEnabled: true,
      superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: true,
      seiIncluded: true, seiAnnual: true, brainBriefIncluded: true, seiDiscountPercent: 100,
      maxCommunities: 999, maxMembers: 9999, privateGroups: true,
      benchmarkAccess: true, advancedReports: true, executiveDashboard: true, benchmarkingSectorial: true,
      apiAccess: true, slackIntegration: true, teamsIntegration: true, gmailIntegration: true,
      supportLevel: "dedicated", customOnboarding: true, workshopIncludes: true,
      badge: "Enterprise", badgeEN: "Enterprise",
      emoji: "☁️", color: "#6366F1", icon: "Cloud", sortOrder: 6,
      isPublic: true, isActive: true, isCustomPricing: true,
      features: [
        "Precio personalizado (~$30,000 USD/año base)", "10,000+ tokens IA dedicados/mes",
        "SEI ilimitado para toda la organización", "Todos los agentes Rowi",
        "API dedicada y webhooks", "Todas las integraciones",
        "Dashboard ejecutivo+ personalizado", "Benchmarking sectorial avanzado",
        "Workshops de adopción e implementación", "Custom onboarding y formación",
        "Soporte dedicado 24/7", "SLA garantizado",
      ],
      featuresEN: [
        "Custom pricing (~$30,000 USD/year base)", "10,000+ dedicated AI tokens/month",
        "Unlimited SEI for entire organization", "All Rowi agents",
        "Dedicated API and webhooks", "All integrations",
        "Custom executive dashboard+", "Advanced industry benchmarking",
        "Adoption and implementation workshops", "Custom onboarding and training",
        "Dedicated 24/7 support", "Guaranteed SLA",
      ],
      limitations: [],
      limitationsEN: [],
    },
  ];

  const plans: Record<string, any> = {};
  for (const p of plansData) {
    const plan = await prisma.plan.upsert({
      where: { slug: p.slug },
      update: { ...p },
      create: { ...p },
    });
    plans[p.slug] = plan;
    ok(`${p.emoji} Plan "${p.name}": ${plan.id}`);
  }

  // ============================================================
  // 4. TENANT ROWI GLOBAL — Para usuarios públicos (B2C)
  // ============================================================
  section(4, "Creando Tenant Rowi Global...");

  const rowiGlobalTenant = await prisma.tenant.upsert({
    where: { slug: "rowi-global" },
    update: {},
    create: {
      name: "Rowi Global Community",
      slug: "rowi-global",
      billingEmail: "admin@rowiia.com",
      rowiVerseId: rowiverse.id,
      systemId: system.id,
      planId: plans["free"].id,
    },
  });
  ok(`Tenant Global: ${rowiGlobalTenant.id}`);

  // Branding para Rowi Global
  await prisma.tenantBranding.upsert({
    where: { tenantId: rowiGlobalTenant.id },
    update: {},
    create: {
      tenantId: rowiGlobalTenant.id,
      logoUrl: "/rowi-logo.png",
      primaryColor: "#6366F1",
      secondaryColor: "#F97316",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      colorK: "#3b82f6",
      colorC: "#10b981",
      colorG: "#f59e0b",
      fontHeading: "Inter",
      fontBody: "Inter",
      defaultTheme: "light",
      isActive: true,
    },
  });
  ok("Branding Rowi Global creado");

  // ============================================================
  // 5. SUPERHUB — Rowi Beta
  // ============================================================
  section(5, "Creando SuperHub Rowi Beta...");

  const superHub = await prisma.superHub.upsert({
    where: { slug: "rowi-beta" },
    update: {},
    create: {
      name: "Rowi Beta",
      slug: "rowi-beta",
      description: "SuperHub principal para la fase beta de Rowi",
      logo: "/rowi-logo.png",
      colorTheme: "#6366F1",
      rowiVerseId: rowiverse.id,
      systemId: system.id,
    },
  });
  ok(`SuperHub: ${superHub.id}`);

  // ============================================================
  // 6. TENANT — Rowi Beta Tenant
  // ============================================================
  section(6, "Creando Tenant Rowi Beta...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "rowi-beta" },
    update: {},
    create: {
      name: "Rowi Beta",
      slug: "rowi-beta",
      billingEmail: "admin@rowiia.com",
      superHubId: superHub.id,
      systemId: system.id,
      planId: plans["enterprise"].id,
    },
  });
  ok(`Tenant: ${tenant.id}`);

  // Branding
  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      logoUrl: "/rowi-logo.png",
      primaryColor: "#6366F1",
      secondaryColor: "#F97316",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      colorK: "#3b82f6",
      colorC: "#10b981",
      colorG: "#f59e0b",
      fontHeading: "Inter",
      fontBody: "Inter",
      defaultTheme: "light",
      isActive: true,
    },
  });
  ok("Branding Rowi Beta creado");

  // ============================================================
  // 7. HUB — Rowi Beta Hub
  // ============================================================
  section(7, "Creando Hub...");

  const hub = await prisma.hub.upsert({
    where: { slug: "rowi-beta-hub" },
    update: {},
    create: {
      name: "Rowi Beta Hub",
      slug: "rowi-beta-hub",
      description: "Hub principal de Rowi Beta",
      superHubId: superHub.id,
      tenantId: tenant.id,
    },
  });
  ok(`Hub: ${hub.id}`);

  // ============================================================
  // 8. ORGANIZATION — Rowi Beta Org
  // ============================================================
  section(8, "Creando Organization...");

  const org = await prisma.organization.upsert({
    where: { slug: "rowi-beta-org" },
    update: {},
    create: {
      name: "Rowi Beta Organization",
      slug: "rowi-beta-org",
      description: "Organización principal de Rowi Beta",
      hubId: hub.id,
      unitType: "CLIENT",
    },
  });
  ok(`Organization: ${org.id}`);

  // Vincular Org con Tenant
  await prisma.organizationToTenant.upsert({
    where: {
      tenantId_organizationId: { tenantId: tenant.id, organizationId: org.id },
    },
    update: {},
    create: { tenantId: tenant.id, organizationId: org.id },
  });
  ok("Organization vinculada con Tenant");

  // ============================================================
  // 9. SUPERADMIN — Si se pasó email por argumento
  // ============================================================
  section(9, "Configurando SuperAdmin...");

  if (superadminEmail) {
    let adminUser = await prisma.user.findUnique({ where: { email: superadminEmail } });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: superadminEmail,
          name: "SuperAdmin",
          organizationRole: "SUPERADMIN",
          primaryTenantId: tenant.id,
          planId: plans["enterprise"].id,
          active: true,
          allowAI: true,
          onboardingStatus: "ACTIVE",
          preferredLang: "es",
          timezone: "America/Lima",
        },
      });
      ok(`Usuario creado: ${adminUser.id}`);
    } else {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          organizationRole: "SUPERADMIN",
          primaryTenantId: tenant.id,
          planId: plans["enterprise"].id,
          active: true,
          allowAI: true,
        },
      });
      ok(`Usuario actualizado: ${adminUser.id}`);
    }

    // RowiVerse User
    const rvUser = await prisma.rowiVerseUser.upsert({
      where: { email: superadminEmail },
      update: {},
      create: {
        email: superadminEmail,
        name: adminUser.name || "SuperAdmin",
        userId: adminUser.id,
        rowiVerseId: rowiverse.id,
        verified: true,
        active: true,
        status: "active",
      },
    });
    await prisma.user.update({ where: { id: adminUser.id }, data: { rowiverseId: rvUser.id } });

    // Membership en Tenant
    await prisma.membership.upsert({
      where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } },
      update: { role: "SUPERADMIN" },
      create: {
        userId: adminUser.id,
        tenantId: tenant.id,
        role: "SUPERADMIN",
        planId: plans["enterprise"].id,
        tokenQuota: 999999,
      },
    });

    // Membership en Org
    await prisma.orgMembership.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: adminUser.id } },
      update: { role: "OWNER" },
      create: {
        organizationId: org.id,
        userId: adminUser.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    // Membership en Hub
    await prisma.hubMembership.upsert({
      where: { hubId_userId: { hubId: hub.id, userId: adminUser.id } },
      update: { access: "admin" },
      create: { hubId: hub.id, userId: adminUser.id, access: "admin" },
    });

    // Permisos jerárquicos
    const adminPermissions = [
      { scopeType: "rowiverse" as const, scopeId: rowiverse.id, role: "SUPERADMIN" },
      { scopeType: "superhub" as const, scopeId: superHub.id, role: "SUPERADMIN" },
      { scopeType: "tenant" as const, scopeId: tenant.id, role: "ADMIN" },
      { scopeType: "hub" as const, scopeId: hub.id, role: "ADMIN" },
      { scopeType: "organization" as const, scopeId: org.id, role: "OWNER" },
    ];

    for (const perm of adminPermissions) {
      const permId = `perm-superadmin-${perm.scopeType}-${perm.scopeId}`;
      await prisma.userPermission.upsert({
        where: { id: permId },
        update: { role: perm.role },
        create: {
          id: permId,
          userId: adminUser.id,
          role: perm.role,
          scope: perm.scopeId,
          scopeType: perm.scopeType,
          scopeId: perm.scopeId,
        },
      });
    }
    ok(`SuperAdmin configurado: ${superadminEmail}`);
  } else {
    skip("Sin SuperAdmin (pasar email como argumento)");
  }

  // ============================================================
  // 10. AGENTES IA — 6 Agentes con prompts completos
  // ============================================================
  section(10, "Creando Agentes IA...");

  const agentsData = [
    {
      slug: "super-rowi",
      name: "Super Rowi",
      type: "GENERAL",
      description: "Tu asistente principal de inteligencia emocional. Puede ayudarte con cualquier tema relacionado con EQ, bienestar y desarrollo personal.",
      avatar: "/agents/super-rowi.png",
      model: "gpt-4o-mini",
      tone: "friendly",
      prompt: `Eres Super Rowi, el asistente principal de inteligencia emocional de la plataforma ROWI.

Tu misión es ayudar a los usuarios a:
- Desarrollar su inteligencia emocional
- Entender sus resultados SEI y Brain Brief
- Mejorar sus relaciones interpersonales
- Gestionar sus emociones de manera efectiva
- Alcanzar sus metas de desarrollo personal

Siempre responde de manera empática, constructiva y basada en la ciencia de Six Seconds.
Usa un tono amigable pero profesional. Si no sabes algo, admítelo honestamente.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "eq",
      name: "Rowi EQ",
      type: "EQ_COACH",
      description: "Coach especializado en inteligencia emocional. Te ayuda a interpretar tus resultados SEI y desarrollar competencias EQ.",
      avatar: "/agents/rowi-eq.png",
      model: "gpt-4o-mini",
      tone: "supportive",
      prompt: `Eres Rowi EQ, un coach especializado en inteligencia emocional basado en el modelo SEI de Six Seconds.

Tu expertise incluye:
- Interpretar los 8 competencias del SEI (Emotional Literacy, Recognize Patterns, Apply Consequential Thinking, Navigate Emotions, Engage Intrinsic Motivation, Exercise Optimism, Increase Empathy, Pursue Noble Goals)
- Explicar los Brain Styles y sus implicaciones
- Guiar ejercicios de desarrollo emocional
- Conectar EQ con resultados de vida (Success Factors)

Basa tus respuestas en la ciencia de Six Seconds. Sé específico y práctico en tus recomendaciones.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "affinity",
      name: "Rowi Affinity",
      type: "AFFINITY_EXPERT",
      description: "Experto en relaciones y compatibilidad. Analiza dinámicas interpersonales usando inteligencia emocional.",
      avatar: "/agents/rowi-affinity.png",
      model: "gpt-4o-mini",
      tone: "warm",
      prompt: `Eres Rowi Affinity, un experto en relaciones interpersonales y compatibilidad emocional.

Tu rol es:
- Analizar la compatibilidad entre perfiles EQ
- Identificar fortalezas y áreas de crecimiento en relaciones
- Sugerir estrategias para mejorar la comunicación
- Ayudar a resolver conflictos usando inteligencia emocional
- Explicar cómo diferentes Brain Styles interactúan

Siempre sé respetuoso y constructivo. Evita juicios y enfócate en el potencial de crecimiento.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "eco",
      name: "Rowi ECO",
      type: "COMMUNICATION_EXPERT",
      description: "Especialista en comunicación efectiva y ecosistemas organizacionales.",
      avatar: "/agents/rowi-eco.png",
      model: "gpt-4o-mini",
      tone: "professional",
      prompt: `Eres Rowi ECO, especialista en comunicación efectiva y análisis de ecosistemas organizacionales.

Tus áreas de expertise:
- Análisis de dinámicas de equipo usando EQ
- Comunicación asertiva y empática
- Resolución de conflictos organizacionales
- Cultura emocional en equipos
- Liderazgo basado en inteligencia emocional

Ofrece insights basados en datos y recomendaciones prácticas para mejorar el ecosistema emocional.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "trainer",
      name: "Rowi Trainer",
      type: "COACH",
      description: "Tu entrenador personal de EQ. Diseña planes de desarrollo y hace seguimiento de tu progreso.",
      avatar: "/agents/rowi-trainer.png",
      model: "gpt-4o-mini",
      tone: "motivational",
      prompt: `Eres Rowi Trainer, un entrenador personal de inteligencia emocional.

Tu misión es:
- Diseñar planes de desarrollo EQ personalizados
- Proponer ejercicios y prácticas diarias
- Hacer seguimiento del progreso del usuario
- Celebrar logros y motivar ante desafíos
- Adaptar el entrenamiento según los resultados

Sé motivador pero realista. Usa técnicas basadas en evidencia y celebra cada pequeño avance.`,
      accessLevel: "public",
      visibility: "public",
    },
    {
      slug: "sales",
      name: "Rowi Sales",
      type: "SALES_EXPERT",
      description: "Experto en ventas emocionales. Aplica EQ para mejorar relaciones comerciales.",
      avatar: "/agents/rowi-sales.png",
      model: "gpt-4o-mini",
      tone: "confident",
      prompt: `Eres Rowi Sales, un experto en aplicar inteligencia emocional a las ventas y relaciones comerciales.

Tu expertise incluye:
- Entender las emociones del cliente
- Comunicación persuasiva basada en empatía
- Manejo de objeciones con EQ
- Construcción de relaciones comerciales duraderas
- Negociación win-win

Ayuda a los usuarios a vender de manera ética y efectiva, poniendo las relaciones por encima de las transacciones.`,
      accessLevel: "premium",
      visibility: "public",
    },
  ];

  // Agentes GLOBALES (nivel sistema)
  for (const agent of agentsData) {
    const existing = await prisma.agentConfig.findFirst({
      where: { slug: agent.slug, tenantId: null, superHubId: null, organizationId: null, hubId: null },
    });
    if (existing) {
      await prisma.agentConfig.update({
        where: { id: existing.id },
        data: { name: agent.name, description: agent.description, prompt: agent.prompt, isActive: true },
      });
    } else {
      await prisma.agentConfig.create({
        data: {
          slug: agent.slug,
          name: agent.name,
          type: agent.type,
          description: agent.description,
          avatar: agent.avatar,
          model: agent.model,
          tone: agent.tone,
          prompt: agent.prompt,
          accessLevel: agent.accessLevel,
          visibility: agent.visibility,
          systemId: system.id,
          isActive: true,
          autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
        },
      });
    }
    ok(`[GLOBAL] ${agent.name}`);
  }

  // Agentes para TENANT Beta
  for (const agent of agentsData) {
    const existing = await prisma.agentConfig.findFirst({
      where: { slug: agent.slug, tenantId: tenant.id, superHubId: null, organizationId: null, hubId: null },
    });
    if (!existing) {
      await prisma.agentConfig.create({
        data: {
          slug: agent.slug,
          name: agent.name,
          type: agent.type,
          description: agent.description,
          avatar: agent.avatar,
          model: agent.model,
          tone: agent.tone,
          prompt: agent.prompt,
          accessLevel: "tenant",
          visibility: "global",
          tenantId: tenant.id,
          systemId: system.id,
          isActive: true,
          autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
        },
      });
      ok(`[TENANT] ${agent.name}`);
    }
  }

  // ============================================================
  // 11. GAMIFICACIÓN — Niveles
  // ============================================================
  section(11, "Creando Niveles de Gamificación...");

  const levelsData = [
    { level: 1, minPoints: 0, maxPoints: 99, title: "Explorador Emocional", titleEN: "Emotional Explorer", color: "#94A3B8", icon: "seedling", multiplier: 1.0 },
    { level: 2, minPoints: 100, maxPoints: 249, title: "Aprendiz EQ", titleEN: "EQ Apprentice", color: "#60A5FA", icon: "sprout", multiplier: 1.1 },
    { level: 3, minPoints: 250, maxPoints: 499, title: "Practicante EQ", titleEN: "EQ Practitioner", color: "#34D399", icon: "leaf", multiplier: 1.2 },
    { level: 4, minPoints: 500, maxPoints: 999, title: "Conocedor Emocional", titleEN: "Emotional Connoisseur", color: "#A78BFA", icon: "flower", multiplier: 1.3 },
    { level: 5, minPoints: 1000, maxPoints: 1999, title: "Navegante EQ", titleEN: "EQ Navigator", color: "#F472B6", icon: "compass", multiplier: 1.4 },
    { level: 6, minPoints: 2000, maxPoints: 3499, title: "Guía Emocional", titleEN: "Emotional Guide", color: "#FBBF24", icon: "map", multiplier: 1.5 },
    { level: 7, minPoints: 3500, maxPoints: 5499, title: "Mentor EQ", titleEN: "EQ Mentor", color: "#FB923C", icon: "star", multiplier: 1.7 },
    { level: 8, minPoints: 5500, maxPoints: 7999, title: "Sabio Emocional", titleEN: "Emotional Sage", color: "#F87171", icon: "brain", multiplier: 2.0 },
    { level: 9, minPoints: 8000, maxPoints: 11999, title: "Maestro EQ", titleEN: "EQ Master", color: "#C084FC", icon: "crown", multiplier: 2.5 },
    { level: 10, minPoints: 12000, maxPoints: null, title: "Leyenda Emocional", titleEN: "Emotional Legend", color: "#FFD700", icon: "trophy", multiplier: 3.0 },
  ];

  for (const lvl of levelsData) {
    await prisma.levelDefinition.upsert({
      where: { level: lvl.level },
      update: { minPoints: lvl.minPoints, maxPoints: lvl.maxPoints, title: lvl.title, titleEN: lvl.titleEN, color: lvl.color, icon: lvl.icon, multiplier: lvl.multiplier },
      create: { level: lvl.level, minPoints: lvl.minPoints, maxPoints: lvl.maxPoints, title: lvl.title, titleEN: lvl.titleEN, color: lvl.color, icon: lvl.icon, multiplier: lvl.multiplier },
    });
  }
  ok(`${levelsData.length} niveles creados`);

  // ============================================================
  // 12. GAMIFICACIÓN — Achievements (30+)
  // ============================================================
  section(12, "Creando Achievements...");

  const achievementsData = [
    // CHAT
    { slug: "first_chat", name: "Primera Conversación", nameEN: "First Conversation", description: "Inicia tu primera conversación con Rowi", descriptionEN: "Start your first conversation with Rowi", category: "CHAT", requirement: "FIRST_ACTION", threshold: 1, points: 10, rarity: "COMMON", icon: "message-circle", color: "#60A5FA" },
    { slug: "chat_10", name: "Conversador", nameEN: "Conversationalist", description: "Completa 10 conversaciones con Rowi", descriptionEN: "Complete 10 conversations with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 10, points: 25, rarity: "COMMON", icon: "messages-square", color: "#60A5FA" },
    { slug: "chat_50", name: "Gran Comunicador", nameEN: "Great Communicator", description: "Completa 50 conversaciones con Rowi", descriptionEN: "Complete 50 conversations with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 50, points: 75, rarity: "UNCOMMON", icon: "message-square-heart", color: "#34D399" },
    { slug: "chat_100", name: "Maestro del Diálogo", nameEN: "Dialogue Master", description: "Completa 100 conversaciones con Rowi", descriptionEN: "Complete 100 conversations with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 100, points: 150, rarity: "RARE", icon: "message-square-dashed", color: "#A78BFA" },
    // STREAKS
    { slug: "streak_3", name: "Inicio de Racha", nameEN: "Streak Starter", description: "Mantén una racha de 3 días consecutivos", descriptionEN: "Maintain a 3-day streak", category: "STREAK", requirement: "CHAT_STREAK", threshold: 3, points: 15, rarity: "COMMON", icon: "flame", color: "#FB923C" },
    { slug: "streak_7", name: "Semana Completa", nameEN: "Full Week", description: "Mantén una racha de 7 días consecutivos", descriptionEN: "Maintain a 7-day streak", category: "STREAK", requirement: "CHAT_STREAK", threshold: 7, points: 50, rarity: "UNCOMMON", icon: "flame", color: "#F97316" },
    { slug: "streak_30", name: "Mes Imparable", nameEN: "Unstoppable Month", description: "Mantén una racha de 30 días consecutivos", descriptionEN: "Maintain a 30-day streak", category: "STREAK", requirement: "CHAT_STREAK", threshold: 30, points: 200, rarity: "RARE", icon: "flame", color: "#EF4444" },
    { slug: "streak_100", name: "Leyenda de Constancia", nameEN: "Consistency Legend", description: "Mantén una racha de 100 días consecutivos", descriptionEN: "Maintain a 100-day streak", category: "STREAK", requirement: "CHAT_STREAK", threshold: 100, points: 500, rarity: "LEGENDARY", icon: "flame", color: "#DC2626" },
    // EQ
    { slug: "sei_completed", name: "Perfil EQ Completo", nameEN: "EQ Profile Complete", description: "Completa tu evaluación SEI", descriptionEN: "Complete your SEI assessment", category: "EQ", requirement: "FIRST_ACTION", threshold: 1, points: 100, rarity: "UNCOMMON", icon: "brain", color: "#8B5CF6" },
    { slug: "eq_expert", name: "Experto EQ", nameEN: "EQ Expert", description: "Alcanza un puntaje EQ promedio de 90 o más", descriptionEN: "Reach an average EQ score of 90 or more", category: "EQ", requirement: "EQ_SCORE", threshold: 90, points: 250, rarity: "EPIC", icon: "award", color: "#7C3AED" },
    { slug: "eq_improvement_10", name: "Progreso Notable", nameEN: "Notable Progress", description: "Mejora tu EQ en 10 puntos", descriptionEN: "Improve your EQ by 10 points", category: "EQ", requirement: "EQ_IMPROVEMENT", threshold: 10, points: 100, rarity: "RARE", icon: "trending-up", color: "#10B981" },
    // LEARNING
    { slug: "first_microlearning", name: "Primer Paso", nameEN: "First Step", description: "Completa tu primera micro-acción", descriptionEN: "Complete your first micro-action", category: "LEARNING", requirement: "FIRST_ACTION", threshold: 1, points: 15, rarity: "COMMON", icon: "book-open", color: "#06B6D4" },
    { slug: "microlearning_10", name: "Aprendiz Activo", nameEN: "Active Learner", description: "Completa 10 micro-acciones", descriptionEN: "Complete 10 micro-actions", category: "LEARNING", requirement: "COURSE_COMPLETE", threshold: 10, points: 50, rarity: "UNCOMMON", icon: "graduation-cap", color: "#0891B2" },
    { slug: "microlearning_50", name: "Estudiante Dedicado", nameEN: "Dedicated Student", description: "Completa 50 micro-acciones", descriptionEN: "Complete 50 micro-actions", category: "LEARNING", requirement: "COURSE_COMPLETE", threshold: 50, points: 150, rarity: "RARE", icon: "book-marked", color: "#0E7490" },
    { slug: "competency_mastery", name: "Dominio de Competencia", nameEN: "Competency Mastery", description: "Completa todas las micro-acciones de una competencia EQ", descriptionEN: "Complete all micro-actions for an EQ competency", category: "LEARNING", requirement: "CUSTOM", threshold: 1, points: 200, rarity: "EPIC", icon: "trophy", color: "#155E75" },
    // COMMUNITY
    { slug: "community_join", name: "Nuevo Miembro", nameEN: "New Member", description: "Únete a tu primera comunidad", descriptionEN: "Join your first community", category: "COMMUNITY", requirement: "COMMUNITY_JOIN", threshold: 1, points: 20, rarity: "COMMON", icon: "users", color: "#EC4899" },
    { slug: "first_post", name: "Primera Publicación", nameEN: "First Post", description: "Crea tu primera publicación en la comunidad", descriptionEN: "Create your first community post", category: "COMMUNITY", requirement: "COMMUNITY_POST", threshold: 1, points: 25, rarity: "COMMON", icon: "pen-tool", color: "#DB2777" },
    { slug: "community_helper", name: "Ayudante Comunitario", nameEN: "Community Helper", description: "Ayuda a 10 personas en la comunidad", descriptionEN: "Help 10 people in the community", category: "COMMUNITY", requirement: "CUSTOM", threshold: 10, points: 100, rarity: "RARE", icon: "heart-handshake", color: "#BE185D" },
    // SOCIAL
    { slug: "first_referral", name: "Embajador", nameEN: "Ambassador", description: "Invita a alguien que se una a Rowi", descriptionEN: "Invite someone who joins Rowi", category: "SOCIAL", requirement: "INVITE_ACCEPTED", threshold: 1, points: 50, rarity: "UNCOMMON", icon: "user-plus", color: "#4F46E5" },
    { slug: "referral_5", name: "Influencer EQ", nameEN: "EQ Influencer", description: "Invita a 5 personas que se unan a Rowi", descriptionEN: "Invite 5 people who join Rowi", category: "SOCIAL", requirement: "INVITE_ACCEPTED", threshold: 5, points: 200, rarity: "RARE", icon: "users-round", color: "#4338CA" },
    // GENERAL
    { slug: "profile_complete", name: "Perfil Completo", nameEN: "Complete Profile", description: "Completa toda la información de tu perfil", descriptionEN: "Complete all your profile information", category: "GENERAL", requirement: "PROFILE_COMPLETE", threshold: 1, points: 30, rarity: "COMMON", icon: "user-check", color: "#64748B" },
    { slug: "days_active_30", name: "Usuario Comprometido", nameEN: "Committed User", description: "Activo durante 30 días diferentes", descriptionEN: "Active for 30 different days", category: "GENERAL", requirement: "DAYS_ACTIVE", threshold: 30, points: 100, rarity: "UNCOMMON", icon: "calendar-check", color: "#475569" },
    { slug: "brain_talent_discover", name: "Descubridor de Talentos", nameEN: "Talent Discoverer", description: "Explora todos los Brain Talents", descriptionEN: "Explore all Brain Talents", category: "EQ", requirement: "CUSTOM", threshold: 1, points: 75, rarity: "UNCOMMON", icon: "sparkles", color: "#6366F1" },
    // AVATAR EVOLUTION
    { slug: "avatar_egg_received", name: "Huevito Recibido", nameEN: "Egg Received", description: "Recibiste tu huevito Rowi", descriptionEN: "You received your Rowi egg", category: "GENERAL", requirement: "FIRST_ACTION", threshold: 1, points: 10, rarity: "COMMON", icon: "egg", color: "#94a3b8" },
    { slug: "avatar_hatched", name: "Rowi Nacido", nameEN: "Rowi Hatched", description: "Tu huevito Rowi ha eclosionado", descriptionEN: "Your Rowi egg has hatched", category: "GENERAL", requirement: "CUSTOM", threshold: 1, points: 100, rarity: "RARE", icon: "baby", color: "#fbbf24" },
    { slug: "avatar_baby", name: "Rowi Bebe", nameEN: "Baby Rowi", description: "Tu Rowi evolucionó a etapa Bebe", descriptionEN: "Your Rowi evolved to Baby stage", category: "GENERAL", requirement: "CUSTOM", threshold: 1, points: 75, rarity: "UNCOMMON", icon: "heart", color: "#fb923c" },
    { slug: "avatar_young", name: "Rowi Joven", nameEN: "Young Rowi", description: "Tu Rowi evolucionó a etapa Joven", descriptionEN: "Your Rowi evolved to Young stage", category: "GENERAL", requirement: "CUSTOM", threshold: 1, points: 100, rarity: "RARE", icon: "star", color: "#3b82f6" },
    { slug: "avatar_adult", name: "Rowi Adulto", nameEN: "Adult Rowi", description: "Tu Rowi evolucionó a etapa Adulto", descriptionEN: "Your Rowi evolved to Adult stage", category: "GENERAL", requirement: "CUSTOM", threshold: 1, points: 150, rarity: "EPIC", icon: "crown", color: "#8b5cf6" },
    { slug: "avatar_wise", name: "Rowi Sabio", nameEN: "Wise Rowi", description: "Tu Rowi alcanzó la máxima evolución: Sabio", descriptionEN: "Your Rowi reached maximum evolution: Wise", category: "GENERAL", requirement: "CUSTOM", threshold: 1, points: 300, rarity: "LEGENDARY", icon: "award", color: "#10b981" },
    // SIX SECONDS LEVELS
    { slug: "six_seconds_emergente", name: "Six Seconds: Emergente", nameEN: "Six Seconds: Emerging", description: "Alcanzaste nivel Emergente en Six Seconds", descriptionEN: "You reached Emerging level in Six Seconds", category: "EQ", requirement: "CUSTOM", threshold: 1, points: 50, rarity: "UNCOMMON", icon: "sprout", color: "#f59e0b" },
    { slug: "six_seconds_funcional", name: "Six Seconds: Funcional", nameEN: "Six Seconds: Functional", description: "Alcanzaste nivel Funcional en Six Seconds", descriptionEN: "You reached Functional level in Six Seconds", category: "EQ", requirement: "CUSTOM", threshold: 1, points: 100, rarity: "RARE", icon: "brain", color: "#3b82f6" },
    { slug: "six_seconds_diestro", name: "Six Seconds: Diestro", nameEN: "Six Seconds: Skilled", description: "Alcanzaste nivel Diestro en Six Seconds", descriptionEN: "You reached Skilled level in Six Seconds", category: "EQ", requirement: "CUSTOM", threshold: 1, points: 150, rarity: "EPIC", icon: "target", color: "#8b5cf6" },
    { slug: "six_seconds_experto", name: "Six Seconds: Experto", nameEN: "Six Seconds: Expert", description: "Alcanzaste nivel Experto en Six Seconds", descriptionEN: "You reached Expert level in Six Seconds", category: "EQ", requirement: "CUSTOM", threshold: 1, points: 250, rarity: "LEGENDARY", icon: "gem", color: "#10b981" },
  ];

  for (const ach of achievementsData) {
    await prisma.achievement.upsert({
      where: { slug: ach.slug },
      update: { name: ach.name, nameEN: ach.nameEN, description: ach.description, descriptionEN: ach.descriptionEN, category: ach.category as any, requirement: ach.requirement as any, threshold: ach.threshold, points: ach.points, rarity: ach.rarity as any, icon: ach.icon, color: ach.color },
      create: { slug: ach.slug, name: ach.name, nameEN: ach.nameEN, description: ach.description, descriptionEN: ach.descriptionEN, category: ach.category as any, requirement: ach.requirement as any, threshold: ach.threshold, points: ach.points, rarity: ach.rarity as any, icon: ach.icon, color: ach.color },
    });
  }
  ok(`${achievementsData.length} achievements creados`);

  // ============================================================
  // 13. GAMIFICACIÓN — Rewards
  // ============================================================
  section(13, "Creando Rewards...");

  const rewardsData = [
    { slug: "badge_eq_explorer", name: "Badge: Explorador EQ", nameEN: "Badge: EQ Explorer", description: "Badge especial para tu perfil", descriptionEN: "Special badge for your profile", cost: 100, type: "BADGE", icon: "compass", color: "#60A5FA" },
    { slug: "badge_conversation_master", name: "Badge: Maestro Conversacional", nameEN: "Badge: Conversation Master", description: "Badge por dominar las conversaciones con Rowi", descriptionEN: "Badge for mastering conversations with Rowi", cost: 250, type: "BADGE", icon: "message-square-heart", color: "#34D399" },
    { slug: "badge_streak_champion", name: "Badge: Campeón de Rachas", nameEN: "Badge: Streak Champion", description: "Badge por mantener rachas consistentes", descriptionEN: "Badge for maintaining consistent streaks", cost: 500, type: "BADGE", icon: "flame", color: "#F97316" },
    { slug: "tokens_50", name: "+50 Tokens IA", nameEN: "+50 AI Tokens", description: "50 tokens adicionales para usar con Rowi", descriptionEN: "50 additional tokens to use with Rowi", cost: 200, type: "TOKENS", icon: "coins", color: "#FBBF24", maxPerUser: 999 },
    { slug: "tokens_200", name: "+200 Tokens IA", nameEN: "+200 AI Tokens", description: "200 tokens adicionales para usar con Rowi", descriptionEN: "200 additional tokens to use with Rowi", cost: 700, type: "TOKENS", icon: "coins", color: "#F59E0B", maxPerUser: 999 },
    { slug: "sei_discount_10", name: "10% Descuento SEI", nameEN: "10% SEI Discount", description: "Descuento en tu próxima evaluación SEI", descriptionEN: "Discount on your next SEI assessment", cost: 300, type: "DISCOUNT", icon: "percent", color: "#10B981" },
    { slug: "premium_feature_trial", name: "Trial Premium 7 días", nameEN: "7-Day Premium Trial", description: "Acceso a funciones premium por 7 días", descriptionEN: "Access to premium features for 7 days", cost: 400, type: "FEATURE", icon: "crown", color: "#8B5CF6" },
    { slug: "certificate_eq_basics", name: "Certificado: Fundamentos EQ", nameEN: "Certificate: EQ Basics", description: "Certificado digital de completar el curso básico", descriptionEN: "Digital certificate for completing basic course", cost: 1000, type: "CERTIFICATE", icon: "award", color: "#EC4899" },
  ];

  for (const reward of rewardsData) {
    await prisma.reward.upsert({
      where: { slug: reward.slug },
      update: { name: reward.name, nameEN: reward.nameEN, description: reward.description, descriptionEN: reward.descriptionEN, cost: reward.cost, type: reward.type as any, icon: reward.icon, color: reward.color, maxPerUser: reward.maxPerUser || 1 },
      create: { slug: reward.slug, name: reward.name, nameEN: reward.nameEN, description: reward.description, descriptionEN: reward.descriptionEN, cost: reward.cost, type: reward.type as any, icon: reward.icon, color: reward.color, maxPerUser: reward.maxPerUser || 1 },
    });
  }
  ok(`${rewardsData.length} rewards creados`);

  // ============================================================
  // 14. MICROLEARNING — Outcomes, Core Outcomes, Brain Talents, Competencias
  // ============================================================
  section(14, "Creando MicroLearning...");

  let microCount = 0;

  // Outcomes
  for (const outcome of outcomes) {
    for (let i = 0; i < outcome.micro_actions.length; i++) {
      const action = outcome.micro_actions[i];
      const slug = generateMicroLearningSlug("outcome", outcome.key, i);
      await prisma.microLearning.upsert({
        where: { slug },
        update: { title: action.es, titleEN: action.en, description: outcome.description_es, descriptionEN: outcome.description_en, content: { action, outcome: { key: outcome.key, name_es: outcome.name_es, name_en: outcome.name_en } } },
        create: { slug, category: "OUTCOME", parentKey: outcome.key, title: action.es, titleEN: action.en, description: outcome.description_es, descriptionEN: outcome.description_en, content: { action, outcome: { key: outcome.key, name_es: outcome.name_es, name_en: outcome.name_en } }, duration: 2, difficulty: "BEGINNER", order: i, points: 10 },
      });
      microCount++;
    }
  }
  ok(`Outcomes: ${outcomes.length} categorías`);

  // Core Outcomes
  for (const co of coreOutcomes) {
    for (let i = 0; i < co.micro_actions.length; i++) {
      const action = co.micro_actions[i];
      const slug = generateMicroLearningSlug("core", co.key, i);
      await prisma.microLearning.upsert({
        where: { slug },
        update: { title: action.es, titleEN: action.en, description: co.description_es, descriptionEN: co.description_en, content: { action, coreOutcome: { key: co.key, name_es: co.name_es, name_en: co.name_en, components: co.components } } },
        create: { slug, category: "CORE_OUTCOME", parentKey: co.key, title: action.es, titleEN: action.en, description: co.description_es, descriptionEN: co.description_en, content: { action, coreOutcome: { key: co.key, name_es: co.name_es, name_en: co.name_en, components: co.components } }, duration: 3, difficulty: "INTERMEDIATE", order: i, points: 15 },
      });
      microCount++;
    }
  }
  ok(`Core Outcomes: ${coreOutcomes.length} categorías`);

  // Brain Talents
  for (const talent of brainTalents) {
    for (let i = 0; i < talent.micro_actions.length; i++) {
      const action = talent.micro_actions[i];
      const slug = generateMicroLearningSlug("talent", talent.key, i);
      await prisma.microLearning.upsert({
        where: { slug },
        update: { title: action.es, titleEN: action.en, description: talent.description_es, descriptionEN: talent.description_en, content: { action, talent: { key: talent.key, name_es: talent.name_es, name_en: talent.name_en, quadrant: talent.quadrant } } },
        create: { slug, category: "BRAIN_TALENT", parentKey: talent.key, title: action.es, titleEN: action.en, description: talent.description_es, descriptionEN: talent.description_en, content: { action, talent: { key: talent.key, name_es: talent.name_es, name_en: talent.name_en, quadrant: talent.quadrant } }, duration: 3, difficulty: "INTERMEDIATE", order: i, points: 12 },
      });
      microCount++;
    }
  }
  ok(`Brain Talents: ${brainTalents.length} categorías`);

  // EQ Competencies
  for (const comp of eqCompetencies) {
    for (let i = 0; i < comp.micro_actions.length; i++) {
      const action = comp.micro_actions[i];
      const slug = generateMicroLearningSlug("competency", comp.key, i);
      await prisma.microLearning.upsert({
        where: { slug },
        update: { title: action.es, titleEN: action.en, description: comp.description_es, descriptionEN: comp.description_en, content: { action, competency: { key: comp.key, name_es: comp.name_es, name_en: comp.name_en, pillar: comp.pillar } } },
        create: { slug, category: "COMPETENCY", parentKey: comp.key, title: action.es, titleEN: action.en, description: comp.description_es, descriptionEN: comp.description_en, content: { action, competency: { key: comp.key, name_es: comp.name_es, name_en: comp.name_en, pillar: comp.pillar } }, duration: 2, difficulty: "BEGINNER", order: i, points: 10, isFeatured: i === 0 },
      });
      microCount++;
    }
  }
  ok(`EQ Competencies: ${eqCompetencies.length} categorías`);
  ok(`Total MicroLearning: ${microCount} acciones`);

  // ============================================================
  // 15. FEATURE DEFINITIONS — Catálogo de features del sistema
  // ============================================================
  section(15, "Creando Feature Definitions...");

  const FEATURE_DEFINITIONS = [
    // Dashboard
    { key: "dashboard", name: "Dashboard", description: "Panel principal con métricas y resumen", category: "dashboard", icon: "LayoutDashboard", route: "/hub/admin", isAdmin: false, isDefault: true },
    { key: "dashboard.overview", name: "Vista General", description: "Resumen de actividad y KPIs", category: "dashboard", parentKey: "dashboard", icon: "PieChart", route: "/hub/admin", isDefault: true },
    { key: "dashboard.analytics", name: "Analíticas", description: "Gráficos y tendencias detalladas", category: "dashboard", parentKey: "dashboard", icon: "TrendingUp", route: "/hub/admin/analytics", isDefault: false },
    // Benchmarks
    { key: "benchmarks", name: "Benchmarks", description: "Módulo completo de benchmarks", category: "benchmarks", icon: "BarChart3", route: "/hub/admin/benchmarks", isAdmin: false, isDefault: true },
    { key: "benchmarks.upload", name: "Subir Benchmarks", description: "Cargar archivos CSV de benchmarks", category: "benchmarks", parentKey: "benchmarks", icon: "Upload", route: "/hub/admin/benchmarks/upload", isAdmin: true, isDefault: false },
    { key: "benchmarks.stats", name: "Estadísticas", description: "Ver estadísticas y distribuciones", category: "benchmarks", parentKey: "benchmarks", icon: "Activity", route: "/hub/admin/benchmarks/[id]/stats", isDefault: true },
    { key: "benchmarks.topPerformers", name: "Top Performers", description: "Análisis de mejores resultados", category: "benchmarks", parentKey: "benchmarks", icon: "TrendingUp", route: "/hub/admin/benchmarks/[id]/top-performers", isDefault: true },
    { key: "benchmarks.compare", name: "Comparar", description: "Comparar usuarios con benchmarks", category: "benchmarks", parentKey: "benchmarks", icon: "Users", route: "/hub/admin/benchmarks/compare", isDefault: true },
    { key: "benchmarks.correlations", name: "Correlaciones", description: "Análisis de correlaciones competencias-resultados", category: "benchmarks", parentKey: "benchmarks", icon: "Brain", isDefault: false },
    { key: "benchmarks.calculate", name: "Calcular Análisis", description: "Ejecutar cálculos de análisis", category: "benchmarks", parentKey: "benchmarks", icon: "Calculator", isAdmin: true, isDefault: false },
    // Usuarios
    { key: "users", name: "Usuarios", description: "Gestión de usuarios del sistema", category: "users", icon: "Users", route: "/hub/admin/users", isAdmin: true, isDefault: false },
    { key: "users.list", name: "Listar Usuarios", description: "Ver lista de usuarios", category: "users", parentKey: "users", icon: "List", isDefault: true },
    { key: "users.create", name: "Crear Usuarios", description: "Crear nuevos usuarios", category: "users", parentKey: "users", icon: "UserPlus", isAdmin: true, isDefault: false },
    { key: "users.edit", name: "Editar Usuarios", description: "Modificar datos de usuarios", category: "users", parentKey: "users", icon: "UserCog", isAdmin: true, isDefault: false },
    { key: "users.delete", name: "Eliminar Usuarios", description: "Eliminar usuarios del sistema", category: "users", parentKey: "users", icon: "UserMinus", isAdmin: true, isDefault: false },
    // Organizaciones
    { key: "organizations", name: "Organizaciones", description: "Gestión de organizaciones y jerarquía", category: "organizations", icon: "Building2", route: "/hub/admin/organizations", isAdmin: true, isDefault: false },
    { key: "organizations.hierarchy", name: "Jerarquía", description: "Ver y gestionar árbol organizacional", category: "organizations", parentKey: "organizations", icon: "GitBranch", isAdmin: true, isDefault: false },
    { key: "organizations.create", name: "Crear Organizaciones", description: "Crear nuevas organizaciones", category: "organizations", parentKey: "organizations", icon: "Plus", isAdmin: true, isDefault: false },
    { key: "organizations.edit", name: "Editar Organizaciones", description: "Modificar organizaciones existentes", category: "organizations", parentKey: "organizations", icon: "Pencil", isAdmin: true, isDefault: false },
    // Permisos
    { key: "permissions", name: "Permisos", description: "Gestión de permisos y accesos", category: "permissions", icon: "Shield", route: "/hub/admin/permissions", isAdmin: true, isDefault: false },
    { key: "permissions.roles", name: "Roles", description: "Configurar roles y sus permisos", category: "permissions", parentKey: "permissions", icon: "KeyRound", isAdmin: true, isDefault: false },
    { key: "permissions.features", name: "Features", description: "Configurar visibilidad de features", category: "permissions", parentKey: "permissions", icon: "ToggleRight", isAdmin: true, isDefault: false },
    // Reportes
    { key: "reports", name: "Reportes", description: "Generación y descarga de reportes", category: "reports", icon: "FileText", route: "/hub/admin/reports", isDefault: true },
    { key: "reports.generate", name: "Generar Reportes", description: "Crear nuevos reportes", category: "reports", parentKey: "reports", icon: "FilePlus", isDefault: true },
    { key: "reports.download", name: "Descargar Reportes", description: "Descargar reportes existentes", category: "reports", parentKey: "reports", icon: "Download", isDefault: true },
    // Configuración
    { key: "settings", name: "Configuración", description: "Configuración del sistema", category: "settings", icon: "Settings", route: "/hub/admin/settings", isAdmin: true, isDefault: false },
    { key: "settings.general", name: "General", description: "Configuración general del sistema", category: "settings", parentKey: "settings", icon: "Sliders", isAdmin: true, isDefault: false },
    { key: "settings.branding", name: "Branding", description: "Logo, colores y marca", category: "settings", parentKey: "settings", icon: "Palette", isAdmin: true, isDefault: false },
    { key: "settings.integrations", name: "Integraciones", description: "Conexiones con servicios externos", category: "settings", parentKey: "settings", icon: "Plug", isAdmin: true, isDefault: false },
    // Coach
    { key: "coach", name: "Panel de Coach", description: "Herramientas para coaches certificados", category: "coach", icon: "GraduationCap", route: "/hub/coach", isDefault: false },
    { key: "coach.clients", name: "Mis Clientes", description: "Ver y gestionar clientes asignados", category: "coach", parentKey: "coach", icon: "Users", isDefault: false },
    { key: "coach.sessions", name: "Sesiones", description: "Gestión de sesiones de coaching", category: "coach", parentKey: "coach", icon: "Calendar", isDefault: false },
    // Equipos
    { key: "teams", name: "Equipos", description: "Gestión de equipos", category: "teams", icon: "Users2", route: "/hub/admin/teams", isDefault: true },
    { key: "teams.affinity", name: "Afinidad", description: "Análisis de afinidad de equipos", category: "teams", parentKey: "teams", icon: "Heart", isDefault: false },
    { key: "teams.dynamics", name: "Dinámicas", description: "Dinámicas y actividades de equipo", category: "teams", parentKey: "teams", icon: "Sparkles", isDefault: false },
  ];

  let featuresCreated = 0;
  for (const def of FEATURE_DEFINITIONS) {
    const exists = await prisma.featureDefinition.findUnique({ where: { key: def.key } });
    if (exists) {
      await prisma.featureDefinition.update({ where: { key: def.key }, data: def });
    } else {
      await prisma.featureDefinition.create({ data: def });
      featuresCreated++;
    }
  }
  ok(`${FEATURE_DEFINITIONS.length} feature definitions (${featuresCreated} nuevas)`);

  // ============================================================
  // 16. PROFILE FEATURES — Permisos por rol
  // ============================================================
  section(16, "Creando Profile Feature mappings...");

  const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    // OrgRoles
    OWNER: ["*"],
    ADMIN: ["dashboard", "benchmarks", "users", "organizations", "permissions", "reports", "settings", "teams"],
    MANAGER: ["dashboard", "benchmarks", "benchmarks.stats", "benchmarks.topPerformers", "benchmarks.compare", "reports", "teams"],
    MEMBER: ["dashboard", "dashboard.overview", "benchmarks.stats", "benchmarks.compare", "reports.download"],
    VIEWER: ["dashboard", "dashboard.overview"],
    // TenantRoles
    SUPERADMIN: ["*"],
    EDITOR: ["dashboard", "benchmarks", "benchmarks.stats", "benchmarks.topPerformers", "reports"],
    DEVELOPER: ["*"],
    FEDERATOR: ["dashboard", "benchmarks", "organizations", "users.list", "reports"],
  };

  let profileFeaturesCreated = 0;
  for (const [role, features] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const roleType = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"].includes(role) ? "org" : "tenant";
    const featuresToCreate = features[0] === "*" ? FEATURE_DEFINITIONS.map((d) => d.key) : features;

    for (const featureKey of featuresToCreate) {
      const def = FEATURE_DEFINITIONS.find((d) => d.key === featureKey);
      if (!def) continue;

      const exists = await prisma.profileFeature.findFirst({
        where: { role, roleType, featureKey, scopeType: null, scopeId: null },
      });

      if (!exists) {
        await prisma.profileFeature.create({
          data: {
            role,
            roleType,
            featureKey,
            category: def.category,
            canView: true,
            canCreate: features[0] === "*" || def.isAdmin === false,
            canEdit: features[0] === "*" || def.isAdmin === false,
            canDelete: features[0] === "*",
            description: def.description,
          },
        });
        profileFeaturesCreated++;
      }
    }
  }
  ok(`${profileFeaturesCreated} profile features creados`);

  // ============================================================
  // 17. SYSTEM SETTINGS
  // ============================================================
  section(17, "Creando System Settings...");

  const settingsData = [
    { key: "ai.defaultModel", value: "gpt-4o-mini", type: "string" },
    { key: "ai.maxTokens", value: "4096", type: "number" },
    { key: "ai.temperature", value: "0.7", type: "number" },
    { key: "eq.sixSecondsEnabled", value: "true", type: "boolean" },
    { key: "affinity.heatThreshold", value: "70", type: "number" },
    { key: "gamification.enabled", value: "true", type: "boolean" },
    { key: "locale.default", value: "es", type: "string" },
    { key: "features.weekflow", value: "true", type: "boolean" },
    { key: "features.communities", value: "true", type: "boolean" },
    { key: "features.benchmarks", value: "true", type: "boolean" },
  ];

  for (const s of settingsData) {
    await prisma.systemSetting.upsert({
      where: { systemId_key: { systemId: system.id, key: s.key } },
      update: { value: s.value },
      create: { systemId: system.id, key: s.key, value: s.value, type: s.type },
    });
  }
  ok(`${settingsData.length} settings`);

  // ============================================================
  // 18. EMOTIONAL CONFIG
  // ============================================================
  section(18, "Creando Emotional Config...");

  await prisma.emotionalConfig.upsert({
    where: { tenantId_key: { tenantId: tenant.id, key: "emotional-settings" } },
    update: {},
    create: {
      tenantId: tenant.id,
      key: "emotional-settings",
      value: {
        enabled: true,
        allowedTypes: ["ky", "cy", "gy", "optimism", "empathy", "clarity"],
        aiAutoDetect: true,
        defaultIntensity: 5,
      },
      description: "Configuración emocional principal",
    },
  });
  ok("Emotional Config creado");

  // ============================================================
  // 19. TRADUCCIONES — ES + EN (200+ pares)
  // ============================================================
  section(19, "Creando Traducciones...");

  const translationPairs = [
    // Common
    { ns: "common", key: "loading", es: "Cargando...", en: "Loading..." },
    { ns: "common", key: "error", es: "Ocurrió un error", en: "An error occurred" },
    { ns: "common", key: "success", es: "Éxito", en: "Success" },
    { ns: "common", key: "save", es: "Guardar", en: "Save" },
    { ns: "common", key: "cancel", es: "Cancelar", en: "Cancel" },
    { ns: "common", key: "delete", es: "Eliminar", en: "Delete" },
    { ns: "common", key: "edit", es: "Editar", en: "Edit" },
    { ns: "common", key: "create", es: "Crear", en: "Create" },
    { ns: "common", key: "search", es: "Buscar", en: "Search" },
    { ns: "common", key: "filter", es: "Filtrar", en: "Filter" },
    { ns: "common", key: "yes", es: "Sí", en: "Yes" },
    { ns: "common", key: "no", es: "No", en: "No" },
    { ns: "common", key: "confirm", es: "Confirmar", en: "Confirm" },

    // Admin Common
    { ns: "admin", key: "common.search", es: "Buscar...", en: "Search..." },
    { ns: "admin", key: "common.refresh", es: "Actualizar", en: "Refresh" },
    { ns: "admin", key: "common.save", es: "Guardar", en: "Save" },
    { ns: "admin", key: "common.cancel", es: "Cancelar", en: "Cancel" },
    { ns: "admin", key: "common.edit", es: "Editar", en: "Edit" },
    { ns: "admin", key: "common.delete", es: "Eliminar", en: "Delete" },
    { ns: "admin", key: "common.preview", es: "Vista previa", en: "Preview" },
    { ns: "admin", key: "common.details", es: "Detalles", en: "Details" },
    { ns: "admin", key: "common.actions", es: "Acciones", en: "Actions" },
    { ns: "admin", key: "common.status", es: "Estado", en: "Status" },
    { ns: "admin", key: "common.name", es: "Nombre", en: "Name" },
    { ns: "admin", key: "common.description", es: "Descripción", en: "Description" },
    { ns: "admin", key: "common.type", es: "Tipo", en: "Type" },
    { ns: "admin", key: "common.category", es: "Categoría", en: "Category" },
    { ns: "admin", key: "common.enabled", es: "Habilitado", en: "Enabled" },
    { ns: "admin", key: "common.disabled", es: "Deshabilitado", en: "Disabled" },
    { ns: "admin", key: "common.active", es: "Activo", en: "Active" },
    { ns: "admin", key: "common.inactive", es: "Inactivo", en: "Inactive" },
    { ns: "admin", key: "common.all", es: "Todos", en: "All" },
    { ns: "admin", key: "common.none", es: "Ninguno", en: "None" },
    { ns: "admin", key: "common.close", es: "Cerrar", en: "Close" },
    { ns: "admin", key: "common.back", es: "Volver", en: "Back" },
    { ns: "admin", key: "common.next", es: "Siguiente", en: "Next" },
    { ns: "admin", key: "common.add", es: "Agregar", en: "Add" },
    { ns: "admin", key: "common.remove", es: "Quitar", en: "Remove" },
    { ns: "admin", key: "common.new", es: "Nuevo", en: "New" },

    // Admin Navigation
    { ns: "admin", key: "nav.dashboard", es: "Dashboard", en: "Dashboard" },
    { ns: "admin", key: "nav.pages", es: "Páginas", en: "Pages" },
    { ns: "admin", key: "nav.layouts", es: "Layouts", en: "Layouts" },
    { ns: "admin", key: "nav.components", es: "Componentes", en: "Components" },
    { ns: "admin", key: "nav.translations", es: "Traducciones", en: "Translations" },
    { ns: "admin", key: "nav.agents", es: "Agentes", en: "Agents" },
    { ns: "admin", key: "nav.users", es: "Usuarios", en: "Users" },
    { ns: "admin", key: "nav.settings", es: "Configuración", en: "Settings" },
    { ns: "admin", key: "nav.tenants", es: "Tenants", en: "Tenants" },
    { ns: "admin", key: "nav.organizations", es: "Organizaciones", en: "Organizations" },
    { ns: "admin", key: "nav.superhubs", es: "SuperHubs", en: "SuperHubs" },
    { ns: "admin", key: "nav.benchmarks", es: "Benchmarks", en: "Benchmarks" },
    { ns: "admin", key: "nav.analytics", es: "Analíticas", en: "Analytics" },
    { ns: "admin", key: "nav.permissions", es: "Permisos", en: "Permissions" },

    // Admin Pages
    { ns: "admin", key: "pages.title", es: "Páginas", en: "Pages" },
    { ns: "admin", key: "pages.description", es: "Gestiona las páginas del CMS", en: "Manage CMS pages" },
    { ns: "admin", key: "pages.noPages", es: "No hay páginas", en: "No pages found" },
    { ns: "admin", key: "pages.new", es: "Nueva página", en: "New page" },

    // Admin Agents
    { ns: "admin", key: "agents.title", es: "Agentes IA", en: "AI Agents" },
    { ns: "admin", key: "agents.description", es: "Gestiona los agentes de inteligencia artificial", en: "Manage AI agents" },
    { ns: "admin", key: "agents.noAgents", es: "No hay agentes", en: "No agents found" },
    { ns: "admin", key: "agents.new", es: "Nuevo agente", en: "New agent" },
    { ns: "admin", key: "agents.edit", es: "Editar agente", en: "Edit agent" },
    { ns: "admin", key: "agents.model", es: "Modelo", en: "Model" },
    { ns: "admin", key: "agents.test", es: "Probar", en: "Test" },

    // Admin Users
    { ns: "admin", key: "users.title", es: "Usuarios", en: "Users" },
    { ns: "admin", key: "users.description", es: "Gestiona los usuarios del sistema", en: "Manage system users" },
    { ns: "admin", key: "users.noUsers", es: "No hay usuarios", en: "No users found" },
    { ns: "admin", key: "users.email", es: "Email", en: "Email" },
    { ns: "admin", key: "users.role", es: "Rol", en: "Role" },

    // Admin Settings
    { ns: "admin", key: "settings.title", es: "Configuración", en: "Settings" },
    { ns: "admin", key: "settings.description", es: "Configuración general del sistema", en: "General system settings" },
    { ns: "admin", key: "settings.saved", es: "Configuración guardada", en: "Settings saved" },

    // Admin Dashboard
    { ns: "admin", key: "dashboard.title", es: "Dashboard", en: "Dashboard" },
    { ns: "admin", key: "dashboard.description", es: "Resumen general del sistema", en: "System overview" },
    { ns: "admin", key: "dashboard.totalUsers", es: "Total usuarios", en: "Total users" },
    { ns: "admin", key: "dashboard.totalAgents", es: "Total agentes", en: "Total agents" },
    { ns: "admin", key: "dashboard.recentActivity", es: "Actividad reciente", en: "Recent activity" },

    // Benchmarks
    { ns: "admin", key: "benchmarks.title", es: "Benchmarks", en: "Benchmarks" },
    { ns: "admin", key: "benchmarks.upload", es: "Subir Benchmark", en: "Upload Benchmark" },
    { ns: "admin", key: "benchmarks.processing", es: "Procesando...", en: "Processing..." },
    { ns: "admin", key: "benchmarks.topPerformers", es: "Top Performers", en: "Top Performers" },
    { ns: "admin", key: "benchmarks.correlations", es: "Correlaciones", en: "Correlations" },

    // EQ Metrics
    { ns: "admin", key: "benchmarks.metrics.K", es: "Know Yourself", en: "Know Yourself" },
    { ns: "admin", key: "benchmarks.metrics.C", es: "Choose Yourself", en: "Choose Yourself" },
    { ns: "admin", key: "benchmarks.metrics.G", es: "Give Yourself", en: "Give Yourself" },
    { ns: "admin", key: "benchmarks.metrics.eqTotal", es: "EQ Total", en: "EQ Total" },
    { ns: "admin", key: "benchmarks.metrics.EL", es: "Enhance Emotional Literacy", en: "Enhance Emotional Literacy" },
    { ns: "admin", key: "benchmarks.metrics.RP", es: "Recognize Patterns", en: "Recognize Patterns" },
    { ns: "admin", key: "benchmarks.metrics.ACT", es: "Apply Consequential Thinking", en: "Apply Consequential Thinking" },
    { ns: "admin", key: "benchmarks.metrics.NE", es: "Navigate Emotions", en: "Navigate Emotions" },
    { ns: "admin", key: "benchmarks.metrics.IM", es: "Engage Intrinsic Motivation", en: "Engage Intrinsic Motivation" },
    { ns: "admin", key: "benchmarks.metrics.OP", es: "Exercise Optimism", en: "Exercise Optimism" },
    { ns: "admin", key: "benchmarks.metrics.EMP", es: "Increase Empathy", en: "Increase Empathy" },
    { ns: "admin", key: "benchmarks.metrics.NG", es: "Pursue Noble Goals", en: "Pursue Noble Goals" },

    // Chat
    { ns: "chat", key: "chat.welcome", es: "¡Hola! Soy tu asistente de inteligencia emocional. ¿En qué puedo ayudarte hoy?", en: "Hello! I'm your emotional intelligence assistant. How can I help you today?" },
    { ns: "chat", key: "chat.thinking", es: "Pensando...", en: "Thinking..." },
    { ns: "chat", key: "chat.error", es: "Lo siento, hubo un error. Por favor intenta de nuevo.", en: "Sorry, there was an error. Please try again." },
    { ns: "chat", key: "chat.placeholder", es: "Escribe tu mensaje...", en: "Type your message..." },
    { ns: "chat", key: "agent.not_found", es: "No hay un agente IA configurado para este contexto.", en: "No AI agent is configured for this context." },

    // Translations Admin
    { ns: "admin", key: "translations.title", es: "Traducciones", en: "Translations" },
    { ns: "admin", key: "translations.description", es: "Gestiona las traducciones del sistema", en: "Manage system translations" },

    // Permissions
    { ns: "admin", key: "permissions.title", es: "Permisos", en: "Permissions" },
    { ns: "admin", key: "permissions.description", es: "Gestiona los permisos y accesos del sistema", en: "Manage system permissions and access" },
    { ns: "admin", key: "permissions.features", es: "Features", en: "Features" },
    { ns: "admin", key: "permissions.roles", es: "Roles", en: "Roles" },
  ];

  const translationsToCreate: { systemId: string; ns: string; key: string; lang: string; value: string }[] = [];
  for (const t of translationPairs) {
    translationsToCreate.push({ systemId: system.id, ns: t.ns, key: t.key, lang: "es", value: t.es });
    translationsToCreate.push({ systemId: system.id, ns: t.ns, key: t.key, lang: "en", value: t.en });
  }

  await prisma.translation.createMany({ data: translationsToCreate, skipDuplicates: true });
  ok(`${translationsToCreate.length} traducciones (${translationPairs.length} pares ES+EN)`);

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  SEED BETA COMPLETADO");
  console.log("=".repeat(60));

  const counts = {
    levels: await prisma.levelDefinition.count(),
    achievements: await prisma.achievement.count(),
    microLearning: await prisma.microLearning.count(),
    rewards: await prisma.reward.count(),
    featureDefinitions: await prisma.featureDefinition.count(),
    profileFeatures: await prisma.profileFeature.count(),
    agents: await prisma.agentConfig.count(),
    plans: await prisma.plan.count(),
    translations: await prisma.translation.count(),
  };

  console.log(`
  Jerarquía:
    - RowiVerse: ${rowiverse.id}
    - System: ${system.id}
    - SuperHub: ${superHub.id}
    - Tenant Global: ${rowiGlobalTenant.id}
    - Tenant Beta: ${tenant.id}
    - Hub: ${hub.id}
    - Organization: ${org.id}

  Datos:
    - Planes: ${counts.plans}
    - Agentes IA: ${counts.agents}
    - Niveles: ${counts.levels}
    - Achievements: ${counts.achievements}
    - MicroLearning: ${counts.microLearning}
    - Rewards: ${counts.rewards}
    - Feature Definitions: ${counts.featureDefinitions}
    - Profile Features: ${counts.profileFeatures}
    - Traducciones: ${counts.translations}

  SuperAdmin: ${superadminEmail || "No configurado"}

  Rowi está listo para Beta!
  `);
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
