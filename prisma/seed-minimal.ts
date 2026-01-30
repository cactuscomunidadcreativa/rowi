// prisma/seed-minimal.ts
// ============================================================
// ROWI - Seed Mínimo para Reset Limpio
// ============================================================
// Estructura:
// - RowiVerse (sistema global)
// - Six Seconds (primer cliente)
// - Eduardo, Josh como admins
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI - SEED MÍNIMO");
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
  // 3. PLANES - Solo los esenciales
  // ============================================================
  console.log("\n3. Creando Planes...");

  const planFree = await prisma.plan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      description: "Plan gratuito para explorar Rowi",
      priceUsd: 0,
      priceCents: 0,
      billingPeriod: "monthly",
      tokensMonthly: 10,
      maxUsers: 1,
      planType: "individual",
      targetAudience: "B2C",
      aiEnabled: true,
      superRowiAccess: true,
      rowiEQAccess: true,
      maxCommunities: 1,
      maxMembers: 5,
      supportLevel: "community",
      isPublic: true,
      isActive: true,
      sortOrder: 1,
    },
  });

  const planEnterprise = await prisma.plan.upsert({
    where: { slug: "enterprise" },
    update: {},
    create: {
      name: "Enterprise",
      slug: "enterprise",
      description: "Plan empresarial completo",
      priceUsd: 0,
      priceCents: 0,
      billingPeriod: "monthly",
      tokensMonthly: 999999,
      maxUsers: 9999,
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
      maxCommunities: 999,
      maxMembers: 9999,
      benchmarkAccess: true,
      advancedReports: true,
      executiveDashboard: true,
      apiAccess: true,
      supportLevel: "dedicated",
      isPublic: false,
      isActive: true,
      sortOrder: 10,
    },
  });

  console.log("   ✅ Plan Free:", planFree.id);
  console.log("   ✅ Plan Enterprise:", planEnterprise.id);

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
      logo: "/six-seconds-logo.png",
      primaryColor: "#E85D04",
      active: true,
      billingEmail: "admin@6seconds.org",
      defaultLang: "en",
      defaultTimezone: "America/Los_Angeles",
      superHubId: superHub.id,
      systemId: system.id,
    },
  });
  console.log("   ✅ Tenant:", tenant.id);

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
      tenantId: tenant.id,
      hubId: hub.id,
      unitType: "COMPANY",
    },
  });
  console.log("   ✅ Organization:", org.id);

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
      planId: planEnterprise.id,
      active: true,
      allowAI: true,
    },
    create: {
      name: "Eduardo Gonzalez",
      email: "eduardo@cactuscomunidadcreativa.com",
      organizationRole: "SUPERADMIN",
      primaryTenantId: tenant.id,
      planId: planEnterprise.id,
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
      planId: planEnterprise.id,
      active: true,
      allowAI: true,
    },
    create: {
      name: "Eduardo Gonzalez (6S)",
      email: "eduardo.gonzalez@6seconds.org",
      organizationRole: "ADMIN",
      primaryTenantId: tenant.id,
      planId: planEnterprise.id,
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
      planId: planEnterprise.id,
      active: true,
      allowAI: true,
    },
    create: {
      name: "Josh Freedman",
      email: "josh@6seconds.org",
      organizationRole: "ADMIN",
      primaryTenantId: tenant.id,
      planId: planEnterprise.id,
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
      planId: planEnterprise.id,
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
    update: { role: "admin" },
    create: {
      hubId: hub.id,
      userId: eduardo.id,
      role: "admin",
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
      planId: planEnterprise.id,
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
    update: { role: "admin" },
    create: {
      hubId: hub.id,
      userId: eduardo6s.id,
      role: "admin",
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
      planId: planEnterprise.id,
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
    update: { role: "admin" },
    create: {
      hubId: hub.id,
      userId: josh.id,
      role: "admin",
    },
  });

  console.log("   ✅ Memberships creados");

  // ============================================================
  // 11. PERMISSIONS - Permisos de superadmin
  // ============================================================
  console.log("\n11. Creando Permisos...");

  // Eduardo - Superadmin global
  await prisma.userPermission.upsert({
    where: { id: `perm-eduardo-global` },
    update: {},
    create: {
      id: `perm-eduardo-global`,
      userId: eduardo.id,
      permission: "SUPERADMIN",
      scope: "GLOBAL",
      scopeType: "GLOBAL",
      grantedBy: eduardo.id,
    },
  });

  // Eduardo 6S - Admin de Six Seconds
  await prisma.userPermission.upsert({
    where: { id: `perm-eduardo6s-tenant` },
    update: {},
    create: {
      id: `perm-eduardo6s-tenant`,
      userId: eduardo6s.id,
      permission: "ADMIN",
      scope: tenant.id,
      scopeType: "TENANT",
      tenantId: tenant.id,
      grantedBy: eduardo.id,
    },
  });

  // Josh - Admin de Six Seconds
  await prisma.userPermission.upsert({
    where: { id: `perm-josh-tenant` },
    update: {},
    create: {
      id: `perm-josh-tenant`,
      userId: josh.id,
      permission: "ADMIN",
      scope: tenant.id,
      scopeType: "TENANT",
      tenantId: tenant.id,
      grantedBy: eduardo.id,
    },
  });

  console.log("   ✅ Permisos creados");

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
      type: "PROFESSIONAL",
      visibility: "PUBLIC",
      tenantId: tenant.id,
      hubId: hub.id,
      creatorId: eduardo6s.id,
      rowiverseCreatorId: rvEduardo6s.id,
    },
  });
  console.log("   ✅ Comunidad:", community.id);

  // Agregar miembros a la comunidad
  await prisma.communityMember.upsert({
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
      status: "ACTIVE",
    },
  });

  await prisma.communityMember.upsert({
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
      status: "ACTIVE",
    },
  });

  console.log("   ✅ Miembros agregados a comunidad");

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
  console.log("  - eduardo@cactuscomunidadcreativa.com (SUPERADMIN)");
  console.log("  - eduardo.gonzalez@6seconds.org (ADMIN Six Seconds)");
  console.log("  - josh@6seconds.org (ADMIN Six Seconds)");
  console.log("\n");
  console.log("Planes:");
  console.log("  - Free (usuarios nuevos)");
  console.log("  - Enterprise (admins)");
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
