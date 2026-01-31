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
  // 4. SUPERHUB - Six Seconds
  // ============================================================
  console.log("\n4. Creando SuperHub Six Seconds...");

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
  // 5. TENANT - Six Seconds Global
  // ============================================================
  console.log("\n5. Creando Tenant Six Seconds...");

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

  // Vincular users con rowiverse
  await prisma.user.update({ where: { id: eduardo.id }, data: { rowiverseId: rvEduardo.id } });
  await prisma.user.update({ where: { id: eduardo6s.id }, data: { rowiverseId: rvEduardo6s.id } });
  await prisma.user.update({ where: { id: josh.id }, data: { rowiverseId: rvJosh.id } });

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

  // Crear agentes para TENANT Six Seconds
  const tenantCulture = {
    culturePrompt: `CULTURA SIX SECONDS:
- Pioneros en inteligencia emocional aplicada desde 1997
- Valoramos autenticidad, empatia y crecimiento continuo
- Lenguaje cercano pero profesional basado en ciencia`,
    companyValues: ["Empatia", "Crecimiento", "Autenticidad", "Colaboracion", "Ciencia"],
    companyMission: "Democratizar la inteligencia emocional para un mundo mejor",
    companyTone: "Calido, inspirador, cercano pero profesional",
    industryContext: "EdTech/HRTech - Inteligencia Emocional",
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
          culturePrompt: tenantCulture.culturePrompt,
          companyValues: tenantCulture.companyValues,
          companyMission: tenantCulture.companyMission,
          companyTone: tenantCulture.companyTone,
          industryContext: tenantCulture.industryContext,
        },
      });
      console.log(`   🤖 [TENANT] ${agent.name}`);
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
  // 16. EQ SNAPSHOT - Datos EQ de ejemplo para Eduardo
  // ============================================================
  console.log("\n16. Creando EQ Snapshot para Eduardo...");

  const eduardoEQ = await prisma.eqSnapshot.upsert({
    where: { id: "sei-eduardo-demo" },
    update: {},
    create: {
      id: "sei-eduardo-demo",
      user: { connect: { id: eduardo.id } },
      rowiverseUser: { connect: { id: rvEduardo.id } },
      email: "eduardo@cactuscomunidadcreativa.com",
      dataset: "Six Seconds Demo",
      project: "Rowi Core Team",
      owner: "Sistema",
      at: new Date(),
      K: 115,
      C: 116,
      G: 105,
      EL: 122,
      RP: 108,
      ACT: 124,
      NE: 124,
      IM: 104,
      OP: 114,
      EMP: 93,
      NG: 118,
      brainStyle: "Strategist",
      recentMood: "Confianza",
      moodIntensity: "Seguro",
      overall4: 111.66,
      country: "PE",
      gender: "M",
      age: 39,
      reliabilityIndex: 85.69,
      positiveImpressionRange: "Average",
    },
  });

  // Crear competencias EQ
  const eqCompetencies = [
    { key: "EL", label: "Enhance Emotional Literacy", score: 121.93 },
    { key: "RP", label: "Recognize Patterns", score: 108.12 },
    { key: "ACT", label: "Apply Consequential Thinking", score: 124.10 },
    { key: "NE", label: "Navigate Emotions", score: 124.12 },
    { key: "IM", label: "Engage Intrinsic Motivation", score: 104.42 },
    { key: "OP", label: "Exercise Optimism", score: 113.84 },
    { key: "EMP", label: "Increase Empathy", score: 92.76 },
    { key: "NG", label: "Pursue Noble Goals", score: 118.00 },
  ];

  for (const comp of eqCompetencies) {
    await prisma.eqCompetencySnapshot.upsert({
      where: { id: `${eduardoEQ.id}-${comp.key}` },
      update: { score: comp.score },
      create: {
        id: `${eduardoEQ.id}-${comp.key}`,
        snapshot: { connect: { id: eduardoEQ.id } },
        key: comp.key,
        label: comp.label,
        score: comp.score,
      },
    });
  }
  console.log("   ✅ EQ Snapshot y competencias creadas");

  // ============================================================
  // 17. AVATAR EVOLUTION - Gamificación
  // ============================================================
  console.log("\n17. Creando Avatar Evolution...");

  await prisma.avatarEvolution.upsert({
    where: { userId: eduardo.id },
    update: {},
    create: {
      userId: eduardo.id,
      stage: "YOUNG",
      experience: 1500,
      hatched: true,
      hatchProgress: 100,
      sixSecondsLevel: 4,
      evolutionScore: 4.6,
      daysActive: 90,
      brainStyle: "Strategist",
      personality: {
        strengths: ["strategic_thinking", "emotional_awareness", "leadership"],
        challenges: ["patience", "delegation"],
      },
    },
  });
  console.log("   ✅ Avatar Evolution creado");

  // ============================================================
  // 18. EMOTIONAL CONFIG - Configuración emocional
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

  // Dar algunos logros a Eduardo
  const eduardoAchievements = ["first_login", "profile_complete", "first_sei", "avatar_hatched"];
  for (const achSlug of eduardoAchievements) {
    const ach = await prisma.achievement.findUnique({ where: { slug: achSlug } });
    if (ach) {
      await prisma.userAchievement.upsert({
        where: { id: `${eduardo.id}-${achSlug}` },
        update: {},
        create: {
          id: `${eduardo.id}-${achSlug}`,
          userId: eduardo.id,
          achievementId: ach.id,
          completed: true,
          completedAt: new Date(),
          progress: 100,
        },
      });
    }
  }
  console.log("   ✅ Achievements asignados a Eduardo");

  // ============================================================
  // 20. LEVEL DEFINITIONS - Definiciones de niveles
  // ============================================================
  console.log("\n20. Creando Level Definitions...");

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

  // Crear UserLevel para Eduardo
  await prisma.userLevel.upsert({
    where: { userId: eduardo.id },
    update: {},
    create: {
      userId: eduardo.id,
      level: 4,
      totalPoints: 650,
      currentLevelPoints: 50,
    },
  });
  console.log("   ✅ UserLevel para Eduardo creado");

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  SEED COMPLETADO");
  console.log("=".repeat(60));
  console.log("\n");
  console.log("Estructura creada:");
  console.log("  - RowiVerse: rowiverse");
  console.log("  - System: rowi");
  console.log("  - SuperHub: Six Seconds");
  console.log("  - Tenant: Six Seconds Global");
  console.log("  - Hub: Six Seconds Hub");
  console.log("  - Organization: Six Seconds Organization");
  console.log("  - Comunidad: Six Seconds Global");
  console.log("\n");
  console.log("Usuarios:");
  console.log("  - eduardo@cactuscomunidadcreativa.com (SUPERADMIN global)");
  console.log("  - eduardo.gonzalez@6seconds.org (ADMIN Six Seconds)");
  console.log("  - josh@6seconds.org (ADMIN Six Seconds)");
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
  console.log("\n");
  console.log("Agentes IA (6):");
  console.log("  🤖 Super Rowi - Asistente principal");
  console.log("  🧠 Rowi EQ - Coach de inteligencia emocional");
  console.log("  💚 Rowi Affinity - Experto en relaciones");
  console.log("  💬 Rowi ECO - Comunicacion emocional");
  console.log("  🏋️ Rowi Trainer - Entrenador personal");
  console.log("  💼 Rowi Sales - Coach de ventas");
  console.log("\n");
  console.log("Datos de prueba:");
  console.log("  - EQ Snapshot para Eduardo (SEI completo)");
  console.log("  - Avatar Evolution con milestones");
  console.log("  - 7 Achievements disponibles");
  console.log("  - System Settings configurados");
  console.log("  - Emotional Config activo");
  console.log("\n");
  console.log("¡Rowi está listo para pruebas! 🚀");
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
