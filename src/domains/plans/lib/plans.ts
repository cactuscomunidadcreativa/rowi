/**
 * 📦 ROWI PLANS - Constantes y tipos para planes
 * Define los 6 planes de ROWI con toda su información
 */

export type PlanSlug = "free" | "plus" | "family" | "pro" | "business" | "enterprise";
export type PlanType = "individual" | "family" | "team" | "business" | "enterprise";
export type TargetAudience = "B2C" | "B2B" | "B2C/B2B";
export type SupportLevel = "community" | "email" | "chat" | "priority" | "dedicated";
export type BillingPeriod = "monthly" | "yearly" | "custom";

export interface RowiPlan {
  slug: PlanSlug;
  name: string;
  nameEN: string;
  description: string;
  descriptionEN: string;

  // Precios
  priceMonthly: number;
  priceYearly: number;
  pricePerUser?: number;
  pricePerUserYearly?: number;
  isCustomPricing: boolean;
  currency: string;

  // Tokens
  tokensMonthly: number;
  tokensShared: boolean;
  tokensOrganization?: number;

  // Usuarios
  maxUsers: number;
  minUsers: number;
  allowFamilyMembers: boolean;

  // Tipo
  planType: PlanType;
  targetAudience: TargetAudience;

  // Agentes IA
  agents: {
    superRowi: boolean;
    rowiEQ: boolean;
    rowiAffinity: boolean;
    rowiECO: boolean;
    rowiTrainer: boolean;
    rowiSales: boolean;
  };

  // SEI
  seiIncluded: boolean;
  seiAnnual: boolean;
  brainBriefIncluded: boolean;
  seiDiscountPercent: number;

  // Features
  maxCommunities: number;
  privateGroups: boolean;
  benchmarkAccess: boolean;
  advancedReports: boolean;
  executiveDashboard: boolean;
  benchmarkingSectorial: boolean;
  apiAccess: boolean;

  // Integraciones
  integrations: {
    slack: boolean;
    teams: boolean;
    gmail: boolean;
  };

  // Soporte
  supportLevel: SupportLevel;
  customOnboarding: boolean;
  workshopIncludes: boolean;

  // Display
  badge?: string;
  badgeEN?: string;
  emoji: string;
  color: string;
  icon: string;
  sortOrder: number;
  isPublic: boolean;

  // Listas
  features: string[];
  featuresEN: string[];
  limitations: string[];
  limitationsEN: string[];
}

/**
 * 🎯 Los 6 planes de ROWI
 */
export const ROWI_PLANS: Record<PlanSlug, RowiPlan> = {
  // ============================================================
  // 1. FREE ROWI
  // ============================================================
  free: {
    slug: "free",
    name: "Free ROWI",
    nameEN: "Free ROWI",
    description: "Comienza tu viaje de inteligencia emocional. Ideal para explorar Rowi.",
    descriptionEN: "Start your emotional intelligence journey. Ideal to explore Rowi.",

    priceMonthly: 0,
    priceYearly: 0,
    isCustomPricing: false,
    currency: "USD",

    tokensMonthly: 10,
    tokensShared: false,

    maxUsers: 1,
    minUsers: 1,
    allowFamilyMembers: false,

    planType: "individual",
    targetAudience: "B2C",

    agents: {
      superRowi: true,
      rowiEQ: true,
      rowiAffinity: false,
      rowiECO: false,
      rowiTrainer: false,
      rowiSales: false,
    },

    seiIncluded: false,
    seiAnnual: false,
    brainBriefIncluded: false,
    seiDiscountPercent: 0,

    maxCommunities: 1,
    privateGroups: false,
    benchmarkAccess: false,
    advancedReports: false,
    executiveDashboard: false,
    benchmarkingSectorial: false,
    apiAccess: false,

    integrations: {
      slack: false,
      teams: false,
      gmail: false,
    },

    supportLevel: "community",
    customOnboarding: false,
    workshopIncludes: false,

    emoji: "🆓",
    color: "#6B7280",
    icon: "Sparkles",
    sortOrder: 1,
    isPublic: true,

    features: [
      "10 tokens IA / mes",
      "Acceso a Rowi EQ básico",
      "1 comunidad",
      "Soporte comunitario",
    ],
    featuresEN: [
      "10 AI tokens / month",
      "Basic Rowi EQ access",
      "1 community",
      "Community support",
    ],
    limitations: [
      "Sin SEI incluido",
      "Sin grupos privados",
      "Sin reportes avanzados",
    ],
    limitationsEN: [
      "SEI not included",
      "No private groups",
      "No advanced reports",
    ],
  },

  // ============================================================
  // 2. ROWI+
  // ============================================================
  plus: {
    slug: "plus",
    name: "ROWI+",
    nameEN: "ROWI+",
    description: "Para tu crecimiento personal. Todo lo que necesitas para desarrollar tu inteligencia emocional.",
    descriptionEN: "For your personal growth. Everything you need to develop your emotional intelligence.",

    priceMonthly: 12,
    priceYearly: 120,
    isCustomPricing: false,
    currency: "USD",

    tokensMonthly: 150,
    tokensShared: false,

    maxUsers: 1,
    minUsers: 1,
    allowFamilyMembers: false,

    planType: "individual",
    targetAudience: "B2C",

    agents: {
      superRowi: true,
      rowiEQ: true,
      rowiAffinity: true,
      rowiECO: true,
      rowiTrainer: true,
      rowiSales: false,
    },

    seiIncluded: false,
    seiAnnual: false,
    brainBriefIncluded: true,
    seiDiscountPercent: 20,

    maxCommunities: 3,
    privateGroups: true,
    benchmarkAccess: false,
    advancedReports: true,
    executiveDashboard: false,
    benchmarkingSectorial: false,
    apiAccess: false,

    integrations: {
      slack: false,
      teams: false,
      gmail: false,
    },

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
    limitations: [
      "Sin benchmarks",
      "Sin integraciones",
      "Sin dashboard ejecutivo",
    ],
    limitationsEN: [
      "No benchmarks",
      "No integrations",
      "No executive dashboard",
    ],
  },

  // ============================================================
  // 3. ROWI Family
  // ============================================================
  family: {
    slug: "family",
    name: "ROWI Family",
    nameEN: "ROWI Family",
    description: "Inteligencia emocional para toda la familia. Comparte tokens y crece juntos.",
    descriptionEN: "Emotional intelligence for the whole family. Share tokens and grow together.",

    priceMonthly: 40,
    priceYearly: 400,
    isCustomPricing: false,
    currency: "USD",

    tokensMonthly: 500,
    tokensShared: true,

    maxUsers: 6,
    minUsers: 2,
    allowFamilyMembers: true,

    planType: "family",
    targetAudience: "B2C",

    agents: {
      superRowi: true,
      rowiEQ: true,
      rowiAffinity: true,
      rowiECO: true,
      rowiTrainer: true,
      rowiSales: false,
    },

    seiIncluded: false,
    seiAnnual: false,
    brainBriefIncluded: true,
    seiDiscountPercent: 30,

    maxCommunities: 5,
    privateGroups: true,
    benchmarkAccess: true,
    advancedReports: true,
    executiveDashboard: false,
    benchmarkingSectorial: false,
    apiAccess: false,

    integrations: {
      slack: false,
      teams: false,
      gmail: false,
    },

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
    limitations: [
      "Sin integraciones empresariales",
      "Sin API",
    ],
    limitationsEN: [
      "No enterprise integrations",
      "No API",
    ],
  },

  // ============================================================
  // 4. ROWI Pro
  // ============================================================
  pro: {
    slug: "pro",
    name: "ROWI Pro",
    nameEN: "ROWI Pro",
    description: "Para profesionales y coaches. Herramientas avanzadas para tu práctica.",
    descriptionEN: "For professionals and coaches. Advanced tools for your practice.",

    priceMonthly: 25,
    priceYearly: 250,
    pricePerUser: 25,
    pricePerUserYearly: 250,
    isCustomPricing: false,
    currency: "USD",

    tokensMonthly: 500,
    tokensShared: false,

    maxUsers: 50,
    minUsers: 1,
    allowFamilyMembers: false,

    planType: "team",
    targetAudience: "B2C/B2B",

    agents: {
      superRowi: true,
      rowiEQ: true,
      rowiAffinity: true,
      rowiECO: true,
      rowiTrainer: true,
      rowiSales: true,
    },

    seiIncluded: true,
    seiAnnual: true,
    brainBriefIncluded: true,
    seiDiscountPercent: 50,

    maxCommunities: 10,
    privateGroups: true,
    benchmarkAccess: true,
    advancedReports: true,
    executiveDashboard: true,
    benchmarkingSectorial: false,
    apiAccess: false,

    integrations: {
      slack: false,
      teams: false,
      gmail: false,
    },

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
    limitations: [
      "Sin API",
      "Sin integraciones avanzadas",
    ],
    limitationsEN: [
      "No API",
      "No advanced integrations",
    ],
  },

  // ============================================================
  // 5. ROWI Business
  // ============================================================
  business: {
    slug: "business",
    name: "ROWI Business",
    nameEN: "ROWI Business",
    description: "Inteligencia emocional para tu organización. Transforma la cultura de tu empresa.",
    descriptionEN: "Emotional intelligence for your organization. Transform your company culture.",

    priceMonthly: 5,
    priceYearly: 54,
    pricePerUser: 5,
    pricePerUserYearly: 54,
    isCustomPricing: false,
    currency: "USD",

    tokensMonthly: 0,
    tokensShared: true,
    tokensOrganization: 1000,

    maxUsers: 1000,
    minUsers: 20,
    allowFamilyMembers: false,

    planType: "business",
    targetAudience: "B2B",

    agents: {
      superRowi: true,
      rowiEQ: true,
      rowiAffinity: true,
      rowiECO: true,
      rowiTrainer: true,
      rowiSales: true,
    },

    seiIncluded: true,
    seiAnnual: true,
    brainBriefIncluded: true,
    seiDiscountPercent: 70,

    maxCommunities: 50,
    privateGroups: true,
    benchmarkAccess: true,
    advancedReports: true,
    executiveDashboard: true,
    benchmarkingSectorial: true,
    apiAccess: true,

    integrations: {
      slack: true,
      teams: true,
      gmail: true,
    },

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
      "Soporte prioritario",
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
      "Priority support",
    ],
    limitations: [
      "Mínimo 20 usuarios",
    ],
    limitationsEN: [
      "Minimum 20 users",
    ],
  },

  // ============================================================
  // 6. ROWI Enterprise
  // ============================================================
  enterprise: {
    slug: "enterprise",
    name: "ROWI Enterprise",
    nameEN: "ROWI Enterprise",
    description: "Solución personalizada para grandes organizaciones. Máximo poder e integración.",
    descriptionEN: "Custom solution for large organizations. Maximum power and integration.",

    priceMonthly: 0,
    priceYearly: 30000,
    isCustomPricing: true,
    currency: "USD",

    tokensMonthly: 0,
    tokensShared: true,
    tokensOrganization: 10000,

    maxUsers: 999999,
    minUsers: 100,
    allowFamilyMembers: false,

    planType: "enterprise",
    targetAudience: "B2B",

    agents: {
      superRowi: true,
      rowiEQ: true,
      rowiAffinity: true,
      rowiECO: true,
      rowiTrainer: true,
      rowiSales: true,
    },

    seiIncluded: true,
    seiAnnual: true,
    brainBriefIncluded: true,
    seiDiscountPercent: 100,

    maxCommunities: 999,
    privateGroups: true,
    benchmarkAccess: true,
    advancedReports: true,
    executiveDashboard: true,
    benchmarkingSectorial: true,
    apiAccess: true,

    integrations: {
      slack: true,
      teams: true,
      gmail: true,
    },

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
      "SLA garantizado",
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
      "Guaranteed SLA",
    ],
    limitations: [],
    limitationsEN: [],
  },
};

// ============================================================
// Helpers
// ============================================================

/** Obtener todos los planes como array ordenado */
export function getAllPlans(): RowiPlan[] {
  return Object.values(ROWI_PLANS).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Obtener planes B2C (individuales y familia) */
export function getB2CPlans(): RowiPlan[] {
  return getAllPlans().filter(p => p.targetAudience === "B2C" || p.targetAudience === "B2C/B2B");
}

/** Obtener planes B2B (business y enterprise) */
export function getB2BPlans(): RowiPlan[] {
  return getAllPlans().filter(p => p.targetAudience === "B2B" || p.targetAudience === "B2C/B2B");
}

/** Obtener plan por slug */
export function getPlanBySlug(slug: PlanSlug): RowiPlan | undefined {
  return ROWI_PLANS[slug];
}

/** Formatear precio */
export function formatPrice(price: number, currency = "USD", locale = "es"): string {
  if (price === 0) return locale === "es" ? "Gratis" : "Free";
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/** Calcular ahorro anual */
export function calculateYearlySavings(plan: RowiPlan): number {
  const monthlyTotal = plan.priceMonthly * 12;
  return monthlyTotal - plan.priceYearly;
}

/** Calcular porcentaje de ahorro anual */
export function calculateYearlySavingsPercent(plan: RowiPlan): number {
  if (plan.priceMonthly === 0) return 0;
  const savings = calculateYearlySavings(plan);
  return Math.round((savings / (plan.priceMonthly * 12)) * 100);
}

/** Obtener nombre del nivel de soporte */
export function getSupportLevelName(level: SupportLevel, locale = "es"): string {
  const names: Record<SupportLevel, { es: string; en: string }> = {
    community: { es: "Comunitario", en: "Community" },
    email: { es: "Email", en: "Email" },
    chat: { es: "Chat", en: "Chat" },
    priority: { es: "Prioritario", en: "Priority" },
    dedicated: { es: "Dedicado 24/7", en: "Dedicated 24/7" },
  };
  return names[level][locale === "es" ? "es" : "en"];
}

/** Obtener texto de tokens */
export function getTokensText(plan: RowiPlan, locale = "es"): string {
  if (plan.tokensOrganization && plan.tokensOrganization > 0) {
    return locale === "es"
      ? `${plan.tokensOrganization.toLocaleString()} tokens/org/mes`
      : `${plan.tokensOrganization.toLocaleString()} tokens/org/month`;
  }
  if (plan.tokensShared) {
    return locale === "es"
      ? `${plan.tokensMonthly.toLocaleString()} tokens compartidos/mes`
      : `${plan.tokensMonthly.toLocaleString()} shared tokens/month`;
  }
  return locale === "es"
    ? `${plan.tokensMonthly.toLocaleString()} tokens/mes`
    : `${plan.tokensMonthly.toLocaleString()} tokens/month`;
}
