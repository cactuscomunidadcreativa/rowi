/**
 * =============================================================
 * Agent Prompt Context Builder
 * =============================================================
 *
 * Construye el bloque de contexto que se inyecta al systemPrompt de un
 * agente en runtime (/api/rowi). Une cuatro fuentes que el admin configura
 * y que ANTES se persistían pero nunca llegaban al modelo:
 *
 *   1. Campos culturales del propio AgentConfig (culturePrompt,
 *      companyMission, companyValues, companyTone, industryContext,
 *      customInstructions).
 *   2. AiCultureConfig resuelto por scope con herencia.
 *   3. AgentKnowledgeDeployment con status DEPLOYED (conocimiento Six
 *      Seconds desplegado al agente).
 *   4. AgentContext activos (personalización por contexto).
 *
 * Todo es best-effort: si una consulta falla, su sección se omite y el
 * agente sigue con su prompt base. El bloque total se trunca a
 * MAX_CONTEXT_CHARS para no reventar el budget de tokens.
 */

import { prisma } from "@/core/prisma";
import {
  resolveCultureWithInheritance,
  cultureHasContent,
  type CultureScope,
} from "@/lib/ai/cultureConfig";

// Tope del bloque inyectado (~ chars). 4000 chars ≈ 1000 tokens, margen
// holgado frente a max_tokens de salida (≤900). Conservador a propósito.
const MAX_CONTEXT_CHARS = 4000;
const MAX_KNOWLEDGE_ITEMS = 24;

export interface AgentLike {
  id: string;
  slug?: string;
  culturePrompt?: string | null;
  companyValues?: string[];
  companyMission?: string | null;
  companyTone?: string | null;
  industryContext?: string | null;
  customInstructions?: string | null;
}

export interface ScopeRef {
  scope: CultureScope;
  scopeId: string | null;
}

/**
 * Determina el scope cultural más específico para resolver la herencia,
 * a partir de los IDs de contexto del usuario. team/org no se distinguen
 * aquí (el caller no los provee), así que priorizamos org → hub → tenant.
 */
function pickCultureScope(opts: {
  organizationId?: string | null;
  hubId?: string | null;
  tenantId?: string | null;
}): ScopeRef {
  if (opts.organizationId) return { scope: "organization", scopeId: opts.organizationId };
  if (opts.hubId) return { scope: "hub", scopeId: opts.hubId };
  if (opts.tenantId) return { scope: "tenant", scopeId: opts.tenantId };
  return { scope: "global", scopeId: null };
}

function section(title: string, body: string): string {
  return `## ${title}\n${body}`.trim();
}

/**
 * Construye el bloque de contexto. Devuelve "" si no hay nada que inyectar.
 */
export async function buildAgentPromptContext(
  agent: AgentLike,
  ctx: {
    organizationId?: string | null;
    hubId?: string | null;
    tenantId?: string | null;
  },
): Promise<string> {
  const parts: string[] = [];

  // 1️⃣ Campos culturales embebidos en el AgentConfig.
  try {
    const lines: string[] = [];
    if (agent.companyMission) lines.push(`Misión: ${agent.companyMission}`);
    if (agent.companyValues && agent.companyValues.length > 0)
      lines.push(`Valores: ${agent.companyValues.join(", ")}`);
    if (agent.companyTone) lines.push(`Tono preferido: ${agent.companyTone}`);
    if (agent.industryContext) lines.push(`Industria: ${agent.industryContext}`);
    if (agent.culturePrompt) lines.push(agent.culturePrompt);
    if (agent.customInstructions)
      lines.push(`Instrucciones del administrador: ${agent.customInstructions}`);
    if (lines.length > 0) {
      parts.push(section("Cultura y voz de este agente", lines.join("\n")));
    }
  } catch (e) {
    console.warn("⚠️ agentPromptContext: agent cultural fields failed:", e);
  }

  // 2️⃣ AiCultureConfig resuelto por scope con herencia.
  try {
    const ref = pickCultureScope(ctx);
    if (ref.scope !== "global" || ref.scopeId === null) {
      const culture = await resolveCultureWithInheritance(ref.scope, ref.scopeId);
      if (cultureHasContent(culture)) {
        const lines: string[] = [];
        if (culture.mission) lines.push(`Misión: ${culture.mission}`);
        if (culture.vision) lines.push(`Visión: ${culture.vision}`);
        if (culture.values.length) lines.push(`Valores: ${culture.values.join(", ")}`);
        if (culture.industry) lines.push(`Industria: ${culture.industry}`);
        if (culture.tone) lines.push(`Tono: ${culture.tone}`);
        if (culture.keywords.length)
          lines.push(`Palabras clave: ${culture.keywords.join(", ")}`);
        if (culture.guidelines) lines.push(`Directrices: ${culture.guidelines}`);
        if (culture.restrictions)
          lines.push(`Restricciones (NO hagas esto): ${culture.restrictions}`);
        if (lines.length) {
          parts.push(section("Cultura de la organización", lines.join("\n")));
        }
      }
    }
  } catch (e) {
    console.warn("⚠️ agentPromptContext: culture inheritance failed:", e);
  }

  // 3️⃣ Knowledge desplegado (Six Seconds u otro), status DEPLOYED.
  try {
    const deployments = await prisma.agentKnowledgeDeployment.findMany({
      where: { agentId: agent.id, status: "DEPLOYED" },
      orderBy: [{ contentType: "asc" }, { title: "asc" }],
      take: MAX_KNOWLEDGE_ITEMS,
      select: { contentType: true, title: true, contentKey: true },
    });
    if (deployments.length > 0) {
      const byType = new Map<string, string[]>();
      for (const d of deployments) {
        const arr = byType.get(d.contentType) || [];
        arr.push(d.title || d.contentKey);
        byType.set(d.contentType, arr);
      }
      const lines = [...byType.entries()].map(
        ([type, items]) => `${type}: ${items.join(", ")}`,
      );
      parts.push(
        section(
          "Marco Six Seconds disponible para este agente",
          `Puedes razonar con estos elementos del modelo:\n${lines.join("\n")}`,
        ),
      );
    }
  } catch (e) {
    console.warn("⚠️ agentPromptContext: knowledge deployments failed:", e);
  }

  // 4️⃣ AgentContext activos (personalización por contexto).
  try {
    const contexts = await prisma.agentContext.findMany({
      where: { agentId: agent.id, isActive: true, customPrompt: { not: null } },
      take: 10,
      select: { contextType: true, customPrompt: true },
    });
    const ctxLines = contexts
      .filter((c) => c.customPrompt && c.customPrompt.trim().length > 0)
      .map((c) => `(${c.contextType}) ${c.customPrompt}`);
    if (ctxLines.length) {
      parts.push(section("Personalización por contexto", ctxLines.join("\n")));
    }
  } catch (e) {
    console.warn("⚠️ agentPromptContext: agent contexts failed:", e);
  }

  if (parts.length === 0) return "";

  let block = parts.join("\n\n");
  if (block.length > MAX_CONTEXT_CHARS) {
    block = block.slice(0, MAX_CONTEXT_CHARS) + "\n…(truncado)";
  }
  return block;
}
