// prisma/seed-production.ts
// ============================================================
// ROWI — Production Seed (Completo)
// ============================================================
//
// Merge de seed-minimal.ts + seed-beta.ts:
//
// ✅ Jerarquía completa (RowiVerse → System → SuperHub → Tenant → Hub → Org)
// ✅ Tenant público (rowi-global) para usuarios free
// ✅ 4 Usuarios (Eduardo SuperAdmin, Eduardo 6S, Josh, Patty)
// ✅ RowiVerse Users + Memberships + Permisos jerárquicos
// ✅ Comunidad Six Seconds Global
// ✅ 6 Planes (Free, ROWI+, Family, Pro, Business, Enterprise)
// ✅ 6 Agentes IA x 3 niveles (Global + Tenant + Hub) = 18 agentes
// ✅ Six Seconds cultura inyectada en agentes Tenant/Hub
// ✅ Gamificación (10 niveles, 34 achievements, 8 rewards)
// ✅ MicroLearning (outcomes, core outcomes, brain talents, competencias)
// ✅ FeatureDefinitions (44 features) + ProfileFeature mappings
// ✅ System Settings + Emotional Config
// ✅ Traducciones base (ES + EN, 212+ pares)
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

function section(num: number, title: string) {
  console.log(`\n${num}. ${title}`);
}
function ok(msg: string) {
  console.log(`   ✅ ${msg}`);
}

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI — PRODUCTION SEED (COMPLETO)");
  console.log("=".repeat(60));
  console.log("\n");

  // ============================================================
  // 1. ROWIVERSE
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
  // 2. SYSTEM
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
      name: "Free ROWI", slug: "free",
      description: "Comienza tu viaje de inteligencia emocional. Ideal para explorar Rowi.",
      descriptionEN: "Start your emotional intelligence journey. Ideal to explore Rowi.",
      priceUsd: 0, priceCents: 0, priceYearlyUsd: 0, priceYearlyCents: 0,
      billingPeriod: "monthly", tokensMonthly: 10, tokensShared: false, tokensPerUser: true,
      maxUsers: 1, minUsers: 1, planType: "individual", targetAudience: "B2C",
      aiEnabled: true, superRowiAccess: true, rowiEQAccess: true,
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
      name: "ROWI+", slug: "plus",
      description: "Para tu crecimiento personal. Todo lo que necesitas para desarrollar tu inteligencia emocional.",
      descriptionEN: "For your personal growth. Everything you need to develop your emotional intelligence.",
      priceUsd: 12, priceCents: 1200, priceYearlyUsd: 120, priceYearlyCents: 12000,
      billingPeriod: "monthly", tokensMonthly: 150, tokensShared: false, tokensPerUser: true,
      maxUsers: 1, minUsers: 1, planType: "individual", targetAudience: "B2C",
      aiEnabled: true, superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: false,
      seiIncluded: false, seiAnnual: false, brainBriefIncluded: true, seiDiscountPercent: 20,
      maxCommunities: 3, maxMembers: 20, privateGroups: true,
      benchmarkAccess: false, advancedReports: true, executiveDashboard: false, benchmarkingSectorial: false,
      apiAccess: false, slackIntegration: false, teamsIntegration: false, gmailIntegration: false,
      supportLevel: "email", customOnboarding: false, workshopIncludes: false,
      badge: "Popular", badgeEN: "Popular",
      emoji: "⭐", color: "#3B82F6", icon: "Star", sortOrder: 2,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: ["150 tokens IA / mes", "Todos los agentes Rowi", "Brain Brief Profile incluido", "20% descuento en SEI", "Hasta 3 comunidades", "Grupos privados", "Reportes avanzados", "Soporte por email"],
      featuresEN: ["150 AI tokens / month", "All Rowi agents", "Brain Brief Profile included", "20% discount on SEI", "Up to 3 communities", "Private groups", "Advanced reports", "Email support"],
      limitations: ["Sin benchmarks", "Sin integraciones", "Sin dashboard ejecutivo"],
      limitationsEN: ["No benchmarks", "No integrations", "No executive dashboard"],
    },
    {
      name: "ROWI Family", slug: "family",
      description: "Inteligencia emocional para toda la familia. Comparte tokens y crece juntos.",
      descriptionEN: "Emotional intelligence for the whole family. Share tokens and grow together.",
      priceUsd: 40, priceCents: 4000, priceYearlyUsd: 400, priceYearlyCents: 40000,
      billingPeriod: "monthly", tokensMonthly: 500, tokensShared: true, tokensPerUser: false,
      maxUsers: 6, minUsers: 2, allowFamilyMembers: true, planType: "family", targetAudience: "B2C",
      aiEnabled: true, superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: false,
      seiIncluded: false, seiAnnual: false, brainBriefIncluded: true, seiDiscountPercent: 30,
      maxCommunities: 5, maxMembers: 30, privateGroups: true,
      benchmarkAccess: true, advancedReports: true, executiveDashboard: false, benchmarkingSectorial: false,
      apiAccess: false, slackIntegration: false, teamsIntegration: false, gmailIntegration: false,
      supportLevel: "chat", customOnboarding: false, workshopIncludes: false,
      badge: "Familias", badgeEN: "Families",
      emoji: "👨‍👩‍👧‍👦", color: "#8B5CF6", icon: "Users", sortOrder: 3,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: ["500 tokens IA compartidos / mes", "Hasta 6 miembros familiares", "Todos los agentes Rowi", "Brain Brief para todos", "30% descuento en SEI", "Benchmarks familiares", "Dashboard familiar", "Soporte por chat"],
      featuresEN: ["500 shared AI tokens / month", "Up to 6 family members", "All Rowi agents", "Brain Brief for everyone", "30% discount on SEI", "Family benchmarks", "Family dashboard", "Chat support"],
      limitations: ["Sin integraciones empresariales", "Sin API"],
      limitationsEN: ["No enterprise integrations", "No API"],
    },
    {
      name: "ROWI Pro", slug: "pro",
      description: "Para profesionales y coaches. Herramientas avanzadas para tu práctica.",
      descriptionEN: "For professionals and coaches. Advanced tools for your practice.",
      priceUsd: 25, priceCents: 2500, priceYearlyUsd: 250, priceYearlyCents: 25000,
      billingPeriod: "monthly", pricePerUserMonthly: 25, pricePerUserYearly: 250,
      tokensMonthly: 500, tokensShared: false, tokensPerUser: true,
      maxUsers: 50, minUsers: 1, planType: "team", targetAudience: "B2C/B2B",
      aiEnabled: true, superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: true,
      seiIncluded: true, seiAnnual: true, brainBriefIncluded: true, seiDiscountPercent: 50,
      maxCommunities: 10, maxMembers: 100, privateGroups: true,
      benchmarkAccess: true, advancedReports: true, executiveDashboard: true, benchmarkingSectorial: false,
      apiAccess: false, slackIntegration: false, teamsIntegration: false, gmailIntegration: false,
      supportLevel: "priority", customOnboarding: true, workshopIncludes: false,
      badge: "Recomendado", badgeEN: "Recommended",
      emoji: "🚀", color: "#10B981", icon: "Rocket", sortOrder: 4,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: ["500 tokens IA / usuario / mes", "SEI anual incluido", "Todos los agentes + Rowi Sales", "50% descuento en SEI adicionales", "Dashboard ejecutivo", "Hasta 10 comunidades", "Reportes avanzados", "Onboarding personalizado", "Soporte prioritario"],
      featuresEN: ["500 AI tokens / user / month", "Annual SEI included", "All agents + Rowi Sales", "50% discount on additional SEI", "Executive dashboard", "Up to 10 communities", "Advanced reports", "Custom onboarding", "Priority support"],
      limitations: ["Sin API", "Sin integraciones avanzadas"],
      limitationsEN: ["No API", "No advanced integrations"],
    },
    {
      name: "ROWI Business", slug: "business",
      description: "Inteligencia emocional para tu organización. Transforma la cultura de tu empresa.",
      descriptionEN: "Emotional intelligence for your organization. Transform your company culture.",
      priceUsd: 5, priceCents: 500, priceYearlyUsd: 54, priceYearlyCents: 5400,
      billingPeriod: "monthly", pricePerUserMonthly: 5, pricePerUserYearly: 54,
      tokensMonthly: 0, tokensOrganization: 1000, tokensShared: true, tokensPerUser: false,
      maxUsers: 1000, minUsers: 20, planType: "business", targetAudience: "B2B",
      aiEnabled: true, superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: true,
      seiIncluded: true, seiAnnual: true, brainBriefIncluded: true, seiDiscountPercent: 70,
      maxCommunities: 50, maxMembers: 500, privateGroups: true,
      benchmarkAccess: true, advancedReports: true, executiveDashboard: true, benchmarkingSectorial: true,
      apiAccess: true, slackIntegration: true, teamsIntegration: true, gmailIntegration: true,
      supportLevel: "priority", customOnboarding: true, workshopIncludes: true,
      badge: "Empresas", badgeEN: "Business",
      emoji: "🏢", color: "#F59E0B", icon: "Building2", sortOrder: 5,
      isPublic: true, isActive: true, isCustomPricing: false,
      features: ["Desde $5 USD/usuario/mes (mín. 20)", "1000 tokens IA compartidos/org/mes", "SEI anual para todos", "Todos los agentes Rowi", "70% descuento en SEI adicionales", "API y webhooks", "Integraciones: Slack, Teams, Gmail", "Dashboard ejecutivo", "Benchmarking sectorial", "Workshops de adopción", "Soporte prioritario"],
      featuresEN: ["From $5 USD/user/month (min. 20)", "1000 shared AI tokens/org/month", "Annual SEI for everyone", "All Rowi agents", "70% discount on additional SEI", "API and webhooks", "Integrations: Slack, Teams, Gmail", "Executive dashboard", "Industry benchmarking", "Adoption workshops", "Priority support"],
      limitations: ["Mínimo 20 usuarios"],
      limitationsEN: ["Minimum 20 users"],
    },
    {
      name: "ROWI Enterprise", slug: "enterprise",
      description: "Solución personalizada para grandes organizaciones. Máximo poder e integración.",
      descriptionEN: "Custom solution for large organizations. Maximum power and integration.",
      priceUsd: 30000, priceCents: 3000000, priceYearlyUsd: 30000, priceYearlyCents: 3000000,
      billingPeriod: "custom", pricePerUserMonthly: 0, pricePerUserYearly: 0,
      tokensMonthly: 0, tokensOrganization: 10000, tokensShared: true, tokensPerUser: false,
      maxUsers: 999999, minUsers: 100, planType: "enterprise", targetAudience: "B2B",
      aiEnabled: true, superRowiAccess: true, rowiEQAccess: true, rowiAffinityAccess: true,
      rowiECOAccess: true, rowiTrainerAccess: true, rowiSalesAccess: true,
      seiIncluded: true, seiAnnual: true, brainBriefIncluded: true, seiDiscountPercent: 100,
      maxCommunities: 999, maxMembers: 9999, privateGroups: true,
      benchmarkAccess: true, advancedReports: true, executiveDashboard: true, benchmarkingSectorial: true,
      apiAccess: true, slackIntegration: true, teamsIntegration: true, gmailIntegration: true,
      supportLevel: "dedicated", customOnboarding: true, workshopIncludes: true,
      badge: "Enterprise", badgeEN: "Enterprise",
      emoji: "☁️", color: "#6366F1", icon: "Cloud", sortOrder: 6,
      isPublic: true, isActive: true, isCustomPricing: true,
      features: ["Precio personalizado (~$30,000 USD/año base)", "10,000+ tokens IA dedicados/mes", "SEI ilimitado para toda la organización", "Todos los agentes Rowi", "API dedicada y webhooks", "Todas las integraciones", "Dashboard ejecutivo+ personalizado", "Benchmarking sectorial avanzado", "Workshops de adopción e implementación", "Custom onboarding y formación", "Soporte dedicado 24/7", "SLA garantizado"],
      featuresEN: ["Custom pricing (~$30,000 USD/year base)", "10,000+ dedicated AI tokens/month", "Unlimited SEI for entire organization", "All Rowi agents", "Dedicated API and webhooks", "All integrations", "Custom executive dashboard+", "Advanced industry benchmarking", "Adoption and implementation workshops", "Custom onboarding and training", "Dedicated 24/7 support", "Guaranteed SLA"],
      limitations: [],
      limitationsEN: [],
    },
  ];

  const plans: Record<string, any> = {};
  for (const p of plansData) {
    const plan = await prisma.plan.upsert({
      where: { slug: p.slug },
      update: { ...p, features: p.features, featuresEN: p.featuresEN, limitations: p.limitations, limitationsEN: p.limitationsEN },
      create: { ...p, features: p.features, featuresEN: p.featuresEN, limitations: p.limitations, limitationsEN: p.limitationsEN },
    });
    plans[p.slug] = plan;
    console.log(`   ${p.emoji} Plan "${p.name}": ${plan.id}`);
  }

  // ============================================================
  // 4. ROWI GLOBAL TENANT
  // ============================================================
  section(4, "Creando Tenant Rowi Global...");

  const rowiGlobalTenant = await prisma.tenant.upsert({
    where: { slug: "rowi-global" },
    update: {},
    create: {
      name: "Rowi Global Community", slug: "rowi-global",
      billingEmail: "admin@rowiia.com",
      rowiVerseId: rowiverse.id, systemId: system.id, planId: plans["free"].id,
    },
  });
  ok(`Rowi Global Tenant: ${rowiGlobalTenant.id}`);

  await prisma.tenantBranding.upsert({
    where: { tenantId: rowiGlobalTenant.id },
    update: {},
    create: {
      tenantId: rowiGlobalTenant.id, logoUrl: "/rowi-logo.png",
      primaryColor: "#6366F1", secondaryColor: "#F97316",
      backgroundColor: "#ffffff", textColor: "#1f2937",
      colorK: "#3b82f6", colorC: "#10b981", colorG: "#f59e0b",
      fontHeading: "Inter", fontBody: "Inter", defaultTheme: "light", isActive: true,
    },
  });
  ok("Rowi Global Branding creado");

  // ============================================================
  // 5. SUPERHUB Six Seconds
  // ============================================================
  section(5, "Creando SuperHub Six Seconds...");

  const superHub = await prisma.superHub.upsert({
    where: { slug: "six-seconds" },
    update: {},
    create: {
      name: "Six Seconds", slug: "six-seconds",
      description: "The Emotional Intelligence Network",
      logo: "/six-seconds-logo.png", colorTheme: "#E85D04",
      rowiVerseId: rowiverse.id, systemId: system.id,
    },
  });
  ok(`SuperHub: ${superHub.id}`);

  // ============================================================
  // 6. TENANT Six Seconds Global
  // ============================================================
  section(6, "Creando Tenant Six Seconds...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "six-seconds-global" },
    update: {},
    create: {
      name: "Six Seconds Global", slug: "six-seconds-global",
      billingEmail: "admin@6seconds.org",
      superHubId: superHub.id, systemId: system.id, planId: plans["enterprise"].id,
    },
  });
  ok(`Tenant: ${tenant.id}`);

  await prisma.tenantBranding.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id, logoUrl: "/six-seconds-logo.png",
      primaryColor: "#E85D04", backgroundColor: "#1a1a2e", textColor: "#ffffff",
      colorK: "#3b82f6", colorC: "#10b981", colorG: "#f59e0b",
      fontHeading: "Inter", fontBody: "Inter", defaultTheme: "light", isActive: true,
    },
  });
  ok("TenantBranding Six Seconds creado");

  // ============================================================
  // 7. HUB
  // ============================================================
  section(7, "Creando Hub...");

  const hub = await prisma.hub.upsert({
    where: { slug: "six-seconds-hub" },
    update: {},
    create: {
      name: "Six Seconds Hub", slug: "six-seconds-hub",
      description: "Hub principal de Six Seconds",
      superHubId: superHub.id, tenantId: tenant.id,
    },
  });
  ok(`Hub: ${hub.id}`);

  // ============================================================
  // 8. ORGANIZATION
  // ============================================================
  section(8, "Creando Organization...");

  const org = await prisma.organization.upsert({
    where: { slug: "six-seconds-org" },
    update: {},
    create: {
      name: "Six Seconds Organization", slug: "six-seconds-org",
      description: "Organización principal de Six Seconds",
      hubId: hub.id, unitType: "CLIENT",
    },
  });
  ok(`Organization: ${org.id}`);

  await prisma.organizationToTenant.upsert({
    where: { tenantId_organizationId: { tenantId: tenant.id, organizationId: org.id } },
    update: {},
    create: { tenantId: tenant.id, organizationId: org.id },
  });
  ok("Organization vinculada con Tenant");


  // ============================================================
  // 9. USUARIOS
  // ============================================================
  section(9, "Creando Usuarios...");

  const eduardo = await prisma.user.upsert({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
    update: { organizationRole: "SUPERADMIN", primaryTenantId: tenant.id, planId: plans["enterprise"].id, active: true, allowAI: true },
    create: {
      name: "Eduardo Gonzalez", email: "eduardo@cactuscomunidadcreativa.com",
      organizationRole: "SUPERADMIN", primaryTenantId: tenant.id, planId: plans["enterprise"].id,
      active: true, allowAI: true, language: "es", country: "PE",
    },
  });
  ok(`Eduardo (Superadmin): ${eduardo.id}`);

  const eduardo6s = await prisma.user.upsert({
    where: { email: "eduardo.gonzalez@6seconds.org" },
    update: { organizationRole: "ADMIN", primaryTenantId: tenant.id, planId: plans["enterprise"].id, active: true, allowAI: true },
    create: {
      name: "Eduardo Gonzalez (6S)", email: "eduardo.gonzalez@6seconds.org",
      organizationRole: "ADMIN", primaryTenantId: tenant.id, planId: plans["enterprise"].id,
      active: true, allowAI: true, language: "en", country: "US",
    },
  });
  ok(`Eduardo 6S (Admin): ${eduardo6s.id}`);

  const josh = await prisma.user.upsert({
    where: { email: "josh@6seconds.org" },
    update: { organizationRole: "ADMIN", primaryTenantId: tenant.id, planId: plans["enterprise"].id, active: true, allowAI: true },
    create: {
      name: "Josh Freedman", email: "josh@6seconds.org",
      organizationRole: "ADMIN", primaryTenantId: tenant.id, planId: plans["enterprise"].id,
      active: true, allowAI: true, language: "en", country: "US",
    },
  });
  ok(`Josh (Admin): ${josh.id}`);

  const patty = await prisma.user.upsert({
    where: { email: "patty@6seconds.org" },
    update: { organizationRole: "ADMIN", primaryTenantId: tenant.id, planId: plans["enterprise"].id, active: true, allowAI: true },
    create: {
      name: "Patty Freedman", email: "patty@6seconds.org",
      organizationRole: "ADMIN", primaryTenantId: tenant.id, planId: plans["enterprise"].id,
      active: true, allowAI: true, language: "en", country: "US",
    },
  });
  ok(`Patty (Admin): ${patty.id}`);

  // ============================================================
  // 10. ROWIVERSE USERS
  // ============================================================
  section(10, "Creando RowiVerse Users...");

  const rvEduardo = await prisma.rowiVerseUser.upsert({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
    update: {},
    create: { email: "eduardo@cactuscomunidadcreativa.com", name: "Eduardo Gonzalez", userId: eduardo.id, rowiVerseId: rowiverse.id, verified: true, active: true, status: "active" },
  });
  const rvEduardo6s = await prisma.rowiVerseUser.upsert({
    where: { email: "eduardo.gonzalez@6seconds.org" },
    update: {},
    create: { email: "eduardo.gonzalez@6seconds.org", name: "Eduardo Gonzalez (6S)", userId: eduardo6s.id, rowiVerseId: rowiverse.id, verified: true, active: true, status: "active" },
  });
  const rvJosh = await prisma.rowiVerseUser.upsert({
    where: { email: "josh@6seconds.org" },
    update: {},
    create: { email: "josh@6seconds.org", name: "Josh Freedman", userId: josh.id, rowiVerseId: rowiverse.id, verified: true, active: true, status: "active" },
  });
  const rvPatty = await prisma.rowiVerseUser.upsert({
    where: { email: "patty@6seconds.org" },
    update: {},
    create: { email: "patty@6seconds.org", name: "Patty Freedman", userId: patty.id, rowiVerseId: rowiverse.id, verified: true, active: true, status: "active" },
  });

  await prisma.user.update({ where: { id: eduardo.id }, data: { rowiverseId: rvEduardo.id } });
  await prisma.user.update({ where: { id: eduardo6s.id }, data: { rowiverseId: rvEduardo6s.id } });
  await prisma.user.update({ where: { id: josh.id }, data: { rowiverseId: rvJosh.id } });
  await prisma.user.update({ where: { id: patty.id }, data: { rowiverseId: rvPatty.id } });
  ok("RowiVerse Users creados y vinculados");

  // ============================================================
  // 11. MEMBERSHIPS
  // ============================================================
  section(11, "Creando Memberships...");

  // Eduardo - Superadmin
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: eduardo.id, tenantId: tenant.id } },
    update: { role: "SUPERADMIN" },
    create: { userId: eduardo.id, tenantId: tenant.id, role: "SUPERADMIN", planId: plans["enterprise"].id, tokenQuota: 999999 },
  });
  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: eduardo.id } },
    update: { role: "OWNER" },
    create: { organizationId: org.id, userId: eduardo.id, role: "OWNER", status: "ACTIVE" },
  });
  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: eduardo.id } },
    update: { access: "admin" },
    create: { hubId: hub.id, userId: eduardo.id, access: "admin" },
  });

  // Eduardo 6S - Admin
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: eduardo6s.id, tenantId: tenant.id } },
    update: { role: "ADMIN" },
    create: { userId: eduardo6s.id, tenantId: tenant.id, role: "ADMIN", planId: plans["enterprise"].id, tokenQuota: 999999 },
  });
  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: eduardo6s.id } },
    update: { role: "ADMIN" },
    create: { organizationId: org.id, userId: eduardo6s.id, role: "ADMIN", status: "ACTIVE" },
  });
  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: eduardo6s.id } },
    update: { access: "admin" },
    create: { hubId: hub.id, userId: eduardo6s.id, access: "admin" },
  });

  // Josh - Admin
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: josh.id, tenantId: tenant.id } },
    update: { role: "ADMIN" },
    create: { userId: josh.id, tenantId: tenant.id, role: "ADMIN", planId: plans["enterprise"].id, tokenQuota: 999999 },
  });
  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: josh.id } },
    update: { role: "ADMIN" },
    create: { organizationId: org.id, userId: josh.id, role: "ADMIN", status: "ACTIVE" },
  });
  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: josh.id } },
    update: { access: "admin" },
    create: { hubId: hub.id, userId: josh.id, access: "admin" },
  });

  // Patty - Admin
  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: patty.id, tenantId: tenant.id } },
    update: { role: "ADMIN" },
    create: { userId: patty.id, tenantId: tenant.id, role: "ADMIN", planId: plans["enterprise"].id, tokenQuota: 999999 },
  });
  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: patty.id } },
    update: { role: "ADMIN" },
    create: { organizationId: org.id, userId: patty.id, role: "ADMIN", status: "ACTIVE" },
  });
  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: hub.id, userId: patty.id } },
    update: { access: "admin" },
    create: { hubId: hub.id, userId: patty.id, access: "admin" },
  });
  ok("Memberships creados");

  // ============================================================
  // 12. PERMISSIONS
  // ============================================================
  section(12, "Creando Permisos Jerárquicos...");

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
      create: { id: permId, userId: eduardo.id, role: perm.role, scope: perm.scope, scopeType: perm.scopeType, scopeId: perm.scopeId },
    });
  }
  ok("Eduardo: 5 permisos jerárquicos");

  for (const user of [{ u: eduardo6s, prefix: "eduardo6s" }, { u: josh, prefix: "josh" }, { u: patty, prefix: "patty" }]) {
    const perms = [
      { scopeType: "superhub" as const, scopeId: superHub.id, role: "ADMIN", scope: superHub.id },
      { scopeType: "tenant" as const, scopeId: tenant.id, role: "ADMIN", scope: tenant.id },
      { scopeType: "hub" as const, scopeId: hub.id, role: "ADMIN", scope: hub.id },
      { scopeType: "organization" as const, scopeId: org.id, role: "ADMIN", scope: org.id },
    ];
    for (const perm of perms) {
      const permId = `perm-${user.prefix}-${perm.scopeType.toLowerCase()}-${perm.scopeId}`;
      await prisma.userPermission.upsert({
        where: { id: permId },
        update: { role: perm.role },
        create: { id: permId, userId: user.u.id, role: perm.role, scope: perm.scope, scopeType: perm.scopeType, scopeId: perm.scopeId, tenantId: tenant.id },
      });
    }
    ok(`${user.prefix}: 4 permisos jerárquicos`);
  }

  // ============================================================
  // 13. COMUNIDAD
  // ============================================================
  section(13, "Creando Comunidad principal...");

  const community = await prisma.rowiCommunity.upsert({
    where: { slug: "six-seconds-global" },
    update: {},
    create: {
      name: "Six Seconds Global", slug: "six-seconds-global",
      description: "Comunidad global de Six Seconds - Inteligencia Emocional",
      type: "professional", visibility: "public",
      tenantId: tenant.id, hubId: hub.id, createdById: eduardo6s.id, owner: "Eduardo Gonzalez",
    },
  });
  ok(`Comunidad: ${community.id}`);

  await prisma.rowiCommunityUser.upsert({
    where: { id: `member-eduardo6s-${community.id}` },
    update: {},
    create: { id: `member-eduardo6s-${community.id}`, communityId: community.id, userId: eduardo6s.id, rowiverseUserId: rvEduardo6s.id, email: "eduardo.gonzalez@6seconds.org", name: "Eduardo Gonzalez", role: "owner", status: "active" },
  });
  await prisma.rowiCommunityUser.upsert({
    where: { id: `member-josh-${community.id}` },
    update: {},
    create: { id: `member-josh-${community.id}`, communityId: community.id, userId: josh.id, rowiverseUserId: rvJosh.id, email: "josh@6seconds.org", name: "Josh Freedman", role: "admin", status: "active" },
  });
  await prisma.rowiCommunityUser.upsert({
    where: { id: `member-patty-${community.id}` },
    update: {},
    create: { id: `member-patty-${community.id}`, communityId: community.id, userId: patty.id, rowiverseUserId: rvPatty.id, email: "patty@6seconds.org", name: "Patty Freedman", role: "admin", status: "active" },
  });
  ok("Miembros agregados a comunidad");

  // ============================================================
  // 14. AGENTES IA — 6 Agentes x 3 niveles = 18
  // ============================================================
  section(14, "Creando Agentes IA...");

  const agentsData = [
    {
      slug: "super-rowi", name: "Super Rowi", type: "GENERAL",
      description: "Tu asistente principal de inteligencia emocional. Puede ayudarte con cualquier tema relacionado con EQ, bienestar y desarrollo personal.",
      avatar: "/agents/super-rowi.png", model: "gpt-4o-mini", tone: "friendly",
      prompt: `Eres Super Rowi, el asistente principal de inteligencia emocional de la plataforma ROWI.\n\nTu misión es ayudar a los usuarios a:\n- Desarrollar su inteligencia emocional\n- Entender sus resultados SEI y Brain Brief\n- Mejorar sus relaciones interpersonales\n- Gestionar sus emociones de manera efectiva\n- Alcanzar sus metas de desarrollo personal\n\nSiempre responde de manera empática, constructiva y basada en la ciencia de Six Seconds.\nUsa un tono amigable pero profesional. Si no sabes algo, admítelo honestamente.`,
      accessLevel: "public", visibility: "public",
    },
    {
      slug: "eq", name: "Rowi EQ", type: "EQ_COACH",
      description: "Coach especializado en inteligencia emocional. Te ayuda a interpretar tus resultados SEI y desarrollar competencias EQ.",
      avatar: "/agents/rowi-eq.png", model: "gpt-4o-mini", tone: "supportive",
      prompt: `Eres Rowi EQ, un coach especializado en inteligencia emocional basado en el modelo SEI de Six Seconds.\n\nTu expertise incluye:\n- Interpretar los 8 competencias del SEI (Emotional Literacy, Recognize Patterns, Apply Consequential Thinking, Navigate Emotions, Engage Intrinsic Motivation, Exercise Optimism, Increase Empathy, Pursue Noble Goals)\n- Explicar los Brain Styles y sus implicaciones\n- Guiar ejercicios de desarrollo emocional\n- Conectar EQ con resultados de vida (Success Factors)\n\nBasa tus respuestas en la ciencia de Six Seconds. Sé específico y práctico en tus recomendaciones.`,
      accessLevel: "public", visibility: "public",
    },
    {
      slug: "affinity", name: "Rowi Affinity", type: "AFFINITY_EXPERT",
      description: "Experto en relaciones y compatibilidad. Analiza dinámicas interpersonales usando inteligencia emocional.",
      avatar: "/agents/rowi-affinity.png", model: "gpt-4o-mini", tone: "warm",
      prompt: `Eres Rowi Affinity, un experto en relaciones interpersonales y compatibilidad emocional.\n\nTu rol es:\n- Analizar la compatibilidad entre perfiles EQ\n- Identificar fortalezas y áreas de crecimiento en relaciones\n- Sugerir estrategias para mejorar la comunicación\n- Ayudar a resolver conflictos usando inteligencia emocional\n- Explicar cómo diferentes Brain Styles interactúan\n\nSiempre sé respetuoso y constructivo. Evita juicios y enfócate en el potencial de crecimiento.`,
      accessLevel: "public", visibility: "public",
    },
    {
      slug: "eco", name: "Rowi ECO", type: "COMMUNICATION_EXPERT",
      description: "Especialista en comunicación efectiva y ecosistemas organizacionales.",
      avatar: "/agents/rowi-eco.png", model: "gpt-4o-mini", tone: "professional",
      prompt: `Eres Rowi ECO, especialista en comunicación efectiva y análisis de ecosistemas organizacionales.\n\nTus áreas de expertise:\n- Análisis de dinámicas de equipo usando EQ\n- Comunicación asertiva y empática\n- Resolución de conflictos organizacionales\n- Cultura emocional en equipos\n- Liderazgo basado en inteligencia emocional\n\nOfrece insights basados en datos y recomendaciones prácticas para mejorar el ecosistema emocional.`,
      accessLevel: "public", visibility: "public",
    },
    {
      slug: "trainer", name: "Rowi Trainer", type: "COACH",
      description: "Tu entrenador personal de EQ. Diseña planes de desarrollo y hace seguimiento de tu progreso.",
      avatar: "/agents/rowi-trainer.png", model: "gpt-4o-mini", tone: "motivational",
      prompt: `Eres Rowi Trainer, un entrenador personal de inteligencia emocional.\n\nTu misión es:\n- Diseñar planes de desarrollo EQ personalizados\n- Proponer ejercicios y prácticas diarias\n- Hacer seguimiento del progreso del usuario\n- Celebrar logros y motivar ante desafíos\n- Adaptar el entrenamiento según los resultados\n\nSé motivador pero realista. Usa técnicas basadas en evidencia y celebra cada pequeño avance.`,
      accessLevel: "public", visibility: "public",
    },
    {
      slug: "sales", name: "Rowi Sales", type: "SALES_EXPERT",
      description: "Experto en ventas emocionales. Aplica EQ para mejorar relaciones comerciales.",
      avatar: "/agents/rowi-sales.png", model: "gpt-4o-mini", tone: "confident",
      prompt: `Eres Rowi Sales, un experto en aplicar inteligencia emocional a las ventas y relaciones comerciales.\n\nTu expertise incluye:\n- Entender las emociones del cliente\n- Comunicación persuasiva basada en empatía\n- Manejo de objeciones con EQ\n- Construcción de relaciones comerciales duraderas\n- Negociación win-win\n\nAyuda a los usuarios a vender de manera ética y efectiva, poniendo las relaciones por encima de las transacciones.`,
      accessLevel: "premium", visibility: "public",
    },
  ];

  const sixSecondsCulture = {
    culturePrompt: `SIX SECONDS CULTURE & VALUES:\n\nVISION: By 2039, we will engage 1 billion people practicing emotional intelligence.\n\nMISSION: To support people to create positive change - everywhere, all the time.\n\nCORE VALUES:\n- Connection: We prioritize relationships and authentic human connection\n- Hope: We believe in human potential and the power to change\n- Safety: We create environments where people feel secure to grow\n- Belonging: Everyone deserves to feel part of a community\n\nTHE SIX SECONDS MODEL:\n- KNOW YOURSELF: Enhance Emotional Literacy, Recognize Patterns\n- CHOOSE YOURSELF: Apply Consequential Thinking, Navigate Emotions, Engage Intrinsic Motivation, Exercise Optimism\n- GIVE YOURSELF: Increase Empathy, Pursue Noble Goals\n\nCOMMUNICATION STYLE:\n- Science-based but accessible and warm\n- Empathetic and non-judgmental\n- Action-oriented with practical tools\n- Inspiring hope while being realistic\n- Always connect EQ to meaningful purpose`,
    companyValues: ["Connection", "Hope", "Safety", "Belonging", "Authenticity", "Growth", "Science-Based Action"],
    companyMission: "To support people to create positive change - everywhere, all the time",
    companyVision: "By 2039, we will engage 1 billion people practicing emotional intelligence",
    companyTone: "Warm, inspiring, science-based yet accessible, action-oriented",
    industryContext: "EdTech/HRTech - Emotional Intelligence & Leadership Development",
  };

  // GLOBAL agents
  for (const agent of agentsData) {
    const existing = await prisma.agentConfig.findFirst({
      where: { slug: agent.slug, tenantId: null, superHubId: null, organizationId: null, hubId: null },
    });
    if (existing) {
      await prisma.agentConfig.update({ where: { id: existing.id }, data: { name: agent.name, description: agent.description, prompt: agent.prompt, isActive: true } });
    } else {
      await prisma.agentConfig.create({
        data: {
          slug: agent.slug, name: agent.name, type: agent.type, description: agent.description,
          avatar: agent.avatar, model: agent.model, tone: agent.tone, prompt: agent.prompt,
          accessLevel: agent.accessLevel, visibility: agent.visibility,
          systemId: system.id, isActive: true, autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
        },
      });
    }
    ok(`[GLOBAL] ${agent.name}`);
  }

  // TENANT agents (with Six Seconds culture)
  for (const agent of agentsData) {
    const existing = await prisma.agentConfig.findFirst({
      where: { slug: agent.slug, tenantId: tenant.id, superHubId: null, organizationId: null, hubId: null },
    });
    if (!existing) {
      await prisma.agentConfig.create({
        data: {
          slug: agent.slug, name: agent.name, type: agent.type, description: agent.description,
          avatar: agent.avatar, model: agent.model, tone: agent.tone, prompt: agent.prompt,
          accessLevel: "tenant", visibility: "global",
          tenantId: tenant.id, systemId: system.id, isActive: true, autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
          culturePrompt: sixSecondsCulture.culturePrompt,
          companyValues: sixSecondsCulture.companyValues,
          companyMission: sixSecondsCulture.companyMission,
          companyTone: sixSecondsCulture.companyTone,
          industryContext: sixSecondsCulture.industryContext,
        },
      });
      ok(`[TENANT] ${agent.name}`);
    }
  }

  // HUB agents (with Six Seconds culture)
  for (const agent of agentsData) {
    const existing = await prisma.agentConfig.findFirst({ where: { slug: agent.slug, hubId: hub.id } });
    if (!existing) {
      await prisma.agentConfig.create({
        data: {
          slug: agent.slug, name: agent.name, type: agent.type, description: agent.description,
          avatar: agent.avatar, model: agent.model, tone: agent.tone, prompt: agent.prompt,
          accessLevel: "hub", visibility: "hub",
          hubId: hub.id, tenantId: tenant.id, systemId: system.id, isActive: true, autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
          culturePrompt: sixSecondsCulture.culturePrompt,
          companyValues: sixSecondsCulture.companyValues,
          companyMission: sixSecondsCulture.companyMission,
          companyTone: sixSecondsCulture.companyTone,
          industryContext: sixSecondsCulture.industryContext,
        },
      });
      ok(`[HUB] ${agent.name}`);
    }
  }

  // ============================================================
  // 15. GAMIFICACIÓN — Niveles
  // ============================================================
  section(15, "Creando Niveles...");

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
  // 16. GAMIFICACIÓN — Achievements (34)
  // ============================================================
  section(16, "Creando Achievements...");

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
    { slug: "brain_talent_discover", name: "Descubridor de Talentos", nameEN: "Talent Discoverer", description: "Explora todos los Brain Talents", descriptionEN: "Explore all Brain Talents", category: "EQ", requirement: "CUSTOM", threshold: 1, points: 75, rarity: "UNCOMMON", icon: "sparkles", color: "#6366F1" },
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
  // 17. GAMIFICACIÓN — Rewards (8)
  // ============================================================
  section(17, "Creando Rewards...");

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
  // 18. MICROLEARNING
  // ============================================================
  section(18, "Creando MicroLearning...");

  let microCount = 0;

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
  // 19. FEATURE DEFINITIONS — Catálogo de features del sistema
  // ============================================================
  section(19, "Creando Feature Definitions...");

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
  // 20. PROFILE FEATURES — Permisos por rol
  // ============================================================
  section(20, "Creando Profile Feature mappings...");

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
  // 21. SYSTEM SETTINGS
  // ============================================================
  section(21, "Creando System Settings...");

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
  // 22. EMOTIONAL CONFIG
  // ============================================================
  section(22, "Creando Emotional Config...");

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
  // 23. TRADUCCIONES — Admin UI i18n (COMPLETAS - 212+ pares)
  // ============================================================
  section(23, "Creando Traducciones...");

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
    { ns: "admin", key: "nav.permissions", es: "Permisos", en: "Permissions" },

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

    // ============ Chat ============
    { ns: "chat", key: "chat.welcome", es: "¡Hola! Soy tu asistente de inteligencia emocional. ¿En qué puedo ayudarte hoy?", en: "Hello! I'm your emotional intelligence assistant. How can I help you today?" },
    { ns: "chat", key: "chat.thinking", es: "Pensando...", en: "Thinking..." },
    { ns: "chat", key: "chat.error", es: "Lo siento, hubo un error. Por favor intenta de nuevo.", en: "Sorry, there was an error. Please try again." },
    { ns: "chat", key: "chat.placeholder", es: "Escribe tu mensaje...", en: "Type your message..." },
    { ns: "chat", key: "agent.not_found", es: "No hay un agente IA configurado para este contexto.", en: "No AI agent is configured for this context." },

    // ============ Permissions ============
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
  // 🏁 RESUMEN FINAL
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  🚀 SEED PRODUCCIÓN COMPLETADO");
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
    communities: await prisma.rowiCommunity.count(),
    users: await prisma.user.count(),
  };

  console.log(`
  Jerarquía:
    - RowiVerse: ${rowiverse.id}
    - System: ${system.id}
    - SuperHub: ${superHub.id}
    - Tenant Global (público): ${rowiGlobalTenant.id}
    - Tenant Six Seconds: ${tenant.id}
    - Hub: ${hub.id}
    - Organization: ${org.id}

  Datos:
    - Usuarios: ${counts.users}
    - Planes: ${counts.plans}
    - Agentes IA: ${counts.agents} (6 Global + 6 Tenant + 6 Hub)
    - Niveles: ${counts.levels}
    - Achievements: ${counts.achievements}
    - MicroLearning: ${counts.microLearning}
    - Rewards: ${counts.rewards}
    - Feature Definitions: ${counts.featureDefinitions}
    - Profile Features: ${counts.profileFeatures}
    - Comunidades: ${counts.communities}
    - Traducciones: ${counts.translations}

  SuperAdmin: eduardo@cactuscomunidadcreativa.com

  ¡Rowi está listo para producción! 🚀
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
