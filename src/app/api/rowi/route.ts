import { NextRequest, NextResponse, after } from "next/server";
import { cookies } from "next/headers";
import type OpenAI from "openai";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { getServerAuthUser } from "@/core/auth";
import { getOpenAIClient } from "@/lib/openai/client";
import { recordActivity } from "@/services/gamification";
import { secureLog } from "@/lib/logging";
import {
  ACTIVE_CONTEXT_COOKIE,
  resolveContextOrganizationId,
} from "@/lib/account/contexts";

export const runtime = "nodejs";

/* =========================================================
   🧠 Helpers
========================================================= */

type AccessLevel = "visitor" | "user" | "hub";

const MODEL_BY_LEVEL: Record<AccessLevel, string | null> = {
  visitor: null,
  user: "gpt-4o-mini",
  hub: "gpt-4o",
};

// Mapeo de intent → slug esperado de agente
// Nota: "super" mapea a "super" O "super-rowi" (legacy de seed-production)
const INTENT_TO_SLUG: Record<string, string> = {
  super: "super",
  affinity: "affinity",
  eq: "eq",
  eco: "eco",
  relationship: "relationship",
  community: "community",
  sales: "sales",
  asesor: "asesor",
  research: "research",
  trainer: "trainer",
  router: "router",
};

// Tope de tokens de salida por agente (cost-control). Todo Rowi que pasa por
// el router queda acotado; los agentes que escriben propuestas/análisis tienen
// algo más de margen. Un agente puede sobreescribir esto vía AgentConfig si en
// el futuro se expone el campo; por ahora el default por slug es la fuente.
const MAX_TOKENS_BY_SLUG: Record<string, number> = {
  super: 900,
  sales: 800,
  asesor: 800,
  research: 700,
  eq: 500,
  affinity: 450,
  eco: 500,
  relationship: 500,
  community: 500,
  trainer: 450,
  router: 600,
};
const DEFAULT_MAX_TOKENS = 600;

// Alias legacy: si el slug principal no existe, probar estos
const SLUG_ALIASES: Record<string, string[]> = {
  super: ["super-rowi"],
};

function normalizeIntent(intent?: string): string {
  const key = (intent || "super").toLowerCase();
  return INTENT_TO_SLUG[key] || "router";
}

// Estimación simple de tokens (para usage)
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4); // aproximación muy grosera
}

/* =========================================================
   🔎 Resolver agente por contexto (org → hub → tenant → superhub → global)
   ---------------------------------------------------------
   Prioridad: organizationId → hubId → tenantId → superHubId → global
   El nivel org solo aplica cuando el usuario actúa como proveedor de servicio
   hacia una org-cliente (cookie de contexto activo `service_provider`). En
   cualquier otro contexto orgId es null y la cadena se comporta como antes.
   SIEMPRE hace fallback a global si no encuentra en niveles específicos.
   Si no encuentra con el slug principal, intenta aliases (ej: super → super-rowi)
========================================================= */
interface ResolvedAgentContext {
  organizationId: string | null;
  hubId: string | null;
  tenantId: string | null;
  superHubId: string | null;
}

async function resolveAgent(
  slug: string,
  auth: any,
): Promise<{ agent: any; ctx: ResolvedAgentContext } | null> {
  // Extraer IDs del contexto del usuario
  const tenantId: string | null = auth?.primaryTenantId ?? null;

  // Obtener hubId y superHubId del contexto del usuario
  let hubId: string | null = null;
  let superHubId: string | null = null;

  // auth.hubs es un array de objetos con .id (de getServerAuthUser)
  const hubs = auth?.hubs || [];
  if (hubs.length > 0) {
    hubId = hubs[0]?.id || null;
    superHubId = hubs[0]?.superHub?.id || null;
  }

  // Alternativa: superHubs directos
  if (!superHubId) {
    const superHubs = auth?.superHubs || [];
    if (superHubs.length > 0) {
      superHubId = superHubs[0]?.id || null;
    }
  }

  // Org activa: solo se resuelve desde el contexto service_provider (la cookie
  // narrow-ea, nunca otorga acceso — el engagement ya prueba la relación).
  let organizationId: string | null = null;
  try {
    const cookieStore = await cookies();
    const activeContext = cookieStore.get(ACTIVE_CONTEXT_COOKIE)?.value;
    organizationId = await resolveContextOrganizationId(activeContext);
  } catch {
    organizationId = null;
  }

  const ctx: ResolvedAgentContext = { organizationId, hubId, tenantId, superHubId };

  // Resolver en UNA sola query (antes: hasta 4-8 findFirst secuenciales en
  // el camino crítico de cada chat). Traemos todos los candidatos (slug
  // principal + aliases) en cualquiera de los scopes aplicables o global, y
  // elegimos el más prioritario en JS con el MISMO orden que la cascada
  // secuencial original: primero por slug (principal > alias), luego por
  // especificidad de scope (org > hub > tenant > superHub > global).
  const slugsToTry = [slug, ...(SLUG_ALIASES[slug] || [])];

  const scopeOr: any[] = [];
  if (organizationId) scopeOr.push({ organizationId });
  if (hubId) scopeOr.push({ hubId });
  if (tenantId) scopeOr.push({ tenantId });
  if (superHubId) scopeOr.push({ superHubId });
  // Fallback global (accessLevel = 'global' | 'system' o sin scope asignado).
  scopeOr.push({ accessLevel: "global" });
  scopeOr.push({ accessLevel: "system" });
  scopeOr.push({ tenantId: null, superHubId: null, organizationId: null, hubId: null });

  const candidates = await prisma.agentConfig.findMany({
    where: {
      slug: { in: slugsToTry },
      isActive: true,
      OR: scopeOr,
    },
  });

  if (candidates.length === 0) return null;

  // 0=org, 1=hub, 2=tenant, 3=superHub, 4=global/system/sin-scope.
  const scopeRank = (a: any): number => {
    if (organizationId && a.organizationId === organizationId) return 0;
    if (hubId && a.hubId === hubId) return 1;
    if (tenantId && a.tenantId === tenantId) return 2;
    if (superHubId && a.superHubId === superHubId) return 3;
    return 4;
  };
  const slugRank = (a: any): number => {
    const i = slugsToTry.indexOf(a.slug);
    return i < 0 ? slugsToTry.length : i;
  };

  let best = candidates[0];
  let bestSlug = slugRank(best);
  let bestScope = scopeRank(best);
  for (const a of candidates) {
    const s = slugRank(a);
    const sc = scopeRank(a);
    if (s < bestSlug || (s === bestSlug && sc < bestScope)) {
      best = a;
      bestSlug = s;
      bestScope = sc;
    }
  }

  return { agent: best, ctx };
}

/* =========================================================
 🚀 POST /api/rowi — Router IA Profesional
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const intentRaw = body.intent as string | undefined;
    const ask = (body.ask as string | undefined)?.trim() || "";
    const locale: string = body.locale || "es";
    const tenantFromBody: string | undefined = body.tenantId;
    const attachments: any[] = Array.isArray(body.attachments) ? body.attachments : [];
    const audio = body.audio as string | null | undefined;

    /* =========================================================
     🔐 1. Autenticación extendida
    ========================================================== */
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;

    let accessLevel: AccessLevel = "visitor";
    let auth: any = null;

    auth = await getServerAuthUser();

    if (auth) {
      if (auth.isSuperAdmin) {
        accessLevel = "hub";
      } else if (auth.hubs?.length > 0) {
        accessLevel = "hub";
      } else {
        accessLevel = "user";
      }
    }

    // 🔐 SEGURIDAD: Acceso por HUB_ACCESS_KEY (solo para servicios internos)
    // ---------------------------------------------------------
    // Este método de acceso está DEPRECADO y será removido.
    // Solo se permite para llamadas desde servicios internos conocidos.
    // Se registra cada uso para auditoría.
    const hubKey = req.headers.get("x-hub-key") || req.headers.get("X-Hub-Key");
    const envKey = process.env.HUB_ACCESS_KEY?.trim();

    if (!auth && hubKey && envKey && hubKey === envKey) {
      // Registrar uso para auditoría
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      secureLog.security("HUB_ACCESS_KEY used", { ip: clientIp, userAgent: userAgent?.slice(0, 50), path: "/api/rowi" });

      // Solo permitir si viene de IPs internas o Vercel
      const allowedPatterns = [
        /^127\.0\.0\./,           // localhost
        /^192\.168\./,            // red privada
        /^10\./,                  // red privada
        /^::1$/,                  // localhost IPv6
        /vercel/i,                // Vercel functions
      ];

      const isAllowedSource =
        clientIp === "unknown" || // Permitir si no hay IP (llamada interna)
        allowedPatterns.some(p => p.test(clientIp)) ||
        (userAgent && /vercel|node-fetch|axios/i.test(userAgent));

      if (!isAllowedSource) {
        secureLog.security("HUB_ACCESS_KEY blocked from external source", { ip: clientIp });
        return NextResponse.json(
          { ok: false, error: "Invalid access method" },
          { status: 403 }
        );
      }

      accessLevel = "hub";
      auth = {
        id: "hub-control-user",
        email: "hub@rowi.system",
        organizationRole: "SYSTEM",
        hubs: [],
        superHubs: [],
        permissions: [],
        _accessMethod: "HUB_ACCESS_KEY", // Marcar método de acceso
      };
    }

    /* =========================================================
     🔐 2. Visitante sin login → modo demo
    ========================================================== */
    if (!auth && accessLevel === "visitor") {
      return NextResponse.json(
        {
          ok: true,
          preview: true,
          access: "visitor",
          text:
            "👋 ¡Hola! Soy Rowi. Para conversar conmigo y desbloquear respuestas reales, inicia sesión o crea una cuenta gratuita en Rowi.app 🌱",
        },
        { status: 200 }
      );
    }

    /* =========================================================
     🎯 3. Resolver intent y agente
    ========================================================== */
    const slug = normalizeIntent(intentRaw);

    // 🔬 Gate the research agent by research access level (privacy contract).
    if (slug === "research") {
      const researcher = auth?.id
        ? await prisma.user.findUnique({
            where: { id: auth.id },
            select: { researchAccessLevel: true },
          })
        : null;
      if (!researcher || researcher.researchAccessLevel === "none") {
        return NextResponse.json(
          {
            ok: false,
            access: accessLevel,
            text: "🔬 El lente de investigación requiere acceso autorizado. Pídele al equipo que active tu nivel de research.",
          },
          { status: 200 },
        );
      }
    }

    let resolved = await resolveAgent(slug, auth);

    // Fallback: intents sin agente propio (relationship/community/router o
    // cualquier intent desconocido) caen al agente general en vez de fallar.
    if (!resolved && slug !== "super" && slug !== "super-rowi") {
      resolved = await resolveAgent("super", auth);
    }

    if (!resolved) {
      return NextResponse.json(
        {
          ok: false,
          access: accessLevel,
          text: `⚠️ No hay un agente IA configurado para el contexto "${slug}". Pídele a un admin que lo active en /hub/admin/agents.`,
        },
        { status: 200 }
      );
    }

    const agent = resolved.agent;
    const agentCtx = resolved.ctx;

    const model = agent.model || MODEL_BY_LEVEL[accessLevel] || "gpt-4o-mini";

    /* =========================================================
     🧠 4. Construir mensaje para OpenAI
    ========================================================== */
    const userName = auth?.name || email || "Usuario";
    const lang = (locale || "es").slice(0, 2);

    let userContent = ask || "";
    if (attachments.length > 0) {
      const names = attachments.map((a) => a.name || "archivo").join(", ");
      userContent += `\n\nArchivos adjuntos: ${names}.`;
    }
    if (audio) {
      userContent += `\n\n(Nota: el usuario también envió un audio, aún no se ha transcrito aquí).`;
    }

    // Construir prompt del sistema con instrucción de idioma obligatoria
    const LANG_NAMES: Record<string, string> = {
      es: "español",
      en: "English",
      pt: "português",
      it: "italiano",
    };
    const langName = LANG_NAMES[lang] || lang;
    const langInstruction =
      lang !== "es"
        ? `\n\nIMPORTANT: You MUST respond entirely in ${langName}. The user has selected "${lang}" as their language. All your responses, including greetings, explanations, and suggestions, must be in ${langName}. Do NOT respond in Spanish unless the user explicitly writes to you in Spanish.`
        : "";
    const basePrompt =
      agent.prompt ||
      `Eres Rowi, un coach emocional y cognitivo. Hablas principalmente en ${langName}. Responde de forma clara, empática y aplicada al contexto de la persona.`;

    // User identity + context go in the SYSTEM prompt — not in every user
    // turn. Previously this lived inside the user message as
    // "Usuario: Eduardo\n...", which made the model treat each turn as
    // a fresh introduction and greet by name every reply.
    const identityNote = auth?.id && auth.id !== "hub-control-user"
      ? `\n\nUser context: name="${userName}", intent="${slug}", access="${accessLevel}", locale="${locale}". This is an ongoing conversation — do NOT greet the user with "Hola ${userName}" on every reply. Address them by name only when it's natural (rarely), not as a default opener.`
      : "";
    const systemPrompt = basePrompt + langInstruction + identityNote;

    // Load recent conversation history so the model sees turn N+1, not a
    // fresh greeting. Keep the window short (last 10 messages) to stay
    // within token budgets and avoid amplifying old context drift.
    let priorMessages: OpenAI.ChatCompletionMessageParam[] = [];
    if (auth?.id && auth.id !== "hub-control-user") {
      try {
        const recent = await prisma.rowiChat.findMany({
          where: {
            userId: auth.id,
            agentId: agent.id,
            intent: slug,
          },
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
              m.content.trim().length > 0,
          )
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
      } catch (historyErr) {
        console.warn("⚠️ Could not load prior rowi_chat history:", historyErr);
      }
    }

    // 🔬 RAG para Investigación: inyectar las correlaciones VS↔SEI reales del
    // rowiverse (nivel cohorte, anónimas) para que el agente razone con datos y
    // no solo con el marco. Best-effort: si falla la consulta o no hay datos
    // suficientes, el bloque se omite y el agente sigue con el prompt base.
    let systemPromptWithData = systemPrompt;

    // 🏛️ Cultura + conocimiento + contexto configurados por el admin.
    // Antes se persistían (AiCultureConfig, AgentKnowledgeDeployment,
    // AgentContext y los campos culturales de AgentConfig) pero NUNCA
    // llegaban al modelo. Ahora se inyectan al systemPrompt para que la
    // configuración del admin sí cambie el comportamiento del agente.
    // Best-effort: si falla, el agente sigue con su prompt base.
    try {
      const { buildAgentPromptContext } = await import(
        "@/lib/ai/agentPromptContext"
      );
      const contextBlock = await buildAgentPromptContext(agent, {
        organizationId: agentCtx.organizationId,
        hubId: agentCtx.hubId,
        tenantId: agentCtx.tenantId,
      });
      if (contextBlock) {
        systemPromptWithData = `${systemPromptWithData}\n\n---\n${contextBlock}`;
      }
    } catch (ctxErr) {
      console.warn("⚠️ No se pudo inyectar contexto de agente:", ctxErr);
    }

    if (slug === "research") {
      try {
        const { buildVsSeiCorrelationContext } = await import(
          "@/lib/vital-signs/vs-sei"
        );
        const dataBlock = await buildVsSeiCorrelationContext();
        if (dataBlock) {
          systemPromptWithData = `${systemPromptWithData}\n\n---\n${dataBlock}`;
        }
      } catch (ragErr) {
        console.warn("⚠️ No se pudo inyectar contexto VS↔SEI:", ragErr);
      }
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPromptWithData },
      ...priorMessages,
      { role: "user", content: userContent },
    ];

    /* =========================================================
     🤖 5. Llamar a OpenAI
    ========================================================== */
    const openai = await getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: MAX_TOKENS_BY_SLUG[slug] ?? DEFAULT_MAX_TOKENS,
    });

    const replyText =
      completion.choices[0]?.message?.content?.trim() ||
      "⚠️ No pude generar una respuesta en este momento.";

    // Estimar tokens (opcional, aproximado)
    const tokensInput = estimateTokens(JSON.stringify(messages));
    const tokensOutput = estimateTokens(replyText);

    /* =========================================================
     ⏭️ 6. Trabajo diferido — FUERA del path de respuesta
     ---------------------------------------------------------
     usage + gamificación + persistencia NO deben bloquear la
     respuesta: antes corrían ~37 queries secuenciales DESPUÉS del
     LLM y ANTES del return. `after()` (Next 15+) las ejecuta tras
     enviar la respuesta al usuario. Todo best-effort; cada bloque
     captura su propio error.
    ========================================================== */
    after(async () => {
      // 6.1 Usage diario — UPSERT atómico sobre el unique
      // (tenantId, feature, day, model). Elimina la race del patrón
      // findFirst+update bajo concurrencia (lost updates / filas dup).
      try {
        const usageTenantId = tenantFromBody || auth?.primaryTenantId || null;
        if (usageTenantId) {
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          await prisma.usageDaily.upsert({
            where: {
              tenantId_feature_day_model: {
                tenantId: usageTenantId,
                feature: "ROWI_CHAT",
                day: today,
                model,
              },
            },
            update: {
              tokensInput: { increment: tokensInput },
              tokensOutput: { increment: tokensOutput },
              calls: { increment: 1 },
            },
            create: {
              tenantId: usageTenantId,
              feature: "ROWI_CHAT",
              model,
              tokensInput,
              tokensOutput,
              calls: 1,
              costUsd: 0,
              day: today,
            },
          });
        }
      } catch (usageErr) {
        console.warn("⚠️ Error registrando usage en usageDaily:", usageErr);
      }

      // 6.2 Gamificación (puntos / racha / achievements / avatar).
      try {
        if (auth?.id) {
          await recordActivity(auth.id, "CHAT", {
            points: 10,
            reasonId: slug,
            description: `Chat con ${slug}`,
          });
        }
      } catch (gamErr) {
        console.warn("⚠️ Error en gamificación:", gamErr);
      }

      // 6.3 Persistir la conversación en rowi_chat.
      try {
        if (auth?.id && auth.id !== "hub-control-user") {
          await prisma.rowiChat.create({
            data: {
              userId: auth.id,
              agentId: agent.id,
              role: "user",
              content: userContent.slice(0, 2000),
              intent: slug,
              locale: lang,
              contextType: "coach",
            },
          });
          await prisma.rowiChat.create({
            data: {
              userId: auth.id,
              agentId: agent.id,
              role: "assistant",
              content: replyText.slice(0, 5000),
              intent: slug,
              locale: lang,
              contextType: "coach",
            },
          });
        }
      } catch (chatErr) {
        console.warn("⚠️ Error guardando en rowi_chat:", chatErr);
      }
    });

    /* =========================================================
     📤 7. Respuesta final para RowiCoach
    ========================================================== */
    return NextResponse.json({
      ok: true,
      access: accessLevel,
      model,
      tokenLimit: MODEL_BY_LEVEL[accessLevel] ? (accessLevel === "hub" ? 10000 : 3000) : 0,
      user: {
        id: auth?.id,
        email: auth?.email,
        name: auth?.name,
        role: auth?.organizationRole,
        hubs: auth?.hubs,
        superHubs: auth?.superHubs,
        permissions: auth?.permissions,
      },
      text: replyText,
      // La gamificación ahora es diferida (after()); ya no viaja en la
      // respuesta. Ningún cliente consumía este campo.
      gamification: null,
    });
  } catch (e: any) {
    console.error("❌ Error en /api/rowi:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno en Rowi" },
      { status: 500 }
    );
  }
}