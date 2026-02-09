// prisma/seed-tp.ts
// ============================================================
// ROWI - Seed para Teleperformance (TP) Demo
// ============================================================
// Estructura:
// - SuperHub: Six Seconds Partners
// - Tenant: Teleperformance
// - Hub: TP Global
// - Organizations: TP LATAM, TP EMEA, TP NA, TP APAC
// - RowiCommunity: TP EQ Community
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI - SEED TELEPERFORMANCE DEMO");
  console.log("=".repeat(60));
  console.log("\n");

  // ============================================================
  // 1. Buscar dependencias existentes
  // ============================================================
  console.log("1. Buscando dependencias existentes...");

  const rowiverse = await prisma.rowiVerse.findFirst({ where: { slug: "rowiverse" } });
  if (!rowiverse) {
    console.error("❌ No se encontró RowiVerse. Ejecuta seed-minimal.ts primero.");
    return;
  }
  console.log("   ✅ RowiVerse:", rowiverse.id);

  const system = await prisma.system.findFirst({ where: { slug: "rowi" } });
  if (!system) {
    console.error("❌ No se encontró System. Ejecuta seed-minimal.ts primero.");
    return;
  }
  console.log("   ✅ System:", system.id);

  // Buscar plan enterprise
  const enterprisePlan = await prisma.plan.findFirst({ where: { slug: "enterprise" } });
  if (!enterprisePlan) {
    console.error("❌ No se encontró Plan Enterprise. Ejecuta seed-minimal.ts primero.");
    return;
  }
  console.log("   ✅ Plan Enterprise:", enterprisePlan.id);

  // Buscar SuperHub Six Seconds existente
  const sixSecondsSH = await prisma.superHub.findFirst({ where: { slug: "six-seconds" } });
  if (!sixSecondsSH) {
    console.error("❌ No se encontró SuperHub Six Seconds. Ejecuta seed-minimal.ts primero.");
    return;
  }
  console.log("   ✅ SuperHub Six Seconds:", sixSecondsSH.id);

  // ============================================================
  // 2. TENANT - Teleperformance
  // ============================================================
  console.log("\n2. Creando Tenant Teleperformance...");

  const tpTenant = await prisma.tenant.upsert({
    where: { slug: "teleperformance" },
    update: {},
    create: {
      name: "Teleperformance",
      slug: "teleperformance",
      billingEmail: "admin@teleperformance.com",
      superHubId: sixSecondsSH.id,
      systemId: system.id,
      planId: enterprisePlan.id,
    },
  });
  console.log("   ✅ Tenant TP:", tpTenant.id);

  // Crear TenantBranding para TP
  await prisma.tenantBranding.upsert({
    where: { tenantId: tpTenant.id },
    update: {},
    create: {
      tenantId: tpTenant.id,
      logoUrl: "/tp-logo.png",
      primaryColor: "#7B2D8E", // TP purple
      secondaryColor: "#E31937", // TP red
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
  console.log("   ✅ TenantBranding TP creado");

  // ============================================================
  // 3. HUB - TP Global
  // ============================================================
  console.log("\n3. Creando Hub TP Global...");

  const tpHub = await prisma.hub.upsert({
    where: { slug: "tp-global" },
    update: {},
    create: {
      name: "TP Global",
      slug: "tp-global",
      description: "Teleperformance Global Operations Hub",
      superHubId: sixSecondsSH.id,
      tenantId: tpTenant.id,
    },
  });
  console.log("   ✅ Hub TP Global:", tpHub.id);

  // ============================================================
  // 4. ORGANIZATIONS - TP Regiones
  // ============================================================
  console.log("\n4. Creando Organizaciones TP...");

  const regions = [
    { name: "TP North America", slug: "tp-na", description: "Teleperformance North America Operations" },
    { name: "TP Latin America", slug: "tp-latam", description: "Teleperformance Latin America Operations" },
    { name: "TP EMEA", slug: "tp-emea", description: "Teleperformance Europe, Middle East & Africa Operations" },
    { name: "TP Asia Pacific", slug: "tp-apac", description: "Teleperformance Asia Pacific Operations" },
  ];

  const orgs: Record<string, any> = {};

  for (const region of regions) {
    const org = await prisma.organization.upsert({
      where: { slug: region.slug },
      update: {},
      create: {
        name: region.name,
        slug: region.slug,
        description: region.description,
        hubId: tpHub.id,
        unitType: "CLIENT",
      },
    });

    // Vincular Organization con Tenant
    await prisma.organizationToTenant.upsert({
      where: {
        tenantId_organizationId: {
          tenantId: tpTenant.id,
          organizationId: org.id,
        },
      },
      update: {},
      create: {
        tenantId: tpTenant.id,
        organizationId: org.id,
      },
    });

    orgs[region.slug] = org;
    console.log(`   ✅ ${region.name}: ${org.id}`);
  }

  // ============================================================
  // 5. ROWI COMMUNITY - TP EQ Community
  // ============================================================
  console.log("\n5. Creando RowiCommunity TP...");

  const tpCommunity = await prisma.rowiCommunity.upsert({
    where: { slug: "tp-eq-community" },
    update: {},
    create: {
      name: "Teleperformance EQ Community",
      slug: "tp-eq-community",
      description: "Emotional Intelligence community for Teleperformance — powered by Six Seconds SEI and Rowi AI",
      type: "enterprise",
      visibility: "private",
      category: "corporate",
      teamType: "biz",
      language: "en",
      superHubId: sixSecondsSH.id,
      hubId: tpHub.id,
      tenantId: tpTenant.id,
      rowiVerseId: rowiverse.id,
    },
  });
  console.log("   ✅ RowiCommunity TP:", tpCommunity.id);

  // ============================================================
  // 6. BENCHMARK - TP All Assessments
  // ============================================================
  console.log("\n6. Creando Benchmark TP...");

  // Buscar usuario admin para el uploadedBy
  const adminUser = await prisma.user.findFirst({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
  });

  if (!adminUser) {
    console.error("❌ No se encontró usuario admin.");
    return;
  }

  const tpBenchmark = await prisma.benchmark.upsert({
    where: { id: "tp-all-assessments-2025" },
    update: {},
    create: {
      id: "tp-all-assessments-2025",
      name: "Teleperformance - All SEI Assessments 2025",
      description: "Complete SEI assessment data from Teleperformance global operations. 14,886 assessments across all regions, roles, and departments.",
      type: "CORPORATE",
      status: "READY",
      scope: "TENANT",
      tenantId: tpTenant.id,
      sourceFile: "TP All Assessments 1.22.26 (1).xlsx",
      totalRows: 14886,
      processedRows: 14886,
      uploadedBy: adminUser.id,
      isActive: true,
      isLearning: true,
    },
  });
  console.log("   ✅ Benchmark TP:", tpBenchmark.id);

  // ============================================================
  // 7. Vincular Eduardo como admin de TP
  // ============================================================
  console.log("\n7. Vinculando admin a TP...");

  await prisma.membership.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tpTenant.id } },
    update: { role: "SUPERADMIN" },
    create: {
      userId: adminUser.id,
      tenantId: tpTenant.id,
      role: "SUPERADMIN",
      planId: enterprisePlan.id,
      tokenQuota: 999999,
    },
  });

  // Add org membership for primary org
  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: orgs["tp-na"].id, userId: adminUser.id } },
    update: { role: "OWNER" },
    create: {
      organizationId: orgs["tp-na"].id,
      userId: adminUser.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  await prisma.hubMembership.upsert({
    where: { hubId_userId: { hubId: tpHub.id, userId: adminUser.id } },
    update: { access: "admin" },
    create: {
      hubId: tpHub.id,
      userId: adminUser.id,
      access: "admin",
    },
  });

  console.log("   ✅ Admin vinculado a TP");

  // ============================================================
  // RESUMEN
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ✅ SEED TELEPERFORMANCE COMPLETADO");
  console.log("=".repeat(60));
  console.log("\n  Estructura creada:");
  console.log("  SuperHub: Six Seconds (existente)");
  console.log(`  └── Tenant: Teleperformance (${tpTenant.id})`);
  console.log(`      └── Hub: TP Global (${tpHub.id})`);
  console.log(`          ├── Org: TP North America (${orgs["tp-na"].id})`);
  console.log(`          ├── Org: TP Latin America (${orgs["tp-latam"].id})`);
  console.log(`          ├── Org: TP EMEA (${orgs["tp-emea"].id})`);
  console.log(`          └── Org: TP Asia Pacific (${orgs["tp-apac"].id})`);
  console.log(`  Community: TP EQ Community (${tpCommunity.id})`);
  console.log(`  Benchmark: TP All Assessments (${tpBenchmark.id})`);
  console.log("\n  Siguiente paso:");
  console.log("  Sube el archivo Excel via /admin/benchmarks o ejecuta el procesamiento.");
  console.log("\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
