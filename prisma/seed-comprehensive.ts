// prisma/seed-comprehensive.ts
// ============================================================
// ROWI SIA - Seed Comprehensivo para Producción
// ============================================================
// Estructura Completa:
// - RowiVerse (sistema global)
// - System (configuración base)
// - Six Seconds Organization Hierarchy (World → Regiones → Teams)
// - Admins: Eduardo x2, Josh + 2 admins adicionales Six Seconds
// - 6 Planes completos
// - 6 Agentes IA con configuración completa
// - MicroLearning: 90 micro-acciones (18 Brain Talents + 8 Outcomes + 4 Core Outcomes)
// - Sistema de gamificación completo (Achievements + Levels + Rewards)
// - Benchmark global preparado
// - Permisos jerárquicos completos
// - CMS Content para onboarding
// - SEI Links por idioma
// - Tenant Branding
// ============================================================

import {
  PrismaClient,
  OrgUnitType,
  OrgRole,
  TenantRole,
  PermissionScope,
  AchievementCategory,
  AchievementRequirement,
  AchievementRarity,
  MicroLearningCategory,
  MicroLearningDifficulty,
  RewardType
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================
// CONFIGURACIÓN DE ADMINS
// ============================================================
const ADMINS = {
  eduardo_rowi: {
    email: "eduardo@cactuscomunidadcreativa.com",
    name: "Eduardo González",
    role: "SUPERADMIN" as const,
    isSuperAdmin: true,
  },
  eduardo_6s: {
    email: "eduardo.gonzalez@6seconds.org",
    name: "Eduardo González (6S)",
    role: "SUPERADMIN" as const,
    isSuperAdmin: true,
  },
  josh: {
    email: "josh@6seconds.org",
    name: "Joshua Freedman",
    role: "SUPERADMIN" as const,
    isSuperAdmin: true,
  },
  admin1_6s: {
    email: "admin1@6seconds.org",
    name: "Six Seconds Admin 1",
    role: "ADMIN" as const,
    isSuperAdmin: false,
  },
  admin2_6s: {
    email: "admin2@6seconds.org",
    name: "Six Seconds Admin 2",
    role: "ADMIN" as const,
    isSuperAdmin: false,
  },
};

// ============================================================
// PLANES COMPLETOS (6 planes)
// ============================================================
const PLANS = [
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
    trialDays: 0,
    durationDays: 30,
    tokensMonthly: 10,
    tokensShared: false,
    tokensPerUser: true,
    tokensOrganization: 0,
    maxUsers: 1,
    minUsers: 1,
    pricePerUserMonthly: 0,
    pricePerUserYearly: 0,
    allowFamilyMembers: false,
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
    weekflowAccess: false,
    maxWeekflows: 0,
    weekflowInsights: false,
    badge: null,
    badgeEN: null,
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
    trialDays: 14,
    durationDays: 30,
    tokensMonthly: 150,
    tokensShared: false,
    tokensPerUser: true,
    tokensOrganization: 0,
    maxUsers: 1,
    minUsers: 1,
    pricePerUserMonthly: 12,
    pricePerUserYearly: 120,
    allowFamilyMembers: false,
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
    weekflowAccess: true,
    maxWeekflows: 1,
    weekflowInsights: false,
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
    trialDays: 14,
    durationDays: 30,
    tokensMonthly: 500,
    tokensShared: true,
    tokensPerUser: false,
    tokensOrganization: 0,
    maxUsers: 6,
    minUsers: 2,
    pricePerUserMonthly: 0,
    pricePerUserYearly: 0,
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
    weekflowAccess: true,
    maxWeekflows: 2,
    weekflowInsights: true,
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
    trialDays: 14,
    durationDays: 30,
    tokensMonthly: 500,
    tokensShared: false,
    tokensPerUser: true,
    tokensOrganization: 0,
    maxUsers: 50,
    minUsers: 1,
    pricePerUserMonthly: 25,
    pricePerUserYearly: 250,
    allowFamilyMembers: false,
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
    weekflowAccess: true,
    maxWeekflows: 5,
    weekflowInsights: true,
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
  {
    name: "ROWI Business",
    slug: "business",
    description: "Inteligencia emocional para tu organización. Transforma la cultura de tu empresa.",
    descriptionEN: "Emotional intelligence for your organization. Transform your company culture.",
    priceUsd: 15,
    priceCents: 1500,
    priceYearlyUsd: 162,
    priceYearlyCents: 16200,
    billingPeriod: "monthly",
    trialDays: 30,
    durationDays: 30,
    tokensMonthly: 0,
    tokensOrganization: 1000,
    tokensShared: true,
    tokensPerUser: false,
    maxUsers: 1000,
    minUsers: 20,
    pricePerUserMonthly: 15,
    pricePerUserYearly: 162,
    allowFamilyMembers: false,
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
    weekflowAccess: true,
    maxWeekflows: 0,
    weekflowInsights: true,
    badge: "Empresas",
    badgeEN: "Business",
    emoji: "🏢",
    color: "#F59E0B",
    icon: "Building",
    sortOrder: 5,
    isPublic: true,
    isActive: true,
    isCustomPricing: false,
    features: [
      "$15 USD / usuario / mes",
      "Mínimo 20 usuarios",
      "1,000 tokens IA compartidos org",
      "SEI anual para todos",
      "Todas las integraciones",
      "API access",
      "Benchmarking sectorial",
      "Workshops de adopción",
      "Soporte prioritario 24/7",
    ],
    featuresEN: [
      "$15 USD / user / month",
      "Minimum 20 users",
      "1,000 shared org AI tokens",
      "Annual SEI for everyone",
      "All integrations",
      "API access",
      "Sector benchmarking",
      "Adoption workshops",
      "24/7 priority support",
    ],
    limitations: [],
    limitationsEN: [],
  },
  {
    name: "ROWI Enterprise",
    slug: "enterprise",
    description: "Solución personalizada para grandes organizaciones. Todo incluido más servicios dedicados.",
    descriptionEN: "Custom solution for large organizations. Everything included plus dedicated services.",
    priceUsd: 0,
    priceCents: 0,
    priceYearlyUsd: 0,
    priceYearlyCents: 0,
    billingPeriod: "custom",
    trialDays: 0,
    durationDays: 365,
    tokensMonthly: 0,
    tokensOrganization: 10000,
    tokensShared: true,
    tokensPerUser: false,
    maxUsers: 100000,
    minUsers: 100,
    pricePerUserMonthly: 0,
    pricePerUserYearly: 0,
    allowFamilyMembers: false,
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
    seiDiscountPercent: 80,
    maxCommunities: 1000,
    maxMembers: 10000,
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
    weekflowAccess: true,
    maxWeekflows: 0,
    weekflowInsights: true,
    badge: "Enterprise",
    badgeEN: "Enterprise",
    emoji: "🏛️",
    color: "#7C3AED",
    icon: "Crown",
    sortOrder: 6,
    isPublic: true,
    isActive: true,
    isCustomPricing: true,
    features: [
      "Precio personalizado",
      "10,000+ tokens IA compartidos",
      "Usuarios ilimitados",
      "Todas las funcionalidades",
      "SSO / SAML",
      "Instancia dedicada opcional",
      "SLA garantizado",
      "Account Manager dedicado",
      "Formación presencial",
    ],
    featuresEN: [
      "Custom pricing",
      "10,000+ shared AI tokens",
      "Unlimited users",
      "All features",
      "SSO / SAML",
      "Optional dedicated instance",
      "Guaranteed SLA",
      "Dedicated Account Manager",
      "In-person training",
    ],
    limitations: [],
    limitationsEN: [],
  },
];

// ============================================================
// AGENTES IA (6 agentes)
// ============================================================
const AGENTS = [
  {
    slug: "rowi",
    name: "Super Rowi",
    description: "Tu compañero de inteligencia emocional. Guía conversaciones reflexivas y ofrece coaching emocional personalizado basado en el modelo Six Seconds.",
    avatar: "/agents/rowi.png",
    type: "SUPER",
    model: "gpt-4o",
    tone: "warm",
    accessLevel: "public",
    visibility: "global",
    autoLearn: true,
    isActive: true,
    prompt: `Eres Rowi, un compañero de inteligencia emocional basado en el modelo Six Seconds. Tu propósito es guiar conversaciones reflexivas que ayuden a las personas a desarrollar su inteligencia emocional.

Principios fundamentales:
- Know Yourself (Conocerte): Ayuda a identificar y nombrar emociones
- Choose Yourself (Elegirte): Facilita la toma de decisiones conscientes
- Give Yourself (Entregarte): Conecta acciones con propósito

Tono: Cálido, empático, sin juzgar. Haz preguntas poderosas. Celebra pequeños avances.`,
  },
  {
    slug: "eco",
    name: "Rowi ECO",
    description: "Especialista en ecosistemas emocionales. Analiza dinámicas de grupo, patrones colectivos y sugiere intervenciones para equipos.",
    avatar: "/agents/eco.png",
    type: "ECO",
    model: "gpt-4o",
    tone: "analytical",
    accessLevel: "premium",
    visibility: "tenant",
    autoLearn: true,
    isActive: true,
    prompt: `Eres Rowi ECO, especialista en ecosistemas emocionales y dinámicas de equipo. Tu rol es analizar patrones colectivos y ofrecer insights sobre el clima emocional del grupo.

Capacidades:
- Identificar patrones emocionales en equipos
- Detectar fortalezas y áreas de desarrollo colectivas
- Sugerir intervenciones basadas en datos EQ
- Facilitar conversaciones sobre cultura emocional`,
  },
  {
    slug: "eq",
    name: "Rowi EQ",
    description: "Coach de inteligencia emocional basado en el modelo Six Seconds. Especialista en las 8 competencias EQ y los 4 outcomes.",
    avatar: "/agents/eq.png",
    type: "EQ",
    model: "gpt-4o",
    tone: "coaching",
    accessLevel: "public",
    visibility: "global",
    autoLearn: true,
    isActive: true,
    prompt: `Eres Rowi EQ, coach especializado en inteligencia emocional basado en el modelo Six Seconds.

Las 8 Competencias EQ:
KNOW YOURSELF:
- Enhance Emotional Literacy (EL): Nombrar y comprender emociones
- Recognize Patterns (RP): Identificar reacciones automáticas

CHOOSE YOURSELF:
- Apply Consequential Thinking (ACT): Evaluar costos y beneficios
- Navigate Emotions (NE): Manejar emociones difíciles
- Engage Intrinsic Motivation (IM): Conectar con motivadores internos
- Exercise Optimism (OP): Generar opciones y esperanza

GIVE YOURSELF:
- Increase Empathy (EMP): Comprender perspectivas ajenas
- Pursue Noble Goals (NG): Conectar con propósito mayor

Tu rol es facilitar el desarrollo de estas competencias a través de preguntas, ejercicios y reflexiones.`,
  },
  {
    slug: "affinity",
    name: "Rowi Affinity",
    description: "Analiza y mejora tus relaciones interpersonales con insights emocionales. Especialista en conexiones y dinámicas relacionales.",
    avatar: "/agents/affinity.png",
    type: "AFFINITY",
    model: "gpt-4o",
    tone: "empathetic",
    accessLevel: "premium",
    visibility: "global",
    autoLearn: true,
    isActive: true,
    prompt: `Eres Rowi Affinity, especialista en relaciones interpersonales e inteligencia emocional relacional.

Tu enfoque:
- Analizar dinámicas de relaciones importantes
- Identificar patrones de comunicación emocional
- Ofrecer estrategias para fortalecer conexiones
- Facilitar la comprensión de diferentes estilos emocionales
- Ayudar a navegar conflictos con empatía

Siempre considera ambas perspectivas y promueve la comprensión mutua.`,
  },
  {
    slug: "trainer",
    name: "Rowi Trainer",
    description: "Facilita aprendizaje emocional con ejercicios prácticos, micro-acciones y contenido Six Seconds.",
    avatar: "/agents/trainer.png",
    type: "TRAINER",
    model: "gpt-4o",
    tone: "encouraging",
    accessLevel: "premium",
    visibility: "global",
    autoLearn: true,
    isActive: true,
    prompt: `Eres Rowi Trainer, facilitador de aprendizaje en inteligencia emocional.

Tu metodología:
- Micro-acciones: Pequeños pasos practicables diariamente
- Brain Talents: 18 talentos cerebrales del modelo Six Seconds
- Ejercicios experienciales: Aprender haciendo
- Reflexión guiada: Conectar experiencia con aprendizaje

Ofrece actividades concretas, celebra el progreso y adapta el ritmo al usuario.`,
  },
  {
    slug: "sales",
    name: "Rowi Sales",
    description: "Aplica inteligencia emocional a ventas, negociaciones y relaciones comerciales.",
    avatar: "/agents/sales.png",
    type: "SALES",
    model: "gpt-4o",
    tone: "professional",
    accessLevel: "business",
    visibility: "tenant",
    autoLearn: true,
    isActive: true,
    prompt: `Eres Rowi Sales, especialista en aplicar inteligencia emocional a contextos comerciales.

Áreas de expertise:
- Lectura emocional de clientes y prospectos
- Negociación consciente y empática
- Manejo de objeciones con EQ
- Construcción de relaciones comerciales duraderas
- Comunicación persuasiva ética

Combina efectividad comercial con autenticidad emocional.`,
  },
];

// ============================================================
// MICROLEARNING - BRAIN TALENTS (18 talentos × 5 acciones = 90)
// ============================================================
const BRAIN_TALENTS_MICROLEARNING = [
  {
    talent: "DataMining",
    titleES: "Minería de Datos",
    actions: [
      "Antes de decidir, recopilar al menos 2 datos adicionales relevantes.",
      "Preguntarme: ¿qué información me falta aquí?",
      "Separar hechos de opiniones en una situación.",
      "Revisar una fuente alternativa antes de concluir.",
      "Anotar un dato clave que otros podrían pasar por alto."
    ]
  },
  {
    talent: "Modeling",
    titleES: "Modelado",
    actions: [
      "Explicar en voz alta cómo llegué a una conclusión.",
      "Crear un esquema simple del problema.",
      "Comparar la situación actual con un caso anterior.",
      "Identificar variables clave y cómo se relacionan.",
      "Simplificar una idea compleja en 3 pasos."
    ]
  },
  {
    talent: "Prioritizing",
    titleES: "Priorización",
    actions: [
      "Elegir una sola tarea clave para avanzar hoy.",
      "Preguntarme: ¿qué es lo más importante ahora?",
      "Ordenar tareas por impacto, no por urgencia.",
      "Eliminar o posponer una tarea de bajo valor.",
      "Revisar prioridades al inicio y cierre del día."
    ]
  },
  {
    talent: "Connection",
    titleES: "Conexión",
    actions: [
      "Iniciar una conversación con una pregunta genuina.",
      "Reconocer algo positivo en otra persona.",
      "Mostrar interés por el punto de vista del otro.",
      "Buscar un punto en común en una interacción.",
      "Cerrar una conversación reforzando el vínculo."
    ]
  },
  {
    talent: "EmotionalInsight",
    titleES: "Insight Emocional",
    actions: [
      "Nombrar la emoción dominante en una situación.",
      "Preguntarme qué me está diciendo esta emoción.",
      "Distinguir emoción primaria de reacción secundaria.",
      "Observar cómo la emoción influye en mis decisiones.",
      "Validar emocionalmente lo que estoy sintiendo."
    ]
  },
  {
    talent: "Collaboration",
    titleES: "Colaboración",
    actions: [
      "Pedir activamente la opinión de otra persona.",
      "Definir claramente roles en una tarea compartida.",
      "Reconocer una contribución del equipo.",
      "Ajustar mi estilo para trabajar mejor con otros.",
      "Cerrar una colaboración revisando aprendizajes."
    ]
  },
  {
    talent: "Reflecting",
    titleES: "Reflexión",
    actions: [
      "Al final del día, identificar un aprendizaje clave.",
      "Preguntarme: ¿qué haría distinto la próxima vez?",
      "Revisar una decisión pasada sin juzgarme.",
      "Anotar una pregunta que quedó abierta.",
      "Tomar 2 minutos de pausa consciente."
    ]
  },
  {
    talent: "Adaptability",
    titleES: "Adaptabilidad",
    actions: [
      "Aceptar un cambio sin intentar controlarlo de inmediato.",
      "Probar una forma distinta de hacer la tarea.",
      "Preguntarme: ¿qué se me está pidiendo ahora?",
      "Ajustar expectativas frente a nueva información.",
      "Responder al cambio con curiosidad, no resistencia."
    ]
  },
  {
    talent: "CriticalThinking",
    titleES: "Pensamiento Crítico",
    actions: [
      "Cuestionar un supuesto que doy por hecho.",
      "Preguntarme: ¿qué evidencia respalda esto?",
      "Explorar un punto de vista opuesto.",
      "Separar emoción de análisis lógico.",
      "Detectar posibles sesgos en mi razonamiento."
    ]
  },
  {
    talent: "Resilience",
    titleES: "Resiliencia",
    actions: [
      "Identificar un recurso personal que me ayudó antes.",
      "Nombrar un desafío como experiencia temporal.",
      "Pedir apoyo cuando lo necesito.",
      "Reconocer un pequeño avance tras una dificultad.",
      "Cuidar energía física y emocional conscientemente."
    ]
  },
  {
    talent: "RiskTolerance",
    titleES: "Tolerancia al Riesgo",
    actions: [
      "Evaluar el riesgo real vs. el percibido.",
      "Dar un pequeño paso fuera de la zona cómoda.",
      "Preguntarme: ¿qué es lo peor que podría pasar?",
      "Definir límites claros antes de asumir un riesgo.",
      "Aprender explícitamente de un error."
    ]
  },
  {
    talent: "Imagination",
    titleES: "Imaginación",
    actions: [
      "Generar al menos 3 ideas sin juzgarlas.",
      "Visualizar un escenario ideal posible.",
      "Conectar ideas de ámbitos distintos.",
      "Preguntarme: ¿y si lo hiciéramos al revés?",
      "Registrar una idea creativa apenas surja."
    ]
  },
  {
    talent: "Proactivity",
    titleES: "Proactividad",
    actions: [
      "Anticipar un problema antes de que ocurra.",
      "Dar el primer paso sin esperar instrucciones.",
      "Convertir una queja en una acción.",
      "Preparar una solución antes de ser solicitada.",
      "Cerrar el día identificando una acción iniciada."
    ]
  },
  {
    talent: "Commitment",
    titleES: "Compromiso",
    actions: [
      "Cumplir un compromiso pequeño conscientemente.",
      "Reafirmar por qué dije que sí.",
      "Comunicar a tiempo si no puedo cumplir.",
      "Sostener una decisión pese a la incomodidad.",
      "Cerrar tareas iniciadas antes de abrir nuevas."
    ]
  },
  {
    talent: "ProblemSolving",
    titleES: "Resolución de Problemas",
    actions: [
      "Definir claramente el problema antes de actuar.",
      "Dividir el problema en partes manejables.",
      "Explorar al menos dos soluciones posibles.",
      "Probar una solución en versión pequeña.",
      "Evaluar resultados y ajustar."
    ]
  },
  {
    talent: "Vision",
    titleES: "Visión",
    actions: [
      "Conectar una acción diaria con un objetivo mayor.",
      "Describir cómo se vería el éxito a futuro.",
      "Comunicar la dirección deseada con claridad.",
      "Tomar decisiones alineadas con la visión.",
      "Revisar si mis acciones reflejan el rumbo elegido."
    ]
  },
  {
    talent: "Designing",
    titleES: "Diseño",
    actions: [
      "Pensar una experiencia desde el usuario final.",
      "Prototipar una idea de forma simple.",
      "Iterar una solución a partir de feedback.",
      "Cuidar coherencia entre forma y función.",
      "Mejorar un detalle que eleve la experiencia."
    ]
  },
  {
    talent: "Entrepreneurship",
    titleES: "Emprendimiento",
    actions: [
      "Detectar una oportunidad donde otros ven problema.",
      "Probar una idea con recursos limitados.",
      "Asumir responsabilidad por un resultado.",
      "Buscar aprendizaje rápido del mercado o entorno.",
      "Actuar con iniciativa orientada a valor."
    ]
  }
];

// ============================================================
// MICROLEARNING - OUTCOMES (8 outcomes × 5 acciones = 40)
// ============================================================
const OUTCOMES_MICROLEARNING = [
  {
    outcome: "Influence",
    titleES: "Influencia",
    actions: [
      "Antes de hablar, clarificar qué quiero que otros comprendan o hagan.",
      "Adaptar mi mensaje al interés de la otra persona.",
      "Usar un ejemplo concreto para reforzar una idea.",
      "Pedir feedback sobre cómo fue recibido mi mensaje.",
      "Cerrar una conversación con un acuerdo claro."
    ]
  },
  {
    outcome: "DecisionMaking",
    titleES: "Toma de Decisiones",
    actions: [
      "Definir la decisión exacta que debo tomar.",
      "Identificar una emoción que influye en la decisión.",
      "Evaluar al menos dos opciones posibles.",
      "Preguntarme: ¿qué impacto tendrá esto a corto y largo plazo?",
      "Comprometerme con una decisión y revisar el resultado luego."
    ]
  },
  {
    outcome: "Community",
    titleES: "Comunidad",
    actions: [
      "Participar activamente en una conversación grupal.",
      "Ofrecer ayuda sin que me la pidan.",
      "Reconocer públicamente la contribución de alguien.",
      "Invitar a otro a participar o expresar su voz.",
      "Reflexionar: ¿cómo contribuí hoy al grupo?"
    ]
  },
  {
    outcome: "Network",
    titleES: "Red de Contactos",
    actions: [
      "Contactar a una persona con la que no hablaba hace tiempo.",
      "Presentar a dos personas que podrían beneficiarse de conocerse.",
      "Mantener una conversación más allá del intercambio funcional.",
      "Dar seguimiento a una interacción previa.",
      "Agradecer explícitamente una conexión recibida."
    ]
  },
  {
    outcome: "Achievement",
    titleES: "Logro",
    actions: [
      "Definir una meta concreta y alcanzable para hoy.",
      "Dividir un objetivo grande en un paso pequeño.",
      "Avanzar aunque no esté todo perfecto.",
      "Reconocer un progreso logrado.",
      "Cerrar el día revisando qué sí se logró."
    ]
  },
  {
    outcome: "Satisfaction",
    titleES: "Satisfacción",
    actions: [
      "Identificar una actividad del día que me generó disfrute.",
      "Reconocer un logro personal, por pequeño que sea.",
      "Expresar gratitud por algo concreto.",
      "Alinear una acción diaria con un valor personal.",
      "Cerrar el día preguntándome: ¿qué fue significativo hoy?"
    ]
  },
  {
    outcome: "Balance",
    titleES: "Balance",
    actions: [
      "Hacer una pausa consciente entre tareas.",
      "Definir un límite claro entre trabajo y descanso.",
      "Priorizar una necesidad personal hoy.",
      "Revisar si estoy sobrecargado y ajustar expectativas.",
      "Cerrar el día desconectándome intencionalmente del trabajo."
    ]
  },
  {
    outcome: "Health",
    titleES: "Salud",
    actions: [
      "Mover el cuerpo al menos 5 minutos.",
      "Beber agua conscientemente durante el día.",
      "Identificar una emoción que impacta mi energía.",
      "Respirar profundamente durante 1 minuto.",
      "Dormir o descansar respetando mis señales físicas."
    ]
  }
];

// ============================================================
// MICROLEARNING - CORE OUTCOMES (4 core × 5 acciones = 20)
// ============================================================
const CORE_OUTCOMES_MICROLEARNING = [
  {
    outcome: "Effectiveness",
    titleES: "Efectividad",
    description: "Capacidad de lograr resultados alineados a objetivos y valores",
    actions: [
      "Definir claramente qué resultado quiero lograr hoy.",
      "Elegir una acción clave que tenga alto impacto.",
      "Eliminar o posponer una tarea que no aporte al objetivo.",
      "Revisar si mi acción está alineada con mis valores.",
      "Cerrar el día evaluando qué fue efectivo y por qué."
    ]
  },
  {
    outcome: "Relationships",
    titleES: "Relaciones",
    description: "Calidad y profundidad de las relaciones con otras personas",
    actions: [
      "Escuchar activamente sin interrumpir durante una conversación.",
      "Mostrar aprecio genuino a alguien hoy.",
      "Preguntar por el punto de vista o necesidad del otro.",
      "Cuidar el tono emocional en una interacción difícil.",
      "Reflexionar: ¿cómo impacté hoy en mis relaciones?"
    ]
  },
  {
    outcome: "QualityOfLife",
    titleES: "Calidad de Vida",
    description: "Satisfacción general con la vida y sentido personal",
    actions: [
      "Identificar una actividad del día que me dio sentido.",
      "Alinear una acción diaria con algo que es importante para mí.",
      "Reconocer un logro personal, por pequeño que sea.",
      "Equilibrar una obligación con algo que disfrute.",
      "Cerrar el día preguntándome: ¿qué valió la pena hoy?"
    ]
  },
  {
    outcome: "Wellbeing",
    titleES: "Bienestar",
    description: "Estado de salud emocional, mental y física sostenida",
    actions: [
      "Hacer una pausa consciente para respirar profundamente.",
      "Identificar una emoción que impacta mi energía hoy.",
      "Mover el cuerpo al menos unos minutos.",
      "Pedir apoyo si noto señales de sobrecarga.",
      "Cuidar descanso, límites y recuperación emocional."
    ]
  }
];

// ============================================================
// ACHIEVEMENTS (Logros del sistema de gamificación)
// ============================================================
const ACHIEVEMENTS = [
  // General
  { slug: "first_login", name: "Primer Paso", nameEN: "First Step", description: "Iniciaste sesión por primera vez", descriptionEN: "You logged in for the first time", category: "GENERAL", requirement: "FIRST_ACTION", threshold: 1, points: 10, rarity: "COMMON", icon: "LogIn", color: "#6B7280", order: 1 },
  { slug: "profile_complete", name: "Perfil Completo", nameEN: "Complete Profile", description: "Completaste tu perfil", descriptionEN: "You completed your profile", category: "GENERAL", requirement: "PROFILE_COMPLETE", threshold: 1, points: 25, rarity: "COMMON", icon: "User", color: "#3B82F6", order: 2 },
  // Chat
  { slug: "first_chat", name: "Primera Conversación", nameEN: "First Conversation", description: "Tuviste tu primera conversación con Rowi", descriptionEN: "You had your first conversation with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 1, points: 15, rarity: "COMMON", icon: "MessageCircle", color: "#10B981", order: 3 },
  { slug: "chat_explorer", name: "Explorador", nameEN: "Explorer", description: "10 conversaciones con Rowi", descriptionEN: "10 conversations with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 10, points: 50, rarity: "UNCOMMON", icon: "MessageSquare", color: "#8B5CF6", order: 4 },
  { slug: "chat_master", name: "Maestro Conversador", nameEN: "Conversation Master", description: "100 conversaciones con Rowi", descriptionEN: "100 conversations with Rowi", category: "CHAT", requirement: "CHAT_COUNT", threshold: 100, points: 200, rarity: "RARE", icon: "MessagesSquare", color: "#F59E0B", order: 5 },
  // Streaks
  { slug: "streak_7", name: "Semana Perfecta", nameEN: "Perfect Week", description: "7 días consecutivos usando Rowi", descriptionEN: "7 consecutive days using Rowi", category: "STREAK", requirement: "SEVEN_DAY_STREAK", threshold: 7, points: 100, rarity: "UNCOMMON", icon: "Flame", color: "#EF4444", order: 6 },
  { slug: "streak_30", name: "Mes Dedicado", nameEN: "Dedicated Month", description: "30 días consecutivos usando Rowi", descriptionEN: "30 consecutive days using Rowi", category: "STREAK", requirement: "THIRTY_DAY_STREAK", threshold: 30, points: 500, rarity: "RARE", icon: "Zap", color: "#F97316", order: 7 },
  // EQ
  { slug: "sei_complete", name: "SEI Completado", nameEN: "SEI Completed", description: "Completaste tu evaluación SEI", descriptionEN: "You completed your SEI assessment", category: "EQ", requirement: "SEI_COMPLETE", threshold: 1, points: 150, rarity: "UNCOMMON", icon: "Award", color: "#06B6D4", order: 8 },
  { slug: "eq_growth", name: "Crecimiento EQ", nameEN: "EQ Growth", description: "Mejoraste 5 puntos en tu EQ total", descriptionEN: "Improved 5 points in your total EQ", category: "EQ", requirement: "EQ_IMPROVEMENT", threshold: 5, points: 300, rarity: "RARE", icon: "TrendingUp", color: "#84CC16", order: 9 },
  // Community
  { slug: "community_join", name: "Parte del Equipo", nameEN: "Part of the Team", description: "Te uniste a tu primera comunidad", descriptionEN: "You joined your first community", category: "COMMUNITY", requirement: "COMMUNITY_JOIN", threshold: 1, points: 20, rarity: "COMMON", icon: "Users", color: "#8B5CF6", order: 10 },
  { slug: "community_contributor", name: "Contribuidor", nameEN: "Contributor", description: "10 publicaciones en comunidades", descriptionEN: "10 posts in communities", category: "COMMUNITY", requirement: "COMMUNITY_POST", threshold: 10, points: 75, rarity: "UNCOMMON", icon: "PenTool", color: "#EC4899", order: 11 },
  // Learning
  { slug: "micro_learner", name: "Micro Aprendiz", nameEN: "Micro Learner", description: "Completaste 10 micro-acciones", descriptionEN: "You completed 10 micro-actions", category: "LEARNING", requirement: "COURSE_COMPLETE", threshold: 10, points: 100, rarity: "UNCOMMON", icon: "BookOpen", color: "#14B8A6", order: 12 },
  { slug: "reflection_master", name: "Maestro Reflexivo", nameEN: "Reflection Master", description: "20 reflexiones registradas", descriptionEN: "20 reflections recorded", category: "LEARNING", requirement: "FIRST_REFLECTION", threshold: 20, points: 150, rarity: "RARE", icon: "Lightbulb", color: "#F59E0B", order: 13 },
  // Avatar
  { slug: "avatar_hatched", name: "Rowi Nacido", nameEN: "Rowi Hatched", description: "Tu Rowi personal ha nacido", descriptionEN: "Your personal Rowi has hatched", category: "AVATAR", requirement: "AVATAR_HATCHED", threshold: 1, points: 50, rarity: "UNCOMMON", icon: "Egg", color: "#EC4899", order: 14 },
  { slug: "avatar_wise", name: "Rowi Sabio", nameEN: "Wise Rowi", description: "Tu Rowi alcanzó la etapa máxima", descriptionEN: "Your Rowi reached the maximum stage", category: "AVATAR", requirement: "AVATAR_EVOLUTION", threshold: 5, points: 1000, rarity: "LEGENDARY", icon: "Crown", color: "#7C3AED", order: 15 },
  // Special
  { slug: "early_adopter", name: "Early Adopter", nameEN: "Early Adopter", description: "Te uniste en los primeros 100 usuarios", descriptionEN: "You joined in the first 100 users", category: "SPECIAL", requirement: "CUSTOM", threshold: 1, points: 500, rarity: "EPIC", icon: "Star", color: "#FFD700", order: 16 },
];

// ============================================================
// LEVEL DEFINITIONS (10 niveles)
// ============================================================
const LEVELS = [
  { level: 1, minPoints: 0, maxPoints: 99, title: "Explorador Emocional", titleEN: "Emotional Explorer", description: "Comenzando el viaje de autoconocimiento", color: "#6B7280", multiplier: 1.0 },
  { level: 2, minPoints: 100, maxPoints: 299, title: "Aprendiz Consciente", titleEN: "Conscious Learner", description: "Desarrollando conciencia emocional", color: "#3B82F6", multiplier: 1.1 },
  { level: 3, minPoints: 300, maxPoints: 599, title: "Navegante Interior", titleEN: "Inner Navigator", description: "Navegando las emociones con mayor habilidad", color: "#10B981", multiplier: 1.2 },
  { level: 4, minPoints: 600, maxPoints: 999, title: "Arquitecto Emocional", titleEN: "Emotional Architect", description: "Construyendo patrones emocionales saludables", color: "#8B5CF6", multiplier: 1.3 },
  { level: 5, minPoints: 1000, maxPoints: 1999, title: "Maestro del Equilibrio", titleEN: "Balance Master", description: "Dominando el equilibrio emocional", color: "#F59E0B", multiplier: 1.4 },
  { level: 6, minPoints: 2000, maxPoints: 3499, title: "Guía Emocional", titleEN: "Emotional Guide", description: "Capaz de guiar a otros en su desarrollo", color: "#EF4444", multiplier: 1.5 },
  { level: 7, minPoints: 3500, maxPoints: 5499, title: "Mentor Sabio", titleEN: "Wise Mentor", description: "Sabiduría emocional profunda", color: "#EC4899", multiplier: 1.6 },
  { level: 8, minPoints: 5500, maxPoints: 7999, title: "Iluminado", titleEN: "Enlightened", description: "Integración completa Know-Choose-Give", color: "#06B6D4", multiplier: 1.7 },
  { level: 9, minPoints: 8000, maxPoints: 11999, title: "Maestro Zen", titleEN: "Zen Master", description: "Paz interior y claridad emocional", color: "#84CC16", multiplier: 1.8 },
  { level: 10, minPoints: 12000, maxPoints: null, title: "Leyenda Emocional", titleEN: "Emotional Legend", description: "Transformador de vidas", color: "#7C3AED", multiplier: 2.0 },
];

// ============================================================
// REWARDS (Recompensas canjeables)
// ============================================================
const REWARDS = [
  { slug: "premium_badge", name: "Insignia Premium", nameEN: "Premium Badge", description: "Insignia exclusiva para tu perfil", cost: 500, type: "BADGE", icon: "Award", color: "#FFD700", maxPerUser: 1, isActive: true, isFeatured: true },
  { slug: "extra_tokens_50", name: "+50 Tokens IA", nameEN: "+50 AI Tokens", description: "50 tokens adicionales de IA", cost: 200, type: "TOKENS", icon: "Zap", color: "#3B82F6", maxPerUser: 10, isActive: true, isFeatured: false },
  { slug: "sei_discount_10", name: "10% Descuento SEI", nameEN: "10% SEI Discount", description: "10% de descuento en tu próximo SEI", cost: 1000, type: "DISCOUNT", icon: "Tag", color: "#10B981", maxPerUser: 3, isActive: true, isFeatured: true },
  { slug: "custom_avatar", name: "Avatar Personalizado", nameEN: "Custom Avatar", description: "Desbloquea accesorios especiales para tu Rowi", cost: 750, type: "FEATURE", icon: "Palette", color: "#EC4899", maxPerUser: 1, isActive: true, isFeatured: false },
  { slug: "certificate_eq", name: "Certificado EQ Digital", nameEN: "Digital EQ Certificate", description: "Certificado digital de tu nivel EQ", cost: 2000, type: "CERTIFICATE", icon: "FileCheck", color: "#8B5CF6", maxPerUser: 1, isActive: true, isFeatured: true },
];

// ============================================================
// SEI LINKS (por idioma)
// ============================================================
const SEI_LINKS = [
  { code: "sei-es-default", name: "SEI Español (Default)", url: "https://www.6seconds.org/sei/es/", language: "es", isDefault: true, isActive: true, description: "Link principal para evaluación SEI en español" },
  { code: "sei-en-default", name: "SEI English (Default)", url: "https://www.6seconds.org/sei/en/", language: "en", isDefault: true, isActive: true, description: "Main link for SEI assessment in English" },
  { code: "sei-pt-default", name: "SEI Português (Default)", url: "https://www.6seconds.org/sei/pt/", language: "pt", isDefault: true, isActive: true, description: "Link principal para avaliação SEI em português" },
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
  console.log("\n");
  console.log("═".repeat(70));
  console.log("  ROWI SIA - SEED COMPREHENSIVO COMPLETO");
  console.log("═".repeat(70));
  console.log("\n");

  // ============================================================
  // 1. ROWIVERSE - Raíz global del ecosistema
  // ============================================================
  console.log("1. 🌍 Creando RowiVerse (ecosistema global)...");
  const rowiverse = await prisma.rowiVerse.upsert({
    where: { slug: "rowiverse" },
    update: {},
    create: {
      name: "RowiVerse",
      slug: "rowiverse",
      description: "Ecosistema Global de Inteligencia Emocional Six Seconds",
      visibility: "public",
    },
  });
  console.log("   ✅ RowiVerse:", rowiverse.id);

  // ============================================================
  // 2. SYSTEM - Núcleo del sistema
  // ============================================================
  console.log("\n2. ⚙️ Creando System...");
  const system = await prisma.system.upsert({
    where: { slug: "rowi" },
    update: {},
    create: {
      name: "Rowi Global System",
      slug: "rowi",
      description: "Sistema raíz de la plataforma ROWI - Powered by Six Seconds",
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
  // 3. SIX SECONDS SUPERHUB (Organización Global)
  // ============================================================
  console.log("\n3. 🏢 Creando Six Seconds SuperHub...");
  const sixSecondsSuperHub = await prisma.superHub.upsert({
    where: { slug: "six-seconds-global" },
    update: {},
    create: {
      name: "Six Seconds Global",
      slug: "six-seconds-global",
      description: "Six Seconds - The Emotional Intelligence Network",
      vision: "A billion people practicing emotional intelligence",
      mission: "Support people to create positive change – everywhere, all the time",
      colorTheme: "#1E88E5",
      logo: "/six-seconds-logo.png",
      country: "Global",
      language: "en",
      region: "GLOBAL",
      rowiVerseId: rowiverse.id,
      systemId: system.id,
    },
  });
  console.log("   ✅ Six Seconds SuperHub:", sixSecondsSuperHub.id);

  // ============================================================
  // 4. SIX SECONDS ORGANIZATION HIERARCHY
  // ============================================================
  console.log("\n4. 🌳 Creando jerarquía de organizaciones Six Seconds...");

  // 4.1 Six Seconds World (Raíz)
  const sixSecondsWorld = await prisma.organization.upsert({
    where: { slug: "six-seconds-world" },
    update: {},
    create: {
      name: "Six Seconds International",
      slug: "six-seconds-world",
      description: "Six Seconds - The Emotional Intelligence Network (Global HQ)",
      rowiVerseId: rowiverse.id,
      superHubId: sixSecondsSuperHub.id,
      unitType: OrgUnitType.WORLD,
      level: 0,
      inheritPermissions: false,
    },
  });
  console.log("   ✅ Six Seconds World:", sixSecondsWorld.id);

  // 4.2 Regiones
  const regions = [
    { name: "Six Seconds LATAM", slug: "six-seconds-latam", region: "LATAM" },
    { name: "Six Seconds EMEA", slug: "six-seconds-emea", region: "EMEA" },
    { name: "Six Seconds APAC", slug: "six-seconds-apac", region: "APAC" },
    { name: "Six Seconds North America", slug: "six-seconds-na", region: "NA" },
  ];

  const createdRegions: Record<string, any> = {};
  for (const region of regions) {
    const org = await prisma.organization.upsert({
      where: { slug: region.slug },
      update: {},
      create: {
        name: region.name,
        slug: region.slug,
        description: `Six Seconds ${region.region} Regional Hub`,
        rowiVerseId: rowiverse.id,
        superHubId: sixSecondsSuperHub.id,
        parentId: sixSecondsWorld.id,
        unitType: OrgUnitType.REGION,
        level: 1,
        inheritPermissions: true,
      },
    });
    createdRegions[region.slug] = org;
    console.log(`   ✅ ${region.name}:`, org.id);
  }

  // ============================================================
  // 5. TENANT SIX SECONDS
  // ============================================================
  console.log("\n5. 🏠 Creando Tenant Six Seconds...");
  const sixSecondsTenant = await prisma.tenant.upsert({
    where: { slug: "six-seconds" },
    update: {},
    create: {
      name: "Six Seconds",
      slug: "six-seconds",
      billingEmail: "billing@6seconds.org",
      visibilityScope: "global",
      rowiVerseId: rowiverse.id,
      superHubId: sixSecondsSuperHub.id,
      systemId: system.id,
    },
  });
  console.log("   ✅ Tenant Six Seconds:", sixSecondsTenant.id);

  // ============================================================
  // 6. HUB SIX SECONDS
  // ============================================================
  console.log("\n6. 🎯 Creando Hub Six Seconds...");
  const sixSecondsHub = await prisma.hub.upsert({
    where: { slug: "six-seconds-hub" },
    update: {},
    create: {
      name: "Six Seconds Hub",
      slug: "six-seconds-hub",
      description: "Hub principal de Six Seconds para gestión y coaching",
      tenantId: sixSecondsTenant.id,
      superHubId: sixSecondsSuperHub.id,
      themeColor: "#1E88E5",
      visibility: "private",
    },
  });
  console.log("   ✅ Hub Six Seconds:", sixSecondsHub.id);

  // ============================================================
  // 7. PLANES
  // ============================================================
  console.log("\n7. 💳 Creando Planes...");
  const createdPlans: Record<string, any> = {};

  for (const planData of PLANS) {
    const plan = await prisma.plan.upsert({
      where: { slug: planData.slug },
      update: planData,
      create: planData,
    });
    createdPlans[planData.slug] = plan;
    console.log(`   ✅ Plan ${planData.name}: ${plan.id}`);
  }

  // ============================================================
  // 8. USUARIOS ADMIN
  // ============================================================
  console.log("\n8. 👤 Creando usuarios administradores...");
  const hashedPassword = await bcrypt.hash("RowiAdmin2024!", 10);
  const createdUsers: Record<string, any> = {};

  for (const [key, adminData] of Object.entries(ADMINS)) {
    const user = await prisma.user.upsert({
      where: { email: adminData.email },
      update: {
        name: adminData.name,
        organizationRole: adminData.role,
      },
      create: {
        email: adminData.email,
        name: adminData.name,
        password: hashedPassword,
        organizationRole: adminData.role,
        onboardingStatus: "ACTIVE",
        onboardingStep: 100,
        allowAI: true,
        active: true,
        primaryTenantId: sixSecondsTenant.id,
        planId: createdPlans["enterprise"].id,
      },
    });
    createdUsers[key] = user;
    console.log(`   ✅ Admin ${adminData.name}: ${user.id}`);

    // Crear RowiVerseUser
    await prisma.rowiVerseUser.upsert({
      where: { email: adminData.email },
      update: {},
      create: {
        email: adminData.email,
        name: adminData.name,
        userId: user.id,
        rowiVerseId: rowiverse.id,
        verified: true,
        active: true,
        status: "active",
      },
    });
  }

  // ============================================================
  // 9. PERMISOS SUPERADMIN
  // ============================================================
  console.log("\n9. 🔐 Asignando permisos SuperAdmin...");

  for (const [key, adminData] of Object.entries(ADMINS)) {
    if (adminData.isSuperAdmin) {
      const user = createdUsers[key];

      await prisma.userPermission.upsert({
        where: {
          userId_scopeType_scopeId: {
            userId: user.id,
            scopeType: PermissionScope.rowiverse,
            scopeId: rowiverse.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          scopeType: PermissionScope.rowiverse,
          scopeId: rowiverse.id,
          role: "superadmin",
          scope: "global",
        },
      });

      await prisma.userPermission.upsert({
        where: {
          userId_scopeType_scopeId: {
            userId: user.id,
            scopeType: PermissionScope.superhub,
            scopeId: sixSecondsSuperHub.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          scopeType: PermissionScope.superhub,
          scopeId: sixSecondsSuperHub.id,
          role: "admin",
          scope: "superhub",
        },
      });

      console.log(`   ✅ Permisos para ${adminData.name}`);
    }
  }

  // ============================================================
  // 10. MEMBRESÍAS
  // ============================================================
  console.log("\n10. 🎫 Creando membresías...");

  for (const [key, adminData] of Object.entries(ADMINS)) {
    const user = createdUsers[key];
    const role = adminData.isSuperAdmin ? TenantRole.SUPERADMIN : TenantRole.ADMIN;

    await prisma.membership.upsert({
      where: { userId_tenantId: { userId: user.id, tenantId: sixSecondsTenant.id } },
      update: {},
      create: {
        userId: user.id,
        tenantId: sixSecondsTenant.id,
        role: role,
        planId: createdPlans["enterprise"].id,
        tokenQuota: 10000,
      },
    });

    await prisma.hubMembership.upsert({
      where: { hubId_userId: { hubId: sixSecondsHub.id, userId: user.id } },
      update: {},
      create: { hubId: sixSecondsHub.id, userId: user.id, access: "admin" },
    });

    await prisma.orgMembership.upsert({
      where: { organizationId_userId: { organizationId: sixSecondsWorld.id, userId: user.id } },
      update: {},
      create: {
        organizationId: sixSecondsWorld.id,
        userId: user.id,
        role: adminData.isSuperAdmin ? OrgRole.OWNER : OrgRole.ADMIN,
        tokenQuota: 10000,
        status: "active",
      },
    });

    console.log(`   ✅ Membresías para ${adminData.name}`);
  }

  // ============================================================
  // 11. AGENTES IA
  // ============================================================
  console.log("\n11. 🤖 Creando Agentes IA...");

  for (const agentData of AGENTS) {
    await prisma.agentConfig.upsert({
      where: {
        slug_tenantId_superHubId_organizationId_hubId: {
          slug: agentData.slug,
          tenantId: null,
          superHubId: null,
          organizationId: null,
          hubId: null,
        },
      },
      update: { ...agentData, systemId: system.id },
      create: { ...agentData, systemId: system.id },
    });
    console.log(`   ✅ Agente ${agentData.name}`);
  }

  // ============================================================
  // 12. MICROLEARNING - BRAIN TALENTS
  // ============================================================
  console.log("\n12. 🧠 Creando MicroLearning - Brain Talents...");
  let microLearningCount = 0;

  for (const talent of BRAIN_TALENTS_MICROLEARNING) {
    let actionOrder = 1;
    for (const action of talent.actions) {
      const slug = `${talent.talent}_action_${actionOrder}`.toLowerCase();
      await prisma.microLearning.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          category: MicroLearningCategory.BRAIN_TALENT,
          parentKey: talent.talent,
          title: action,
          titleEN: action, // TODO: Traducir
          description: `Micro-acción para desarrollar ${talent.titleES}`,
          duration: 2,
          difficulty: MicroLearningDifficulty.BEGINNER,
          order: actionOrder,
          points: 10,
          isActive: true,
          isFeatured: actionOrder === 1,
        },
      });
      microLearningCount++;
      actionOrder++;
    }
  }
  console.log(`   ✅ ${microLearningCount} micro-acciones de Brain Talents creadas`);

  // ============================================================
  // 13. MICROLEARNING - OUTCOMES
  // ============================================================
  console.log("\n13. 🎯 Creando MicroLearning - Outcomes...");
  let outcomesCount = 0;

  for (const outcome of OUTCOMES_MICROLEARNING) {
    let actionOrder = 1;
    for (const action of outcome.actions) {
      const slug = `${outcome.outcome}_action_${actionOrder}`.toLowerCase();
      await prisma.microLearning.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          category: MicroLearningCategory.OUTCOME,
          parentKey: outcome.outcome,
          title: action,
          titleEN: action,
          description: `Micro-acción para mejorar ${outcome.titleES}`,
          duration: 2,
          difficulty: MicroLearningDifficulty.BEGINNER,
          order: actionOrder,
          points: 10,
          isActive: true,
          isFeatured: actionOrder === 1,
        },
      });
      outcomesCount++;
      actionOrder++;
    }
  }
  console.log(`   ✅ ${outcomesCount} micro-acciones de Outcomes creadas`);

  // ============================================================
  // 14. MICROLEARNING - CORE OUTCOMES
  // ============================================================
  console.log("\n14. 💫 Creando MicroLearning - Core Outcomes...");
  let coreCount = 0;

  for (const core of CORE_OUTCOMES_MICROLEARNING) {
    let actionOrder = 1;
    for (const action of core.actions) {
      const slug = `${core.outcome}_core_action_${actionOrder}`.toLowerCase();
      await prisma.microLearning.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          category: MicroLearningCategory.CORE_OUTCOME,
          parentKey: core.outcome,
          title: action,
          titleEN: action,
          description: core.description,
          duration: 2,
          difficulty: MicroLearningDifficulty.INTERMEDIATE,
          order: actionOrder,
          points: 15,
          isActive: true,
          isFeatured: actionOrder === 1,
        },
      });
      coreCount++;
      actionOrder++;
    }
  }
  console.log(`   ✅ ${coreCount} micro-acciones de Core Outcomes creadas`);

  // ============================================================
  // 15. ACHIEVEMENTS
  // ============================================================
  console.log("\n15. 🏆 Creando Achievements (Logros)...");

  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: achievement,
      create: {
        ...achievement,
        category: achievement.category as AchievementCategory,
        requirement: achievement.requirement as AchievementRequirement,
        rarity: achievement.rarity as AchievementRarity,
      },
    });
  }
  console.log(`   ✅ ${ACHIEVEMENTS.length} logros creados`);

  // ============================================================
  // 16. LEVEL DEFINITIONS
  // ============================================================
  console.log("\n16. 📊 Creando Level Definitions...");

  for (const level of LEVELS) {
    await prisma.levelDefinition.upsert({
      where: { level: level.level },
      update: level,
      create: level,
    });
  }
  console.log(`   ✅ ${LEVELS.length} niveles creados`);

  // ============================================================
  // 17. REWARDS
  // ============================================================
  console.log("\n17. 🎁 Creando Rewards...");

  for (const reward of REWARDS) {
    await prisma.reward.upsert({
      where: { slug: reward.slug },
      update: reward,
      create: {
        ...reward,
        type: reward.type as RewardType,
      },
    });
  }
  console.log(`   ✅ ${REWARDS.length} recompensas creadas`);

  // ============================================================
  // 18. SEI LINKS
  // ============================================================
  console.log("\n18. 🔗 Creando SEI Links...");

  for (const link of SEI_LINKS) {
    await prisma.seiLink.upsert({
      where: { code: link.code },
      update: link,
      create: link,
    });
  }
  console.log(`   ✅ ${SEI_LINKS.length} SEI Links creados`);

  // ============================================================
  // 19. BENCHMARK ROWIVERSE
  // ============================================================
  console.log("\n19. 📈 Creando Benchmark RowiVerse (global)...");

  await prisma.benchmark.upsert({
    where: { id: "benchmark-rowiverse-global" },
    update: {},
    create: {
      id: "benchmark-rowiverse-global",
      name: "RowiVerse Global Benchmark",
      description: "Benchmark global de inteligencia emocional del ecosistema RowiVerse - State of the Heart",
      type: "ROWIVERSE",
      status: "COMPLETED",
      scope: "GLOBAL",
      uploadedBy: createdUsers["eduardo_rowi"].id,
      totalRows: 0,
      processedRows: 0,
      version: 1,
      isActive: true,
      isLearning: true,
    },
  });
  console.log("   ✅ Benchmark RowiVerse creado");

  // ============================================================
  // 20. TENANT BRANDING
  // ============================================================
  console.log("\n20. 🎨 Creando Tenant Branding...");

  await prisma.tenantBranding.upsert({
    where: { tenantId: sixSecondsTenant.id },
    update: {},
    create: {
      tenantId: sixSecondsTenant.id,
      primaryColor: "#1E88E5",
      secondaryColor: "#F378A5",
      accentColor: "#FF9800",
      colorK: "#1E88E5",
      colorC: "#7A59C9",
      colorG: "#43A047",
      logoUrl: "/six-seconds-logo.png",
      fontHeading: "Varela Round",
      fontBody: "Poppins",
      defaultTheme: "light",
      isActive: true,
    },
  });
  console.log("   ✅ Tenant Branding creado");

  // ============================================================
  // 21. COMUNIDAD GLOBAL
  // ============================================================
  console.log("\n21. 👥 Creando Comunidad Global...");

  await prisma.rowiCommunity.upsert({
    where: { slug: "rowiverse-global" },
    update: {},
    create: {
      name: "RowiVerse Global Community",
      slug: "rowiverse-global",
      description: "Comunidad global de practicantes de inteligencia emocional",
      type: "general",
      visibility: "public",
      category: "emotional-intelligence",
      rowiVerseId: rowiverse.id,
      superHubId: sixSecondsSuperHub.id,
      tenantId: sixSecondsTenant.id,
      createdById: createdUsers["josh"].id,
      language: "en",
    },
  });
  console.log("   ✅ Comunidad RowiVerse Global creada");

  // ============================================================
  // 22. EMOTIONAL AI ENGINE
  // ============================================================
  console.log("\n22. 🧠 Creando Emotional AI Engine...");

  await prisma.emotionalAIEngine.upsert({
    where: { tenantId_hubId: { tenantId: sixSecondsTenant.id, hubId: null } },
    update: {},
    create: {
      tenantId: sixSecondsTenant.id,
      state: "active",
      mode: "coach",
      description: "Motor de IA emocional Six Seconds",
      temperature: 0.7,
      contextSize: 16384,
      memorySpan: 30,
    },
  });
  console.log("   ✅ Emotional AI Engine creado");

  // ============================================================
  // 23. WEEKFLOW CONFIG
  // ============================================================
  console.log("\n23. 📅 Creando WeekFlow Config...");

  await prisma.weekFlowConfig.upsert({
    where: { tenantId_hubId: { tenantId: sixSecondsTenant.id, hubId: null } },
    update: {},
    create: {
      tenantId: sixSecondsTenant.id,
      name: "Six Seconds WeekFlow",
      isActive: true,
      enableShowTell: true,
      enableToDiscuss: true,
      enableFocus: true,
      enableTasks: true,
      enableMoodCheckin: true,
      requireMoodCheckin: true,
      moodReminderDay: 1,
      moodReminderTime: "09:00",
      pointsPerCheckin: 15,
      pointsPerContribution: 10,
      pointsPerTaskComplete: 5,
      maxItemsPerSection: 10,
      maxTasksPerMember: 20,
      daysBeforeTaskReflection: 7,
      emailReminders: false,
    },
  });
  console.log("   ✅ WeekFlow Config creado");

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  const totalMicroLearning = microLearningCount + outcomesCount + coreCount;

  console.log("\n");
  console.log("═".repeat(70));
  console.log("  ✅ SEED COMPLETADO EXITOSAMENTE");
  console.log("═".repeat(70));
  console.log("\n📊 Resumen:");
  console.log("   - RowiVerse: 1");
  console.log("   - System: 1");
  console.log("   - SuperHub: 1 (Six Seconds Global)");
  console.log("   - Organizations: 5 (World + 4 Regiones)");
  console.log("   - Tenant: 1 (Six Seconds)");
  console.log("   - Hub: 1 (Six Seconds Hub)");
  console.log("   - Planes: " + PLANS.length);
  console.log("   - Usuarios Admin: " + Object.keys(ADMINS).length);
  console.log("   - Agentes IA: " + AGENTS.length);
  console.log("   - MicroLearning: " + totalMicroLearning + " micro-acciones");
  console.log("     - Brain Talents: " + microLearningCount);
  console.log("     - Outcomes: " + outcomesCount);
  console.log("     - Core Outcomes: " + coreCount);
  console.log("   - Achievements: " + ACHIEVEMENTS.length);
  console.log("   - Niveles: " + LEVELS.length);
  console.log("   - Rewards: " + REWARDS.length);
  console.log("   - SEI Links: " + SEI_LINKS.length);
  console.log("   - Benchmark Global: 1");
  console.log("   - WeekFlow Config: 1");
  console.log("\n🔐 Credenciales de acceso:");
  console.log("   Email: eduardo@cactuscomunidadcreativa.com");
  console.log("   Email: eduardo.gonzalez@6seconds.org");
  console.log("   Email: josh@6seconds.org");
  console.log("   Email: admin1@6seconds.org");
  console.log("   Email: admin2@6seconds.org");
  console.log("   Password: RowiAdmin2024!");
  console.log("\n⚠️  IMPORTANTE: Cambiar las contraseñas en producción!");
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
