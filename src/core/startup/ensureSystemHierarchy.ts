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
    where: { slug: "rowi" },
    update: {},
    create: {
      slug: "rowi",
      name: "Rowi Global System",
      description: "Sistema raíz de la plataforma ROWI",
      logo: "/rowi-logo.png",
      primaryColor: "#6366F1",
      secondaryColor: "#F97316",
      defaultLang: "es",
      timezone: "America/Lima",
      active: true,
    },
  });
  console.log(`🧩 System garantizado: ${system.name}`);

  // =========================================================
  // 3️⃣ SUPERHUB - Six Seconds
  // =========================================================
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
  console.log(`🏛️ SuperHub garantizado: ${superHub.name}`);

  // =========================================================
  // 4️⃣ PLAN ENTERPRISE (mínimo necesario para Tenant)
  // =========================================================
  let enterprisePlan = await prisma.plan.findFirst({
    where: { slug: "enterprise" },
  });

  if (!enterprisePlan) {
    enterprisePlan = await prisma.plan.upsert({
      where: { slug: "enterprise" },
      update: {},
      create: {
        name: "ROWI Enterprise",
        slug: "enterprise",
        priceUsd: 30000,
        aiEnabled: true,
        isActive: true,
      },
    });
  }
  console.log("💼 Plan Enterprise garantizado.");

  // =========================================================
  // 5️⃣ TENANT - Six Seconds Global
  // =========================================================
  const tenant = await prisma.tenant.upsert({
    where: { slug: "six-seconds-global" },
    update: {
      planId: enterprisePlan?.id,
    },
    create: {
      name: "Six Seconds Global",
      slug: "six-seconds-global",
      billingEmail: "admin@6seconds.org",
      superHubId: superHub.id,
      systemId: system.id,
      planId: enterprisePlan?.id,
    },
  });
  console.log(`🏢 Tenant garantizado: ${tenant.name}`);

  // =========================================================
  // 6️⃣ HUB - Six Seconds Hub
  // =========================================================
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
  console.log(`🧱 Hub garantizado: ${hub.name}`);

  // =========================================================
  // 7️⃣ ORGANIZATION - Six Seconds Org
  // =========================================================
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
  console.log(`🏢 Organización garantizada: ${org.name}`);

  // =========================================================
  // 8️⃣ ORG ↔ TENANT (N:M)
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
    update: {
      organizationRole: "SUPERADMIN",
      primaryTenantId: tenant.id,
      active: true,
      allowAI: true,
    },
    create: {
      email: "eduardo@cactuscomunidadcreativa.com",
      name: "Eduardo González",
      organizationRole: "SUPERADMIN",
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
      tokenQuota: 999999,
    },
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: "SUPERADMIN",
      planId: enterprisePlan?.id,
      tokenQuota: 999999,
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
    update: { role: "OWNER" },
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
    update: { access: "admin" },
    create: {
      hubId: hub.id,
      userId: user.id,
      access: "admin",
    },
  });
  console.log("🔗 Membresía Hub garantizada.");

  // =========================================================
  // 1️⃣4️⃣ SUPERADMIN PERMISSION (RowiVerse scope)
  // =========================================================
  const existingPerm = await prisma.userPermission.findFirst({
    where: {
      userId: user.id,
      role: "superadmin",
      scopeType: "rowiverse",
    },
  });

  if (!existingPerm) {
    await prisma.userPermission.create({
      data: {
        userId: user.id,
        role: "superadmin",
        scopeType: "rowiverse",
        scopeId: rowiverse.id,
        scope: rowiverse.id,
      },
    });
    console.log("🔐 Permiso SuperAdmin RowiVerse creado.");
  } else {
    console.log("🔐 Permiso SuperAdmin RowiVerse ya existe.");
  }

  // =========================================================
  // 1️⃣5️⃣ ROLES DINÁMICOS (RoleDynamic)
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
