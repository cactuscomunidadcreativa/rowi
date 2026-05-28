/**
 * =========================================================
 * 💬 Rowi Coach AI — adaptador para Slack
 * =========================================================
 * `askRowiCoach(userId, text, opts?)` invoca al MISMO motor de IA que
 * `POST /api/rowi`: resuelve el `AgentConfig` por contexto del usuario,
 * carga historial reciente de `rowiChat`, construye el prompt con la
 * misma estrategia y llama a OpenAI vía `getOpenAIClient()`.
 *
 * Por qué un helper y no un fetch a /api/rowi:
 *   - /api/rowi resuelve identidad con la sesión NextAuth (cookies). Una
 *     llamada server-to-server desde el webhook de Slack no tiene esa
 *     sesión, así que tendríamos que falsear cookies o usar HUB_ACCESS_KEY
 *     (deprecado y restringido por IP). Aquí ya tenemos el `userId` de
 *     Rowi resuelto vía SlackUserLink, así que reutilizamos directamente
 *     las piezas internas — sin duplicar el prompt ni el cliente IA.
 *   - La respuesta es completa (no streaming): OpenAI chat.completions
 *     sin `stream:true` devuelve el texto entero, que es lo que Slack
 *     necesita para postear un único mensaje.
 *
 * NO reimplementa el system prompt: lo deriva de `agent.prompt` igual
 * que /api/rowi. Si /api/rowi cambia su estrategia base, este helper
 * sigue leyendo el mismo `AgentConfig`.
 * =========================================================
 */

import type OpenAI from "openai";
import { prisma } from "@/core/prisma";
import { getOpenAIClient } from "@/lib/openai/client";
import { secureLog } from "@/lib/logging";

// Intent por defecto para el coach conversacional en Slack. "super" es
// el router/coach general (con alias legacy "super-rowi"), idéntico al
// default de /api/rowi cuando no se envía intent.
const DEFAULT_SLUG = "super";
const SLUG_ALIASES: Record<string, string[]> = {
  super: ["super-rowi"],
};

const LANG_NAMES: Record<string, string> = {
  es: "español",
  en: "English",
  pt: "português",
  it: "italiano",
};

type AgentRow = {
  id: string;
  model: string | null;
  prompt: string | null;
};

/**
 * Resuelve el agente por contexto del usuario (hub → tenant → superhub →
 * global), espejando la lógica de `resolveAgent` en /api/rowi pero
 * partiendo del `userId` (no de un objeto auth de sesión).
 */
async function resolveAgentForUser(
  slug: string,
  ctx: { primaryTenantId: string | null; hubId: string | null; superHubId: string | null }
): Promise<AgentRow | null> {
  const slugsToTry = [slug, ...(SLUG_ALIASES[slug] || [])];

  for (const trySlug of slugsToTry) {
    if (ctx.hubId) {
      const hubAgent = await prisma.agentConfig.findFirst({
        where: { slug: trySlug, hubId: ctx.hubId, isActive: true },
        select: { id: true, model: true, prompt: true },
      });
      if (hubAgent) return hubAgent;
    }

    if (ctx.primaryTenantId) {
      const tenantAgent = await prisma.agentConfig.findFirst({
        where: { slug: trySlug, tenantId: ctx.primaryTenantId, isActive: true },
        select: { id: true, model: true, prompt: true },
      });
      if (tenantAgent) return tenantAgent;
    }

    if (ctx.superHubId) {
      const shAgent = await prisma.agentConfig.findFirst({
        where: { slug: trySlug, superHubId: ctx.superHubId, isActive: true },
        select: { id: true, model: true, prompt: true },
      });
      if (shAgent) return shAgent;
    }

    const globalAgent = await prisma.agentConfig.findFirst({
      where: {
        slug: trySlug,
        isActive: true,
        OR: [
          { accessLevel: "global" },
          { accessLevel: "system" },
          { tenantId: null, superHubId: null, organizationId: null, hubId: null },
        ],
      },
      select: { id: true, model: true, prompt: true },
    });
    if (globalAgent) return globalAgent;
  }

  return null;
}

export type AskRowiCoachResult =
  | { ok: true; text: string }
  | { ok: false; text: string };

/**
 * Pregunta al Rowi Coach en nombre de un usuario de Rowi ya identificado.
 *
 * @param userId  id del User de Rowi (resuelto vía SlackUserLink).
 * @param text    texto del usuario (ya limpio de la mención <@BOT>).
 * @param opts.locale  idioma de respuesta (default "es").
 * @returns       texto de respuesta listo para postear en Slack.
 */
export async function askRowiCoach(
  userId: string,
  text: string,
  opts?: { locale?: string }
): Promise<AskRowiCoachResult> {
  const ask = (text || "").trim();
  if (!ask) {
    return {
      ok: false,
      text: "No recibí ningún mensaje. Escríbeme algo y te respondo.",
    };
  }

  try {
    // 1) Contexto del usuario para resolver el agente correcto.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        primaryTenantId: true,
        preferredLang: true,
        language: true,
        hubMemberships: {
          take: 1,
          orderBy: { joinedAt: "asc" },
          select: { hub: { select: { id: true, superHubId: true } } },
        },
      },
    });

    if (!user) {
      return {
        ok: false,
        text: "No encontré tu cuenta de Rowi. Vuelve a vincular Slack desde la app.",
      };
    }

    const hubMembership = user.hubMemberships[0]?.hub ?? null;
    const ctx = {
      primaryTenantId: user.primaryTenantId ?? null,
      hubId: hubMembership?.id ?? null,
      superHubId: hubMembership?.superHubId ?? null,
    };

    const locale = (opts?.locale || user.preferredLang || user.language || "es").slice(0, 2);

    // 2) Resolver agente (mismo orden de prioridad que /api/rowi).
    const agent = await resolveAgentForUser(DEFAULT_SLUG, ctx);
    if (!agent) {
      secureLog.warn("slack.coach.no_agent", { userId, slug: DEFAULT_SLUG });
      return {
        ok: false,
        text: "Todavía no hay un coach de IA configurado para tu espacio. Pídele a un admin que lo active.",
      };
    }

    const model = agent.model || "gpt-4o-mini";
    const userName = user.name || user.email || "Usuario";
    const langName = LANG_NAMES[locale] || locale;

    // 3) System prompt — misma estrategia que /api/rowi (base del agente
    //    + instrucción de idioma + nota de identidad que evita saludar
    //    por nombre en cada turno).
    const basePrompt =
      agent.prompt ||
      `Eres Rowi, un coach emocional y cognitivo. Hablas principalmente en ${langName}. Responde de forma clara, empática y aplicada al contexto de la persona.`;
    const langInstruction =
      locale !== "es"
        ? `\n\nIMPORTANT: You MUST respond entirely in ${langName}. The user has selected "${locale}" as their language. All your responses must be in ${langName}.`
        : "";
    const identityNote = `\n\nUser context: name="${userName}", channel="slack", locale="${locale}".`;
    const styleNote = `\n\nSlack chat style (IMPORTANT): Keep replies short — 2-4 sentences or a few short "- " bullets, ~120 words max unless the user explicitly asks for more detail. Lead with the answer; skip preambles, recaps of the question, and filler. Use short paragraphs or bullets, never headings or long numbered lists. This is an ongoing conversation — do NOT greet the user by name on every reply.`;
    const systemPrompt = basePrompt + langInstruction + identityNote + styleNote;

    // 4) Historial reciente (mismo patrón que /api/rowi: últimas 10
    //    entradas del mismo usuario + agente + intent).
    let priorMessages: OpenAI.ChatCompletionMessageParam[] = [];
    try {
      const recent = await prisma.rowiChat.findMany({
        where: { userId, agentId: agent.id, intent: DEFAULT_SLUG },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { role: true, content: true },
      });
      priorMessages = recent
        .reverse()
        .filter(
          (m) =>
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
    } catch (historyErr) {
      secureLog.warn("slack.coach.history_load_failed", { userId });
      void historyErr;
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...priorMessages,
      { role: "user", content: ask },
    ];

    // 5) Llamada NO-streaming → respuesta completa para Slack.
    const openai = await getOpenAIClient();
    const completion = await openai.chat.completions.create({ model, messages, max_tokens: 500 });
    const replyText =
      completion.choices[0]?.message?.content?.trim() ||
      "No pude generar una respuesta en este momento. Intenta de nuevo.";

    // 6) Persistir la conversación (mismo destino que /api/rowi para que
    //    el historial sea compartido entre web y Slack).
    try {
      await prisma.rowiChat.createMany({
        data: [
          {
            userId,
            agentId: agent.id,
            role: "user",
            content: ask.slice(0, 2000),
            intent: DEFAULT_SLUG,
            locale,
            contextType: "slack",
          },
          {
            userId,
            agentId: agent.id,
            role: "assistant",
            content: replyText.slice(0, 5000),
            intent: DEFAULT_SLUG,
            locale,
            contextType: "slack",
          },
        ],
      });
    } catch (persistErr) {
      secureLog.warn("slack.coach.persist_failed", { userId });
      void persistErr;
    }

    return { ok: true, text: replyText };
  } catch (err) {
    secureLog.error("slack.coach.failed", err, { userId });
    return {
      ok: false,
      text: "Tuve un problema procesando tu mensaje. Intenta de nuevo en un momento.",
    };
  }
}
