// prisma/seed-minimal.ts
// ============================================================
// ROWI - Seed Mínimo para Reset Limpio
// ============================================================
// Estructura:
// - RowiVerse (sistema global)
// - Six Seconds (primer cliente)
// - Eduardo, Josh como admins
// - 6 Planes completos
// - Permisos jerárquicos
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI - SEED MÍNIMO CON PLANES Y PERMISOS");
  console.log("=".repeat(60));
  console.log("\n");

  // ============================================================
  // 1. ROWIVERSE - Raíz global del ecosistema
  // ============================================================
  console.log("1. Creando RowiVerse...");

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
  console.log("   ✅ RowiVerse:", rowiverse.id);

  // ============================================================
  // 2. SYSTEM - Núcleo del sistema
  // ============================================================
  console.log("\n2. Creando System...");

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
  console.log("   ✅ System:", system.id);

  // ============================================================
  // 3. PLANES ROWI - 6 Planes Completos
  // ============================================================
  console.log("\n3. Creando Planes ROWI...");

  const plansData = [
    // 1. FREE ROWI
    {
      name: "Free ROWI",
      slug: "free",
      description: "Comienza tu viaje de inteligencia emocional. Ideal para explorar Rowi.",
      descriptionEN: "Start your emotional intelligence journey. Ideal to explore Rowi.",
      priceUsd: 0,
      priceCents: 0,
      priceYearlyUsd: 0,
      priceYearlyCents: 0,
      billingPeriod: "monthly",
      tokensMonthly: 10,
      tokensShared: false,
      tokensPerUser: true,
      maxUsers: 1,
      minUsers: 1,
      planType: "individual",
      targetAudience: "B2C",
      aiEnabled: true,
      superRowiAccess: true,
      rowiEQAccess: true,
      rowiAffinityAccess: false,
      rowiECOAccess: false,
      rowiTrainerAccess: false,
      rowiSalesAccess: false,
      seiIncluded: false,
      seiAnnual: false,
      brainBriefIncluded: false,
      seiDiscountPercent: 0,
      maxCommunities: 1,
      maxMembers: 5,
      privateGroups: false,
      benchmarkAccess: false,
      advancedReports: false,
      executiveDashboard: false,
      benchmarkingSectorial: false,
      apiAccess: false,
      slackIntegration: false,
      teamsIntegration: false,
      gmailIntegration: false,
      supportLevel: "community",
      customOnboarding: false,
      workshopIncludes: false,
      emoji: "🆓",
      color: "#6B7280",
      icon: "Sparkles",
      sortOrder: 1,
      isPublic: true,
      isActive: true,
      isCustomPricing: false,
      features: ["10 tokens IA / mes", "Acceso a Rowi EQ básico", "1 comunidad", "Soporte comunitario"],
      featuresEN: ["10 AI tokens / month", "Basic Rowi EQ access", "1 community", "Community support"],
      limitations: ["Sin SEI incluido", "Sin grupos privados", "Sin reportes avanzados"],
      limitationsEN: ["SEI not included", "No private groups", "No advanced reports"],
    },

    // 2. ROWI+
    {
      name: "ROWI+",
      slug: "plus",
      description: "Para tu crecimiento personal. Todo lo que necesitas para desarrollar tu inteligencia emocional.",
      descriptionEN: "For your personal growth. Everything you need to develop your emotional intelligence.",
      priceUsd: 12,
      priceCents: 1200,
      priceYearlyUsd: 120,
      priceYearlyCents: 12000,
      billingPeriod: "monthly",
      tokensMonthly: 150,
      tokensShared: false,
      tokensPerUser: true,
      maxUsers: 1,
      minUsers: 1,
      planType: "individual",
      targetAudience: "B2C",
      aiEnabled: true,
      superRowiAccess: true,
      rowiEQAccess: true,
      rowiAffinityAccess: true,
      rowiECOAccess: true,
      rowiTrainerAccess: true,
      rowiSalesAccess: false,
      seiIncluded: false,
      seiAnnual: false,
      brainBriefIncluded: true,
      seiDiscountPercent: 20,
      maxCommunities: 3,
      maxMembers: 20,
      privateGroups: true,
      benchmarkAccess: false,
      advancedReports: true,
      executiveDashboard: false,
      benchmarkingSectorial: false,
      apiAccess: false,
      slackIntegration: false,
      teamsIntegration: false,
      gmailIntegration: false,
      supportLevel: "email",
      customOnboarding: false,
      workshopIncludes: false,
      badge: "Popular",
      badgeEN: "Popular",
      emoji: "⭐",
      color: "#3B82F6",
      icon: "Star",
      sortOrder: 2,
      isPublic: true,
      isActive: true,
      isCustomPricing: false,
      features: [
        "150 tokens IA / mes",
        "Todos los agentes Rowi",
        "Brain Brief Profile incluido",
        "20% descuento en SEI",
        "Hasta 3 comunidades",
        "Grupos privados",
        "Reportes avanzados",
        "Soporte por email",
      ],
      featuresEN: [
        "150 AI tokens / month",
        "All Rowi agents",
        "Brain Brief Profile included",
        "20% discount on SEI",
        "Up to 3 communities",
        "Private groups",
        "Advanced reports",
        "Email support",
      ],
      limitations: ["Sin benchmarks", "Sin integraciones", "Sin dashboard ejecutivo"],
      limitationsEN: ["No benchmarks", "No integrations", "No executive dashboard"],
    },

    // 3. ROWI Family
    {
      name: "ROWI Family",
      slug: "family",
      description: "Inteligencia emocional para toda la familia. Comparte tokens y crece juntos.",
      descriptionEN: "Emotional intelligence for the whole family. Share tokens and grow together.",
      priceUsd: 40,
      priceCents: 4000,
      priceYearlyUsd: 400,
      priceYearlyCents: 40000,
      billingPeriod: "monthly",
      tokensMonthly: 500,
      tokensShared: true,
      tokensPerUser: false,
      maxUsers: 6,
      minUsers: 2,
      allowFamilyMembers: true,
      planType: "family",
      targetAudience: "B2C",
      aiEnabled: true,
      superRowiAccess: true,
      rowiEQAccess: true,
      rowiAffinityAccess: true,
      rowiECOAccess: true,
      rowiTrainerAccess: true,
      rowiSalesAccess: false,
      seiIncluded: false,
      seiAnnual: false,
      brainBriefIncluded: true,
      seiDiscountPercent: 30,
      maxCommunities: 5,
      maxMembers: 30,
      privateGroups: true,
      benchmarkAccess: true,
      advancedReports: true,
      executiveDashboard: false,
      benchmarkingSectorial: false,
      apiAccess: false,
      slackIntegration: false,
      teamsIntegration: false,
      gmailIntegration: false,
      supportLevel: "chat",
      customOnboarding: false,
      workshopIncludes: false,
      badge: "Familias",
      badgeEN: "Families",
      emoji: "👨‍👩‍👧‍👦",
      color: "#8B5CF6",
      icon: "Users",
      sortOrder: 3,
      isPublic: true,
      isActive: true,
      isCustomPricing: false,
      features: [
        "500 tokens IA compartidos / mes",
        "Hasta 6 miembros familiares",
        "Todos los agentes Rowi",
        "Brain Brief para todos",
        "30% descuento en SEI",
        "Benchmarks familiares",
        "Dashboard familiar",
        "Soporte por chat",
      ],
      featuresEN: [
        "500 shared AI tokens / month",
        "Up to 6 family members",
        "All Rowi agents",
        "Brain Brief for everyone",
        "30% discount on SEI",
        "Family benchmarks",
        "Family dashboard",
        "Chat support",
      ],
      limitations: ["Sin integraciones empresariales", "Sin API"],
      limitationsEN: ["No enterprise integrations", "No API"],
    },

    // 4. ROWI Pro
    {
      name: "ROWI Pro",
      slug: "pro",
      description: "Para profesionales y coaches. Herramientas avanzadas para tu práctica.",
      descriptionEN: "For professionals and coaches. Advanced tools for your practice.",
      priceUsd: 25,
      priceCents: 2500,
      priceYearlyUsd: 250,
      priceYearlyCents: 25000,
      billingPeriod: "monthly",
      pricePerUserMonthly: 25,
      pricePerUserYearly: 250,
      tokensMonthly: 500,
      tokensShared: false,
      tokensPerUser: true,
      maxUsers: 50,
      minUsers: 1,
      planType: "team",
      targetAudience: "B2C/B2B",
      aiEnabled: true,
      superRowiAccess: true,
      rowiEQAccess: true,
      rowiAffinityAccess: true,
      rowiECOAccess: true,
      rowiTrainerAccess: true,
      rowiSalesAccess: true,
      seiIncluded: true,
      seiAnnual: true,
      brainBriefIncluded: true,
      seiDiscountPercent: 50,
      maxCommunities: 10,
      maxMembers: 100,
      privateGroups: true,
      benchmarkAccess: true,
      advancedReports: true,
      executiveDashboard: true,
      benchmarkingSectorial: false,
      apiAccess: false,
      slackIntegration: false,
      teamsIntegration: false,
      gmailIntegration: false,
      supportLevel: "priority",
      customOnboarding: true,
      workshopIncludes: false,
      badge: "Recomendado",
      badgeEN: "Recommended",
      emoji: "🚀",
      color: "#10B981",
      icon: "Rocket",
      sortOrder: 4,
      isPublic: true,
      isActive: true,
      isCustomPricing: false,
      features: [
        "500 tokens IA / usuario / mes",
        "SEI anual incluido",
        "Todos los agentes + Rowi Sales",
        "50% descuento en SEI adicionales",
        "Dashboard ejecutivo",
        "Hasta 10 comunidades",
        "Reportes avanzados",
        "Onboarding personalizado",
        "Soporte prioritario",
      ],
      featuresEN: [
        "500 AI tokens / user / month",
        "Annual SEI included",
        "All agents + Rowi Sales",
        "50% discount on additional SEI",
        "Executive dashboard",
        "Up to 10 communities",
        "Advanced reports",
        "Custom onboarding",
        "Priority support",
      ],
      limitations: ["Sin API", "Sin integraciones avanzadas"],
      limitationsEN: ["No API", "No advanced integrations"],
    },

    // 5. ROWI Business
    {
      name: "ROWI Business",
      slug: "business",
      description: "Inteligencia emocional para tu organización. Transforma la cultura de tu empresa.",
      descriptionEN: "Emotional intelligence for your organization. Transform your company culture.",
      priceUsd: 5,
      priceCents: 500,
      priceYearlyUsd: 54,
      priceYearlyCents: 5400,
      billingPeriod: "monthly",
      pricePerUserMonthly: 5,
      pricePerUserYearly: 54,
      tokensMonthly: 0,
      tokensOrganization: 1000,
      tokensShared: true,
      tokensPerUser: false,
      maxUsers: 1000,
      minUsers: 20,
      planType: "business",
      targetAudience: "B2B",
      aiEnabled: true,
      superRowiAccess: true,
      rowiEQAccess: true,
      rowiAffinityAccess: true,
      rowiECOAccess: true,
      rowiTrainerAccess: true,
      rowiSalesAccess: true,
      seiIncluded: true,
      seiAnnual: true,
      brainBriefIncluded: true,
      seiDiscountPercent: 70,
      maxCommunities: 50,
      maxMembers: 500,
      privateGroups: true,
      benchmarkAccess: true,
      advancedReports: true,
      executiveDashboard: true,
      benchmarkingSectorial: true,
      apiAccess: true,
      slackIntegration: true,
      teamsIntegration: true,
      gmailIntegration: true,
      supportLevel: "priority",
      customOnboarding: true,
      workshopIncludes: true,
      badge: "Empresas",
      badgeEN: "Business",
      emoji: "🏢",
      color: "#F59E0B",
      icon: "Building2",
      sortOrder: 5,
      isPublic: true,
      isActive: true,
      isCustomPricing: false,
      features: [
        "Desde $5 USD/usuario/mes (mín. 20)",
        "1000 tokens IA compartidos/org/mes",
        "SEI anual para todos",
        "Todos los agentes Rowi",
        "70% descuento en SEI adicionales",
        "API y webhooks",
        "Integraciones: Slack, Teams, Gmail",
        "Dashboard ejecutivo",
        "Benchmarking sectorial",
        "Workshops de adopción",
        "Soporte prioritario",
      ],
      featuresEN: [
        "From $5 USD/user/month (min. 20)",
        "1000 shared AI tokens/org/month",
        "Annual SEI for everyone",
        "All Rowi agents",
        "70% discount on additional SEI",
        "API and webhooks",
        "Integrations: Slack, Teams, Gmail",
        "Executive dashboard",
        "Industry benchmarking",
        "Adoption workshops",
        "Priority support",
      ],
      limitations: ["Mínimo 20 usuarios"],
      limitationsEN: ["Minimum 20 users"],
    },

    // 6. ROWI Enterprise
    {
      name: "ROWI Enterprise",
      slug: "enterprise",
      description: "Solución personalizada para grandes organizaciones. Máximo poder e integración.",
      descriptionEN: "Custom solution for large organizations. Maximum power and integration.",
      priceUsd: 30000,
      priceCents: 3000000,
      priceYearlyUsd: 30000,
      priceYearlyCents: 3000000,
      billingPeriod: "custom",
      pricePerUserMonthly: 0,
      pricePerUserYearly: 0,
      tokensMonthly: 0,
      tokensOrganization: 10000,
      tokensShared: true,
      tokensPerUser: false,
      maxUsers: 999999,
      minUsers: 100,
      planType: "enterprise",
      targetAudience: "B2B",
      aiEnabled: true,
      superRowiAccess: true,
      rowiEQAccess: true,
      rowiAffinityAccess: true,
      rowiECOAccess: true,
      rowiTrainerAccess: true,
      rowiSalesAccess: true,
      seiIncluded: true,
      seiAnnual: true,
      brainBriefIncluded: true,
      seiDiscountPercent: 100,
      maxCommunities: 999,
      maxMembers: 9999,
      privateGroups: true,
      benchmarkAccess: true,
      advancedReports: true,
      executiveDashboard: true,
      benchmarkingSectorial: true,
      apiAccess: true,
      slackIntegration: true,
      teamsIntegration: true,
      gmailIntegration: true,
      supportLevel: "dedicated",
      customOnboarding: true,
      workshopIncludes: true,
      badge: "Enterprise",
      badgeEN: "Enterprise",
      emoji: "☁️",
      color: "#6366F1",
      icon: "Cloud",
      sortOrder: 6,
      isPublic: true,
      isActive: true,
      isCustomPricing: true,
      features: [
        "Precio personalizado (~$30,000 USD/año base)",
        "10,000+ tokens IA dedicados/mes",
        "SEI ilimitado para toda la organización",
        "Todos los agentes Rowi",
        "API dedicada y webhooks",
        "Todas las integraciones",
        "Dashboard ejecutivo+ personalizado",
        "Benchmarking sectorial avanzado",
        "Workshops de adopción e implementación",
        "Custom onboarding y formación",
        "Soporte dedicado 24/7",
        "SLA garantizado",
      ],
      featuresEN: [
        "Custom pricing (~$30,000 USD/year base)",
        "10,000+ dedicated AI tokens/month",
        "Unlimited SEI for entire organization",
        "All Rowi agents",
        "Dedicated API and webhooks",
        "All integrations",
        "Custom executive dashboard+",
        "Advanced industry benchmarking",
        "Adoption and implementation workshops",
        "Custom onboarding and training",
        "Dedicated 24/7 support",
        "Guaranteed SLA",
      ],
      limitations: [],
      limitationsEN: [],
    },
  ];

  const plans: Record<string, any> = {};
  for (const p of plansData) {
    const plan = await prisma.plan.upsert({
      where: { slug: p.slug },
      update: {
        ...p,
        features: p.features,
        featuresEN: p.featuresEN,
        limitations: p.limitations,
        limitationsEN: p.limitationsEN,
      },
      create: {
        ...p,
        features: p.features,
        featuresEN: p.featuresEN,
        limitations: p.limitations,
        limitationsEN: p.limitationsEN,
      },
    });
    plans[p.slug] = plan;
    console.log(`   ${p.emoji} Plan "${p.name}": ${plan.id}`);
  }

  // ============================================================
  // 4. TENANT ROWI GLOBAL - Para usuarios públicos
  // ============================================================
  console.log("\n4. Creando Tenant Rowi Global (para usuarios públicos)...");

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
  console.log("   ✅ Rowi Global Tenant:", rowiGlobalTenant.id);

  // Crear TenantBranding para Rowi Global
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
  console.log("   ✅ Rowi Global Branding creado");

  // ============================================================
  // 5. SUPERHUB - Six Seconds (cliente específico)
  // ============================================================
  console.log("\n5. Creando SuperHub Six Seconds...");

  const superHub = await prisma.superHub.upsert({
    where: { slug: "six-seconds" },
    update: {},
    create: {
      name: "Six Seconds",
      slug: "six-seconds",
      description: "The Emotional Intelligence Network",
      logo: "/six-seconds-logo.png",
      colorTheme: "#E85D04",
      rowiVerseId: rowiverse.id,
      systemId: system.id,
    },
  });
  console.log("   ✅ SuperHub:", superHub.id);

  // ============================================================
  // 6. TENANT - Six Seconds Global (cliente específico)
  // ============================================================
  console.log("\n6. Creando Tenant Six Seconds...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "six-seconds-global" },
    update: {},
    create: {
      name: "Six Seconds Global",
      slug: "six-seconds-global",
      billingEmail: "admin@6seconds.org",
      superHubId: superHub.id,
      systemId: system.id,
      planId: plans["enterprise"].id,
    },
  });
  console.log("   ✅ Tenant:", tenant.id);

  // Crear TenantBranding con configuración visual
  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      logoUrl: "/six-seconds-logo.png",
      primaryColor: "#E85D04",
      backgroundColor: "#1a1a2e",
      textColor: "#ffffff",
      colorK: "#3b82f6", // Know Yourself - Blue
      colorC: "#10b981", // Choose Yourself - Green
      colorG: "#f59e0b", // Give Yourself - Orange
      fontHeading: "Inter",
      fontBody: "Inter",
      defaultTheme: "light",
      isActive: true,
    },
  });
  console.log("   ✅ TenantBranding creado");

  // ============================================================
  // 6. HUB - Six Seconds Hub
  // ============================================================
  console.log("\n6. Creando Hub...");

  const hub = await prisma.hub.upsert({
    where: { slug: "six-seconds-hub" },
    update: {},
    create: {
      name: "Six Seconds Hub",
      slug: "six-seconds-hub",
      description: "Hub principal de Six Seconds",
      superHubId: superHub.id,
      tenantId: tenant.id,
    },
  });
  console.log("   ✅ Hub:", hub.id);

  // ============================================================
  // 7. ORGANIZATION - Six Seconds Org
  // ============================================================
  console.log("\n7. Creando Organization...");

  const org = await prisma.organization.upsert({
    where: { slug: "six-seconds-org" },
    update: {},
    create: {
      name: "Six Seconds Organization",
      slug: "six-seconds-org",
      description: "Organización principal de Six Seconds",
      hubId: hub.id,
      unitType: "CLIENT",
    },
  });
  console.log("   ✅ Organization:", org.id);

  // Vincular Organization con Tenant
  await prisma.organizationToTenant.upsert({
    where: {
      tenantId_organizationId: {
        tenantId: tenant.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      organizationId: org.id,
    },
  });

  // ============================================================
  // 8. USUARIOS - Eduardo (Superadmin), Josh, Eduardo 6S
  // ============================================================
  console.log("\n8. Creando Usuarios...");

  // Eduardo - Superadmin Principal
  const eduardo = await prisma.user.upsert({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
    update: {
      organizationRole: "SUPERADMIN",
      primaryTenantId: tenant.id,
      planId: plans["enterprise"].id,
      active: true,
      allowAI: true,
    },
    create: {
      name: "Eduardo Gonzalez",
      email: "eduardo@cactuscomunidadcreativa.com",
      organizationRole: "SUPERADMIN",
      primaryTenantId: tenant.id,
      planId: plans["enterprise"].id,
      active: true,
      allowAI: true,
      language: "es",
      country: "PE",
    },
  });
  console.log("   ✅ Eduardo (Superadmin):", eduardo.id);

  // Eduardo 6S - Admin Six Seconds
  const eduardo6s = await prisma.user.upsert({
    where: { email: "eduardo.gonzalez@6seconds.org" },
    update: {
      organizationRole: "ADMIN",
      primaryTenantId: tenant.id,
      planId: plans["enterprise"].id,
      active: true,
      allowAI: true,
    },
    create: {
      name: "Eduardo Gonzalez (6S)",
      email: "eduardo.gonzalez@6seconds.org",
      organizationRole: "ADMIN",
      primaryTenantId: tenant.id,
      planId: plans["enterprise"].id,
      active: true,
      allowAI: true,
      language: "en",
      country: "US",
    },
  });
  console.log("   ✅ Eduardo 6S (Admin):", eduardo6s.id);

  // Josh - Admin Six Seconds
  const josh = await prisma.user.upsert({
    where: { email: "josh@6seconds.org" },
    update: {
      organizationRole: "ADMIN",
      primaryTenantId: tenant.id,
      planId: plans["enterprise"].id,
      active: true,
      allowAI: true,
    },
    create: {
      name: "Josh Freedman",
      email: "josh@6seconds.org",
      organizationRole: "ADMIN",
      primaryTenantId: tenant.id,
      planId: plans["enterprise"].id,
      active: true,
      allowAI: true,
      language: "en",
      country: "US",
    },
  });
  console.log("   ✅ Josh (Admin):", josh.id);

  // Patty - Admin Six Seconds
  const patty = await prisma.user.upsert({
    where: { email: "patty@6seconds.org" },
    update: {
      organizationRole: "ADMIN",
      primaryTenantId: tenant.id,
      planId: plans["enterprise"].id,
      active: true,
      allowAI: true,
    },
    create: {
      name: "Patty Freedman",
      email: "patty@6seconds.org",
      organizationRole: "ADMIN",
      primaryTenantId: tenant.id,
      planId: plans["enterprise"].id,
      active: true,
      allowAI: true,
      language: "en",
      country: "US",
    },
  });
  console.log("   ✅ Patty (Admin):", patty.id);

  // ============================================================
  // 9. ROWIVERSE USERS - Identidades globales
  // ============================================================
  console.log("\n9. Creando RowiVerse Users...");

  const rvEduardo = await prisma.rowiVerseUser.upsert({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
    update: {},
    create: {
      email: "eduardo@cactuscomunidadcreativa.com",
      name: "Eduardo Gonzalez",
      userId: eduardo.id,
      rowiVerseId: rowiverse.id,
      verified: true,
      active: true,
      status: "active",
    },
  });

  const rvEduardo6s = await prisma.rowiVerseUser.upsert({
    where: { email: "eduardo.gonzalez@6seconds.org" },
    update: {},
    create: {
      email: "eduardo.gonzalez@6seconds.org",
      name: "Eduardo Gonzalez (6S)",
      userId: eduardo6s.id,
      rowiVerseId: rowiverse.id,
      verified: true,
      active: true,
      status: "active",
    },
  });

  const rvJosh = await prisma.rowiVerseUser.upsert({
    where: { email: "josh@6seconds.org" },
    update: {},
    create: {
      email: "josh@6seconds.org",
      name: "Josh Freedman",
      userId: josh.id,
      rowiVerseId: rowiverse.id,
      verified: true,
      active: true,
      status: "active",
    },
  });

  const rvPatty = await prisma.rowiVerseUser.upsert({
    where: { email: "patty@6seconds.org" },
    update: {},
    create: {
      email: "patty@6seconds.org",
      name: "Patty Freedman",
      userId: patty.id,
      rowiVerseId: rowiverse.id,
      verified: true,
      active: true,
      status: "active",
    },
  });

  // Vincular users con rowiverse
  await prisma.user.update({ where: { id: eduardo.id }, data: { rowiverseId: rvEduardo.id } });
  await prisma.user.update({ where: { id: eduardo6s.id }, data: { rowiverseId: rvEduardo6s.id } });
  await prisma.user.update({ where: { id: josh.id }, data: { rowiverseId: rvJosh.id } });
  await prisma.user.update({ where: { id: patty.id }, data: { rowiverseId: rvPatty.id } });

  console.log("   ✅ RowiVerse Users creados y vinculados");

  // ============================================================
  // 10. MEMBERSHIPS - Vincular usuarios a tenant/org
  // ============================================================
  console.log("\n10. Creando Memberships...");

  // Eduardo - Superadmin en todo
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: eduardo.id, tenantId: tenant.id } },
    update: { role: "SUPERADMIN" },
    create: {
      userId: eduardo.id,
      tenantId: tenant.id,
      role: "SUPERADMIN",
      planId: plans["enterprise"].id,
      tokenQuota: 999999,
    },
  });

  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: eduardo.id } },
    update: { role: "OWNER" },
    create: {
      organizationId: org.id,
      userId: eduardo.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: eduardo.id } },
    update: { access: "admin" },
    create: {
      hubId: hub.id,
      userId: eduardo.id,
      access: "admin",
    },
  });

  // Eduardo 6S - Admin
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: eduardo6s.id, tenantId: tenant.id } },
    update: { role: "ADMIN" },
    create: {
      userId: eduardo6s.id,
      tenantId: tenant.id,
      role: "ADMIN",
      planId: plans["enterprise"].id,
      tokenQuota: 999999,
    },
  });

  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: eduardo6s.id } },
    update: { role: "ADMIN" },
    create: {
      organizationId: org.id,
      userId: eduardo6s.id,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: eduardo6s.id } },
    update: { access: "admin" },
    create: {
      hubId: hub.id,
      userId: eduardo6s.id,
      access: "admin",
    },
  });

  // Josh - Admin
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: josh.id, tenantId: tenant.id } },
    update: { role: "ADMIN" },
    create: {
      userId: josh.id,
      tenantId: tenant.id,
      role: "ADMIN",
      planId: plans["enterprise"].id,
      tokenQuota: 999999,
    },
  });

  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: josh.id } },
    update: { role: "ADMIN" },
    create: {
      organizationId: org.id,
      userId: josh.id,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: josh.id } },
    update: { access: "admin" },
    create: {
      hubId: hub.id,
      userId: josh.id,
      access: "admin",
    },
  });

  // Patty - Admin
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: patty.id, tenantId: tenant.id } },
    update: { role: "ADMIN" },
    create: {
      userId: patty.id,
      tenantId: tenant.id,
      role: "ADMIN",
      planId: plans["enterprise"].id,
      tokenQuota: 999999,
    },
  });

  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: patty.id } },
    update: { role: "ADMIN" },
    create: {
      organizationId: org.id,
      userId: patty.id,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: patty.id } },
    update: { access: "admin" },
    create: {
      hubId: hub.id,
      userId: patty.id,
      access: "admin",
    },
  });

  console.log("   ✅ Memberships creados");

  // ============================================================
  // 11. PERMISSIONS - Permisos jerárquicos completos
  // ============================================================
  console.log("\n11. Creando Permisos Jerárquicos...");

  // Eduardo - Superadmin con permisos en todos los niveles
  const eduardoPermissions = [
    { scopeType: "rowiverse" as const, scopeId: rowiverse.id, role: "SUPERADMIN", scope: rowiverse.id },
    { scopeType: "superhub" as const, scopeId: superHub.id, role: "SUPERADMIN", scope: superHub.id },
    { scopeType: "tenant" as const, scopeId: tenant.id, role: "ADMIN", scope: tenant.id },
    { scopeType: "hub" as const, scopeId: hub.id, role: "ADMIN", scope: hub.id },
    { scopeType: "organization" as const, scopeId: org.id, role: "OWNER", scope: org.id },
  ];

  for (const perm of eduardoPermissions) {
    const permId = `perm-eduardo-${perm.scopeType.toLowerCase()}-${perm.scopeId || "global"}`;
    await prisma.userPermission.upsert({
      where: { id: permId },
      update: { role: perm.role },
      create: {
        id: permId,
        userId: eduardo.id,
        role: perm.role,
        scope: perm.scope,
        scopeType: perm.scopeType,
        scopeId: perm.scopeId,
        tenantId: perm.scopeType === "TENANT" || perm.scopeType === "HUB" || perm.scopeType === "ORGANIZATION" ? tenant.id : null,
      },
    });
    console.log(`   ✅ Eduardo: ${perm.scopeType} → ${perm.role}`);
  }

  // Eduardo 6S - Admin de Six Seconds
  const eduardo6sPermissions = [
    { scopeType: "superhub" as const, scopeId: superHub.id, role: "ADMIN", scope: superHub.id },
    { scopeType: "tenant" as const, scopeId: tenant.id, role: "ADMIN", scope: tenant.id },
    { scopeType: "hub" as const, scopeId: hub.id, role: "ADMIN", scope: hub.id },
    { scopeType: "organization" as const, scopeId: org.id, role: "ADMIN", scope: org.id },
  ];

  for (const perm of eduardo6sPermissions) {
    const permId = `perm-eduardo6s-${perm.scopeType.toLowerCase()}-${perm.scopeId}`;
    await prisma.userPermission.upsert({
      where: { id: permId },
      update: { role: perm.role },
      create: {
        id: permId,
        userId: eduardo6s.id,
        role: perm.role,
        scope: perm.scope,
        scopeType: perm.scopeType,
        scopeId: perm.scopeId,
        tenantId: tenant.id,
      },
    });
    console.log(`   ✅ Eduardo 6S: ${perm.scopeType} → ${perm.role}`);
  }

  // Josh - Admin de Six Seconds
  const joshPermissions = [
    { scopeType: "superhub" as const, scopeId: superHub.id, role: "ADMIN", scope: superHub.id },
    { scopeType: "tenant" as const, scopeId: tenant.id, role: "ADMIN", scope: tenant.id },
    { scopeType: "hub" as const, scopeId: hub.id, role: "ADMIN", scope: hub.id },
    { scopeType: "organization" as const, scopeId: org.id, role: "ADMIN", scope: org.id },
  ];

  for (const perm of joshPermissions) {
    const permId = `perm-josh-${perm.scopeType.toLowerCase()}-${perm.scopeId}`;
    await prisma.userPermission.upsert({
      where: { id: permId },
      update: { role: perm.role },
      create: {
        id: permId,
        userId: josh.id,
        role: perm.role,
        scope: perm.scope,
        scopeType: perm.scopeType,
        scopeId: perm.scopeId,
        tenantId: tenant.id,
      },
    });
    console.log(`   ✅ Josh: ${perm.scopeType} → ${perm.role}`);
  }

  // Patty - Admin de Six Seconds
  const pattyPermissions = [
    { scopeType: "superhub" as const, scopeId: superHub.id, role: "ADMIN", scope: superHub.id },
    { scopeType: "tenant" as const, scopeId: tenant.id, role: "ADMIN", scope: tenant.id },
    { scopeType: "hub" as const, scopeId: hub.id, role: "ADMIN", scope: hub.id },
    { scopeType: "organization" as const, scopeId: org.id, role: "ADMIN", scope: org.id },
  ];

  for (const perm of pattyPermissions) {
    const permId = `perm-patty-${perm.scopeType.toLowerCase()}-${perm.scopeId}`;
    await prisma.userPermission.upsert({
      where: { id: permId },
      update: { role: perm.role },
      create: {
        id: permId,
        userId: patty.id,
        role: perm.role,
        scope: perm.scope,
        scopeType: perm.scopeType,
        scopeId: perm.scopeId,
        tenantId: tenant.id,
      },
    });
    console.log(`   ✅ Patty: ${perm.scopeType} → ${perm.role}`);
  }

  // ============================================================
  // 12. COMUNIDAD - Comunidad principal de Six Seconds
  // ============================================================
  console.log("\n12. Creando Comunidad principal...");

  const community = await prisma.rowiCommunity.upsert({
    where: { slug: "six-seconds-global" },
    update: {},
    create: {
      name: "Six Seconds Global",
      slug: "six-seconds-global",
      description: "Comunidad global de Six Seconds - Inteligencia Emocional",
      type: "professional",
      visibility: "public",
      tenantId: tenant.id,
      hubId: hub.id,
      createdById: eduardo6s.id,
      owner: "Eduardo Gonzalez",
    },
  });
  console.log("   ✅ Comunidad:", community.id);

  // Agregar miembros a la comunidad usando RowiCommunityUser
  await prisma.rowiCommunityUser.upsert({
    where: { id: `member-eduardo6s-${community.id}` },
    update: {},
    create: {
      id: `member-eduardo6s-${community.id}`,
      communityId: community.id,
      userId: eduardo6s.id,
      rowiverseUserId: rvEduardo6s.id,
      email: "eduardo.gonzalez@6seconds.org",
      name: "Eduardo Gonzalez",
      role: "owner",
      status: "active",
    },
  });

  await prisma.rowiCommunityUser.upsert({
    where: { id: `member-josh-${community.id}` },
    update: {},
    create: {
      id: `member-josh-${community.id}`,
      communityId: community.id,
      userId: josh.id,
      rowiverseUserId: rvJosh.id,
      email: "josh@6seconds.org",
      name: "Josh Freedman",
      role: "admin",
      status: "active",
    },
  });

  await prisma.rowiCommunityUser.upsert({
    where: { id: `member-patty-${community.id}` },
    update: {},
    create: {
      id: `member-patty-${community.id}`,
      communityId: community.id,
      userId: patty.id,
      rowiverseUserId: rvPatty.id,
      email: "patty@6seconds.org",
      name: "Patty Freedman",
      role: "admin",
      status: "active",
    },
  });

  console.log("   ✅ Miembros agregados a comunidad");

  // ============================================================
  // 13. AGENTES IA - 6 Agentes Rowi
  // ============================================================
  console.log("\n14. Creando Agentes IA...");

  const agentsData = [
    {
      slug: "super-rowi",
      name: "Super Rowi",
      description: "Asistente principal de inteligencia emocional",
      avatar: "/agents/super-rowi.png",
      type: "GENERAL",
      model: "gpt-4o-mini",
      prompt: `Eres Super Rowi, asistente de inteligencia emocional.
Ayudas a los usuarios a entender y gestionar sus emociones.
Usas el modelo Six Seconds: Know Yourself, Choose Yourself, Give Yourself.`,
      tone: "warm",
    },
    {
      slug: "eq",
      name: "Rowi EQ",
      description: "Coach de inteligencia emocional basado en Six Seconds",
      avatar: "/agents/eq.png",
      type: "EQ_COACH",
      model: "gpt-4o-mini",
      prompt: `Eres Rowi EQ, coach especializado en las 8 competencias Six Seconds:
1. Enhance Emotional Literacy
2. Recognize Patterns
3. Apply Consequential Thinking
4. Navigate Emotions
5. Engage Intrinsic Motivation
6. Exercise Optimism
7. Increase Empathy
8. Pursue Noble Goals`,
      tone: "empathetic",
    },
    {
      slug: "affinity",
      name: "Rowi Affinity",
      description: "Experto en relaciones y compatibilidad emocional",
      avatar: "/agents/affinity.png",
      type: "AFFINITY_EXPERT",
      model: "gpt-4o-mini",
      prompt: `Eres Rowi Affinity, experto en relaciones y compatibilidad emocional.
Analizas patrones de comunicacion y sugieres como mejorar las relaciones.`,
      tone: "supportive",
    },
    {
      slug: "eco",
      name: "Rowi ECO",
      description: "Experto en comunicacion emocional",
      avatar: "/agents/eco.png",
      type: "COMMUNICATION_EXPERT",
      model: "gpt-4o-mini",
      prompt: `Eres Rowi ECO, experto en comunicacion emocional.
Ayudas a redactar mensajes con inteligencia emocional.
Adaptas el estilo segun Brain Styles.`,
      tone: "adaptive",
    },
    {
      slug: "trainer",
      name: "Rowi Trainer",
      description: "Entrenador personal de habitos y emociones",
      avatar: "/agents/trainer.png",
      type: "COACH",
      model: "gpt-4o-mini",
      prompt: `Eres Rowi Trainer, entrenador de habitos y emociones.
Ayudas a establecer metas claras, superar obstaculos y desarrollar habitos positivos.`,
      tone: "motivational",
    },
    {
      slug: "sales",
      name: "Rowi Sales",
      description: "Coach de ventas y negociacion emocional",
      avatar: "/agents/sales.png",
      type: "SALES_EXPERT",
      model: "gpt-4o-mini",
      prompt: `Eres Rowi Sales, coach de ventas y negociacion emocional.
Usas tecnicas de inteligencia emocional y persuasion etica.`,
      tone: "persuasive",
    },
  ];

  // Crear agentes GLOBALES
  for (const agent of agentsData) {
    const existingGlobal = await prisma.agentConfig.findFirst({
      where: { slug: agent.slug, tenantId: null, superHubId: null, organizationId: null, hubId: null },
    });

    if (existingGlobal) {
      await prisma.agentConfig.update({
        where: { id: existingGlobal.id },
        data: { name: agent.name, description: agent.description, prompt: agent.prompt },
      });
    } else {
      await prisma.agentConfig.create({
        data: {
          slug: agent.slug,
          name: agent.name,
          description: agent.description,
          avatar: agent.avatar,
          type: agent.type,
          model: agent.model,
          prompt: agent.prompt,
          tone: agent.tone,
          accessLevel: "system",
          visibility: "global",
          systemId: system.id,
          isActive: true,
          autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
        },
      });
    }
    console.log(`   🤖 [GLOBAL] ${agent.name}`);
  }

  // Crear agentes para TENANT Six Seconds con cultura oficial
  // VISION: By 2039, we will engage 1 billion people practicing emotional intelligence
  // MISSION: To support one billion people practicing the skills of emotional intelligence
  const sixSecondsCulture = {
    culturePrompt: `SIX SECONDS CULTURE & VALUES:

VISION: By 2039, we will engage 1 billion people practicing emotional intelligence.

MISSION: To support people to create positive change - everywhere, all the time.

CORE VALUES:
- Connection: We prioritize relationships and authentic human connection
- Hope: We believe in human potential and the power to change
- Safety: We create environments where people feel secure to grow
- Belonging: Everyone deserves to feel part of a community

THE SIX SECONDS MODEL:
- KNOW YOURSELF: Enhance Emotional Literacy, Recognize Patterns
- CHOOSE YOURSELF: Apply Consequential Thinking, Navigate Emotions, Engage Intrinsic Motivation, Exercise Optimism
- GIVE YOURSELF: Increase Empathy, Pursue Noble Goals

COMMUNICATION STYLE:
- Science-based but accessible and warm
- Empathetic and non-judgmental
- Action-oriented with practical tools
- Inspiring hope while being realistic
- Always connect EQ to meaningful purpose`,
    companyValues: ["Connection", "Hope", "Safety", "Belonging", "Authenticity", "Growth", "Science-Based Action"],
    companyMission: "To support people to create positive change - everywhere, all the time",
    companyVision: "By 2039, we will engage 1 billion people practicing emotional intelligence",
    companyTone: "Warm, inspiring, science-based yet accessible, action-oriented",
    industryContext: "EdTech/HRTech - Emotional Intelligence & Leadership Development",
  };

  for (const agent of agentsData) {
    const existingTenant = await prisma.agentConfig.findFirst({
      where: { slug: agent.slug, tenantId: tenant.id, superHubId: null, organizationId: null, hubId: null },
    });

    if (!existingTenant) {
      await prisma.agentConfig.create({
        data: {
          slug: agent.slug,
          name: agent.name,
          description: agent.description,
          avatar: agent.avatar,
          type: agent.type,
          model: agent.model,
          prompt: agent.prompt,
          tone: agent.tone,
          accessLevel: "tenant",
          visibility: "global",
          tenantId: tenant.id,
          systemId: system.id,
          isActive: true,
          autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
          culturePrompt: sixSecondsCulture.culturePrompt,
          companyValues: sixSecondsCulture.companyValues,
          companyMission: sixSecondsCulture.companyMission,
          companyTone: sixSecondsCulture.companyTone,
          industryContext: sixSecondsCulture.industryContext,
        },
      });
      console.log(`   🤖 [TENANT] ${agent.name}`);
    }
  }

  // Crear agentes para HUB Six Seconds (estos son los que heredan cultura específica del Hub)
  for (const agent of agentsData) {
    const existingHub = await prisma.agentConfig.findFirst({
      where: { slug: agent.slug, hubId: hub.id },
    });

    if (!existingHub) {
      await prisma.agentConfig.create({
        data: {
          slug: agent.slug,
          name: agent.name,
          description: agent.description,
          avatar: agent.avatar,
          type: agent.type,
          model: agent.model,
          prompt: agent.prompt,
          tone: agent.tone,
          accessLevel: "hub",
          visibility: "hub",
          hubId: hub.id,
          tenantId: tenant.id,
          systemId: system.id,
          isActive: true,
          autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
          culturePrompt: sixSecondsCulture.culturePrompt,
          companyValues: sixSecondsCulture.companyValues,
          companyMission: sixSecondsCulture.companyMission,
          companyTone: sixSecondsCulture.companyTone,
          industryContext: sixSecondsCulture.industryContext,
        },
      });
      console.log(`   🤖 [HUB] ${agent.name}`);
    }
  }

  // ============================================================
  // 15. SYSTEM SETTINGS - Configuración del sistema
  // ============================================================
  console.log("\n15. Creando System Settings...");

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
  console.log(`   ✅ ${settingsData.length} settings creados`);

  // ============================================================
  // 16. EMOTIONAL CONFIG - Configuración emocional
  // ============================================================
  console.log("\n18. Creando Emotional Config...");

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
      description: "Configuracion emocional principal",
    },
  });
  console.log("   ✅ Emotional Config creado");

  // ============================================================
  // 19. ACHIEVEMENTS - Logros disponibles
  // ============================================================
  console.log("\n19. Creando Achievements (logros)...");

  const achievementsData = [
    { slug: "first_login", name: "Primer Paso", description: "Iniciaste tu viaje en Rowi", points: 10, icon: "🌱", category: "GENERAL", requirement: "FIRST_ACTION" },
    { slug: "profile_complete", name: "Perfil Completo", description: "Completaste tu perfil", points: 50, icon: "✨", category: "GENERAL", requirement: "PROFILE_COMPLETE" },
    { slug: "first_sei", name: "Auto-conocimiento", description: "Completaste tu primer SEI", points: 100, icon: "🧠", category: "EQ", requirement: "SEI_COMPLETE" },
    { slug: "first_chat", name: "Primera Conversación", description: "Tuviste tu primera conversación con Rowi", points: 25, icon: "💬", category: "CHAT", requirement: "CHAT_COUNT" },
    { slug: "week_streak_7", name: "Semana Consistente", description: "7 días seguidos usando Rowi", points: 75, icon: "🔥", category: "STREAK", requirement: "CHAT_STREAK", threshold: 7 },
    { slug: "community_join", name: "Social", description: "Te uniste a tu primera comunidad", points: 30, icon: "👥", category: "COMMUNITY", requirement: "COMMUNITY_JOIN" },
    { slug: "avatar_hatched", name: "Nacimiento", description: "Tu avatar ha eclosionado", points: 100, icon: "🥚", category: "AVATAR", requirement: "DAYS_ACTIVE" },
  ];

  for (const ach of achievementsData) {
    await prisma.achievement.upsert({
      where: { slug: ach.slug },
      update: {},
      create: {
        slug: ach.slug,
        name: ach.name,
        description: ach.description,
        points: ach.points,
        icon: ach.icon,
        category: ach.category as any,
        requirement: ach.requirement as any,
        threshold: ach.threshold || 1,
        isActive: true,
      },
    });
  }
  console.log(`   ✅ ${achievementsData.length} achievements creados`);

  // ============================================================
  // 18. LEVEL DEFINITIONS - Definiciones de niveles
  // ============================================================
  console.log("\n18. Creando Level Definitions...");

  const levelsData = [
    { level: 1, minPoints: 0, maxPoints: 99, title: "Explorador Emocional", titleEN: "Emotional Explorer", color: "#6B7280", multiplier: 1.0 },
    { level: 2, minPoints: 100, maxPoints: 299, title: "Aprendiz Consciente", titleEN: "Conscious Learner", color: "#3B82F6", multiplier: 1.1 },
    { level: 3, minPoints: 300, maxPoints: 599, title: "Practicante Emocional", titleEN: "Emotional Practitioner", color: "#10B981", multiplier: 1.2 },
    { level: 4, minPoints: 600, maxPoints: 999, title: "Navegante Interior", titleEN: "Inner Navigator", color: "#8B5CF6", multiplier: 1.3 },
    { level: 5, minPoints: 1000, maxPoints: 1499, title: "Maestro de Emociones", titleEN: "Emotion Master", color: "#F59E0B", multiplier: 1.5 },
    { level: 6, minPoints: 1500, maxPoints: 2499, title: "Guía Emocional", titleEN: "Emotional Guide", color: "#EF4444", multiplier: 1.7 },
    { level: 7, minPoints: 2500, maxPoints: 3999, title: "Sabio del Corazón", titleEN: "Heart Sage", color: "#EC4899", multiplier: 2.0 },
    { level: 8, minPoints: 4000, maxPoints: 5999, title: "Iluminado EQ", titleEN: "EQ Enlightened", color: "#06B6D4", multiplier: 2.5 },
    { level: 9, minPoints: 6000, maxPoints: 9999, title: "Guardián Emocional", titleEN: "Emotional Guardian", color: "#84CC16", multiplier: 3.0 },
    { level: 10, minPoints: 10000, maxPoints: null, title: "Leyenda Rowi", titleEN: "Rowi Legend", color: "#FFD700", multiplier: 4.0 },
  ];

  for (const lvl of levelsData) {
    await prisma.levelDefinition.upsert({
      where: { level: lvl.level },
      update: {
        minPoints: lvl.minPoints,
        maxPoints: lvl.maxPoints,
        title: lvl.title,
        titleEN: lvl.titleEN,
        color: lvl.color,
        multiplier: lvl.multiplier,
      },
      create: {
        level: lvl.level,
        minPoints: lvl.minPoints,
        maxPoints: lvl.maxPoints,
        title: lvl.title,
        titleEN: lvl.titleEN,
        color: lvl.color,
        multiplier: lvl.multiplier,
        icon: "star",
      },
    });
  }
  console.log(`   ✅ ${levelsData.length} niveles creados`);

  // ============================================================
  // 19. TRADUCCIONES - Admin UI i18n (COMPLETAS - 212 pares)
  // ============================================================
  console.log("\n19. Creando Traducciones...");

  // Todas las traducciones del sistema
  const translationPairs = [
    // ============ Common ============
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

    // ============ Admin Common ============
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
    { ns: "admin", key: "common.version", es: "Versión", en: "Version" },
    { ns: "admin", key: "common.config", es: "Configuración", en: "Configuration" },
    { ns: "admin", key: "common.enabled", es: "Habilitado", en: "Enabled" },
    { ns: "admin", key: "common.disabled", es: "Deshabilitado", en: "Disabled" },
    { ns: "admin", key: "common.active", es: "Activo", en: "Active" },
    { ns: "admin", key: "common.inactive", es: "Inactivo", en: "Inactive" },
    { ns: "admin", key: "common.all", es: "Todos", en: "All" },
    { ns: "admin", key: "common.none", es: "Ninguno", en: "None" },
    { ns: "admin", key: "common.select", es: "Seleccionar", en: "Select" },
    { ns: "admin", key: "common.close", es: "Cerrar", en: "Close" },
    { ns: "admin", key: "common.back", es: "Volver", en: "Back" },
    { ns: "admin", key: "common.next", es: "Siguiente", en: "Next" },
    { ns: "admin", key: "common.previous", es: "Anterior", en: "Previous" },
    { ns: "admin", key: "common.finish", es: "Finalizar", en: "Finish" },
    { ns: "admin", key: "common.add", es: "Agregar", en: "Add" },
    { ns: "admin", key: "common.remove", es: "Quitar", en: "Remove" },
    { ns: "admin", key: "common.new", es: "Nuevo", en: "New" },

    // ============ Admin Navigation ============
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
    { ns: "admin", key: "nav.api", es: "API", en: "API" },
    { ns: "admin", key: "nav.logs", es: "Logs", en: "Logs" },
    { ns: "admin", key: "nav.analytics", es: "Analíticas", en: "Analytics" },
    { ns: "admin", key: "nav.media", es: "Media", en: "Media" },
    { ns: "admin", key: "nav.forms", es: "Formularios", en: "Forms" },
    { ns: "admin", key: "nav.menus", es: "Menús", en: "Menus" },
    { ns: "admin", key: "nav.themes", es: "Temas", en: "Themes" },
    { ns: "admin", key: "nav.benchmarks", es: "Benchmarks", en: "Benchmarks" },

    // ============ Admin Pages ============
    { ns: "admin", key: "pages.title", es: "Páginas", en: "Pages" },
    { ns: "admin", key: "pages.description", es: "Gestiona las páginas del CMS", en: "Manage CMS pages" },
    { ns: "admin", key: "pages.noPages", es: "No hay páginas", en: "No pages found" },
    { ns: "admin", key: "pages.new", es: "Nueva página", en: "New page" },
    { ns: "admin", key: "pages.edit", es: "Editar página", en: "Edit page" },
    { ns: "admin", key: "pages.scan", es: "Escanear", en: "Scan" },
    { ns: "admin", key: "pages.created", es: "Página creada", en: "Page created" },
    { ns: "admin", key: "pages.updated", es: "Página actualizada", en: "Page updated" },
    { ns: "admin", key: "pages.deleted", es: "Página eliminada", en: "Page deleted" },
    { ns: "admin", key: "pages.confirmDelete", es: "¿Eliminar esta página?", en: "Delete this page?" },
    { ns: "admin", key: "pages.newPages", es: "páginas nuevas", en: "new pages" },
    { ns: "admin", key: "pages.updatedPages", es: "páginas actualizadas", en: "updated pages" },
    { ns: "admin", key: "pages.untitled", es: "Sin título", en: "Untitled" },
    { ns: "admin", key: "pages.titleField", es: "Título", en: "Title" },
    { ns: "admin", key: "pages.slug", es: "Slug (URL)", en: "Slug (URL)" },
    { ns: "admin", key: "pages.summary", es: "Resumen", en: "Summary" },
    { ns: "admin", key: "pages.content", es: "Contenido", en: "Content" },
    { ns: "admin", key: "pages.language", es: "Idioma", en: "Language" },
    { ns: "admin", key: "pages.visibility", es: "Visibilidad", en: "Visibility" },
    { ns: "admin", key: "pages.accessLevel", es: "Nivel de acceso", en: "Access level" },
    { ns: "admin", key: "pages.seoConfig", es: "Configuración SEO", en: "SEO Configuration" },
    { ns: "admin", key: "pages.public", es: "Público", en: "Public" },
    { ns: "admin", key: "pages.private", es: "Privado", en: "Private" },
    { ns: "admin", key: "pages.internal", es: "Interno", en: "Internal" },
    { ns: "admin", key: "pages.organization", es: "Organización", en: "Organization" },
    { ns: "admin", key: "pages.tab.general", es: "General", en: "General" },
    { ns: "admin", key: "pages.tab.content", es: "Contenido", en: "Content" },
    { ns: "admin", key: "pages.tab.seo", es: "SEO", en: "SEO" },
    { ns: "admin", key: "pages.tab.access", es: "Acceso", en: "Access" },

    // ============ Admin Layouts ============
    { ns: "admin", key: "layouts.title", es: "Layouts", en: "Layouts" },
    { ns: "admin", key: "layouts.description", es: "Diseña la estructura de tus páginas", en: "Design the structure of your pages" },
    { ns: "admin", key: "layouts.noLayouts", es: "No hay layouts", en: "No layouts found" },
    { ns: "admin", key: "layouts.new", es: "Nuevo layout", en: "New layout" },
    { ns: "admin", key: "layouts.edit", es: "Editar layout", en: "Edit layout" },
    { ns: "admin", key: "layouts.editDescription", es: "Arrastra y suelta componentes", en: "Drag and drop components" },
    { ns: "admin", key: "layouts.created", es: "Layout creado", en: "Layout created" },
    { ns: "admin", key: "layouts.updated", es: "Layout actualizado", en: "Layout updated" },
    { ns: "admin", key: "layouts.deleted", es: "Layout eliminado", en: "Layout deleted" },
    { ns: "admin", key: "layouts.confirmDelete", es: "¿Eliminar este layout?", en: "Delete this layout?" },
    { ns: "admin", key: "layouts.header", es: "Header", en: "Header" },
    { ns: "admin", key: "layouts.main", es: "Principal", en: "Main" },
    { ns: "admin", key: "layouts.footer", es: "Footer", en: "Footer" },
    { ns: "admin", key: "layouts.empty", es: "Zona vacía", en: "Empty zone" },
    { ns: "admin", key: "layouts.addComponent", es: "Agregar componente", en: "Add component" },
    { ns: "admin", key: "layouts.searchComponent", es: "Buscar componente...", en: "Search component..." },
    { ns: "admin", key: "layouts.componentCatalog", es: "Catálogo de componentes", en: "Component catalog" },

    // ============ Admin Components ============
    { ns: "admin", key: "components.title", es: "Componentes", en: "Components" },
    { ns: "admin", key: "components.description", es: "Gestiona los componentes reutilizables", en: "Manage reusable components" },
    { ns: "admin", key: "components.noComponents", es: "No hay componentes", en: "No components found" },
    { ns: "admin", key: "components.new", es: "Nuevo componente", en: "New component" },
    { ns: "admin", key: "components.edit", es: "Editar componente", en: "Edit component" },
    { ns: "admin", key: "components.created", es: "Componente creado", en: "Component created" },
    { ns: "admin", key: "components.updated", es: "Componente actualizado", en: "Component updated" },
    { ns: "admin", key: "components.deleted", es: "Componente eliminado", en: "Component deleted" },
    { ns: "admin", key: "components.confirmDelete", es: "¿Eliminar este componente?", en: "Delete this component?" },
    { ns: "admin", key: "components.allLevels", es: "Todos los niveles", en: "All levels" },
    { ns: "admin", key: "components.version", es: "Versión", en: "Version" },
    { ns: "admin", key: "components.category", es: "Categoría", en: "Category" },
    { ns: "admin", key: "components.showMore", es: "Ver más", en: "Show more" },
    { ns: "admin", key: "components.showLess", es: "Ver menos", en: "Show less" },

    // ============ Admin Translations ============
    { ns: "admin", key: "translations.title", es: "Traducciones", en: "Translations" },
    { ns: "admin", key: "translations.description", es: "Gestiona las traducciones del sistema", en: "Manage system translations" },
    { ns: "admin", key: "translations.noTranslations", es: "No hay traducciones", en: "No translations found" },
    { ns: "admin", key: "translations.new", es: "Nueva traducción", en: "New translation" },
    { ns: "admin", key: "translations.edit", es: "Editar traducción", en: "Edit translation" },
    { ns: "admin", key: "translations.created", es: "Traducción creada", en: "Translation created" },
    { ns: "admin", key: "translations.updated", es: "Traducción actualizada", en: "Translation updated" },
    { ns: "admin", key: "translations.deleted", es: "Traducción eliminada", en: "Translation deleted" },
    { ns: "admin", key: "translations.confirmDelete", es: "¿Eliminar esta traducción?", en: "Delete this translation?" },
    { ns: "admin", key: "translations.namespace", es: "Namespace", en: "Namespace" },
    { ns: "admin", key: "translations.key", es: "Clave", en: "Key" },
    { ns: "admin", key: "translations.value", es: "Valor", en: "Value" },
    { ns: "admin", key: "translations.language", es: "Idioma", en: "Language" },
    { ns: "admin", key: "translations.export", es: "Exportar", en: "Export" },
    { ns: "admin", key: "translations.import", es: "Importar", en: "Import" },
    { ns: "admin", key: "translations.scan", es: "Escanear claves", en: "Scan keys" },
    { ns: "admin", key: "translations.autoTranslate", es: "Auto traducir", en: "Auto translate" },
    { ns: "admin", key: "translations.missing", es: "Faltantes", en: "Missing" },
    { ns: "admin", key: "translations.all", es: "Todas", en: "All" },
    { ns: "admin", key: "translations.filterByNs", es: "Filtrar por namespace", en: "Filter by namespace" },
    { ns: "admin", key: "translations.filterByLang", es: "Filtrar por idioma", en: "Filter by language" },
    { ns: "admin", key: "translations.total", es: "Total", en: "Total" },
    { ns: "admin", key: "translations.translated", es: "Traducidas", en: "Translated" },
    { ns: "admin", key: "translations.pending", es: "Pendientes", en: "Pending" },

    // ============ Admin Agents ============
    { ns: "admin", key: "agents.title", es: "Agentes IA", en: "AI Agents" },
    { ns: "admin", key: "agents.description", es: "Gestiona los agentes de inteligencia artificial", en: "Manage AI agents" },
    { ns: "admin", key: "agents.noAgents", es: "No hay agentes", en: "No agents found" },
    { ns: "admin", key: "agents.new", es: "Nuevo agente", en: "New agent" },
    { ns: "admin", key: "agents.edit", es: "Editar agente", en: "Edit agent" },
    { ns: "admin", key: "agents.created", es: "Agente creado", en: "Agent created" },
    { ns: "admin", key: "agents.updated", es: "Agente actualizado", en: "Agent updated" },
    { ns: "admin", key: "agents.deleted", es: "Agente eliminado", en: "Agent deleted" },
    { ns: "admin", key: "agents.confirmDelete", es: "¿Eliminar este agente?", en: "Delete this agent?" },
    { ns: "admin", key: "agents.name", es: "Nombre", en: "Name" },
    { ns: "admin", key: "agents.systemPrompt", es: "System Prompt", en: "System Prompt" },
    { ns: "admin", key: "agents.model", es: "Modelo", en: "Model" },
    { ns: "admin", key: "agents.temperature", es: "Temperatura", en: "Temperature" },
    { ns: "admin", key: "agents.maxTokens", es: "Max Tokens", en: "Max Tokens" },
    { ns: "admin", key: "agents.enabled", es: "Habilitado", en: "Enabled" },
    { ns: "admin", key: "agents.disabled", es: "Deshabilitado", en: "Disabled" },
    { ns: "admin", key: "agents.test", es: "Probar", en: "Test" },
    { ns: "admin", key: "agents.duplicate", es: "Duplicar", en: "Duplicate" },

    // ============ Admin Users ============
    { ns: "admin", key: "users.title", es: "Usuarios", en: "Users" },
    { ns: "admin", key: "users.description", es: "Gestiona los usuarios del sistema", en: "Manage system users" },
    { ns: "admin", key: "users.noUsers", es: "No hay usuarios", en: "No users found" },
    { ns: "admin", key: "users.new", es: "Nuevo usuario", en: "New user" },
    { ns: "admin", key: "users.edit", es: "Editar usuario", en: "Edit user" },
    { ns: "admin", key: "users.created", es: "Usuario creado", en: "User created" },
    { ns: "admin", key: "users.updated", es: "Usuario actualizado", en: "User updated" },
    { ns: "admin", key: "users.deleted", es: "Usuario eliminado", en: "User deleted" },
    { ns: "admin", key: "users.confirmDelete", es: "¿Eliminar este usuario?", en: "Delete this user?" },
    { ns: "admin", key: "users.email", es: "Email", en: "Email" },
    { ns: "admin", key: "users.password", es: "Contraseña", en: "Password" },
    { ns: "admin", key: "users.role", es: "Rol", en: "Role" },
    { ns: "admin", key: "users.active", es: "Activo", en: "Active" },
    { ns: "admin", key: "users.inactive", es: "Inactivo", en: "Inactive" },
    { ns: "admin", key: "users.lastLogin", es: "Último acceso", en: "Last login" },
    { ns: "admin", key: "users.createdAt", es: "Fecha de creación", en: "Created at" },

    // ============ Admin Settings ============
    { ns: "admin", key: "settings.title", es: "Configuración", en: "Settings" },
    { ns: "admin", key: "settings.description", es: "Configuración general del sistema", en: "General system settings" },
    { ns: "admin", key: "settings.general", es: "General", en: "General" },
    { ns: "admin", key: "settings.appearance", es: "Apariencia", en: "Appearance" },
    { ns: "admin", key: "settings.security", es: "Seguridad", en: "Security" },
    { ns: "admin", key: "settings.integrations", es: "Integraciones", en: "Integrations" },
    { ns: "admin", key: "settings.saved", es: "Configuración guardada", en: "Settings saved" },
    { ns: "admin", key: "settings.siteName", es: "Nombre del sitio", en: "Site name" },
    { ns: "admin", key: "settings.siteDescription", es: "Descripción del sitio", en: "Site description" },
    { ns: "admin", key: "settings.defaultLanguage", es: "Idioma predeterminado", en: "Default language" },
    { ns: "admin", key: "settings.timezone", es: "Zona horaria", en: "Timezone" },
    { ns: "admin", key: "settings.theme", es: "Tema", en: "Theme" },
    { ns: "admin", key: "settings.light", es: "Claro", en: "Light" },
    { ns: "admin", key: "settings.dark", es: "Oscuro", en: "Dark" },
    { ns: "admin", key: "settings.auto", es: "Automático", en: "Auto" },

    // ============ Admin Dashboard ============
    { ns: "admin", key: "dashboard.title", es: "Dashboard", en: "Dashboard" },
    { ns: "admin", key: "dashboard.description", es: "Resumen general del sistema", en: "System overview" },
    { ns: "admin", key: "dashboard.totalUsers", es: "Total usuarios", en: "Total users" },
    { ns: "admin", key: "dashboard.totalPages", es: "Total páginas", en: "Total pages" },
    { ns: "admin", key: "dashboard.totalComponents", es: "Total componentes", en: "Total components" },
    { ns: "admin", key: "dashboard.totalAgents", es: "Total agentes", en: "Total agents" },
    { ns: "admin", key: "dashboard.recentActivity", es: "Actividad reciente", en: "Recent activity" },
    { ns: "admin", key: "dashboard.quickActions", es: "Acciones rápidas", en: "Quick actions" },
    { ns: "admin", key: "dashboard.systemStatus", es: "Estado del sistema", en: "System status" },
    { ns: "admin", key: "dashboard.healthy", es: "Saludable", en: "Healthy" },
    { ns: "admin", key: "dashboard.warning", es: "Advertencia", en: "Warning" },
    { ns: "admin", key: "dashboard.critical", es: "Crítico", en: "Critical" },

    // ============ Benchmarks ============
    { ns: "admin", key: "benchmarks.title", es: "Benchmarks", en: "Benchmarks" },
    { ns: "admin", key: "benchmarks.upload", es: "Subir Benchmark", en: "Upload Benchmark" },
    { ns: "admin", key: "benchmarks.processing", es: "Procesando...", en: "Processing..." },
    { ns: "admin", key: "benchmarks.completed", es: "Completado", en: "Completed" },
    { ns: "admin", key: "benchmarks.failed", es: "Fallido", en: "Failed" },
    { ns: "admin", key: "benchmarks.topPerformers", es: "Top Performers", en: "Top Performers" },
    { ns: "admin", key: "benchmarks.correlations", es: "Correlaciones", en: "Correlations" },
    { ns: "admin", key: "benchmarks.generate", es: "Generar", en: "Generate" },
    { ns: "admin", key: "benchmarks.dataPoints", es: "Puntos de datos", en: "Data points" },

    // ============ EQ Metrics ============
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

    // ============ Outcomes ============
    { ns: "admin", key: "benchmarks.outcomes.effectiveness", es: "Efectividad", en: "Effectiveness" },
    { ns: "admin", key: "benchmarks.outcomes.relationships", es: "Relaciones", en: "Relationships" },
    { ns: "admin", key: "benchmarks.outcomes.qualityOfLife", es: "Calidad de Vida", en: "Quality of Life" },
    { ns: "admin", key: "benchmarks.outcomes.wellbeing", es: "Bienestar", en: "Wellbeing" },
    { ns: "admin", key: "benchmarks.outcomes.influence", es: "Influencia", en: "Influence" },
    { ns: "admin", key: "benchmarks.outcomes.decisionMaking", es: "Toma de Decisiones", en: "Decision Making" },
    { ns: "admin", key: "benchmarks.outcomes.community", es: "Comunidad", en: "Community" },
    { ns: "admin", key: "benchmarks.outcomes.network", es: "Red de Contactos", en: "Network" },
    { ns: "admin", key: "benchmarks.outcomes.achievement", es: "Logro", en: "Achievement" },
    { ns: "admin", key: "benchmarks.outcomes.satisfaction", es: "Satisfacción", en: "Satisfaction" },
    { ns: "admin", key: "benchmarks.outcomes.balance", es: "Balance", en: "Balance" },
    { ns: "admin", key: "benchmarks.outcomes.health", es: "Salud", en: "Health" },

    // ============ Brain Talents ============
    { ns: "admin", key: "benchmarks.talents.dataMining", es: "Minería de Datos", en: "Data Mining" },
    { ns: "admin", key: "benchmarks.talents.modeling", es: "Modelado", en: "Modeling" },
    { ns: "admin", key: "benchmarks.talents.prioritizing", es: "Priorización", en: "Prioritizing" },
    { ns: "admin", key: "benchmarks.talents.connection", es: "Conexión", en: "Connection" },
    { ns: "admin", key: "benchmarks.talents.emotionalInsight", es: "Insight Emocional", en: "Emotional Insight" },
    { ns: "admin", key: "benchmarks.talents.collaboration", es: "Colaboración", en: "Collaboration" },
    { ns: "admin", key: "benchmarks.talents.reflecting", es: "Reflexión", en: "Reflecting" },
    { ns: "admin", key: "benchmarks.talents.adaptability", es: "Adaptabilidad", en: "Adaptability" },
    { ns: "admin", key: "benchmarks.talents.criticalThinking", es: "Pensamiento Crítico", en: "Critical Thinking" },
    { ns: "admin", key: "benchmarks.talents.resilience", es: "Resiliencia", en: "Resilience" },
    { ns: "admin", key: "benchmarks.talents.riskTolerance", es: "Tolerancia al Riesgo", en: "Risk Tolerance" },
    { ns: "admin", key: "benchmarks.talents.imagination", es: "Imaginación", en: "Imagination" },
    { ns: "admin", key: "benchmarks.talents.proactivity", es: "Proactividad", en: "Proactivity" },
    { ns: "admin", key: "benchmarks.talents.commitment", es: "Compromiso", en: "Commitment" },
    { ns: "admin", key: "benchmarks.talents.problemSolving", es: "Resolución de Problemas", en: "Problem Solving" },
    { ns: "admin", key: "benchmarks.talents.vision", es: "Visión", en: "Vision" },
    { ns: "admin", key: "benchmarks.talents.designing", es: "Diseño", en: "Designing" },
    { ns: "admin", key: "benchmarks.talents.entrepreneurship", es: "Emprendimiento", en: "Entrepreneurship" },
  ];

  // Crear traducciones para cada idioma usando createMany (más eficiente)
  // No borramos las existentes, solo agregamos las que faltan con skipDuplicates

  const translationsToCreate: { systemId: string; ns: string; key: string; lang: string; value: string }[] = [];
  for (const t of translationPairs) {
    translationsToCreate.push({ systemId: system.id, ns: t.ns, key: t.key, lang: "es", value: t.es });
    translationsToCreate.push({ systemId: system.id, ns: t.ns, key: t.key, lang: "en", value: t.en });
  }

  await prisma.translation.createMany({ data: translationsToCreate, skipDuplicates: true });
  console.log(`   ✅ ${translationsToCreate.length} traducciones creadas (ES + EN)`);

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  SEED COMPLETADO");
  console.log("=".repeat(60));
  console.log("\n");
  console.log("Estructura creada:");
  console.log("  - RowiVerse: rowiverse (ecosistema global)");
  console.log("  - System: rowi");
  console.log("  - Tenant Global: rowi-global (para usuarios públicos)");
  console.log("");
  console.log("  Six Seconds (Cliente):");
  console.log("    - SuperHub: Six Seconds");
  console.log("    - Tenant: Six Seconds Global");
  console.log("    - Hub: Six Seconds Hub");
  console.log("    - Organization: Six Seconds Organization");
  console.log("    - Comunidad: Six Seconds Global");
  console.log("\n");
  console.log("Usuarios (4):");
  console.log("  - eduardo@cactuscomunidadcreativa.com (SUPERADMIN global)");
  console.log("  - eduardo.gonzalez@6seconds.org (ADMIN Six Seconds)");
  console.log("  - josh@6seconds.org (ADMIN Six Seconds)");
  console.log("  - patty@6seconds.org (ADMIN Six Seconds)");
  console.log("\n");
  console.log("Planes (6):");
  console.log("  🆓 Free ROWI - Exploración");
  console.log("  ⭐ ROWI+ - Individual premium");
  console.log("  👨‍👩‍👧‍👦 ROWI Family - Familias");
  console.log("  🚀 ROWI Pro - Profesionales");
  console.log("  🏢 ROWI Business - Empresas");
  console.log("  ☁️ ROWI Enterprise - Grandes organizaciones");
  console.log("\n");
  console.log("Permisos jerárquicos:");
  console.log("  - Eduardo: SUPERADMIN (Global, RowiVerse, SuperHub, Tenant, Hub, Org)");
  console.log("  - Eduardo 6S: ADMIN (SuperHub, Tenant, Hub, Org)");
  console.log("  - Josh: ADMIN (SuperHub, Tenant, Hub, Org)");
  console.log("  - Patty: ADMIN (SuperHub, Tenant, Hub, Org)");
  console.log("\n");
  console.log("Agentes IA (18 total = 6 Global + 6 Tenant + 6 Hub):");
  console.log("  🤖 Super Rowi - Asistente principal");
  console.log("  🧠 Rowi EQ - Coach de inteligencia emocional");
  console.log("  💚 Rowi Affinity - Experto en relaciones");
  console.log("  💬 Rowi ECO - Comunicacion emocional");
  console.log("  🏋️ Rowi Trainer - Entrenador personal");
  console.log("  💼 Rowi Sales - Coach de ventas");
  console.log("\n");
  console.log("Cultura Six Seconds (aplicada a Tenant y Hub):");
  console.log("  🎯 Vision: By 2039, 1 billion people practicing EQ");
  console.log("  🚀 Mission: To support people to create positive change");
  console.log("  ❤️ Values: Connection, Hope, Safety, Belonging");
  console.log("\n");
  console.log("Gamificación:");
  console.log("  - 7 Achievements disponibles");
  console.log("  - 10 Level Definitions (Explorador → Leyenda Rowi)");
  console.log("  - System Settings configurados");
  console.log("  - Emotional Config activo");
  console.log("  - 518+ Traducciones ES/EN incluidas");
  console.log("\n");
  console.log("Flujo de registro:");
  console.log("  1. Usuario se registra → crea User");
  console.log("  2. Se crea RowiVerseUser → identidad global");
  console.log("  3. Se asigna a Tenant rowi-global (no Six Seconds)");
  console.log("  4. Six Seconds es cliente específico con su propio SuperHub");
  console.log("\n");
  console.log("¡Rowi está listo para producción! 🚀");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
