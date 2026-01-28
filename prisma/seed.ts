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
  // 3. PLANES - Free, Pro, Enterprise
  // ============================================================
  console.log("\n3. Creando Planes...");

  const plansData = [
    { name: "Free", description: "Plan gratuito", priceUsd: 0, durationDays: 365, aiEnabled: false },
    { name: "Pro", description: "Plan profesional con IA", priceUsd: 29, durationDays: 30, aiEnabled: true },
    { name: "Enterprise", description: "Plan empresarial completo", priceUsd: 99, durationDays: 30, aiEnabled: true },
  ];

  const plans: Record<string, any> = {};
  for (const p of plansData) {
    const plan = await prisma.plan.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    plans[p.name] = plan;
    console.log(`   Plan "${p.name}":`, plan.id);
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
      planId: plans["Enterprise"].id,
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
      planId: plans["Enterprise"].id,
    },
    create: {
      name: "Eduardo Gonzalez",
      email: adminEmail,
      active: true,
      allowAI: true,
      organizationRole: "SUPERADMIN",
      primaryTenantId: tenant.id,
      planId: plans["Enterprise"].id,
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
      planId: plans["Enterprise"].id,
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
  // FIN DEL SEED
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  SEED COMPLETADO");
  console.log("=".repeat(60));
  console.log("\n");
  console.log("Resumen:");
  console.log("  - RowiVerse creado");
  console.log("  - System (Cactus) creado");
  console.log("  - SuperHub Global creado");
  console.log("  - 3 Planes creados (Free, Pro, Enterprise)");
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
}

main()
  .catch((e) => {
    console.error("\n ERROR EN SEED:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
