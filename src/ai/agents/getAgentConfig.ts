// src/ai/agents/getAgentConfig.ts
// ============================================================
// Helper para cargar la configuración del agente desde la BD
// incluyendo la cultura corporativa del tenant y planes de suscripción
// ============================================================

import { prisma } from "@/core/prisma";

// ============================================================
// 📋 DEFINICIÓN DE AGENTES POR PLAN DE SUSCRIPCIÓN
// ============================================================
// Estos son los agentes incluidos en cada nivel de plan

export const PLAN_AGENTS: Record<string, string[]> = {
  // Plan Free: Solo agentes básicos
  free: ["super", "eq"],

  // Plan Personal/Pro: Agentes individuales
  personal: ["super", "eq", "trainer", "eco"],
  pro: ["super", "eq", "trainer", "eco", "affinity"],

  // Plan Enterprise: Todos los agentes
  enterprise: ["super", "eq", "affinity", "eco", "sales", "trainer"],

  // Plan Global AI: Todos los agentes + features premium
  "global-ai": ["super", "eq", "affinity", "eco", "sales", "trainer"],

  // Fallback para planes desconocidos
  default: ["super", "eq"],
};

// Mapeo de nombres de plan a slugs (case insensitive)
const PLAN_NAME_MAP: Record<string, string> = {
  "free": "free",
  "personal": "personal",
  "pro": "pro",
  "enterprise": "enterprise",
  "empresarial": "enterprise",
  "global ai": "global-ai",
  "global-ai": "global-ai",
};

export interface AgentCultureConfig {
  // Configuración base del agente
  slug: string;
  name: string;
  description: string | null;
  prompt: string | null;
  model: string | null;
  tone: string | null;

  // Cultura corporativa del tenant
  culturePrompt: string | null;
  companyValues: string[];
  companyMission: string | null;
  companyTone: string | null;
  industryContext: string | null;
  customInstructions: string | null;
  brandVoice: any | null;
}

/**
 * Obtiene la configuración del agente para un tenant específico
 * Si el tenant tiene cultura personalizada, la devuelve
 * Si no, devuelve la configuración global
 */
export async function getAgentConfig(
  agentSlug: string,
  tenantId?: string
): Promise<AgentCultureConfig | null> {
  try {
    // Primero buscar configuración específica del tenant
    if (tenantId) {
      const tenantAgent = await prisma.agentConfig.findFirst({
        where: {
          slug: agentSlug,
          tenantId: tenantId,
        },
        select: {
          slug: true,
          name: true,
          description: true,
          prompt: true,
          model: true,
          tone: true,
          culturePrompt: true,
          companyValues: true,
          companyMission: true,
          companyTone: true,
          industryContext: true,
          customInstructions: true,
          brandVoice: true,
        },
      });

      if (tenantAgent) {
        return tenantAgent;
      }
    }

    // Si no hay config de tenant, buscar global
    const globalAgent = await prisma.agentConfig.findFirst({
      where: {
        slug: agentSlug,
        tenantId: null,
        superHubId: null,
        hubId: null,
        organizationId: null,
      },
      select: {
        slug: true,
        name: true,
        description: true,
        prompt: true,
        model: true,
        tone: true,
        culturePrompt: true,
        companyValues: true,
        companyMission: true,
        companyTone: true,
        industryContext: true,
        customInstructions: true,
        brandVoice: true,
      },
    });

    return globalAgent;
  } catch (error) {
    console.error(`[getAgentConfig] Error cargando ${agentSlug}:`, error);
    return null;
  }
}

/**
 * Construye el prompt completo del agente incluyendo cultura corporativa
 *
 * IMPORTANTE: El prompt base del agente NO se modifica aquí.
 * Solo se AGREGA la cultura corporativa como contexto adicional.
 * Los prompts de cada agente se mantienen en sus archivos respectivos
 * y se pueden editar independientemente.
 *
 * @param basePrompt - Prompt base del agente (del archivo .ts)
 * @param config - Configuración cultural del tenant (de la BD)
 * @param language - Idioma para responder
 */
export function buildCultureEnrichedPrompt(
  basePrompt: string,
  config: AgentCultureConfig | null,
  language: string = "Español"
): string {
  const parts: string[] = [];

  // 1. Prompt base del agente (NO SE MODIFICA, viene del archivo .ts)
  parts.push(basePrompt);

  // 2. Si hay cultura corporativa, agregarla
  if (config?.culturePrompt) {
    parts.push("\n=== CULTURA CORPORATIVA ===");
    parts.push(config.culturePrompt);
  }

  // 3. Valores de la empresa
  if (config?.companyValues && config.companyValues.length > 0) {
    parts.push("\n=== VALORES A REFORZAR ===");
    parts.push(config.companyValues.map((v) => `• ${v}`).join("\n"));
  }

  // 4. Misión de la empresa
  if (config?.companyMission) {
    parts.push("\n=== MISIÓN ===");
    parts.push(config.companyMission);
  }

  // 5. Tono de comunicación preferido
  if (config?.companyTone) {
    parts.push("\n=== TONO DE COMUNICACIÓN ===");
    parts.push(config.companyTone);
  }

  // 6. Contexto de industria
  if (config?.industryContext) {
    parts.push("\n=== CONTEXTO DE INDUSTRIA ===");
    parts.push(config.industryContext);
  }

  // 7. Instrucciones personalizadas del admin
  if (config?.customInstructions) {
    parts.push("\n=== INSTRUCCIONES ADICIONALES ===");
    parts.push(config.customInstructions);
  }

  // 8. Guía de voz de marca
  if (config?.brandVoice) {
    parts.push("\n=== GUÍA DE VOZ DE MARCA ===");
    const voice = config.brandVoice;
    if (voice.formalityLevel) {
      parts.push(`Nivel de formalidad: ${voice.formalityLevel}`);
    }
    if (voice.useEmojis !== undefined) {
      parts.push(
        `Usar emojis: ${voice.useEmojis ? "Sí" : "No"} (${voice.emojiFrequency || "moderado"})`
      );
    }
    if (voice.preferredEmojis?.length) {
      parts.push(`Emojis preferidos: ${voice.preferredEmojis.join(" ")}`);
    }
    if (voice.avoidWords?.length) {
      parts.push(`Evitar palabras: ${voice.avoidWords.join(", ")}`);
    }
    if (voice.preferWords?.length) {
      parts.push(`Preferir palabras: ${voice.preferWords.join(", ")}`);
    }
  }

  // 9. Recordatorio de idioma
  parts.push(`\n=== IDIOMA ===`);
  parts.push(`Responde SIEMPRE en ${language}.`);

  return parts.join("\n");
}

/**
 * Obtiene los agentes del plan de suscripción del usuario
 * Verifica primero la membresía del tenant, luego el plan directo del usuario
 */
async function getAgentsFromPlan(
  userId: string,
  tenantId?: string
): Promise<string[]> {
  try {
    let planName: string | null = null;

    // 1. Primero verificar si tiene membresía en el tenant con plan
    if (tenantId) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_tenantId: {
            userId,
            tenantId,
          },
        },
        select: {
          plan: {
            select: { name: true },
          },
        },
      });

      if (membership?.plan?.name) {
        planName = membership.plan.name;
      }
    }

    // 2. Si no hay plan de membresía, verificar plan directo del usuario
    if (!planName) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          plan: {
            select: { name: true },
          },
        },
      });

      if (user?.plan?.name) {
        planName = user.plan.name;
      }
    }

    // 3. Si no hay plan, devolver agentes default (free)
    if (!planName) {
      return PLAN_AGENTS.default;
    }

    // 4. Normalizar nombre del plan y obtener agentes
    const normalizedPlan = planName.toLowerCase().trim();
    const planKey = PLAN_NAME_MAP[normalizedPlan] || "default";

    return PLAN_AGENTS[planKey] || PLAN_AGENTS.default;
  } catch (error) {
    console.error(`[getAgentsFromPlan] Error:`, error);
    return PLAN_AGENTS.default;
  }
}

/**
 * Obtiene los agentes habilitados para un usuario específico
 * Combina:
 * 1. Agentes del plan de suscripción (límite máximo)
 * 2. Controles específicos del usuario (UserAIControl - puede desactivar)
 *
 * @param userId - ID del usuario
 * @param tenantId - ID del tenant (opcional, para verificar membresía)
 */
export async function getUserEnabledAgents(
  userId: string,
  tenantId?: string
): Promise<string[]> {
  try {
    // 1. Obtener agentes permitidos por el plan de suscripción
    const planAgents = await getAgentsFromPlan(userId, tenantId);

    // 2. Buscar controles específicos del usuario (puede desactivar agentes)
    const controls = await prisma.userAIControl.findMany({
      where: { userId },
      select: { feature: true, enabled: true },
    });

    // 3. Si no hay controles personalizados, devolver todos los del plan
    if (!controls.length) {
      return planAgents;
    }

    // 4. Crear mapa de controles del usuario
    const controlMap = new Map<string, boolean>();
    for (const c of controls) {
      controlMap.set(c.feature.toLowerCase(), c.enabled);
    }

    // 5. Filtrar: solo agentes del plan que el usuario no haya desactivado
    const enabledAgents = planAgents.filter((agent) => {
      const userControl = controlMap.get(agent);
      // Si el usuario tiene un control explícito, respetarlo
      // Si no tiene control, el agente está habilitado por defecto
      return userControl !== false;
    });

    // 6. Asegurar que siempre haya al menos el agente "super"
    if (!enabledAgents.includes("super")) {
      enabledAgents.unshift("super");
    }

    return enabledAgents;
  } catch (error) {
    console.error(`[getUserEnabledAgents] Error:`, error);
    return PLAN_AGENTS.default; // fallback
  }
}

/**
 * Obtiene información del plan del usuario
 * Útil para mostrar en la UI qué agentes tiene disponibles
 */
export async function getUserPlanInfo(
  userId: string,
  tenantId?: string
): Promise<{
  planName: string;
  planAgents: string[];
  isEnterprise: boolean;
}> {
  try {
    let planName = "Free";

    // Verificar membresía del tenant
    if (tenantId) {
      const membership = await prisma.membership.findUnique({
        where: {
          userId_tenantId: { userId, tenantId },
        },
        select: {
          plan: { select: { name: true } },
        },
      });

      if (membership?.plan?.name) {
        planName = membership.plan.name;
      }
    }

    // Verificar plan directo del usuario
    if (planName === "Free") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          plan: { select: { name: true } },
        },
      });

      if (user?.plan?.name) {
        planName = user.plan.name;
      }
    }

    const normalizedPlan = planName.toLowerCase().trim();
    const planKey = PLAN_NAME_MAP[normalizedPlan] || "default";
    const planAgents = PLAN_AGENTS[planKey] || PLAN_AGENTS.default;
    const isEnterprise = planKey === "enterprise" || planKey === "global-ai";

    return {
      planName,
      planAgents,
      isEnterprise,
    };
  } catch (error) {
    console.error(`[getUserPlanInfo] Error:`, error);
    return {
      planName: "Free",
      planAgents: PLAN_AGENTS.default,
      isEnterprise: false,
    };
  }
}

/**
 * Obtiene la cultura unificada del tenant + agentes habilitados del usuario
 * Útil para SuperAgent que necesita conocer la cultura general
 * y qué agentes puede usar para este usuario específico
 *
 * @param tenantId - ID del tenant
 * @param userId - ID del usuario (opcional, para filtrar por plan y controles)
 */
export async function getTenantCulture(
  tenantId: string,
  userId?: string
): Promise<{
  culturePrompt: string | null;
  companyValues: string[];
  companyMission: string | null;
  companyTone: string | null;
  industryContext: string | null;
  customInstructions: string | null;
  brandVoice: any | null;
  agents: { slug: string; name: string; description: string | null; enabled: boolean }[];
  enabledAgentSlugs: string[];
  userPlan: {
    name: string;
    isEnterprise: boolean;
  };
} | null> {
  try {
    // 1. Obtener agentes habilitados del usuario (considera plan + controles)
    const enabledSlugs = userId
      ? await getUserEnabledAgents(userId, tenantId)
      : PLAN_AGENTS.enterprise; // Sin usuario, asumimos todos

    // 2. Obtener info del plan del usuario
    const planInfo = userId
      ? await getUserPlanInfo(userId, tenantId)
      : { planName: "Enterprise", planAgents: PLAN_AGENTS.enterprise, isEnterprise: true };

    // 3. Obtener todos los agentes del tenant con su cultura
    const tenantAgents = await prisma.agentConfig.findMany({
      where: { tenantId, isActive: true },
      select: {
        slug: true,
        name: true,
        description: true,
        culturePrompt: true,
        companyValues: true,
        companyMission: true,
        companyTone: true,
        industryContext: true,
        customInstructions: true,
        brandVoice: true,
      },
    });

    if (!tenantAgents.length) return null;

    // Tomar la cultura del primer agente (todos deberían tener la misma del tenant)
    const first = tenantAgents[0];

    return {
      culturePrompt: first.culturePrompt,
      companyValues: first.companyValues || [],
      companyMission: first.companyMission,
      companyTone: first.companyTone,
      industryContext: first.industryContext,
      customInstructions: first.customInstructions,
      brandVoice: first.brandVoice,
      agents: tenantAgents.map((a) => ({
        slug: a.slug,
        name: a.name,
        description: a.description,
        enabled: enabledSlugs.includes(a.slug),
      })),
      enabledAgentSlugs: enabledSlugs,
      userPlan: {
        name: planInfo.planName,
        isEnterprise: planInfo.isEnterprise,
      },
    };
  } catch (error) {
    console.error(`[getTenantCulture] Error:`, error);
    return null;
  }
}

/**
 * Construye un prompt para SuperAgent que incluye:
 * - Cultura corporativa del tenant
 * - Lista de agentes disponibles y sus capacidades
 * - Información del plan del usuario
 */
export function buildSuperAgentPrompt(
  basePrompt: string,
  tenantCulture: Awaited<ReturnType<typeof getTenantCulture>>,
  language: string = "Español"
): string {
  const parts: string[] = [];

  // 1. Prompt base de SuperAgent
  parts.push(basePrompt);

  // 2. Información del plan del usuario
  if (tenantCulture?.userPlan) {
    parts.push("\n=== PLAN DEL USUARIO ===");
    parts.push(`Plan: ${tenantCulture.userPlan.name}`);
    if (tenantCulture.userPlan.isEnterprise) {
      parts.push("Tipo: Empresarial (acceso completo a todos los agentes)");
    } else {
      parts.push("Tipo: Personal (acceso limitado según plan)");
    }
  }

  // 3. Cultura corporativa
  if (tenantCulture?.culturePrompt) {
    parts.push("\n=== CULTURA CORPORATIVA DEL TENANT ===");
    parts.push(tenantCulture.culturePrompt);
  }

  // 4. Valores
  if (tenantCulture?.companyValues?.length) {
    parts.push("\n=== VALORES CORPORATIVOS ===");
    parts.push(tenantCulture.companyValues.map((v) => `• ${v}`).join("\n"));
  }

  // 5. Misión
  if (tenantCulture?.companyMission) {
    parts.push("\n=== MISIÓN DE LA EMPRESA ===");
    parts.push(tenantCulture.companyMission);
  }

  // 6. Tono
  if (tenantCulture?.companyTone) {
    parts.push("\n=== TONO DE COMUNICACIÓN ===");
    parts.push(tenantCulture.companyTone);
  }

  // 7. Contexto de industria
  if (tenantCulture?.industryContext) {
    parts.push("\n=== INDUSTRIA/SECTOR ===");
    parts.push(tenantCulture.industryContext);
  }

  // 8. Instrucciones personalizadas
  if (tenantCulture?.customInstructions) {
    parts.push("\n=== INSTRUCCIONES DEL ADMINISTRADOR ===");
    parts.push(tenantCulture.customInstructions);
  }

  // 9. Brand Voice
  if (tenantCulture?.brandVoice) {
    parts.push("\n=== VOZ DE MARCA ===");
    const voice = tenantCulture.brandVoice;
    if (voice.formalityLevel) parts.push(`Formalidad: ${voice.formalityLevel}`);
    if (voice.useEmojis !== undefined) {
      parts.push(`Emojis: ${voice.useEmojis ? "Sí" : "No"} (${voice.emojiFrequency || "moderado"})`);
    }
    if (voice.avoidWords?.length) parts.push(`Evitar: ${voice.avoidWords.join(", ")}`);
    if (voice.preferWords?.length) parts.push(`Preferir: ${voice.preferWords.join(", ")}`);
  }

  // 10. Agentes HABILITADOS para este usuario (basado en plan + controles)
  if (tenantCulture?.agents?.length) {
    const enabledAgents = tenantCulture.agents.filter((a) => a.enabled);
    const disabledAgents = tenantCulture.agents.filter((a) => !a.enabled);

    if (enabledAgents.length) {
      parts.push("\n=== AGENTES HABILITADOS (puedes usar estos) ===");
      for (const agent of enabledAgents) {
        parts.push(`✅ ${agent.name} (${agent.slug}): ${agent.description || "Sin descripción"}`);
      }
    }

    if (disabledAgents.length) {
      parts.push("\n=== AGENTES NO DISPONIBLES ===");
      parts.push("(El usuario no tiene acceso según su plan de suscripción)");
      for (const agent of disabledAgents) {
        parts.push(`❌ ${agent.name} (${agent.slug}): Requiere plan superior`);
      }
    }
  }

  // 11. Idioma
  parts.push(`\n=== IDIOMA ===`);
  parts.push(`Responde SIEMPRE en ${language}.`);

  return parts.join("\n");
}

/**
 * Verifica si un usuario tiene acceso a un agente específico
 * Útil para validar antes de ejecutar un agente
 */
export async function canUserAccessAgent(
  userId: string,
  agentSlug: string,
  tenantId?: string
): Promise<boolean> {
  try {
    const enabledAgents = await getUserEnabledAgents(userId, tenantId);
    return enabledAgents.includes(agentSlug);
  } catch (error) {
    console.error(`[canUserAccessAgent] Error:`, error);
    return false;
  }
}
