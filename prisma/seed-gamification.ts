// prisma/seed-gamification.ts
// ============================================================
// ROWI - Seed de Gamificación, MicroLearning y Niveles
// ============================================================
// Ejecutar: npx tsx prisma/seed-gamification.ts
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

async function main() {
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  ROWI - SEED DE GAMIFICACIÓN Y MICROLEARNING");
  console.log("=".repeat(60));
  console.log("\n");

  // ============================================================
  // 1. NIVELES DE GAMIFICACIÓN
  // ============================================================
  console.log("1. Creando Niveles de Gamificación...");

  const levelsData = [
    { level: 1, minPoints: 0, maxPoints: 99, title: "Explorador Emocional", titleEN: "Emotional Explorer", color: "#94A3B8", icon: "seedling" },
    { level: 2, minPoints: 100, maxPoints: 249, title: "Aprendiz EQ", titleEN: "EQ Apprentice", color: "#60A5FA", icon: "sprout" },
    { level: 3, minPoints: 250, maxPoints: 499, title: "Practicante EQ", titleEN: "EQ Practitioner", color: "#34D399", icon: "leaf" },
    { level: 4, minPoints: 500, maxPoints: 999, title: "Conocedor Emocional", titleEN: "Emotional Connoisseur", color: "#A78BFA", icon: "flower" },
    { level: 5, minPoints: 1000, maxPoints: 1999, title: "Navegante EQ", titleEN: "EQ Navigator", color: "#F472B6", icon: "compass" },
    { level: 6, minPoints: 2000, maxPoints: 3499, title: "Guía Emocional", titleEN: "Emotional Guide", color: "#FBBF24", icon: "map" },
    { level: 7, minPoints: 3500, maxPoints: 5499, title: "Mentor EQ", titleEN: "EQ Mentor", color: "#FB923C", icon: "star" },
    { level: 8, minPoints: 5500, maxPoints: 7999, title: "Sabio Emocional", titleEN: "Emotional Sage", color: "#F87171", icon: "brain" },
    { level: 9, minPoints: 8000, maxPoints: 11999, title: "Maestro EQ", titleEN: "EQ Master", color: "#C084FC", icon: "crown" },
    { level: 10, minPoints: 12000, maxPoints: null, title: "Leyenda Emocional", titleEN: "Emotional Legend", color: "#FFD700", icon: "trophy", multiplier: 1.5 },
  ];

  for (const levelData of levelsData) {
    await prisma.levelDefinition.upsert({
      where: { level: levelData.level },
      update: {
        minPoints: levelData.minPoints,
        maxPoints: levelData.maxPoints,
        title: levelData.title,
        titleEN: levelData.titleEN,
        color: levelData.color,
        icon: levelData.icon,
        multiplier: levelData.multiplier || 1.0,
      },
      create: {
        level: levelData.level,
        minPoints: levelData.minPoints,
        maxPoints: levelData.maxPoints,
        title: levelData.title,
        titleEN: levelData.titleEN,
        color: levelData.color,
        icon: levelData.icon,
        multiplier: levelData.multiplier || 1.0,
      },
    });
    console.log(`   ✓ Nivel ${levelData.level}: ${levelData.title}`);
  }

  // ============================================================
  // 2. ACHIEVEMENTS (LOGROS)
  // ============================================================
  console.log("\n2. Creando Achievements...");

  const achievementsData = [
    // === CHAT ===
    { slug: "first_chat", name: "Primera Conversación", nameEN: "First Conversation", description: "Inicia tu primera conversación con Rowi", descriptionEN: "Start your first conversation with Rowi", category: "CHAT", requirement: "FIRST_ACTION", threshold: 1, points: 10, rarity: "COMMON", icon: "message-circle", color: "#60A5FA" },
    { slug: "chat_10", name: "Conversador", nameEN: "Conversationalist", description: "Completa 10 conversaciones con Rowi", descriptionEN: "Complete 10 conversations with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 10, points: 25, rarity: "COMMON", icon: "messages-square", color: "#60A5FA" },
    { slug: "chat_50", name: "Gran Comunicador", nameEN: "Great Communicator", description: "Completa 50 conversaciones con Rowi", descriptionEN: "Complete 50 conversations with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 50, points: 75, rarity: "UNCOMMON", icon: "message-square-heart", color: "#34D399" },
    { slug: "chat_100", name: "Maestro del Diálogo", nameEN: "Dialogue Master", description: "Completa 100 conversaciones con Rowi", descriptionEN: "Complete 100 conversations with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 100, points: 150, rarity: "RARE", icon: "message-square-dashed", color: "#A78BFA" },

    // === STREAKS ===
    { slug: "streak_3", name: "Inicio de Racha", nameEN: "Streak Starter", description: "Mantén una racha de 3 días consecutivos", descriptionEN: "Maintain a 3-day streak", category: "STREAK", requirement: "CHAT_STREAK", threshold: 3, points: 15, rarity: "COMMON", icon: "flame", color: "#FB923C" },
    { slug: "streak_7", name: "Semana Completa", nameEN: "Full Week", description: "Mantén una racha de 7 días consecutivos", descriptionEN: "Maintain a 7-day streak", category: "STREAK", requirement: "CHAT_STREAK", threshold: 7, points: 50, rarity: "UNCOMMON", icon: "flame", color: "#F97316" },
    { slug: "streak_30", name: "Mes Imparable", nameEN: "Unstoppable Month", description: "Mantén una racha de 30 días consecutivos", descriptionEN: "Maintain a 30-day streak", category: "STREAK", requirement: "CHAT_STREAK", threshold: 30, points: 200, rarity: "RARE", icon: "flame", color: "#EF4444" },
    { slug: "streak_100", name: "Leyenda de Constancia", nameEN: "Consistency Legend", description: "Mantén una racha de 100 días consecutivos", descriptionEN: "Maintain a 100-day streak", category: "STREAK", requirement: "CHAT_STREAK", threshold: 100, points: 500, rarity: "LEGENDARY", icon: "flame", color: "#DC2626" },

    // === EQ ===
    { slug: "sei_completed", name: "Perfil EQ Completo", nameEN: "EQ Profile Complete", description: "Completa tu evaluación SEI", descriptionEN: "Complete your SEI assessment", category: "EQ", requirement: "FIRST_ACTION", threshold: 1, points: 100, rarity: "UNCOMMON", icon: "brain", color: "#8B5CF6" },
    { slug: "eq_expert", name: "Experto EQ", nameEN: "EQ Expert", description: "Alcanza un puntaje EQ promedio de 90 o más", descriptionEN: "Reach an average EQ score of 90 or more", category: "EQ", requirement: "EQ_SCORE", threshold: 90, points: 250, rarity: "EPIC", icon: "award", color: "#7C3AED" },
    { slug: "eq_improvement_10", name: "Progreso Notable", nameEN: "Notable Progress", description: "Mejora tu EQ en 10 puntos", descriptionEN: "Improve your EQ by 10 points", category: "EQ", requirement: "EQ_IMPROVEMENT", threshold: 10, points: 100, rarity: "RARE", icon: "trending-up", color: "#10B981" },

    // === LEARNING ===
    { slug: "first_microlearning", name: "Primer Paso", nameEN: "First Step", description: "Completa tu primera micro-acción", descriptionEN: "Complete your first micro-action", category: "LEARNING", requirement: "FIRST_ACTION", threshold: 1, points: 15, rarity: "COMMON", icon: "book-open", color: "#06B6D4" },
    { slug: "microlearning_10", name: "Aprendiz Activo", nameEN: "Active Learner", description: "Completa 10 micro-acciones", descriptionEN: "Complete 10 micro-actions", category: "LEARNING", requirement: "COURSE_COMPLETE", threshold: 10, points: 50, rarity: "UNCOMMON", icon: "graduation-cap", color: "#0891B2" },
    { slug: "microlearning_50", name: "Estudiante Dedicado", nameEN: "Dedicated Student", description: "Completa 50 micro-acciones", descriptionEN: "Complete 50 micro-actions", category: "LEARNING", requirement: "COURSE_COMPLETE", threshold: 50, points: 150, rarity: "RARE", icon: "book-marked", color: "#0E7490" },
    { slug: "competency_mastery", name: "Dominio de Competencia", nameEN: "Competency Mastery", description: "Completa todas las micro-acciones de una competencia EQ", descriptionEN: "Complete all micro-actions for an EQ competency", category: "LEARNING", requirement: "CUSTOM", threshold: 1, points: 200, rarity: "EPIC", icon: "trophy", color: "#155E75" },

    // === COMMUNITY ===
    { slug: "community_join", name: "Nuevo Miembro", nameEN: "New Member", description: "Únete a tu primera comunidad", descriptionEN: "Join your first community", category: "COMMUNITY", requirement: "COMMUNITY_JOIN", threshold: 1, points: 20, rarity: "COMMON", icon: "users", color: "#EC4899" },
    { slug: "first_post", name: "Primera Publicación", nameEN: "First Post", description: "Crea tu primera publicación en la comunidad", descriptionEN: "Create your first community post", category: "COMMUNITY", requirement: "COMMUNITY_POST", threshold: 1, points: 25, rarity: "COMMON", icon: "pen-tool", color: "#DB2777" },
    { slug: "community_helper", name: "Ayudante Comunitario", nameEN: "Community Helper", description: "Ayuda a 10 personas en la comunidad", descriptionEN: "Help 10 people in the community", category: "COMMUNITY", requirement: "CUSTOM", threshold: 10, points: 100, rarity: "RARE", icon: "heart-handshake", color: "#BE185D" },

    // === SOCIAL ===
    { slug: "first_referral", name: "Embajador", nameEN: "Ambassador", description: "Invita a alguien que se una a Rowi", descriptionEN: "Invite someone who joins Rowi", category: "SOCIAL", requirement: "INVITE_ACCEPTED", threshold: 1, points: 50, rarity: "UNCOMMON", icon: "user-plus", color: "#4F46E5" },
    { slug: "referral_5", name: "Influencer EQ", nameEN: "EQ Influencer", description: "Invita a 5 personas que se unan a Rowi", descriptionEN: "Invite 5 people who join Rowi", category: "SOCIAL", requirement: "INVITE_ACCEPTED", threshold: 5, points: 200, rarity: "RARE", icon: "users-round", color: "#4338CA" },

    // === SPECIAL ===
    { slug: "profile_complete", name: "Perfil Completo", nameEN: "Complete Profile", description: "Completa toda la información de tu perfil", descriptionEN: "Complete all your profile information", category: "GENERAL", requirement: "PROFILE_COMPLETE", threshold: 1, points: 30, rarity: "COMMON", icon: "user-check", color: "#64748B" },
    { slug: "days_active_30", name: "Usuario Comprometido", nameEN: "Committed User", description: "Activo durante 30 días diferentes", descriptionEN: "Active for 30 different days", category: "GENERAL", requirement: "DAYS_ACTIVE", threshold: 30, points: 100, rarity: "UNCOMMON", icon: "calendar-check", color: "#475569" },
    { slug: "brain_talent_discover", name: "Descubridor de Talentos", nameEN: "Talent Discoverer", description: "Explora todos los Brain Talents", descriptionEN: "Explore all Brain Talents", category: "EQ", requirement: "CUSTOM", threshold: 1, points: 75, rarity: "UNCOMMON", icon: "sparkles", color: "#6366F1" },
  ];

  for (const achievement of achievementsData) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {
        name: achievement.name,
        nameEN: achievement.nameEN,
        description: achievement.description,
        descriptionEN: achievement.descriptionEN,
        category: achievement.category as any,
        requirement: achievement.requirement as any,
        threshold: achievement.threshold,
        points: achievement.points,
        rarity: achievement.rarity as any,
        icon: achievement.icon,
        color: achievement.color,
      },
      create: {
        slug: achievement.slug,
        name: achievement.name,
        nameEN: achievement.nameEN,
        description: achievement.description,
        descriptionEN: achievement.descriptionEN,
        category: achievement.category as any,
        requirement: achievement.requirement as any,
        threshold: achievement.threshold,
        points: achievement.points,
        rarity: achievement.rarity as any,
        icon: achievement.icon,
        color: achievement.color,
      },
    });
    console.log(`   ✓ ${achievement.name}`);
  }

  // ============================================================
  // 3. MICROLEARNING - OUTCOMES
  // ============================================================
  console.log("\n3. Creando MicroLearning - Outcomes...");

  for (const outcome of outcomes) {
    for (let i = 0; i < outcome.micro_actions.length; i++) {
      const action = outcome.micro_actions[i];
      const slug = generateMicroLearningSlug("outcome", outcome.key, i);

      await prisma.microLearning.upsert({
        where: { slug },
        update: {
          title: action.es,
          titleEN: action.en,
          description: outcome.description_es,
          descriptionEN: outcome.description_en,
          content: { action, outcome: { key: outcome.key, name_es: outcome.name_es, name_en: outcome.name_en } },
        },
        create: {
          slug,
          category: "OUTCOME",
          parentKey: outcome.key,
          title: action.es,
          titleEN: action.en,
          description: outcome.description_es,
          descriptionEN: outcome.description_en,
          content: { action, outcome: { key: outcome.key, name_es: outcome.name_es, name_en: outcome.name_en } },
          duration: 2,
          difficulty: "BEGINNER",
          order: i,
          points: 10,
        },
      });
    }
    console.log(`   ✓ ${outcome.name_es} (${outcome.micro_actions.length} acciones)`);
  }

  // ============================================================
  // 4. MICROLEARNING - CORE OUTCOMES
  // ============================================================
  console.log("\n4. Creando MicroLearning - Core Outcomes...");

  for (const coreOutcome of coreOutcomes) {
    for (let i = 0; i < coreOutcome.micro_actions.length; i++) {
      const action = coreOutcome.micro_actions[i];
      const slug = generateMicroLearningSlug("core", coreOutcome.key, i);

      await prisma.microLearning.upsert({
        where: { slug },
        update: {
          title: action.es,
          titleEN: action.en,
          description: coreOutcome.description_es,
          descriptionEN: coreOutcome.description_en,
          content: { action, coreOutcome: { key: coreOutcome.key, name_es: coreOutcome.name_es, name_en: coreOutcome.name_en, components: coreOutcome.components } },
        },
        create: {
          slug,
          category: "CORE_OUTCOME",
          parentKey: coreOutcome.key,
          title: action.es,
          titleEN: action.en,
          description: coreOutcome.description_es,
          descriptionEN: coreOutcome.description_en,
          content: { action, coreOutcome: { key: coreOutcome.key, name_es: coreOutcome.name_es, name_en: coreOutcome.name_en, components: coreOutcome.components } },
          duration: 3,
          difficulty: "INTERMEDIATE",
          order: i,
          points: 15,
        },
      });
    }
    console.log(`   ✓ ${coreOutcome.name_es} (${coreOutcome.micro_actions.length} acciones)`);
  }

  // ============================================================
  // 5. MICROLEARNING - BRAIN TALENTS
  // ============================================================
  console.log("\n5. Creando MicroLearning - Brain Talents...");

  for (const talent of brainTalents) {
    for (let i = 0; i < talent.micro_actions.length; i++) {
      const action = talent.micro_actions[i];
      const slug = generateMicroLearningSlug("talent", talent.key, i);

      await prisma.microLearning.upsert({
        where: { slug },
        update: {
          title: action.es,
          titleEN: action.en,
          description: talent.description_es,
          descriptionEN: talent.description_en,
          content: { action, talent: { key: talent.key, name_es: talent.name_es, name_en: talent.name_en, quadrant: talent.quadrant } },
        },
        create: {
          slug,
          category: "BRAIN_TALENT",
          parentKey: talent.key,
          title: action.es,
          titleEN: action.en,
          description: talent.description_es,
          descriptionEN: talent.description_en,
          content: { action, talent: { key: talent.key, name_es: talent.name_es, name_en: talent.name_en, quadrant: talent.quadrant } },
          duration: 3,
          difficulty: "INTERMEDIATE",
          order: i,
          points: 12,
        },
      });
    }
    console.log(`   ✓ ${talent.name_es} (${talent.micro_actions.length} acciones)`);
  }

  // ============================================================
  // 6. MICROLEARNING - EQ COMPETENCIES
  // ============================================================
  console.log("\n6. Creando MicroLearning - Competencias EQ...");

  for (const competency of eqCompetencies) {
    for (let i = 0; i < competency.micro_actions.length; i++) {
      const action = competency.micro_actions[i];
      const slug = generateMicroLearningSlug("competency", competency.key, i);

      await prisma.microLearning.upsert({
        where: { slug },
        update: {
          title: action.es,
          titleEN: action.en,
          description: competency.description_es,
          descriptionEN: competency.description_en,
          content: { action, competency: { key: competency.key, name_es: competency.name_es, name_en: competency.name_en, pillar: competency.pillar } },
        },
        create: {
          slug,
          category: "COMPETENCY",
          parentKey: competency.key,
          title: action.es,
          titleEN: action.en,
          description: competency.description_es,
          descriptionEN: competency.description_en,
          content: { action, competency: { key: competency.key, name_es: competency.name_es, name_en: competency.name_en, pillar: competency.pillar } },
          duration: 2,
          difficulty: "BEGINNER",
          order: i,
          points: 10,
          isFeatured: i === 0, // Primera acción de cada competencia es destacada
        },
      });
    }
    console.log(`   ✓ ${competency.name_es} (${competency.micro_actions.length} acciones)`);
  }

  // ============================================================
  // 7. REWARDS (RECOMPENSAS)
  // ============================================================
  console.log("\n7. Creando Rewards...");

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
      update: {
        name: reward.name,
        nameEN: reward.nameEN,
        description: reward.description,
        descriptionEN: reward.descriptionEN,
        cost: reward.cost,
        type: reward.type as any,
        icon: reward.icon,
        color: reward.color,
        maxPerUser: reward.maxPerUser || 1,
      },
      create: {
        slug: reward.slug,
        name: reward.name,
        nameEN: reward.nameEN,
        description: reward.description,
        descriptionEN: reward.descriptionEN,
        cost: reward.cost,
        type: reward.type as any,
        icon: reward.icon,
        color: reward.color,
        maxPerUser: reward.maxPerUser || 1,
      },
    });
    console.log(`   ✓ ${reward.name} (${reward.cost} puntos)`);
  }

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log("\n");
  console.log("=".repeat(60));
  console.log("  SEED COMPLETADO");
  console.log("=".repeat(60));

  const counts = {
    levels: await prisma.levelDefinition.count(),
    achievements: await prisma.achievement.count(),
    microLearning: await prisma.microLearning.count(),
    rewards: await prisma.reward.count(),
  };

  console.log(`
  📊 Resumen:
  - Niveles creados: ${counts.levels}
  - Achievements creados: ${counts.achievements}
  - MicroLearning creados: ${counts.microLearning}
  - Rewards creados: ${counts.rewards}
  `);
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
