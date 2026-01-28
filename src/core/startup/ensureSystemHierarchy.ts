// src/core/startup/ensureSystemHierarchy.ts
import { prisma } from "../prisma";

export async function ensureSystemHierarchy() {
  console.log("🚀 Iniciando verificación de jerarquía del sistema...\n");

  // =========================================================
  // 1️⃣ ROWIVERSE ROOT
  // =========================================================
  const rowiverse = await prisma.rowiVerse.upsert({
    where: { slug: "rowiverse" },
    update: {},
    create: {
      id: "rowiverse_root",
      slug: "rowiverse",
      name: "RowiVerse Global",
      description: "Ecosistema global de inteligencia emocional y coaching.",
    },
  });
  console.log(`🌍 RowiVerse garantizado: ${rowiverse.name}`);

  // =========================================================
  // 2️⃣ SYSTEM ROOT
  // =========================================================
  const system = await prisma.system.upsert({
    where: { slug: "cactus" },
    update: {},
    create: {
      slug: "cactus",
      name: "Cactus Global System",
      description: "Sistema administrativo base del ecosistema Rowi/Cactus.",
      logo: "/assets/system/cactus-logo.png",
    },
  });
  console.log(`🧩 System garantizado: ${system.name}`);

  // =========================================================
  // 3️⃣ SUPERHUB BASE
  // =========================================================
  const superHub = await prisma.superHub.upsert({
    where: { slug: "cactus-hub" },
    update: {},
    create: {
      name: "Cactus Hub",
      slug: "cactus-hub",
      description: "SuperHub principal del ecosistema Rowi/Cactus",
      colorTheme: "#FF6B35",
      region: "LATAM",
      rowiVerseId: rowiverse.id,
      systemId: system.id,
    },
  });
  console.log(`🏛️ SuperHub garantizado: ${superHub.name}`);

  // =========================================================
  // 4️⃣ PLANES BASE
  // =========================================================
  const basePlans = [
    { name: "Free", priceUsd: 0, aiEnabled: false },
    { name: "Pro", priceUsd: 29, aiEnabled: true },
    { name: "Enterprise", priceUsd: 99, aiEnabled: true },
    { name: "Global AI", priceUsd: 0, aiEnabled: true },
  ];

  for (const p of basePlans) {
    await prisma.plan.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }
  console.log("💼 Planes base garantizados.");

  const enterprisePlan = await prisma.plan.findUnique({
    where: { name: "Enterprise" },
  });

  // =========================================================
  // 5️⃣ TENANT PRINCIPAL (Rowi Master) con plan Enterprise
  // =========================================================
  const tenant = await prisma.tenant.upsert({
    where: { slug: "rowi-master" },
    update: {
      planId: enterprisePlan?.id,
    },
    create: {
      name: "Rowi Master",
      slug: "rowi-master",
      billingEmail: "admin@rowi.ai",
      visibilityScope: "global",
      superHubId: superHub.id,
      planId: enterprisePlan?.id,
    },
  });
  console.log(`🏢 Tenant garantizado: ${tenant.name}`);

  // =========================================================
  // 6️⃣ ORGANIZATION BASE
  // =========================================================
  const org = await prisma.organization.upsert({
    where: { slug: "rowi-organization" },
    update: {},
    create: {
      name: "Rowi Organization",
      slug: "rowi-organization",
      description: "Organización base de Rowi",
      superHubId: superHub.id,
    },
  });
  console.log(`🏢 Organización garantizada: ${org.name}`);

  // =========================================================
  // 7️⃣ ORG ↔ TENANT (N:M)
  // =========================================================
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
  console.log("🔗 Org ↔ Tenant vinculado");

  // =========================================================
  // 8️⃣ HUB BASE
  // =========================================================
  const hub = await prisma.hub.upsert({
    where: { slug: "rowi" },
    update: {},
    create: {
      name: "Rowi",
      slug: "rowi",
      description: "Hub principal del ecosistema Rowi",
      superHubId: superHub.id,
      tenantId: tenant.id,
      themeColor: "#007AFF",
      visibility: "public",
    },
  });
  console.log(`🧱 Hub garantizado: ${hub.name}`);

  // =========================================================
  // 9️⃣ ORG ↔ HUB (N:M)
  // =========================================================
  await prisma.organizationToHub.upsert({
    where: {
      hubId_organizationId: {
        hubId: hub.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      hubId: hub.id,
      organizationId: org.id,
    },
  });
  console.log("🔗 Org ↔ Hub vinculado");
  // =========================================================
  // 🔟 USUARIO PRINCIPAL (Eduardo)
  // =========================================================
  const user = await prisma.user.upsert({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
    update: {},
    create: {
      email: "eduardo@cactuscomunidadcreativa.com",
      name: "Eduardo González",
      active: true,
      allowAI: true,
      primaryTenantId: tenant.id,
    },
  });
  console.log(`👤 Usuario base garantizado: ${user.email}`);

  // =========================================================
  // 1️⃣1️⃣ MEMBRESÍA DE TENANT (Enterprise)
  // =========================================================
  await prisma.membership.upsert({
    where: {
      userId_tenantId: { userId: user.id, tenantId: tenant.id },
    },
    update: {
      role: "SUPERADMIN",
      planId: enterprisePlan?.id,
      tokenQuota: 200000,
    },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: "SUPERADMIN",
      planId: enterprisePlan?.id,
      tokenQuota: 200000,
    },
  });
  console.log("🔗 Membresía Tenant garantizada (Enterprise).");

  // =========================================================
  // 1️⃣2️⃣ MEMBRESÍA DE ORGANIZATION
  // =========================================================
  await prisma.orgMembership.upsert({
    where: {
      organizationId_userId: { organizationId: org.id, userId: user.id },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: user.id,
      role: "OWNER",
    },
  });
  console.log("🔗 Membresía Organización garantizada.");

  // =========================================================
  // 1️⃣3️⃣ MEMBRESÍA DE HUB
  // =========================================================
  await prisma.hubMembership.upsert({
    where: {
      hubId_userId: { hubId: hub.id, userId: user.id },
    },
    update: {},
    create: {
      hubId: hub.id,
      userId: user.id,
      access: "ADMIN",
    },
  });
  console.log("🔗 Membresía Hub garantizada.");

  // =========================================================
  // 1️⃣4️⃣ ROLES DINÁMICOS (RoleDynamic)
  // =========================================================
  const roleDefs = [
    { name: "superadmin", level: "SYSTEM" },
    { name: "superhub-admin", level: "SUPERHUB" },
    { name: "superhub-manager", level: "SUPERHUB" },
    { name: "superhub-viewer", level: "SUPERHUB" },
    { name: "tenant-admin", level: "TENANT" },
    { name: "tenant-manager", level: "TENANT" },
    { name: "tenant-editor", level: "TENANT" },
    { name: "tenant-viewer", level: "TENANT" },
    { name: "hub-admin", level: "HUB" },
    { name: "hub-manager", level: "HUB" },
    { name: "hub-viewer", level: "HUB" },
    { name: "plan-admin", level: "PLAN" },
    { name: "plan-viewer", level: "PLAN" },
  ];

  for (const r of roleDefs) {
    await prisma.roleDynamic.upsert({
      where: {
        name_superHubId: {
          name: r.name,
          superHubId: superHub.id,
        },
      },
      update: {},
      create: {
        name: r.name,
        level: r.level as any,
        description: `${r.name} role`,
        superHubId: superHub.id,
      },
    });
  }

  console.log("🧩 Roles dinámicos garantizados.");
  console.log("\n✅ Jerarquía COMPLETA está lista.\n");
}
/**
 * 🧪 Ejecutar manualmente:
 * pnpm tsx src/core/startup/ensureSystemHierarchy.ts
 */
if (require.main === module) {
  ensureSystemHierarchy()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error en ensureSystemHierarchy:", err);
      process.exit(1);
    });
}