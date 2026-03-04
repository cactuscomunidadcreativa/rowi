import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { getServerAuthUser } from "@/core/auth";
import { getOpenAIClient } from "@/lib/openai/client";
import { recordActivity } from "@/services/gamification";
import { secureLog } from "@/lib/logging";

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
  trainer: "trainer",
  router: "router",
};

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
   🔎 Resolver agente por contexto (hub → tenant → superhub → global)
   ---------------------------------------------------------
   Prioridad: hubId → tenantId → superHubId → global
   SIEMPRE hace fallback a global si no encuentra en niveles específicos
   Si no encuentra con el slug principal, intenta aliases (ej: super → super-rowi)
========================================================= */
async function resolveAgent(slug: string, auth: any) {
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

  // Intentar resolver con el slug principal y luego con aliases
  const slugsToTry = [slug, ...(SLUG_ALIASES[slug] || [])];

  for (const trySlug of slugsToTry) {
    // 1️⃣ Intentar agente por Hub (más específico)
    if (hubId) {
      const hubAgent = await prisma.agentConfig.findFirst({
        where: { slug: trySlug, hubId, isActive: true },
      });
      if (hubAgent) return hubAgent;
    }

    // 2️⃣ Intentar agente por Tenant
    if (tenantId) {
      const tenantAgent = await prisma.agentConfig.findFirst({
        where: { slug: trySlug, tenantId, isActive: true },
      });
      if (tenantAgent) return tenantAgent;
    }

    // 3️⃣ Intentar agente por SuperHub
    if (superHubId) {
      const shAgent = await prisma.agentConfig.findFirst({
        where: { slug: trySlug, superHubId, isActive: true },
      });
      if (shAgent) return shAgent;
    }

    // 4️⃣ Fallback global (accessLevel = 'global', 'system' o sin scope asignado)
    const globalAgent = await prisma.agentConfig.findFirst({
      where: {
        slug: trySlug,
        isActive: true,
        OR: [
          { accessLevel: "global" },
          { accessLevel: "system" },
          {
            tenantId: null,
            superHubId: null,
            organizationId: null,
            hubId: null,
          }
        ]
      },
    });

    if (globalAgent) return globalAgent;
  }

  return null;
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
    const agent = await resolveAgent(slug, auth);

    if (!agent) {
      return NextResponse.json(
        {
          ok: false,
          access: accessLevel,
          text: `⚠️ No hay un agente IA configurado para el contexto "${slug}". Pídele a un admin que lo active en /hub/admin/agents.`,
        },
        { status: 200 }
      );
    }

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
    const systemPrompt = basePrompt + langInstruction;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Usuario: ${userName}\nContexto: intent=${slug}, nivel=${accessLevel}, locale=${locale}\n\nMensaje:\n${userContent}`,
      },
    ];

    /* =========================================================
     🤖 5. Llamar a OpenAI
    ========================================================== */
    const openai = await getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model,
      messages,
    });

    const replyText =
      completion.choices[0]?.message?.content?.trim() ||
      "⚠️ No pude generar una respuesta en este momento.";

    // Estimar tokens (opcional, aproximado)
    const tokensInput = estimateTokens(JSON.stringify(messages));
    const tokensOutput = estimateTokens(replyText);

    /* =========================================================
     📊 6. Registrar usage (ROWI_CHAT)
    ========================================================== */
    try {
      const tenantId = tenantFromBody || auth?.primaryTenantId || null;

      if (tenantId) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const feature: "AFFINITY" | "ECO" | "ROWI_CHAT" | "OTHER" = "ROWI_CHAT";

        const existingUsage = await prisma.usageDaily.findFirst({
          where: { tenantId, feature, day: today },
        });

        if (existingUsage) {
          await prisma.usageDaily.update({
            where: { id: existingUsage.id },
            data: {
              tokensInput: existingUsage.tokensInput + tokensInput,
              tokensOutput: existingUsage.tokensOutput + tokensOutput,
              calls: existingUsage.calls + 1,
              costUsd: (Number(existingUsage.costUsd) || 0) + 0, // aquí puedes poner cálculo real de coste
            },
          });
        } else {
          await prisma.usageDaily.create({
            data: {
              tenantId,
              feature,
              model,
              tokensInput,
              tokensOutput,
              calls: 1,
              costUsd: 0,
              day: today,
            },
          });
        }
      }
    } catch (usageErr) {
      console.warn("⚠️ Error registrando usage en usageDaily:", usageErr);
    }

    /* =========================================================
     🎮 6.5 Gamificación - Otorgar puntos por sesión de chat
    ========================================================== */
    let gamificationResult = null;
    try {
      if (auth?.id) {
        gamificationResult = await recordActivity(auth.id, "CHAT", {
          points: 10,
          reasonId: slug,
          description: `Chat con ${slug}`,
        });
      }
    } catch (gamErr) {
      console.warn("⚠️ Error en gamificación:", gamErr);
    }

    /* =========================================================
     💾 6.6 Persistir conversación en rowi_chat
    ========================================================== */
    try {
      if (auth?.id && auth.id !== "hub-control-user") {
        // Guardar mensaje del usuario
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

        // Guardar respuesta del asistente
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
      gamification: gamificationResult,
    });
  } catch (e: any) {
    console.error("❌ Error en /api/rowi:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno en Rowi" },
      { status: 500 }
    );
  }
}