// prisma/seed-comprehensive.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("\n=".repeat(70));
  console.log("  🌱 ROWI - SEED COMPREHENSIVO PARA PRODUCCIÓN");
  console.log("=".repeat(70) + "\n");

  // 1. SISTEMA
  console.log("1️⃣  Sistema Base...");
  const system = await prisma.system.upsert({
    where: { slug: "rowi-global" },
    update: { name: "Rowi Global System" },
    create: { name: "Rowi Global System", slug: "rowi-global", description: "Sistema raíz ROWI", primaryColor: "#6366F1", defaultLang: "es", active: true },
  });
  console.log("   ✅ System: " + system.id);

  // 2. ROWIVERSE
  console.log("2️⃣  RowiVerse...");
  const rowiverse = await prisma.rowiVerse.upsert({
    where: { slug: "rowiverse-global" },
    update: {},
    create: { name: "RowiVerse Global", slug: "rowiverse-global", visibility: "public" },
  });
  console.log("   ✅ RowiVerse: " + rowiverse.id);

  // 3. SUPERHUB
  console.log("3️⃣  SuperHub...");
  const superHub = await prisma.superHub.upsert({
    where: { slug: "six-seconds-global" },
    update: {},
    create: { name: "Six Seconds Global", slug: "six-seconds-global", colorTheme: "#6366F1", rowiVerseId: rowiverse.id, systemId: system.id },
  });
  console.log("   ✅ SuperHub: " + superHub.id);

  // 4. PLANES
  console.log("4️⃣  Planes...");
  const plansData = [
    { slug: "free", name: "Free ROWI", priceUsd: 0, priceCents: 0, tokensMonthly: 10, sortOrder: 1, isPublic: true, isActive: true },
    { slug: "plus", name: "ROWI+", priceUsd: 12, priceCents: 1200, tokensMonthly: 150, sortOrder: 2, isPublic: true, isActive: true },
    { slug: "pro", name: "ROWI Pro", priceUsd: 25, priceCents: 2500, tokensMonthly: 500, sortOrder: 3, isPublic: true, isActive: true },
    { slug: "enterprise", name: "ROWI Enterprise", priceUsd: 30000, priceCents: 3000000, tokensMonthly: 10000, sortOrder: 4, isPublic: true, isActive: true },
  ];
  const plans: Record<string, any> = {};
  for (const p of plansData) {
    const plan = await prisma.plan.upsert({ where: { slug: p.slug }, update: p, create: p });
    plans[p.slug] = plan;
    console.log("   ✅ " + plan.name);
  }

  // 5. TENANT
  console.log("5️⃣  Tenant...");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "six-seconds" },
    update: {},
    create: { name: "Six Seconds", slug: "six-seconds", superHubId: superHub.id, systemId: system.id, planId: plans["enterprise"].id },
  });
  console.log("   ✅ Tenant: " + tenant.id);

  // 6. HUB
  console.log("6️⃣  Hub...");
  const hub = await prisma.hub.upsert({
    where: { slug: "six-seconds-hub" },
    update: {},
    create: { name: "Six Seconds Hub", slug: "six-seconds-hub", tenantId: tenant.id, superHubId: superHub.id, visibility: "private" },
  });
  console.log("   ✅ Hub: " + hub.id);

  // 7. AGENTES
  console.log("7️⃣  Agentes IA...");
  const agents = [
    { slug: "super", name: "Super Rowi", type: "GENERAL" },
    { slug: "eq", name: "Rowi EQ", type: "EQ_COACH" },
    { slug: "affinity", name: "Rowi Affinity", type: "AFFINITY_EXPERT" },
    { slug: "eco", name: "Rowi ECO", type: "COMMUNICATION_EXPERT" },
    { slug: "trainer", name: "Rowi Trainer", type: "COACH" },
    { slug: "sales", name: "Rowi Sales", type: "SALES_EXPERT" },
  ];
  for (const a of agents) {
    const prompt = "Eres " + a.name + ", asistente de inteligencia emocional de ROWI.";
    await prisma.agentConfig.upsert({
      where: { id: "agent-sys-" + a.slug },
      update: { isActive: true },
      create: { id: "agent-sys-" + a.slug, slug: a.slug, name: a.name, type: a.type, model: "gpt-4o-mini", prompt, isActive: true, accessLevel: "public", visibility: "public", systemId: system.id },
    });
    await prisma.agentConfig.upsert({
      where: { id: "agent-tenant-" + a.slug },
      update: { isActive: true },
      create: { id: "agent-tenant-" + a.slug, slug: a.slug, name: a.name, type: a.type, model: "gpt-4o-mini", prompt, isActive: true, accessLevel: "public", visibility: "public", systemId: system.id, tenantId: tenant.id },
    });
    console.log("   ✅ " + a.name);
  }

  // 8. USUARIOS
  console.log("8️⃣  Usuarios de Prueba...");
  const users = [
    { email: "admin@rowi.ai", name: "Admin ROWI", role: "ADMIN", plan: "enterprise" },
    { email: "coach@rowi.ai", name: "Coach Demo", role: "COACH", plan: "pro" },
    { email: "usuario@rowi.ai", name: "Usuario Demo", role: "MEMBER", plan: "plus" },
    { email: "free@rowi.ai", name: "Usuario Free", role: "VIEWER", plan: "free" },
  ];
  const createdUsers: Record<string, any> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { email: u.email, name: u.name, active: true, allowAI: true, preferredLang: "es", planId: plans[u.plan].id, primaryTenantId: tenant.id, organizationRole: u.role, onboardingStatus: "ACTIVE" },
    });
    createdUsers[u.email] = user;
    await prisma.hubMembership.upsert({
      where: { hubId_userId: { hubId: hub.id, userId: user.id } },
      update: { access: u.role === "ADMIN" ? "admin" : "member" },
      create: { hubId: hub.id, userId: user.id, access: u.role === "ADMIN" ? "admin" : "member" },
    });
    console.log("   ✅ " + user.name + " (" + u.role + ")");
  }

  // 9. EQ SNAPSHOTS
  console.log("9️⃣  EQ Snapshots...");
  const styles = ["RATIONAL", "EMPIRICAL", "INNOVATIVE", "PRACTICAL"];
  const comps = ["emotionalLiteracy", "recognizePatterns", "consequentialThinking", "navigateEmotions", "intrinsicMotivation", "exerciseOptimism", "increaseEmpathy", "pursueNobleGoals"];
  for (const [email, user] of Object.entries(createdUsers)) {
    for (let i = 0; i < 2; i++) {
      const date = new Date(); date.setMonth(date.getMonth() - i * 2);
      const snap = await prisma.eqSnapshot.create({
        data: {
          userId: (user as any).id, email, at: date,
          K: Math.random() * 30 + 70, eqTotal: Math.random() * 30 + 90,
          knowYourself: Math.random() * 30 + 100, chooseYourself: Math.random() * 30 + 100, giveYourself: Math.random() * 30 + 100,
          brainStyle: styles[Math.floor(Math.random() * 4)], context: "seed", dataset: "SEED_TEST",
          effectiveness: Math.random() * 30 + 90, relationships: Math.random() * 30 + 90, wellbeing: Math.random() * 30 + 90, quality: Math.random() * 30 + 90,
        },
      });
      for (const c of comps) { await prisma.eqCompetencySnapshot.create({ data: { snapshotId: snap.id, key: c, score: Math.random() * 40 + 80 } }); }
    }
    console.log("   ✅ 2 snapshots para " + (user as any).name);
  }

  // 10. GAMIFICACIÓN
  console.log("🔟  Gamificación...");
  const achs = [
    { slug: "first-login", name: "Primer Paso", category: "ONBOARDING", points: 10 },
    { slug: "profile-complete", name: "Perfil Completo", category: "ONBOARDING", points: 25 },
    { slug: "first-eq", name: "Autoconocimiento", category: "EQ", points: 50 },
  ];
  for (let i = 0; i < achs.length; i++) {
    await prisma.achievement.upsert({ where: { slug: achs[i].slug }, update: achs[i], create: { ...achs[i], order: i, threshold: 1, icon: "Star", color: "#6366F1" } });
  }
  console.log("   ✅ " + achs.length + " achievements");
  
  const lvls = [{ level: 1, title: "Novato", points: 0 }, { level: 2, title: "Aprendiz", points: 100 }, { level: 3, title: "Experto", points: 500 }];
  for (const l of lvls) { await prisma.levelDefinition.upsert({ where: { level: l.level }, update: l, create: l }); }
  console.log("   ✅ " + lvls.length + " niveles");

  // RESUMEN
  console.log("\n" + "=".repeat(70));
  console.log("  ✅ SEED COMPLETADO");
  console.log("=".repeat(70));
  console.log("\n  Usuarios de prueba:");
  console.log("  • admin@rowi.ai (Admin)");
  console.log("  • coach@rowi.ai (Coach)");
  console.log("  • usuario@rowi.ai (Member)");
  console.log("  • free@rowi.ai (Free)\n");
}

main().catch((e) => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());
