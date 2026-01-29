// prisma/seed.ts
// ============================================================
// ROWI - Seed del Ecosistema Completo
// ============================================================
// Crea toda la estructura jerarquica necesaria para ejecutar ROWI:
// RowiVerse -> SuperHub -> Tenant -> Hub -> Organization
// Incluye: Planes, Usuarios, Roles, Agentes IA, Gamificacion
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI - SEED DEL ECOSISTEMA");
  console.log("=".repeat(60));
  console.log("\n");

  // ============================================================
  // 1. ROWIVERSE - Raiz global del ecosistema
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
  console.log("   RowiVerse:", rowiverse.id);

  // ============================================================
  // 2. SYSTEM (CACTUS) - Nucleo del sistema
  // ============================================================
  console.log("\n2. Creando System...");

  const system = await prisma.system.upsert({
    where: { slug: "cactus" },
    update: {},
    create: {
      name: "Cactus Global System",
      slug: "cactus",
      description: "Sistema raiz de la plataforma ROWI/Cactus",
      logo: "/cactus-logo.png",
      primaryColor: "#0F172A",
      secondaryColor: "#F97316",
      defaultLang: "es",
      timezone: "America/Lima",
      active: true,
    },
  });
  console.log("   System:", system.id);

  // ============================================================
  // 3. PLANES ROWI - 6 Planes Completos
  // ============================================================
  console.log("\n3. Creando Planes ROWI...");

  const plansData = [
    // ============================================================
    // 1. FREE ROWI - Plan gratuito
    // ============================================================
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
      features: [
        "10 tokens IA / mes",
        "Acceso a Rowi EQ básico",
        "1 comunidad",
        "Soporte comunitario"
      ],
      featuresEN: [
        "10 AI tokens / month",
        "Basic Rowi EQ access",
        "1 community",
        "Community support"
      ],
      limitations: [
        "Sin SEI incluido",
        "Sin grupos privados",
        "Sin reportes avanzados"
      ],
      limitationsEN: [
        "SEI not included",
        "No private groups",
        "No advanced reports"
      ],
    },

    // ============================================================
    // 2. ROWI+ - Plan individual premium
    // ============================================================
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
        "Soporte por email"
      ],
      featuresEN: [
        "150 AI tokens / month",
        "All Rowi agents",
        "Brain Brief Profile included",
        "20% discount on SEI",
        "Up to 3 communities",
        "Private groups",
        "Advanced reports",
        "Email support"
      ],
      limitations: [
        "Sin benchmarks",
        "Sin integraciones",
        "Sin dashboard ejecutivo"
      ],
      limitationsEN: [
        "No benchmarks",
        "No integrations",
        "No executive dashboard"
      ],
    },

    // ============================================================
    // 3. ROWI Family - Plan familiar
    // ============================================================
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
        "Soporte por chat"
      ],
      featuresEN: [
        "500 shared AI tokens / month",
        "Up to 6 family members",
        "All Rowi agents",
        "Brain Brief for everyone",
        "30% discount on SEI",
        "Family benchmarks",
        "Family dashboard",
        "Chat support"
      ],
      limitations: [
        "Sin integraciones empresariales",
        "Sin API"
      ],
      limitationsEN: [
        "No enterprise integrations",
        "No API"
      ],
    },

    // ============================================================
    // 4. ROWI Pro - Plan profesional
    // ============================================================
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
        "Soporte prioritario"
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
        "Priority support"
      ],
      limitations: [
        "Sin API",
        "Sin integraciones avanzadas"
      ],
      limitationsEN: [
        "No API",
        "No advanced integrations"
      ],
    },

    // ============================================================
    // 5. ROWI Business - Plan empresarial
    // ============================================================
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
        "Soporte prioritario"
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
        "Priority support"
      ],
      limitations: [
        "Mínimo 20 usuarios"
      ],
      limitationsEN: [
        "Minimum 20 users"
      ],
    },

    // ============================================================
    // 6. ROWI Enterprise - Plan enterprise personalizado
    // ============================================================
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
        "SLA garantizado"
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
        "Guaranteed SLA"
      ],
      limitations: [],
      limitationsEN: [],
    },
  ];

  const plans: Record<string, any> = {};
  for (const p of plansData) {
    const plan = await prisma.plan.upsert({
      where: { name: p.name },
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
    plans[p.name] = plan;
    console.log(`   ${p.emoji} Plan "${p.name}": ${plan.id}`);
  }

  // ============================================================
  // 4. SUPERHUB GLOBAL
  // ============================================================
  console.log("\n4. Creando SuperHub...");

  const superHub = await prisma.superHub.upsert({
    where: { slug: "cactus-hub-global" },
    update: {},
    create: {
      name: "Cactus Hub Global",
      slug: "cactus-hub-global",
      description: "SuperHub raiz del ecosistema Rowi/Cactus",
      vision: "Democratizar la inteligencia emocional",
      mission: "Potenciar el desarrollo humano con tecnologia empatica",
      colorTheme: "#31A2E3",
      region: "LATAM",
      country: "Global",
      language: "es",
      rowiVerseId: rowiverse.id,
      systemId: system.id,
    },
  });
  console.log("   SuperHub:", superHub.id);

  // ============================================================
  // 5. TENANT MASTER
  // ============================================================
  console.log("\n5. Creando Tenant...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "rowi-master" },
    update: {},
    create: {
      name: "Rowi Master",
      slug: "rowi-master",
      billingEmail: "admin@rowi.app",
      superHubId: superHub.id,
      rowiVerseId: rowiverse.id,
      systemId: system.id,
      planId: plans["ROWI Enterprise"].id,
      visibilityScope: "global",
      emotionalAccess: { allAgents: true, coaching: true, analytics: true },
    },
  });
  console.log("   Tenant:", tenant.id);

  // ============================================================
  // 6. HUB PRINCIPAL
  // ============================================================
  console.log("\n6. Creando Hub...");

  const hub = await prisma.hub.upsert({
    where: { slug: "rowi-hub" },
    update: {},
    create: {
      name: "Rowi Hub",
      slug: "rowi-hub",
      description: "Hub principal del ecosistema Rowi",
      visibility: "private",
      themeColor: "#007AFF",
      superHubId: superHub.id,
      tenantId: tenant.id,
    },
  });
  console.log("   Hub:", hub.id);

  // ============================================================
  // 7. ORGANIZATION
  // ============================================================
  console.log("\n7. Creando Organization...");

  const org = await prisma.organization.upsert({
    where: { slug: "rowi-organization" },
    update: {},
    create: {
      name: "Rowi Organization",
      slug: "rowi-organization",
      description: "Organizacion principal del ecosistema Rowi",
      superHubId: superHub.id,
      hubId: hub.id,
      rowiVerseId: rowiverse.id,
    },
  });
  console.log("   Organization:", org.id);

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
  console.log("   Organization vinculada a Tenant");

  // ============================================================
  // 8. SUPERADMIN USER
  // ============================================================
  console.log("\n8. Creando SuperAdmin...");

  const adminEmail = "eduardo@cactuscomunidadcreativa.com";

  const superadmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      active: true,
      allowAI: true,
      organizationRole: "SUPERADMIN",
      primaryTenantId: tenant.id,
      planId: plans["ROWI Enterprise"].id,
    },
    create: {
      name: "Eduardo Gonzalez",
      email: adminEmail,
      active: true,
      allowAI: true,
      organizationRole: "SUPERADMIN",
      primaryTenantId: tenant.id,
      planId: plans["ROWI Enterprise"].id,
      country: "PE",
      region: "Lima",
      city: "Lima",
      language: "es",
      timezone: "America/Lima",
    },
  });
  console.log("   SuperAdmin:", superadmin.id);

  // ============================================================
  // 9. ROWIVERSE USER - Identidad global
  // ============================================================
  console.log("\n9. Creando RowiVerseUser...");

  const rowiverseUser = await prisma.rowiVerseUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Eduardo Gonzalez",
      userId: superadmin.id,
      rowiVerseId: rowiverse.id,
      verified: true,
      active: true,
      country: "PE",
      language: "es",
      status: "active",
    },
  });
  console.log("   RowiVerseUser:", rowiverseUser.id);

  // Vincular User con RowiVerseUser
  await prisma.user.update({
    where: { id: superadmin.id },
    data: { rowiverseId: rowiverseUser.id },
  });

  // ============================================================
  // 10. MEMBERSHIPS
  // ============================================================
  console.log("\n10. Creando Memberships...");

  // Membership Tenant
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: superadmin.id, tenantId: tenant.id } },
    update: { role: "SUPERADMIN", tokenQuota: 999999 },
    create: {
      userId: superadmin.id,
      tenantId: tenant.id,
      role: "SUPERADMIN",
      planId: plans["ROWI Enterprise"].id,
      tokenQuota: 999999,
      tokenUsed: 0,
    },
  });
  console.log("   Membership Tenant creado");

  // Membership Organization
  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: superadmin.id } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: {
      organizationId: org.id,
      userId: superadmin.id,
      role: "OWNER",
      status: "ACTIVE",
      tokenQuota: 999999,
      tokenUsed: 0,
    },
  });
  console.log("   Membership Organization creado");

  // Membership Hub
  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: superadmin.id } },
    update: { access: "FULL" },
    create: {
      hubId: hub.id,
      userId: superadmin.id,
      access: "FULL",
      joinedAt: new Date(),
    },
  });
  console.log("   Membership Hub creado");

  // ============================================================
  // 11. USER PERMISSIONS
  // ============================================================
  console.log("\n11. Creando Permissions...");

  const permissionsData = [
    { scopeType: "rowiverse" as const, scopeId: rowiverse.id, role: "superadmin" },
    { scopeType: "superhub" as const, scopeId: superHub.id, role: "superadmin" },
    { scopeType: "tenant" as const, scopeId: tenant.id, role: "manager" },
    { scopeType: "hub" as const, scopeId: hub.id, role: "admin" },
    { scopeType: "organization" as const, scopeId: org.id, role: "owner" },
  ];

  for (const perm of permissionsData) {
    // Check if permission already exists
    const existing = await prisma.userPermission.findFirst({
      where: {
        userId: superadmin.id,
        scopeType: perm.scopeType,
        scopeId: perm.scopeId,
      },
    });

    if (existing) {
      await prisma.userPermission.update({
        where: { id: existing.id },
        data: { role: perm.role },
      });
    } else {
      await prisma.userPermission.create({
        data: {
          userId: superadmin.id,
          scopeType: perm.scopeType,
          scopeId: perm.scopeId,
          role: perm.role,
          scope: "global",
        },
      });
    }
    console.log(`   Permission ${perm.scopeType}:${perm.role}`);
  }

  // ============================================================
  // 12. AGENT CONFIGS - Agentes IA
  // ============================================================
  console.log("\n12. Creando Agentes IA...");

  const agentsData = [
    {
      slug: "super",
      name: "Super Rowi",
      description: "Coordinador multimodal que orquesta todos los agentes IA",
      avatar: "/agents/super.png",
      type: "ORCHESTRATOR",
      model: "gpt-4o-mini",
      prompt: `Eres Super Rowi, asistente integral de inteligencia emocional.
Tu rol es coordinar los subagentes (EQ, Affinity, ECO, Sales, Trainer).
Tono calido, empatico, humano y accionable.`,
      tone: "professional",
    },
    {
      slug: "eq",
      name: "Rowi EQ",
      description: "Coach experto en Inteligencia Emocional Six Seconds",
      avatar: "/agents/eq.png",
      type: "EQ_SPECIALIST",
      model: "gpt-4o-mini",
      prompt: `Eres Rowi, coach de Inteligencia Emocional del modelo Six Seconds.
Usa el marco KCG con las 8 competencias: EL, RP, ACT, NE, IM, OP, EMP, NG.
Se calido, empatico y breve.`,
      tone: "empathetic",
    },
    {
      slug: "affinity",
      name: "Rowi Affinity",
      description: "Coach tactico de afinidad interpersonal",
      avatar: "/agents/affinity.png",
      type: "RELATIONSHIP_ANALYST",
      model: "gpt-4o-mini",
      prompt: `Eres Rowi, coach tactico de afinidad interpersonal.
Analizas y fortaleces relaciones usando Growth, Collaboration, Understanding.
Lenguaje calido, humano y breve.`,
      tone: "friendly",
    },
    {
      slug: "eco",
      name: "Rowi ECO",
      description: "Experto en comunicacion emocional",
      avatar: "/agents/eco.png",
      type: "COMMUNICATION_EXPERT",
      model: "gpt-4o-mini",
      prompt: `Eres Rowi, experto en comunicacion emocional (ECO).
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

  // Crear agentes GLOBALES (sin tenantId) - usando findFirst + create/update
  for (const agent of agentsData) {
    const existingGlobal = await prisma.agentConfig.findFirst({
      where: {
        slug: agent.slug,
        tenantId: null,
        superHubId: null,
        organizationId: null,
        hubId: null,
      },
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
    console.log(`   [GLOBAL] ${agent.name}`);
  }

  // Crear agentes para TENANT con cultura corporativa
  const tenantCulture = {
    culturePrompt: `CULTURA ROWI:
- Pioneros en inteligencia emocional aplicada
- Valoramos autenticidad, empatia y crecimiento
- Lenguaje cercano pero profesional`,
    companyValues: ["Empatia", "Crecimiento", "Autenticidad", "Colaboracion"],
    companyMission: "Democratizar la inteligencia emocional",
    companyTone: "Calido, inspirador, cercano pero profesional",
    industryContext: "EdTech/HRTech",
  };

  for (const agent of agentsData) {
    const existingTenant = await prisma.agentConfig.findFirst({
      where: {
        slug: agent.slug,
        tenantId: tenant.id,
        superHubId: null,
        organizationId: null,
        hubId: null,
      },
    });

    if (existingTenant) {
      await prisma.agentConfig.update({
        where: { id: existingTenant.id },
        data: {
          culturePrompt: tenantCulture.culturePrompt,
          companyValues: tenantCulture.companyValues,
          companyMission: tenantCulture.companyMission,
          companyTone: tenantCulture.companyTone,
          industryContext: tenantCulture.industryContext,
        },
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
    }
    console.log(`   [TENANT] ${agent.name}`);
  }

  // ============================================================
  // 13. AVATAR EVOLUTION - Gamificacion
  // ============================================================
  console.log("\n13. Creando Avatar Evolution...");

  const avatar = await prisma.avatarEvolution.upsert({
    where: { userId: superadmin.id },
    update: {},
    create: {
      userId: superadmin.id,
      stage: "ADULT",
      experience: 10000,
      hatched: true,
      hatchProgress: 100,
      brainStyle: "Visionary",
      accessories: [],
      colors: { primary: "#31a2e3", secondary: "#f378a5" },
    },
  });
  console.log("   Avatar:", avatar.id);

  // Milestones
  const milestones = [
    { type: "PROFILE_COMPLETE" as const, title: "Perfil Completo", xpReward: 100 },
    { type: "SEI_COMPLETE" as const, title: "SEI Completado", xpReward: 500 },
    { type: "FIRST_COACH_SESSION" as const, title: "Primera Sesion", xpReward: 200 },
  ];

  for (const m of milestones) {
    await prisma.avatarMilestone.create({
      data: {
        avatarId: avatar.id,
        type: m.type,
        title: m.title,
        xpReward: m.xpReward,
        achievedAt: new Date(),
      },
    });
    console.log(`   Milestone: ${m.title}`);
  }

  // Streak
  await prisma.avatarStreak.upsert({
    where: { avatarId_type: { avatarId: avatar.id, type: "DAILY" } },
    update: {},
    create: {
      avatarId: avatar.id,
      type: "DAILY",
      currentDays: 30,
      longestDays: 45,
      lastActive: new Date(),
    },
  });
  console.log("   Streak creado");

  // ============================================================
  // 14. TENANT BRANDING
  // ============================================================
  console.log("\n14. Creando Tenant Branding...");

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      primaryColor: "#31a2e3",
      secondaryColor: "#f378a5",
      accentColor: "#6bc3b0",
      colorK: "#1E88E5",
      colorC: "#7A59C9",
      colorG: "#43A047",
      logoUrl: "/logos/rowi-logo.png",
      fontHeading: "Varela Round",
      fontBody: "Poppins",
      defaultTheme: "light",
      isActive: true,
    },
  });
  console.log("   Branding creado");

  // ============================================================
  // 15. SYSTEM SETTINGS
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
  ];

  for (const s of settingsData) {
    await prisma.systemSetting.upsert({
      where: { systemId_key: { systemId: system.id, key: s.key } },
      update: { value: s.value },
      create: { systemId: system.id, key: s.key, value: s.value, type: s.type },
    });
    console.log(`   Setting: ${s.key}`);
  }

  // ============================================================
  // 16. TRANSLATIONS
  // ============================================================
  console.log("\n16. Creando Translations...");

  const translations = [
    { ns: "common", key: "app.name", lang: "es", value: "Rowi" },
    { ns: "common", key: "app.name", lang: "en", value: "Rowi" },
    { ns: "common", key: "welcome", lang: "es", value: "Bienvenido" },
    { ns: "common", key: "welcome", lang: "en", value: "Welcome" },
    { ns: "dashboard", key: "title", lang: "es", value: "Panel de Control" },
    { ns: "dashboard", key: "title", lang: "en", value: "Dashboard" },
    { ns: "affinity", key: "title", lang: "es", value: "Afinidad" },
    { ns: "affinity", key: "title", lang: "en", value: "Affinity" },
  ];

  for (const t of translations) {
    await prisma.translation.upsert({
      where: {
        tenantId_ns_key_lang: {
          tenantId: tenant.id,
          ns: t.ns,
          key: t.key,
          lang: t.lang,
        },
      },
      update: { value: t.value },
      create: {
        tenantId: tenant.id,
        ns: t.ns,
        key: t.key,
        lang: t.lang,
        value: t.value,
      },
    });
  }
  console.log(`   ${translations.length} traducciones creadas`);

  // ============================================================
  // 17. ROWI COMMUNITY
  // ============================================================
  console.log("\n17. Creando RowiCommunity...");

  const community = await prisma.rowiCommunity.upsert({
    where: { slug: "rowi-pioneers" },
    update: {},
    create: {
      name: "Rowi Pioneers",
      slug: "rowi-pioneers",
      description: "Comunidad de pioneros en inteligencia emocional",
      type: "PROFESSIONAL",
      visibility: "PUBLIC",
      language: "es",
      createdById: superadmin.id,
      superHubId: superHub.id,
      tenantId: tenant.id,
      hubId: hub.id,
      rowiVerseId: rowiverse.id,
    },
  });
  console.log("   Community:", community.id);

  // Agregar admin como miembro (usando upsert-like pattern)
  const existingMember = await prisma.rowiCommunityUser.findFirst({
    where: { userId: superadmin.id, communityId: community.id },
  });

  if (!existingMember) {
    await prisma.rowiCommunityUser.create({
      data: {
        communityId: community.id,
        userId: superadmin.id,
        rowiverseUserId: rowiverseUser.id,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      },
    });
  }
  console.log("   Admin agregado como owner");

  // ============================================================
  // 18. EMOTIONAL CONFIG
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
  console.log("   Emotional Config creado");

  // ============================================================
  // 19. SIX SECONDS ROWIVERSE - Ecosistema de pruebas
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  SIX SECONDS - ECOSISTEMA DE PRUEBAS");
  console.log("=".repeat(60));
  console.log("\n");

  // 19.1 Six Seconds RowiVerse
  console.log("19.1 Creando Six Seconds RowiVerse...");
  const sixSecondsRowiverse = await prisma.rowiVerse.upsert({
    where: { slug: "six-seconds" },
    update: {},
    create: {
      name: "Six Seconds",
      slug: "six-seconds",
      description: "Ecosistema Global de Inteligencia Emocional - Six Seconds Network",
      visibility: "public",
    },
  });
  console.log("   Six Seconds RowiVerse:", sixSecondsRowiverse.id);

  // 19.2 Six Seconds SuperHub
  console.log("\n19.2 Creando Six Seconds SuperHub...");
  const sixSecondsSuperHub = await prisma.superHub.upsert({
    where: { slug: "six-seconds-global" },
    update: {},
    create: {
      name: "Six Seconds Global Network",
      slug: "six-seconds-global",
      description: "Red global de inteligencia emocional Six Seconds",
      vision: "Un mundo donde la inteligencia emocional es valorada y practicada",
      mission: "Apoyar a mil millones de personas a practicar la inteligencia emocional",
      colorTheme: "#F7941D",
      region: "Global",
      country: "Global",
      language: "en",
      rowiVerseId: sixSecondsRowiverse.id,
      systemId: system.id,
    },
  });
  console.log("   Six Seconds SuperHub:", sixSecondsSuperHub.id);

  // 19.3 Six Seconds Tenant
  console.log("\n19.3 Creando Six Seconds Tenant...");
  const sixSecondsTenant = await prisma.tenant.upsert({
    where: { slug: "six-seconds" },
    update: {},
    create: {
      name: "Six Seconds",
      slug: "six-seconds",
      billingEmail: "admin@6seconds.org",
      superHubId: sixSecondsSuperHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
      systemId: system.id,
      planId: plans["ROWI Enterprise"].id,
      visibilityScope: "global",
      emotionalAccess: { allAgents: true, coaching: true, analytics: true, ssoEnabled: true },
    },
  });
  console.log("   Six Seconds Tenant:", sixSecondsTenant.id);

  // 19.4 Six Seconds Hub
  console.log("\n19.4 Creando Six Seconds Hub...");
  const sixSecondsHub = await prisma.hub.upsert({
    where: { slug: "six-seconds-hub" },
    update: {},
    create: {
      name: "Six Seconds Hub",
      slug: "six-seconds-hub",
      description: "Hub principal de Six Seconds para graduados y partners",
      visibility: "private",
      themeColor: "#F7941D",
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
    },
  });
  console.log("   Six Seconds Hub:", sixSecondsHub.id);

  // 19.5 Six Seconds Organization
  console.log("\n19.5 Creando Six Seconds Organization...");
  const sixSecondsOrg = await prisma.organization.upsert({
    where: { slug: "six-seconds-org" },
    update: {},
    create: {
      name: "Six Seconds Organization",
      slug: "six-seconds-org",
      description: "Organizacion Six Seconds - Pioneers of Emotional Intelligence",
      superHubId: sixSecondsSuperHub.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
    },
  });
  console.log("   Six Seconds Organization:", sixSecondsOrg.id);

  // Vincular Organization con Tenant
  await prisma.organizationToTenant.upsert({
    where: {
      tenantId_organizationId: {
        tenantId: sixSecondsTenant.id,
        organizationId: sixSecondsOrg.id,
      },
    },
    update: {},
    create: {
      tenantId: sixSecondsTenant.id,
      organizationId: sixSecondsOrg.id,
    },
  });

  // 19.6 Six Seconds Branding
  console.log("\n19.6 Creando Six Seconds Branding...");
  await prisma.tenantBranding.upsert({
    where: { tenantId: sixSecondsTenant.id },
    update: {},
    create: {
      tenantId: sixSecondsTenant.id,
      primaryColor: "#F7941D",
      secondaryColor: "#00A99D",
      accentColor: "#662D91",
      colorK: "#00A99D",
      colorC: "#662D91",
      colorG: "#F7941D",
      logoUrl: "/logos/six-seconds-logo.png",
      fontHeading: "Montserrat",
      fontBody: "Open Sans",
      defaultTheme: "light",
      isActive: true,
    },
  });
  console.log("   Six Seconds Branding creado");

  // 19.7 Six Seconds Admin Users (Eduardo y Josh)
  console.log("\n19.7 Creando Six Seconds Admins...");

  // Helper para crear admin con RowiVerseUser
  async function createSixSecondsAdmin(adminData: {
    email: string;
    name: string;
    country: string;
    language: string;
    timezone: string;
  }) {
    const admin = await prisma.user.upsert({
      where: { email: adminData.email },
      update: {
        active: true,
        allowAI: true,
        organizationRole: "ADMIN",
        primaryTenantId: sixSecondsTenant.id,
        // SSO deshabilitado por ahora
        // ssoProvider: "six-seconds",
        // ssoProviderId: `ss-${adminData.email.split("@")[0]}`,
      },
      create: {
        name: adminData.name,
        email: adminData.email,
        active: true,
        allowAI: true,
        organizationRole: "ADMIN",
        primaryTenantId: sixSecondsTenant.id,
        planId: plans["ROWI Enterprise"].id,
        country: adminData.country,
        language: adminData.language,
        timezone: adminData.timezone,
        // SSO deshabilitado por ahora
        // ssoProvider: "six-seconds",
        // ssoProviderId: `ss-${adminData.email.split("@")[0]}`,
      },
    });

    const rvUser = await prisma.rowiVerseUser.upsert({
      where: { email: adminData.email },
      update: {},
      create: {
        email: adminData.email,
        name: adminData.name,
        userId: admin.id,
        rowiVerseId: sixSecondsRowiverse.id,
        verified: true,
        active: true,
        country: adminData.country,
        language: adminData.language,
        status: "active",
      },
    });

    await prisma.user.update({
      where: { id: admin.id },
      data: { rowiverseId: rvUser.id },
    });

    // Membership Tenant
    await prisma.membership.upsert({
      where: { userId_tenantId: { userId: admin.id, tenantId: sixSecondsTenant.id } },
      update: { role: "ADMIN", tokenQuota: 50000 },
      create: {
        userId: admin.id,
        tenantId: sixSecondsTenant.id,
        role: "ADMIN",
        planId: plans["ROWI Enterprise"].id,
        tokenQuota: 50000,
        tokenUsed: 0,
      },
    });

    // Membership Hub
    await prisma.hubMembership.upsert({
      where: { hubId_userId: { hubId: sixSecondsHub.id, userId: admin.id } },
      update: { access: "FULL" },
      create: {
        hubId: sixSecondsHub.id,
        userId: admin.id,
        access: "FULL",
        joinedAt: new Date(),
      },
    });

    // Permissions
    const perms = [
      { scopeType: "rowiverse" as const, scopeId: sixSecondsRowiverse.id, role: "admin" },
      { scopeType: "superhub" as const, scopeId: sixSecondsSuperHub.id, role: "admin" },
      { scopeType: "tenant" as const, scopeId: sixSecondsTenant.id, role: "admin" },
      { scopeType: "hub" as const, scopeId: sixSecondsHub.id, role: "admin" },
    ];

    for (const perm of perms) {
      const existing = await prisma.userPermission.findFirst({
        where: { userId: admin.id, scopeType: perm.scopeType, scopeId: perm.scopeId },
      });
      if (!existing) {
        await prisma.userPermission.create({
          data: {
            userId: admin.id,
            scopeType: perm.scopeType,
            scopeId: perm.scopeId,
            role: perm.role,
            scope: "global",
          },
        });
      }
    }

    console.log(`   Admin: ${adminData.name} (${adminData.email})`);
    return { admin, rvUser };
  }

  // Crear Eduardo como admin
  const { admin: eduardoAdmin, rvUser: eduardoRvUser } = await createSixSecondsAdmin({
    email: "eduardo.gonzalez@6seconds.org",
    name: "Eduardo Gonzalez",
    country: "PE",
    language: "es",
    timezone: "America/Lima",
  });

  // Crear Josh como admin
  const { admin: joshAdmin, rvUser: joshRvUser } = await createSixSecondsAdmin({
    email: "josh@6seconds.org",
    name: "Josh Freedman",
    country: "US",
    language: "en",
    timezone: "America/Los_Angeles",
  });

  // Usar Eduardo como referencia principal para las comunidades
  const sixSecondsAdmin = eduardoAdmin;
  const sixSecondsRowiverseUser = eduardoRvUser;
  const sixSecondsAdminEmail = "eduardo.gonzalez@6seconds.org";

  // 19.8 Six Seconds Permissions ya creados en createSixSecondsAdmin
  console.log("\n19.8 Permissions creados para Eduardo y Josh");

  // Agregar Josh a todas las comunidades también
  console.log("\n19.9 Agregando Josh como admin a comunidades...");

  // 19.11 Six Seconds Communities
  console.log("\n19.11 Creando Six Seconds Communities...");

  // Comunidad de Graduados SEI
  const seiGraduates = await prisma.rowiCommunity.upsert({
    where: { slug: "sei-graduates" },
    update: {},
    create: {
      name: "SEI Graduates",
      slug: "sei-graduates",
      description: "Comunidad de graduados certificados en SEI - Six Seconds Emotional Intelligence",
      type: "PROFESSIONAL",
      visibility: "PRIVATE",
      language: "en",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
    },
  });
  console.log("   Community SEI Graduates:", seiGraduates.id);

  // Comunidad de Partners
  const seiPartners = await prisma.rowiCommunity.upsert({
    where: { slug: "sei-partners" },
    update: {},
    create: {
      name: "Six Seconds Partners",
      slug: "sei-partners",
      description: "Red de partners y distribuidores autorizados de Six Seconds",
      type: "PROFESSIONAL",
      visibility: "PRIVATE",
      language: "en",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
    },
  });
  console.log("   Community SEI Partners:", seiPartners.id);

  // Comunidad LATAM
  const seiLatam = await prisma.rowiCommunity.upsert({
    where: { slug: "sei-latam" },
    update: {},
    create: {
      name: "Six Seconds LATAM",
      slug: "sei-latam",
      description: "Comunidad de practitioners de inteligencia emocional en Latinoamerica",
      type: "REGIONAL",
      visibility: "PUBLIC",
      language: "es",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
    },
  });
  console.log("   Community SEI LATAM:", seiLatam.id);

  // Comunidad de Coaches
  const seiCoaches = await prisma.rowiCommunity.upsert({
    where: { slug: "sei-coaches" },
    update: {},
    create: {
      name: "EQ Coaches Network",
      slug: "sei-coaches",
      description: "Red de coaches certificados en inteligencia emocional",
      type: "PROFESSIONAL",
      visibility: "PRIVATE",
      language: "en",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
    },
  });
  console.log("   Community EQ Coaches:", seiCoaches.id);

  // Comunidad de Educadores
  const seiEducators = await prisma.rowiCommunity.upsert({
    where: { slug: "sei-educators" },
    update: {},
    create: {
      name: "EQ Educators",
      slug: "sei-educators",
      description: "Educadores implementando inteligencia emocional en escuelas",
      type: "EDUCATION",
      visibility: "PUBLIC",
      language: "en",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
    },
  });
  console.log("   Community EQ Educators:", seiEducators.id);

  // ============================================================
  // SIX SECONDS STAFF - Comunidad principal con equipos/sub-comunidades
  // ============================================================
  console.log("\n19.11b Creando Six Seconds Staff (comunidad con equipos)...");

  // Comunidad principal Staff
  const sixSecondsStaff = await prisma.rowiCommunity.upsert({
    where: { slug: "six-seconds-staff" },
    update: {},
    create: {
      name: "Six Seconds Staff",
      slug: "six-seconds-staff",
      description: "Equipo interno de Six Seconds - Staff global",
      type: "INTERNAL",
      visibility: "PRIVATE",
      language: "en",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
    },
  });
  console.log("   Community Six Seconds Staff:", sixSecondsStaff.id);

  // Sub-comunidad/Equipo: Staff LATAM
  const staffLatam = await prisma.rowiCommunity.upsert({
    where: { slug: "staff-latam" },
    update: {},
    create: {
      name: "Staff LATAM",
      slug: "staff-latam",
      description: "Equipo Six Seconds Latinoamérica",
      type: "TEAM",
      visibility: "PRIVATE",
      language: "es",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
      superId: sixSecondsStaff.id, // Sub-comunidad de Staff
    },
  });
  console.log("   Team Staff LATAM:", staffLatam.id);

  // Sub-comunidad/Equipo: Staff USA
  const staffUsa = await prisma.rowiCommunity.upsert({
    where: { slug: "staff-usa" },
    update: {},
    create: {
      name: "Staff USA",
      slug: "staff-usa",
      description: "Equipo Six Seconds Estados Unidos",
      type: "TEAM",
      visibility: "PRIVATE",
      language: "en",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
      superId: sixSecondsStaff.id, // Sub-comunidad de Staff
    },
  });
  console.log("   Team Staff USA:", staffUsa.id);

  // Sub-comunidad/Equipo: Staff Europe
  const staffEurope = await prisma.rowiCommunity.upsert({
    where: { slug: "staff-europe" },
    update: {},
    create: {
      name: "Staff Europe",
      slug: "staff-europe",
      description: "Equipo Six Seconds Europa",
      type: "TEAM",
      visibility: "PRIVATE",
      language: "en",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
      superId: sixSecondsStaff.id, // Sub-comunidad de Staff
    },
  });
  console.log("   Team Staff Europe:", staffEurope.id);

  // Sub-comunidad/Equipo: Staff Asia
  const staffAsia = await prisma.rowiCommunity.upsert({
    where: { slug: "staff-asia" },
    update: {},
    create: {
      name: "Staff Asia",
      slug: "staff-asia",
      description: "Equipo Six Seconds Asia",
      type: "TEAM",
      visibility: "PRIVATE",
      language: "en",
      createdById: sixSecondsAdmin.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      hubId: sixSecondsHub.id,
      rowiVerseId: sixSecondsRowiverse.id,
      superId: sixSecondsStaff.id, // Sub-comunidad de Staff
    },
  });
  console.log("   Team Staff Asia:", staffAsia.id);

  // 19.12 Agregar Eduardo y Josh a todas las comunidades
  console.log("\n19.12 Agregando admins a comunidades...");

  // Todas las comunidades incluyendo Staff y sus equipos
  const allSixSecondsCommunities = [
    seiGraduates, seiPartners, seiLatam, seiCoaches, seiEducators,
    sixSecondsStaff, staffLatam, staffUsa, staffEurope, staffAsia
  ];

  // Agregar Eduardo (owner) a todas
  for (const comm of allSixSecondsCommunities) {
    const existingMember = await prisma.rowiCommunityUser.findFirst({
      where: { userId: eduardoAdmin.id, communityId: comm.id },
    });

    if (!existingMember) {
      await prisma.rowiCommunityUser.create({
        data: {
          communityId: comm.id,
          userId: eduardoAdmin.id,
          rowiverseUserId: eduardoRvUser.id,
          name: "Eduardo Gonzalez",
          email: "eduardo.gonzalez@6seconds.org",
          role: "owner",
          status: "active",
          language: comm.language || "en",
          joinedAt: new Date(),
        },
      });
    }
  }
  console.log("   Eduardo agregado como owner a 10 comunidades");

  // Agregar Josh (admin) a todas
  for (const comm of allSixSecondsCommunities) {
    const existingMember = await prisma.rowiCommunityUser.findFirst({
      where: { userId: joshAdmin.id, communityId: comm.id },
    });

    if (!existingMember) {
      await prisma.rowiCommunityUser.create({
        data: {
          communityId: comm.id,
          userId: joshAdmin.id,
          rowiverseUserId: joshRvUser.id,
          name: "Josh Freedman",
          email: "josh@6seconds.org",
          role: "admin",
          status: "active",
          language: comm.language || "en",
          joinedAt: new Date(),
        },
      });
    }
  }
  console.log("   Josh agregado como admin a 10 comunidades");

  // ============================================================
  // 19.13 STAFF RETREAT SEI DATA - Usuarios reales con datos SEI
  // ============================================================
  console.log("\n19.13 Creando Staff Retreat con datos SEI reales...");

  // Datos reales del Staff Retreat SEI (Sept 2025)
  const staffRetreatData = [
    { id: "444498", name: "Jayne Morrison", email: "jayne@6seconds.org", country: "AE", lang: "en", gender: "F", age: 59, jobFunction: "SENIOR_STRATEGICMANAGEMENT", jobRole: "SENIOREXECUTIVE", sector: "EDUCATION", education: "ADVANCEDDEGREE", date: "2021-01-18", executionTime: 615, eqScore: 108.797419, kScore: 117, cScore: 112, gScore: 96, el: 118.050779, rp: 116.521379, act: 116.137376, ne: 99.0285671, im: 119.482869, op: 117.371841, emp: 81.9642198, ng: 110.237808, effectiveness: 119.474839, relationship: 114.53106, qualityOfLife: 106.390927, wellbeing: 115.663854, overall4: 114.01517, influence: 121.059966, decisionMaking: 117.889712, community: 111.73895, network: 117.32317, achievement: 108.608489, satisfaction: 104.173365, balance: 118.19486, health: 113.132847, mood: "Trust", intensity: "Accepting", reliabilityIndex: 104.3177612, positiveImpression: "Average", brainProfile: "Deliverer", dataMining: 117.3677127, modeling: 117.2358959, prioritizing: 116.6872446, connection: 94.32960639, emotionalInsight: 98.33922407, collaboration: 89.88490771, reflecting: 97.2998311, adaptability: 101.0869681, criticalThinking: 106.0688532, resilience: 107.5473376, riskTolerance: 101.7727823, imagination: 103.8109239, proactivity: 106.0601733, commitment: 112.174598, problemSolving: 111.7631095, vision: 105.5997359, designing: 105.7277371, entrepreneurship: 106.0112244, brainAgility: 109.8493549 },
    { id: "549329", name: "Jenny Wiley", email: "jenny@6seconds.org", country: "US", lang: "en", gender: "F", age: 55, jobFunction: "ADMINISTRATION_SUPPORTSERVICES", jobRole: "MANAGEMENT", sector: "EDUCATION", education: "UNIVERSITY", date: "2022-06-07", executionTime: 468, eqScore: 117.807066, kScore: 121, cScore: 117, gScore: 115, el: 122.016098, rp: 120.32347, act: 119.020417, ne: 117.601358, im: 117.333149, op: 114.032045, emp: 112.220721, ng: 118.288624, effectiveness: 115.18119, relationship: 114.53106, qualityOfLife: 110.671004, wellbeing: 115.663854, overall4: 114.011777, influence: 108.149672, decisionMaking: 122.212707, community: 111.73895, network: 117.32317, achievement: 108.608489, satisfaction: 112.733518, balance: 118.19486, health: 113.132847, mood: "Joy", intensity: "Serene", reliabilityIndex: 91.19721479, positiveImpression: "Average", brainProfile: "Strategist", dataMining: 113.6556368, modeling: 110.2952385, prioritizing: 112.512293, connection: 108.2538043, emotionalInsight: 109.3421794, collaboration: 107.3800731, reflecting: 109.4088605, adaptability: 111.044733, criticalThinking: 111.3501844, resilience: 108.1059129, riskTolerance: 108.2734148, imagination: 107.8768243, proactivity: 109.5066026, commitment: 108.3168313, problemSolving: 109.9796222, vision: 110.6166056, designing: 111.0509566, entrepreneurship: 108.9538147, brainAgility: 117.6044854 },
    { id: "607558", name: "Jeff Kinsley", email: "jeff.kinsley@6seconds.org", country: "US", lang: "en", gender: "M", age: 62, jobFunction: "EDUCATION_TRAINING", jobRole: "SENIOREXECUTIVE", sector: "EDUCATION", education: "ADVANCEDDEGREE", date: "2023-05-01", executionTime: 426, eqScore: 110.67144, kScore: 114, cScore: 108, gScore: 109, el: 122.016098, rp: 105.861311, act: 115.43112, ne: 107.469005, im: 105.224912, op: 107.352451, emp: 112.375061, ng: 106.037423, effectiveness: 103.944788, relationship: 114.53106, qualityOfLife: 107.370525, wellbeing: 107.894099, overall4: 108.435118, influence: 114.085125, decisionMaking: 93.8044504, community: 111.73895, network: 117.32317, achievement: 102.007532, satisfaction: 112.733518, balance: 111.779569, health: 104.008629, mood: "Joy", intensity: "Serene", reliabilityIndex: 100.492529, positiveImpression: "Average", brainProfile: "Sage", dataMining: 107.193713, modeling: 102.471513, prioritizing: 106.0620327, connection: 111.5362127, emotionalInsight: 112.607439, collaboration: 106.1420647, reflecting: 109.349418, adaptability: 106.8293868, criticalThinking: 106.1931278, resilience: 101.8510925, riskTolerance: 102.3412372, imagination: 102.3282867, proactivity: 103.4702021, commitment: 103.4313507, problemSolving: 106.1242404, vision: 106.6659143, designing: 103.4759779, entrepreneurship: 103.9730246, brainAgility: 110.2209227 },
    { id: "684895", name: "Sue McNamara", email: "sue@6seconds.org", country: "GB", lang: "en", gender: "F", age: 58, jobFunction: "EDUCATION_TRAINING", jobRole: "SENIOREXECUTIVE", sector: "EDUCATION", education: "ADVANCEDDEGREE", date: "2024-09-02", executionTime: 500, eqScore: 117.106196, kScore: 119, cScore: 117, gScore: 115, el: 118.050779, rp: 120.32347, act: 124.740096, ne: 112.810562, im: 113.483475, op: 116.670484, emp: 112.121992, ng: 118.288624, effectiveness: 116.142722, relationship: 110.848597, qualityOfLife: 116.089929, wellbeing: 106.868975, overall4: 112.487556, influence: 121.059966, decisionMaking: 111.225477, community: 111.73895, network: 109.958245, achievement: 119.446339, satisfaction: 112.733518, balance: 109.729322, health: 104.008629, mood: "Anticipation", intensity: "Interested", reliabilityIndex: 84.78357548, positiveImpression: "Average", brainProfile: "Strategist", dataMining: 112.3558039, modeling: 111.4898181, prioritizing: 115.0763126, connection: 106.8881514, emotionalInsight: 107.5469055, collaboration: 105.2179204, reflecting: 111.3317103, adaptability: 110.2357301, criticalThinking: 112.6704242, resilience: 108.0075128, riskTolerance: 105.752612, imagination: 106.1814922, proactivity: 106.1987041, commitment: 107.4853446, problemSolving: 110.1752155, vision: 113.3786485, designing: 111.9064398, entrepreneurship: 110.6887777, brainAgility: 117.0611852 },
    { id: "692559", name: "Lorenzo Fariselli", email: "lorenzo@6seconds.org", country: "IT", lang: "it", gender: "M", age: 44, jobFunction: "OTHER", jobRole: "SENIOREXECUTIVE", sector: "OTHER", education: "ADVANCEDDEGREE", date: "2024-10-15", executionTime: 653, eqScore: 111.396915, kScore: 115, cScore: 113, gScore: 105, el: 114.918177, rp: 116.272644, act: 108.307219, ne: 117.294393, im: 114.614221, op: 114.733402, emp: 94.6574972, ng: 115.058554, effectiveness: 108.50523, relationship: 104.735739, qualityOfLife: 116.089929, wellbeing: 112.456208, overall4: 110.446777, influence: 107.76674, decisionMaking: 109.24372, community: 100.086296, network: 109.385182, achievement: 119.446339, satisfaction: 112.733518, balance: 111.779569, health: 113.132847, mood: "Fiducia", intensity: "Sicurezza", reliabilityIndex: 75.66677209, positiveImpression: "Very Low", brainProfile: "Inventor", dataMining: 113.3922349, modeling: 113.1596162, prioritizing: 110.303535, connection: 98.98213681, emotionalInsight: 101.2333235, collaboration: 102.2894194, reflecting: 98.63717374, adaptability: 107.1813805, criticalThinking: 106.1876742, resilience: 109.7216478, riskTolerance: 110.7514821, imagination: 110.4669276, proactivity: 108.9136619, commitment: 108.0599982, problemSolving: 105.9179373, vision: 106.2141588, designing: 108.8693006, entrepreneurship: 108.3562197, brainAgility: 111.9820134 },
    { id: "698942", name: "Yuyang Zou", email: "yuyang.zou@6seconds.org", country: "NONE", lang: "en", gender: "M", age: 34, jobFunction: "NONE", jobRole: "NONE", sector: "NONE", education: "NONE", date: "2024-12-02", executionTime: 763, eqScore: 110.351802, kScore: 111, cScore: 105, gScore: 114, el: 106.432395, rp: 116.521379, act: 122.609714, ne: 103.215095, im: 99.5977552, op: 97.0992755, emp: 112.837562, ng: 115.058554, effectiveness: 106.862012, relationship: 100.69934, qualityOfLife: 107.370525, wellbeing: 106.868975, overall4: 105.450213, influence: 101.503059, decisionMaking: 112.220965, community: 99.3784244, network: 102.020256, achievement: 102.007532, satisfaction: 112.733518, balance: 109.729322, health: 104.008629, mood: "Anticipation", intensity: "Interested", reliabilityIndex: 81.6851374, positiveImpression: "Low", brainProfile: "Strategist", dataMining: 106.6341754, modeling: 101.365124, prioritizing: 112.7030968, connection: 104.178297, emotionalInsight: 103.4666118, collaboration: 102.0367007, reflecting: 114.9725546, adaptability: 109.610108, criticalThinking: 114.8738674, resilience: 98.70592607, riskTolerance: 95.437642, imagination: 94.7581065, proactivity: 97.54657758, commitment: 95.50797107, problemSolving: 104.0114506, vision: 114.3186497, designing: 112.2892047, entrepreneurship: 105.8151701, brainAgility: 109.1714662 },
    { id: "714718", name: "Hala Jimenez", email: "hala.jimenez@6seconds.org", country: "US", lang: "en", gender: "F", age: 42, jobFunction: "SENIOR_STRATEGICMANAGEMENT", jobRole: "SENIOREXECUTIVE", sector: "EDUCATION", education: "UNIVERSITY", date: "2025-03-11", executionTime: 394, eqScore: 112.591541, kScore: 117, cScore: 109, gScore: 111, el: 114.640605, rp: 120.32347, act: 119.068878, ne: 98.9521361, im: 108.918669, op: 109.289533, emp: 104.181938, ng: 118.288624, effectiveness: 113.019692, relationship: 97.7861767, qualityOfLife: 95.6527675, wellbeing: 90.9137091, overall4: 99.3430863, influence: 108.149672, decisionMaking: 117.889712, community: 93.5520974, network: 102.020256, achievement: 86.9327878, satisfaction: 104.372747, balance: 86.3829537, health: 95.4444645, mood: "Anticipation", intensity: "Vigilant", reliabilityIndex: 107.543707, positiveImpression: "Average", brainProfile: "Strategist", dataMining: 112.9835354, modeling: 109.9738519, prioritizing: 114.3202273, connection: 102.2225141, emotionalInsight: 103.3845882, collaboration: 96.41193543, reflecting: 107.8046956, adaptability: 103.8262346, criticalThinking: 112.4202293, resilience: 105.9873611, riskTolerance: 98.39326538, imagination: 99.54186507, proactivity: 99.55042621, commitment: 102.9962253, problemSolving: 106.2560068, vision: 112.5026436, designing: 112.920841, entrepreneurship: 109.242862, brainAgility: 111.7079817 },
    { id: "716232", name: "Blossom Beatty", email: "blossom.beatty@6seconds.org", country: "US", lang: "en", gender: "F", age: 50, jobFunction: "EDUCATION_TRAINING", jobRole: "CONSULTANT", sector: "EDUCATION", education: "ADVANCEDDEGREE", date: "2025-03-11", executionTime: 499, eqScore: 118.826652, kScore: 121, cScore: 117, gScore: 117, el: 122.016098, rp: 120.32347, act: 124.740096, ne: 111.744616, im: 117.333149, op: 117.371841, emp: 119.337994, ng: 115.687496, effectiveness: 118.801963, relationship: 111.617897, qualityOfLife: 110.671004, wellbeing: 106.868975, overall4: 111.98996, influence: 121.059966, decisionMaking: 116.54396, community: 105.912623, network: 117.32317, achievement: 108.608489, satisfaction: 112.733518, balance: 109.729322, health: 104.008629, mood: "Fear", intensity: "Uneasy", reliabilityIndex: 75.66677209, positiveImpression: "Very Low", brainProfile: "Scientist", dataMining: 112.0740207, modeling: 110.1979764, prioritizing: 113.4727565, connection: 111.4170365, emotionalInsight: 111.7146036, collaboration: 107.1495005, reflecting: 113.5811872, adaptability: 109.6061189, criticalThinking: 111.3585103, resilience: 107.4521846, riskTolerance: 105.5126438, imagination: 106.1378911, proactivity: 108.1323834, commitment: 110.0081252, problemSolving: 112.4642103, vision: 111.3671085, designing: 109.8948998, entrepreneurship: 108.9110234, brainAgility: 118.5693451 },
    { id: "716918", name: "Liliana Rodríguez", email: "malanga21@hotmail.com", country: "CO", lang: "es", gender: "F", age: 53, jobFunction: "NONE", jobRole: "FREELANCE", sector: "NONE", education: "ADVANCEDDEGREE", date: "2025-03-16", executionTime: 690, eqScore: 100.436654, kScore: 98, cScore: 106, gScore: 96, el: 92.1223255, rp: 105.149169, act: 91.928903, ne: 113.064481, im: 114.816386, op: 106.636905, emp: 95.819107, ng: 96.3059882, effectiveness: 105.983426, relationship: 103.612923, qualityOfLife: 105.436755, wellbeing: 110.322086, overall4: 106.338798, influence: 120.014125, decisionMaking: 91.9527278, community: 107.912914, network: 99.3129321, achievement: 102.124316, satisfaction: 108.749194, balance: 113.917065, health: 106.727107, mood: "Confianza", intensity: "Tranquilo", reliabilityIndex: 92.31271117, positiveImpression: "Average", brainProfile: "Deliverer", dataMining: 100.5917152, modeling: 105.5952123, prioritizing: 99.05832267, connection: 94.37167412, emotionalInsight: 93.96092062, collaboration: 103.2685454, reflecting: 93.54434705, adaptability: 101.6412027, criticalThinking: 94.19298357, resilience: 103.5119753, riskTolerance: 109.8123148, imagination: 109.0981396, proactivity: 111.7607789, commitment: 109.6182534, problemSolving: 104.7155862, vision: 92.37532113, designing: 96.78207638, entrepreneurship: 97.27798839, brainAgility: 101.980408 },
    { id: "720868", name: "Michael Miller", email: "michaelmiller845@gmail.com", country: "US", lang: "en", gender: "M", age: 34, jobFunction: "MARKETING_COMMUNICATION", jobRole: "SENIOREXECUTIVE", sector: "EDUCATION", education: "UNIVERSITY", date: "2025-04-13", executionTime: 238, eqScore: 113.671016, kScore: 119, cScore: 113, gScore: 108, el: 122.016098, rp: 116.521379, act: 122.609714, ne: 105.878653, im: 119.482869, op: 107.352451, emp: 101.236134, ng: 114.590641, effectiveness: 121.636337, relationship: 114.53106, qualityOfLife: 116.089929, wellbeing: 112.456208, overall4: 116.178384, influence: 121.059966, decisionMaking: 122.212707, community: 111.73895, network: 117.32317, achievement: 119.446339, satisfaction: 112.733518, balance: 111.779569, health: 113.132847, mood: "Joy", intensity: "Serene", reliabilityIndex: 75.66677209, positiveImpression: "Very Low", brainProfile: "Scientist", dataMining: 114.4068381, modeling: 108.5001862, prioritizing: 115.2811919, connection: 104.2166744, emotionalInsight: 106.5255593, collaboration: 99.35336151, reflecting: 108.8269284, adaptability: 108.5154279, criticalThinking: 112.3874227, resilience: 103.1069222, riskTolerance: 100.0391707, imagination: 100.2029261, proactivity: 107.376239, commitment: 107.8675052, problemSolving: 112.9532595, vision: 109.6917744, designing: 107.6623294, entrepreneurship: 104.6060201, brainAgility: 113.7109924 },
    { id: "726547", name: "Daniel Choi", email: "daniel.choi@6seconds.org", country: "US", lang: "en", gender: "M", age: 28, jobFunction: "RESEARCHDEVELOPMENT", jobRole: "RESEARCH", sector: "EDUCATION", education: "ADVANCEDDEGREE", date: "2025-05-19", executionTime: 499, eqScore: 111.582659, kScore: 121, cScore: 106, gScore: 108, el: 122.016098, rp: 120.32347, act: 122.609714, ne: 83.5648688, im: 106.735565, op: 109.523319, emp: 119.337994, ng: 96.6016567, effectiveness: 103.894286, relationship: 114.53106, qualityOfLife: 110.671004, wellbeing: 111.431085, overall4: 110.131858, influence: 95.5676066, decisionMaking: 112.220965, community: 111.73895, network: 117.32317, achievement: 108.608489, satisfaction: 112.733518, balance: 109.729322, health: 113.132847, mood: "Joy", intensity: "Happy", reliabilityIndex: 81.92740211, positiveImpression: "Low", brainProfile: "Scientist", dataMining: 112.0740207, modeling: 106.7097443, prioritizing: 112.52592, connection: 111.4170365, emotionalInsight: 111.7146036, collaboration: 94.62516849, reflecting: 114.3784667, adaptability: 98.11577551, criticalThinking: 103.9099035, resilience: 98.0754242, riskTolerance: 90.84555599, imagination: 93.72982824, proactivity: 98.27039481, commitment: 106.9232116, problemSolving: 111.2853433, vision: 104.5294043, designing: 103.767323, entrepreneurship: 100.1672726, brainAgility: 110.0890857 },
    { id: "727109", name: "Joshua Freedman", email: "josh@6seconds.org", country: "US", lang: "en", gender: "M", age: 57, jobFunction: "SENIOR_STRATEGICMANAGEMENT", jobRole: "SENIOREXECUTIVE", sector: "EDUCATION", education: "UNIVERSITY", date: "2025-05-22", executionTime: 239, eqScore: 118.99524, kScore: 119, cScore: 120, gScore: 117, el: 118.605924, rp: 120.32347, act: 124.740096, ne: 123.225546, im: 119.482869, op: 114.499616, emp: 115.779358, ng: 118.288624, effectiveness: 121.636337, relationship: 104.668335, qualityOfLife: 116.089929, wellbeing: 111.101745, overall4: 113.374086, influence: 121.059966, decisionMaking: 122.212707, community: 99.3784244, network: 109.958245, achievement: 119.446339, satisfaction: 112.733518, balance: 118.19486, health: 104.008629, mood: "Joy", intensity: "Happy", reliabilityIndex: 114.6331374, positiveImpression: "Average", brainProfile: "Scientist", dataMining: 111.728104, modeling: 109.71224, prioritizing: 114.2635646, connection: 108.6986957, emotionalInsight: 109.0127585, collaboration: 111.0659243, reflecting: 113.0332474, adaptability: 115.347027, criticalThinking: 113.1528393, resilience: 107.0426826, riskTolerance: 109.6578713, imagination: 108.6883234, proactivity: 112.3367629, commitment: 109.4281194, problemSolving: 112.8416129, vision: 112.0454498, designing: 110.5732411, entrepreneurship: 108.6319564, brainAgility: 119.3681879 },
    { id: "727572", name: "Patty Freedman", email: "patty@6seconds.org", country: "US", lang: "en", gender: "F", age: 54, jobFunction: "MARKETING_COMMUNICATION", jobRole: "SENIOREXECUTIVE", sector: "ADVERTISING_PUBLICRELATIONS", education: "ADVANCEDDEGREE", date: "2025-05-23", executionTime: 429, eqScore: 111.332588, kScore: 115, cScore: 108, gScore: 110, el: 113.807888, rp: 116.521379, act: 124.740096, ne: 95.6310326, im: 111.326086, op: 103.311297, emp: 105.103449, ng: 115.058554, effectiveness: 121.636337, relationship: 110.562066, qualityOfLife: 116.089929, wellbeing: 115.663854, overall4: 115.988046, influence: 121.059966, decisionMaking: 122.212707, community: 111.73895, network: 109.385182, achievement: 119.446339, satisfaction: 112.733518, balance: 118.19486, health: 113.132847, mood: "Anticipation", intensity: "Interested", reliabilityIndex: 91.52873491, positiveImpression: "Average", brainProfile: "Strategist", dataMining: 110.8113648, modeling: 105.8447144, prioritizing: 115.3686251, connection: 103.1994112, emotionalInsight: 104.166571, collaboration: 96.0879687, reflecting: 111.9609042, adaptability: 105.5690917, criticalThinking: 114.2035455, resilience: 100.9934064, riskTolerance: 93.66420325, imagination: 94.51756599, proactivity: 100.2311483, commitment: 102.7912365, problemSolving: 109.9341696, vision: 112.4224813, designing: 109.682909, entrepreneurship: 105.2795483, brainAgility: 110.6874728 },
    { id: "728634", name: "Susie Lubbers", email: "susie.lubbers@6seconds.org", country: "US", lang: "en", gender: "M", age: 0, jobFunction: "NONE", jobRole: "NONE", sector: "NONE", education: "NONE", date: "2025-05-28", executionTime: 522, eqScore: 115.832009, kScore: 118, cScore: 117, gScore: 111, el: 117.495634, rp: 120.32347, act: 124.740096, ne: 111.414251, im: 117.333149, op: 116.670484, emp: 119.492333, ng: 102.601628, effectiveness: 121.636337, relationship: 114.53106, qualityOfLife: 116.089929, wellbeing: 103.66133, overall4: 113.979664, influence: 121.059966, decisionMaking: 122.212707, community: 111.73895, network: 117.32317, achievement: 119.446339, satisfaction: 112.733518, balance: 103.314031, health: 104.008629, mood: "Joy", intensity: "Happy", reliabilityIndex: 107.3269439, positiveImpression: "Average", brainProfile: "Scientist", dataMining: 110.5329019, modeling: 109.8519644, prioritizing: 113.4384589, connection: 109.9788107, emotionalInsight: 109.7569552, collaboration: 107.0541184, reflecting: 113.7884909, adaptability: 109.6151475, criticalThinking: 105.698426, resilience: 102.7785141, riskTolerance: 105.1320294, imagination: 105.7160552, proactivity: 110.9302327, commitment: 112.6823102, problemSolving: 115.372181, vision: 105.551167, designing: 104.0789583, entrepreneurship: 102.8612962, brainAgility: 116.2588809 },
    { id: "730841", name: "Anabel Jensen", email: "anabel@6seconds.org", country: "US", lang: "en", gender: "F", age: 85, jobFunction: "ADMINISTRATION_SUPPORTSERVICES", jobRole: "CONSULTANT", sector: "EDUCATION", education: "ADVANCEDDEGREE", date: "2025-06-09", executionTime: 747, eqScore: 119.524777, kScore: 119, cScore: 118, gScore: 120, el: 118.605924, rp: 120.32347, act: 122.609714, ne: 114.294926, im: 119.482869, op: 117.371841, emp: 123.05097, ng: 118.288624, effectiveness: 121.636337, relationship: 114.53106, qualityOfLife: 116.089929, wellbeing: 86.302287, overall4: 109.639903, influence: 121.059966, decisionMaking: 122.212707, community: 111.73895, network: 117.32317, achievement: 119.446339, satisfaction: 112.733518, balance: 94.8484923, health: 77.7560817, mood: "Trust", intensity: "Accepting", reliabilityIndex: 78.67595475, positiveImpression: "Low", brainProfile: "Guardian", dataMining: 110.1121903, modeling: 109.3728707, prioritizing: 111.7008142, connection: 111.9305232, emotionalInsight: 111.4366292, collaboration: 109.5206305, reflecting: 113.8720093, adaptability: 110.0294629, criticalThinking: 111.8044396, resilience: 108.7926454, riskTolerance: 107.1195334, imagination: 107.4614129, proactivity: 109.3598896, commitment: 110.3855278, problemSolving: 112.1314855, vision: 111.3353224, designing: 110.5732411, entrepreneurship: 109.5893647, brainAgility: 119.2535423 },
    { id: "734831", name: "Chris Draper", email: "chris.draper@6seconds.org", country: "US", lang: "en", gender: "M", age: 39, jobFunction: "NONE", jobRole: "NONE", sector: "NONE", education: "ADVANCEDDEGREE", date: "2025-07-02", executionTime: 446, eqScore: 115.02691, kScore: 117, cScore: 111, gScore: 116, el: 114.363032, rp: 120.32347, act: 121.1508, ne: 108.878119, im: 104.876927, op: 109.990891, emp: 123.05097, ng: 109.97562, effectiveness: 108.66793, relationship: 98.1401125, qualityOfLife: 116.089929, wellbeing: 104.686454, overall4: 106.896106, influence: 100.791899, decisionMaking: 116.54396, community: 94.2599689, network: 102.020256, achievement: 119.446339, satisfaction: 112.733518, balance: 105.364278, health: 104.008629, mood: "Anticipation", intensity: "Eager", reliabilityIndex: 94.05338816, positiveImpression: "Average", brainProfile: "Sage", dataMining: 108.6978932, modeling: 106.0924482, prioritizing: 111.0524078, connection: 110.5162262, emotionalInsight: 109.5508998, collaboration: 107.1131606, reflecting: 114.863814, adaptability: 108.7758994, criticalThinking: 109.2636776, resilience: 103.0654249, riskTolerance: 102.5759499, imagination: 102.6995912, proactivity: 102.9100916, commitment: 103.2810154, problemSolving: 107.0009851, vision: 110.400114, designing: 110.1243376, entrepreneurship: 106.6801443, brainAgility: 114.0762286 },
    { id: "735357", name: "Jessica Hufnagle", email: "jessica.hufnagle@6seconds.org", country: "US", lang: "en", gender: "F", age: 43, jobFunction: "ADMINISTRATION_SUPPORTSERVICES", jobRole: "OTHER", sector: "BUSINESS_SERVICES", education: "ADVANCEDDEGREE", date: "2025-07-07", executionTime: 423, eqScore: 111.731142, kScore: 109, cScore: 114, gScore: 111, el: 110.120141, rp: 108.917197, act: 113.040258, ne: 112.024904, im: 111.333755, op: 120.711638, emp: 108.203593, ng: 114.590641, effectiveness: 119.474839, relationship: 114.53106, qualityOfLife: 110.671004, wellbeing: 107.894099, overall4: 113.14275, influence: 121.059966, decisionMaking: 117.889712, community: 111.73895, network: 117.32317, achievement: 108.608489, satisfaction: 112.733518, balance: 111.779569, health: 104.008629, mood: "Trust", intensity: "Safe", reliabilityIndex: 107.658464, positiveImpression: "Average", brainProfile: "Inventor", dataMining: 105.5135587, modeling: 110.3545509, prioritizing: 106.9450487, connection: 105.0378224, emotionalInsight: 105.2507722, collaboration: 106.0973331, reflecting: 103.927615, adaptability: 105.0885681, criticalThinking: 106.2288959, resilience: 111.1708843, riskTolerance: 109.3504457, imagination: 110.3156384, proactivity: 105.8031608, commitment: 108.6987389, problemSolving: 106.1416123, vision: 108.3128699, designing: 106.9385164, entrepreneurship: 110.8699965, brainAgility: 112.3677659 },
    { id: "740059", name: "Charlotte McNamara", email: "charlotte.mcnamara@6seconds.org", country: "GB", lang: "en", gender: "F", age: 26, jobFunction: "EDUCATION_TRAINING", jobRole: "EDUCATOR", sector: "EDUCATION", education: "UNIVERSITY", date: "2025-08-11", executionTime: 453, eqScore: 94.4298382, kScore: 97, cScore: 91, gScore: 95, el: 99.905545, rp: 93.7345546, act: 113.128073, ne: 77.558265, im: 88.066026, op: 86.3687365, emp: 110.68199, ng: 79.6963898, effectiveness: 89.0371102, relationship: 94.8730132, qualityOfLife: 79.784362, wellbeing: 94.8171384, overall4: 89.627906, influence: 88.5927657, decisionMaking: 89.4814547, community: 87.7257704, network: 102.020256, achievement: 84.5687241, satisfaction: 75, balance: 103.314031, health: 86.3202459, mood: "Sadness", intensity: "Unhappy", reliabilityIndex: 97.58535255, positiveImpression: "Average", brainProfile: "Guardian", dataMining: 94.81009713, modeling: 89.47940342, prioritizing: 101.372442, connection: 106.1083871, emotionalInsight: 104.9110044, collaboration: 94.97887997, reflecting: 112.4245321, adaptability: 97.43108967, criticalThinking: 98.38136733, resilience: 84.25644099, riskTolerance: 82.56479147, imagination: 83.54373274, proactivity: 91.72734664, commitment: 94.66417047, problemSolving: 103.5839494, vision: 98.00419188, designing: 91.53968563, entrepreneurship: 89.08441296, brainAgility: 93.64244748 },
    { id: "743145", name: "Eduardo Gonzalez", email: "eduardo.gonzalez@6seconds.org", country: "PE", lang: "es", gender: "M", age: 39, jobFunction: "SENIOR_STRATEGICMANAGEMENT", jobRole: "SENIOREXECUTIVE", sector: "EDUCATION", education: "ADVANCEDDEGREE", date: "2025-08-26", executionTime: 342, eqScore: 112.342383, kScore: 115, cScore: 116, gScore: 105, el: 121.926233, rp: 108.121876, act: 124.102191, ne: 124.120782, im: 104.422578, op: 113.839286, emp: 92.7637696, ng: 118, effectiveness: 116.64798, relationship: 111.71618, qualityOfLife: 111.527588, wellbeing: 106.730388, overall4: 111.655534, influence: 120.014125, decisionMaking: 113.281835, community: 107.912914, network: 115.519445, achievement: 114.305982, satisfaction: 108.749194, balance: 106.733669, health: 106.727107, mood: "Confianza", intensity: "Seguro", reliabilityIndex: 85.69223972, positiveImpression: "Average", brainProfile: "Strategist", dataMining: 112.5265184, modeling: 110.466137, prioritizing: 115.0274284, connection: 102.2877804, emotionalInsight: 105.5280541, collaboration: 106.5034092, reflecting: 105.2246114, adaptability: 115.6790144, criticalThinking: 112.958667, resilience: 106.7947511, riskTolerance: 109.9774001, imagination: 108.8350117, proactivity: 106.0058508, commitment: 102.5786855, problemSolving: 105.999654, vision: 115.0512687, designing: 109.7244971, entrepreneurship: 111.6303001, brainAgility: 113.4120895 },
    { id: "744016", name: "Maddalena Campitelli", email: "maddalena.campitelli@gmail.com", country: "IT", lang: "it", gender: "F", age: 31, jobFunction: "NONE", jobRole: "NONE", sector: "NONE", education: "UNIVERSITY", date: "2025-09-02", executionTime: 412, eqScore: 105.059085, kScore: 111, cScore: 114, gScore: 89, el: 114.08546, rp: 108.917197, act: 120.578928, ne: 117.601358, im: 102.727207, op: 116.670484, emp: 88.7488538, ng: 89.8140081, effectiveness: 96.4448558, relationship: 107.648902, qualityOfLife: 103.090448, wellbeing: 112.456208, overall4: 104.910104, influence: 75, decisionMaking: 117.889712, community: 105.912623, network: 109.385182, achievement: 102.007532, satisfaction: 104.173365, balance: 111.779569, health: 113.132847, mood: "Aspettativa", intensity: "Allerta", reliabilityIndex: 85.53587114, positiveImpression: "Average", brainProfile: "Deliverer", dataMining: 111.158607, modeling: 112.8817578, prioritizing: 114.6188443, connection: 97.71304454, emotionalInsight: 100.528223, collaboration: 102.0908445, reflecting: 101.6912564, adaptability: 110.9779168, criticalThinking: 98.62798334, resilience: 99.44067812, riskTolerance: 108.8065587, imagination: 108.7031282, proactivity: 109.3427653, commitment: 109.0324738, problemSolving: 110.3352886, vision: 101.7264893, designing: 97.83924562, entrepreneurship: 100.4236744, brainAgility: 107.3929372 },
    { id: "744066", name: "Greer Lambert", email: "greer.lambert@6seconds.org", country: "GB", lang: "en", gender: "F", age: 24, jobFunction: "SALES_BUSINESSDEVELOPMENT", jobRole: "SALESMARKETING", sector: "EDUCATION", education: "UNIVERSITY", date: "2025-09-02", executionTime: 330, eqScore: 93.5045939, kScore: 112, cScore: 85, gScore: 83, el: 106.709967, rp: 117.018849, act: 104.846075, ne: 81.6139697, im: 79.537194, op: 75, emp: 91.8001279, ng: 75, effectiveness: 98.5340237, relationship: 104.735739, qualityOfLife: 89.3107517, wellbeing: 106.819662, overall4: 99.8500442, influence: 101.503059, decisionMaking: 95.564988, community: 100.086296, network: 109.385182, achievement: 91.1696811, satisfaction: 87.4518223, balance: 118.19486, health: 95.4444645, mood: "Anticipation", intensity: "Vigilant", reliabilityIndex: 91.19721479, positiveImpression: "Average", brainProfile: "Strategist", dataMining: 111.6227825, modeling: 96.38403241, prioritizing: 109.6489544, connection: 94.81030167, emotionalInsight: 96.46695049, collaboration: 85.31317379, reflecting: 104.9760758, adaptability: 98.99934473, criticalThinking: 96.05980264, resilience: 79.47865009, riskTolerance: 82.41819218, imagination: 81.68330665, proactivity: 90.33229834, commitment: 88.12764178, problemSolving: 98.07633331, vision: 95.05153731, designing: 99.10912882, entrepreneurship: 85.10284578, brainAgility: 91.44077282 },
    { id: "745596", name: "Ayaka Mawarida", email: "ayaka.mawarida@6seconds.org", country: "JP", lang: "en", gender: "F", age: 37, jobFunction: "ADMINISTRATION_SUPPORTSERVICES", jobRole: "MANAGEMENT", sector: "EDUCATION", education: "ADVANCEDDEGREE", date: "2025-09-12", executionTime: 1354, eqScore: 106.784869, kScore: 115, cScore: 110, gScore: 95, el: 122.016098, rp: 109.165932, act: 121.1508, ne: 96.8879898, im: 104.930022, op: 116.90427, emp: 75, ng: 114.590641, effectiveness: 113.598699, relationship: 114.53106, qualityOfLife: 116.089929, wellbeing: 102.53758, overall4: 111.689317, influence: 121.059966, decisionMaking: 106.137431, community: 111.73895, network: 117.32317, achievement: 119.446339, satisfaction: 112.733518, balance: 118.19486, health: 86.8803003, mood: "Trust", intensity: "Accepting", reliabilityIndex: 88.71081386, positiveImpression: "Average", brainProfile: "Inventor", dataMining: 116.9680025, modeling: 116.1238751, prioritizing: 118.0112217, connection: 94.19071428, emotionalInsight: 99.41472514, collaboration: 88.24667717, reflecting: 97.31051767, adaptability: 101.9106465, criticalThinking: 109.7784916, resilience: 107.6763781, riskTolerance: 99.55146323, imagination: 101.7754943, proactivity: 97.91141928, commitment: 104.5835126, problemSolving: 105.9990225, vision: 112.4394356, designing: 108.4444798, entrepreneurship: 111.0239256, brainAgility: 107.580719 },
    { id: "745853", name: "Ilaria Iseppato", email: "ilaria.i2@6seconds.org", country: "IT", lang: "it", gender: "M", age: 0, jobFunction: "NONE", jobRole: "NONE", sector: "NONE", education: "NONE", date: "2025-09-15", executionTime: 311, eqScore: 93.9273679, kScore: 94, cScore: 99, gScore: 88, el: 95.5777961, rp: 92.7197161, act: 101.108923, ne: 97.4104145, im: 107.847144, op: 91.2742299, emp: 75.6626068, ng: 99.9463393, effectiveness: 100.985872, relationship: 94.8730132, qualityOfLife: 85.0306749, wellbeing: 84.1690782, overall4: 91.2646596, influence: 101.503059, decisionMaking: 100.468685, community: 87.7257704, network: 102.020256, achievement: 91.1696811, satisfaction: 78.8916686, balance: 82.0179104, health: 86.3202459, mood: "Aspettativa", intensity: "Allerta", reliabilityIndex: 84.69432006, positiveImpression: "Average", brainProfile: "Scientist", dataMining: 100.6985599, modeling: 99.10342825, prioritizing: 103.4744031, connection: 89.32715368, emotionalInsight: 91.5399525, collaboration: 92.35444955, reflecting: 94.31945045, adaptability: 101.1577742, criticalThinking: 102.2848519, resilience: 95.85756562, riskTolerance: 95.69405563, imagination: 95.01225735, proactivity: 102.6363489, commitment: 100.590954, problemSolving: 103.8691852, vision: 98.60198218, designing: 95.80557974, entrepreneurship: 95.32375101, brainAgility: 95.19339622 },
    { id: "746183", name: "Natalia Vergara", email: "natalia.vergara@6seconds.org", country: "CO", lang: "es", gender: "F", age: 45, jobFunction: "EDUCATION_TRAINING", jobRole: "CONSULTANT", sector: "EDUCATION", education: "UNIVERSITY", date: "2025-09-16", executionTime: 469, eqScore: 108.80798, kScore: 113, cScore: 102, gScore: 111, el: 116.900279, rp: 109.402428, act: 118.118799, ne: 89.0522229, im: 99.7591125, op: 101.10119, emp: 104.529511, ng: 118, effectiveness: 99.5047945, relationship: 107.816277, qualityOfLife: 111.527588, wellbeing: 114.845938, overall4: 108.423649, influence: 94.2617576, decisionMaking: 104.747831, community: 107.912914, network: 107.719639, achievement: 114.305982, satisfaction: 108.749194, balance: 113.917065, health: 115.774812, mood: "Felicidad", intensity: "Feliz", reliabilityIndex: 92.98415858, positiveImpression: "Average", brainProfile: "Strategist", dataMining: 108.8057251, modeling: 102.6170026, prioritizing: 110.1803843, connection: 105.5571137, emotionalInsight: 106.9316435, collaboration: 94.55472979, reflecting: 109.3179275, adaptability: 100.929212, criticalThinking: 113.7948907, resilience: 102.4630182, riskTolerance: 91.47498495, imagination: 92.81375912, proactivity: 92.24367983, commitment: 96.26000236, problemSolving: 101.9325386, vision: 114.0931303, designing: 111.1876731, entrepreneurship: 108.4205941, brainAgility: 107.1079427 },
  ];

  // Crear usuarios del Staff Retreat con sus datos SEI
  for (const staff of staffRetreatData) {
    // Normalizar email
    const normalizedEmail = staff.email.toLowerCase().trim();

    // Crear User
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: staff.name,
        country: staff.country === "NONE" ? null : staff.country,
        language: staff.lang,
        active: true,
        allowAI: true,
      },
      create: {
        name: staff.name,
        email: normalizedEmail,
        active: true,
        allowAI: true,
        organizationRole: "MEMBER",
        primaryTenantId: sixSecondsTenant.id,
        planId: plans["ROWI Pro"].id,
        country: staff.country === "NONE" ? null : staff.country,
        language: staff.lang,
      },
    });

    // Crear RowiVerseUser
    const rvUser = await prisma.rowiVerseUser.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        name: staff.name,
        userId: user.id,
        rowiVerseId: sixSecondsRowiverse.id,
        verified: true,
        active: true,
        country: staff.country === "NONE" ? null : staff.country,
        language: staff.lang,
        status: "active",
      },
    });

    // Vincular User con RowiVerseUser
    await prisma.user.update({
      where: { id: user.id },
      data: { rowiverseId: rvUser.id },
    });

    // Agregar a comunidad Six Seconds Staff
    const existingStaffMember = await prisma.rowiCommunityUser.findFirst({
      where: { userId: user.id, communityId: sixSecondsStaff.id },
    });

    if (!existingStaffMember) {
      await prisma.rowiCommunityUser.create({
        data: {
          communityId: sixSecondsStaff.id,
          userId: user.id,
          rowiverseUserId: rvUser.id,
          name: staff.name,
          email: normalizedEmail,
          role: "member",
          status: "active",
          language: staff.lang,
          joinedAt: new Date(),
        },
      });
    }

    // Crear EqSnapshot con datos SEI completos
    const snapshot = await prisma.eqSnapshot.upsert({
      where: {
        id: `sei-${staff.id}`
      },
      update: {
        K: staff.kScore,
        C: staff.cScore,
        G: staff.gScore,
        brainStyle: staff.brainProfile,
        recentMood: staff.mood,
        moodIntensity: staff.intensity,
      },
      create: {
        id: `sei-${staff.id}`,
        user: { connect: { id: user.id } },
        rowiverseUser: { connect: { id: rvUser.id } },
        email: normalizedEmail,
        dataset: "6S Staff Retreat (Sept 2025)",
        project: "Staff Retreat Sept 2025",
        owner: "Eduardo Gonzalez",
        at: new Date(staff.date),
        // Pursuit Scores (K, C, G)
        K: staff.kScore,
        C: staff.cScore,
        G: staff.gScore,
        // 8 Competencies (stored as Int)
        EL: Math.round(staff.el),
        RP: Math.round(staff.rp),
        ACT: Math.round(staff.act),
        NE: Math.round(staff.ne),
        IM: Math.round(staff.im),
        OP: Math.round(staff.op),
        EMP: Math.round(staff.emp),
        NG: Math.round(staff.ng),
        // Brain Profile
        brainStyle: staff.brainProfile,
        // Mood
        recentMood: staff.mood,
        moodIntensity: staff.intensity,
        // Outcomes
        overall4: staff.overall4,
        // Metadata
        country: staff.country === "NONE" ? null : staff.country,
        gender: staff.gender,
        age: staff.age > 0 ? staff.age : null,
        jobFunction: staff.jobFunction === "NONE" ? null : staff.jobFunction,
        jobRole: staff.jobRole === "NONE" ? null : staff.jobRole,
        sector: staff.sector === "NONE" ? null : staff.sector,
        education: staff.education === "NONE" ? null : staff.education,
        reliabilityIndex: staff.reliabilityIndex,
        positiveImpressionRange: staff.positiveImpression,
      },
    });

    // Crear competencias EQ (8 competencias)
    const competencies = [
      { key: "EL", label: "Enhance Emotional Literacy", score: staff.el },
      { key: "RP", label: "Recognize Patterns", score: staff.rp },
      { key: "ACT", label: "Apply Consequential Thinking", score: staff.act },
      { key: "NE", label: "Navigate Emotions", score: staff.ne },
      { key: "IM", label: "Engage Intrinsic Motivation", score: staff.im },
      { key: "OP", label: "Exercise Optimism", score: staff.op },
      { key: "EMP", label: "Increase Empathy", score: staff.emp },
      { key: "NG", label: "Pursue Noble Goals", score: staff.ng },
    ];

    for (const comp of competencies) {
      await prisma.eqCompetencySnapshot.upsert({
        where: { id: `${snapshot.id}-${comp.key}` },
        update: { score: comp.score },
        create: {
          id: `${snapshot.id}-${comp.key}`,
          snapshot: { connect: { id: snapshot.id } },
          key: comp.key,
          label: comp.label,
          score: comp.score,
        },
      });
    }

    // Crear outcomes (4 principales + 8 success factors)
    const outcomes = [
      { key: "effectiveness", label: "Effectiveness", score: staff.effectiveness },
      { key: "relationship", label: "Relationship", score: staff.relationship },
      { key: "qualityOfLife", label: "Quality of Life", score: staff.qualityOfLife },
      { key: "wellbeing", label: "Wellbeing", score: staff.wellbeing },
      { key: "overall4", label: "Overall 4 Outcome", score: staff.overall4 },
      { key: "influence", label: "Influence", score: staff.influence },
      { key: "decisionMaking", label: "Decision Making", score: staff.decisionMaking },
      { key: "community", label: "Community", score: staff.community },
      { key: "network", label: "Network", score: staff.network },
      { key: "achievement", label: "Achievement", score: staff.achievement },
      { key: "satisfaction", label: "Satisfaction", score: staff.satisfaction },
      { key: "balance", label: "Balance", score: staff.balance },
      { key: "health", label: "Health", score: staff.health },
    ];

    for (const outcome of outcomes) {
      await prisma.eqOutcomeSnapshot.upsert({
        where: { id: `${snapshot.id}-${outcome.key}` },
        update: { score: outcome.score },
        create: {
          id: `${snapshot.id}-${outcome.key}`,
          snapshot: { connect: { id: snapshot.id } },
          key: outcome.key,
          label: outcome.label,
          score: outcome.score,
        },
      });
    }

    // Crear Brain Talents (18 talents)
    const talents = [
      { key: "dataMining", label: "Data Mining", score: staff.dataMining },
      { key: "modeling", label: "Modeling", score: staff.modeling },
      { key: "prioritizing", label: "Prioritizing", score: staff.prioritizing },
      { key: "connection", label: "Connection", score: staff.connection },
      { key: "emotionalInsight", label: "Emotional Insight", score: staff.emotionalInsight },
      { key: "collaboration", label: "Collaboration", score: staff.collaboration },
      { key: "reflecting", label: "Reflecting", score: staff.reflecting },
      { key: "adaptability", label: "Adaptability", score: staff.adaptability },
      { key: "criticalThinking", label: "Critical Thinking", score: staff.criticalThinking },
      { key: "resilience", label: "Resilience", score: staff.resilience },
      { key: "riskTolerance", label: "Risk Tolerance", score: staff.riskTolerance },
      { key: "imagination", label: "Imagination", score: staff.imagination },
      { key: "proactivity", label: "Proactivity", score: staff.proactivity },
      { key: "commitment", label: "Commitment", score: staff.commitment },
      { key: "problemSolving", label: "Problem Solving", score: staff.problemSolving },
      { key: "vision", label: "Vision", score: staff.vision },
      { key: "designing", label: "Designing", score: staff.designing },
      { key: "entrepreneurship", label: "Entrepreneurship", score: staff.entrepreneurship },
      { key: "brainAgility", label: "Brain Agility", score: staff.brainAgility },
    ];

    for (const talent of talents) {
      await prisma.talentSnapshot.upsert({
        where: { id: `${snapshot.id}-${talent.key}` },
        update: { score: talent.score },
        create: {
          id: `${snapshot.id}-${talent.key}`,
          snapshot: { connect: { id: snapshot.id } },
          key: talent.key,
          label: talent.label,
          score: talent.score,
        },
      });
    }

    console.log(`   ✅ ${staff.name} (${normalizedEmail}) - EQ: ${staff.eqScore.toFixed(1)}, Profile: ${staff.brainProfile}`);
  }

  console.log(`   📊 ${staffRetreatData.length} usuarios del Staff Retreat creados con datos SEI completos`);

  // 19.14 Vincular SuperAdmin de Rowi al ecosistema Six Seconds
  console.log("\n19.14 Vinculando SuperAdmin a Six Seconds...");

  // Agregar permiso de superadmin al ecosistema Six Seconds
  const superAdminSixSecondsPerms = [
    { scopeType: "rowiverse" as const, scopeId: sixSecondsRowiverse.id, role: "superadmin" },
    { scopeType: "superhub" as const, scopeId: sixSecondsSuperHub.id, role: "superadmin" },
    { scopeType: "tenant" as const, scopeId: sixSecondsTenant.id, role: "superadmin" },
  ];

  for (const perm of superAdminSixSecondsPerms) {
    const existing = await prisma.userPermission.findFirst({
      where: {
        userId: superadmin.id,
        scopeType: perm.scopeType,
        scopeId: perm.scopeId,
      },
    });

    if (!existing) {
      await prisma.userPermission.create({
        data: {
          userId: superadmin.id,
          scopeType: perm.scopeType,
          scopeId: perm.scopeId,
          role: perm.role,
          scope: "global",
        },
      });
    }
  }
  console.log("   SuperAdmin vinculado a Six Seconds");

  // ============================================================
  // FIN DEL SEED
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  SEED COMPLETADO");
  console.log("=".repeat(60));
  console.log("\n");
  console.log("Resumen ROWI:");
  console.log("  - RowiVerse creado");
  console.log("  - System (Cactus) creado");
  console.log("  - SuperHub Global creado");
  console.log("  - 6 Planes creados (Free, ROWI+, Family, Pro, Business, Enterprise)");
  console.log("  - Tenant Master creado");
  console.log("  - Hub Principal creado");
  console.log("  - Organization creada");
  console.log("  - SuperAdmin User creado");
  console.log("  - RowiVerseUser vinculado");
  console.log("  - Memberships creadas");
  console.log("  - Permissions configurados");
  console.log("  - 6 Agentes IA (GLOBAL + TENANT)");
  console.log("  - Avatar Evolution con Milestones");
  console.log("  - Tenant Branding");
  console.log("  - System Settings");
  console.log("  - Translations");
  console.log("  - RowiCommunity");
  console.log("  - Emotional Config");
  console.log("\n");
  console.log("Resumen SIX SECONDS:");
  console.log("  - Six Seconds RowiVerse creado");
  console.log("  - Six Seconds SuperHub creado");
  console.log("  - Six Seconds Tenant creado");
  console.log("  - Six Seconds Hub creado");
  console.log("  - Six Seconds Organization creada");
  console.log("  - Six Seconds Branding creado");
  console.log("  - 2 Admins: Eduardo (eduardo.gonzalez@6seconds.org) y Josh (josh@6seconds.org)");
  console.log("  - 5 Comunidades: Graduates, Partners, LATAM, Coaches, Educators");
  console.log("  - 1 Staff Community con 4 equipos: LATAM, USA, Europe, Asia");
  console.log("  - 24 Staff Retreat usuarios REALES con datos SEI completos:");
  console.log("    * 8 Competencias EQ (EL, RP, ACT, NE, IM, OP, EMP, NG)");
  console.log("    * 3 Pursuits (K, C, G)");
  console.log("    * 13 Outcomes (4 principales + 9 success factors)");
  console.log("    * 19 Brain Talents");
  console.log("    * Brain Profile, Mood, Reliability Index");
  console.log("  - SuperAdmin Rowi vinculado a Six Seconds");
  console.log("  - SSO deshabilitado (usar login normal)");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("\n ERROR EN SEED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
