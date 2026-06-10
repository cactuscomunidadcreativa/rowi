/**
 * POST /api/vital-signs/ask
 *
 * Agente conversacional Rowi Vital. Recibe el contexto (scope + subjectId)
 * + historial de mensajes del usuario, y responde con OpenAI usando el
 * AggregateResult del contexto como knowledge base.
 *
 * Body:
 *   {
 *     scope: "team" | "org" | "family" | "world",
 *     subjectId: string,
 *     messages: Array<{ role: "user" | "assistant", content: string }>
 *   }
 *
 * Validaciones:
 *   - Usuario debe ser miembro del scope (mismo check que /context).
 *   - Si el agregado está suppressed (N<5), responde diciéndolo en vez
 *     de llamar al modelo (no hay capital sobre el que conversar).
 *   - Historial limitado a últimos 10 mensajes para mantener costo bajo.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { getOpenAIClient } from "@/lib/openai/client";
import {
  aggregateInferredVitalSigns,
  type AggregateScope,
} from "@/lib/vital-signs/aggregate";
import { OVS_ORIENTATIONS, ROWI_ARCHETYPES } from "@/lib/vital-signs/catalog";

const MAX_HISTORY = 10;
const MAX_MESSAGE_LEN = 1000;
const FEATURE_KEY = "VITAL_SIGNS_ASK";
const MODEL = "gpt-4o-mini";

// Pricing gpt-4o-mini (Dec 2024): $0.15 / 1M input · $0.60 / 1M output.
const PRICE_INPUT_PER_TOKEN = 0.15 / 1_000_000;
const PRICE_OUTPUT_PER_TOKEN = 0.60 / 1_000_000;

async function userBelongsToScope(
  userId: string,
  scope: AggregateScope,
  subjectId: string,
): Promise<boolean> {
  if (scope === "world") return true;
  if (scope === "team") {
    const m = await prisma.rowiCommunityUser.findFirst({
      where: { userId, communityId: subjectId },
      select: { id: true },
    });
    return !!m;
  }
  if (scope === "org") {
    const m = await prisma.membership.findFirst({
      where: { userId, tenantId: subjectId },
      select: { id: true },
    });
    return !!m;
  }
  if (userId === subjectId) return true;
  const rel = await prisma.familyRelation.findFirst({
    where: {
      ownerId: subjectId,
      relatedUserId: userId,
      consentStatus: "accepted",
    },
    select: { id: true },
  });
  return !!rel;
}

async function resolveSubjectName(
  scope: AggregateScope,
  subjectId: string,
): Promise<string> {
  if (scope === "world") return "Rowiverse";
  if (scope === "team") {
    const c = await prisma.rowiCommunity.findUnique({
      where: { id: subjectId },
      select: { name: true },
    });
    return c?.name ?? "—";
  }
  if (scope === "org") {
    const t = await prisma.tenant.findUnique({
      where: { id: subjectId },
      select: { name: true },
    });
    return t?.name ?? "—";
  }
  const owner = await prisma.user.findUnique({
    where: { id: subjectId },
    select: { name: true },
  });
  return owner?.name ?? "Familia";
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, primaryTenantId: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      scope?: string;
      subjectId?: string;
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      lang?: "es" | "en";
    };
    const scope = body.scope as AggregateScope;
    if (!scope || !["team", "org", "family", "world"].includes(scope)) {
      return NextResponse.json({ ok: false, error: "Invalid scope" }, { status: 400 });
    }
    const subjectId = scope === "world" ? "rowiverse" : (body.subjectId ?? "");
    if (!subjectId) {
      return NextResponse.json({ ok: false, error: "Missing subjectId" }, { status: 400 });
    }
    // Solo aceptar roles user/assistant: evita que el cliente inyecte un
    // mensaje role:"system" con instrucciones arbitrarias al modelo.
    const messages = (body.messages ?? [])
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .slice(-MAX_HISTORY)
      .map((m) => ({
        role: m.role,
        content: String(m.content ?? "").slice(0, MAX_MESSAGE_LEN),
      }));
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ ok: false, error: "Last message must be from user" }, { status: 400 });
    }
    const lang: "es" | "en" = body.lang === "en" ? "en" : "es";

    const belongs = await userBelongsToScope(user.id, scope, subjectId);
    if (!belongs) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const subjectName = await resolveSubjectName(scope, subjectId);
    const agg = await aggregateInferredVitalSigns({
      scope,
      subjectId,
      subjectName,
    });

    if (agg.suppressed) {
      const msg = lang === "en"
        ? `I can't talk about ${subjectName} yet — the privacy floor needs at least 5 members with a complete profile. Today there are ${agg.n} of ${agg.nTotal}.`
        : `Todavía no puedo conversar sobre ${subjectName} — la regla de privacidad requiere mínimo 5 miembros con perfil completo. Hoy hay ${agg.n} de ${agg.nTotal}.`;
      return NextResponse.json({ ok: true, suppressed: true, reply: msg });
    }

    // Construir contexto compacto para el modelo.
    const orientation = agg.orientation ? OVS_ORIENTATIONS[agg.orientation] : null;
    const archetype = agg.dominantQuadrant ? ROWI_ARCHETYPES[agg.dominantQuadrant] : null;
    const driversLine = agg.drivers
      .map((d) => `${lang === "en" ? d.enName : d.esName} ${d.scoreMean?.toFixed(1) ?? "—"} (SD ${d.scoreSD?.toFixed(1) ?? "—"})`)
      .join(", ");
    const seiLine = agg.seiCompetencies
      .map((c) => `${c.key} ${c.scoreMean?.toFixed(1) ?? "—"}`)
      .join(", ");
    const outcomesLine = (scope === "org" || scope === "world") && agg.outcomes.length > 0
      ? agg.outcomes
          .map((o) => `${lang === "en" ? o.enName : o.esName} ${o.scoreMean?.toFixed(1) ?? "—"}`)
          .join(", ")
      : "";

    const scopeLabel = scope === "team" ? (lang === "en" ? "team" : "equipo")
      : scope === "org" ? (lang === "en" ? "organization" : "organización")
      : scope === "family" ? (lang === "en" ? "family" : "familia")
      : (lang === "en" ? "the Rowiverse" : "el Rowiverse");

    const systemPrompt = lang === "en"
      ? `You are Rowi Vital, a coaching assistant grounded in the Six Seconds emotional intelligence model. The user is asking about their ${scopeLabel}: "${subjectName}".

Current inferred snapshot (NOT an official OVS/TVS, just an inference from member SEI + Brain Talent profiles, N=${agg.n}/${agg.nTotal}):

- Engagement Index: ${agg.engagementIndex ?? "—"}/100
- Dominant orientation: ${orientation?.enName ?? "—"} (${orientation?.enIdentity ?? "—"})
- Dominant archetype: ${archetype?.enName ?? "—"}
- 5 drivers (mean / SD): ${driversLine}
- 8 SEI competencies (mean): ${seiLine}${outcomesLine ? `\n- 4 OVS outcomes: ${outcomesLine}` : ""}

Your job: answer the user's question with grounded, actionable insights. Be concise (3-6 sentences), reference the data when relevant, suggest 1-2 concrete next steps. Don't invent data not given. If the question is about what THEY can contribute, focus on the gap between their personal profile and the aggregate. Use the Six Seconds vocabulary (KCG, drivers, pulse points) naturally without lecturing.`
      : `Sos Rowi Vital, un asistente de coaching basado en el modelo Six Seconds de inteligencia emocional. El usuario está preguntando sobre su ${scopeLabel}: "${subjectName}".

Snapshot inferido actual (NO es un OVS/TVS oficial, es una inferencia desde los perfiles SEI + Brain Talents de los miembros, N=${agg.n}/${agg.nTotal}):

- Índice de Engagement: ${agg.engagementIndex ?? "—"}/100
- Orientación dominante: ${orientation?.esName ?? "—"} (${orientation?.esIdentity ?? "—"})
- Arquetipo Rowi dominante: ${archetype?.esName ?? "—"}
- 5 drivers (media / SD): ${driversLine}
- 8 competencias SEI (media): ${seiLine}${outcomesLine ? `\n- 4 outcomes del OVS: ${outcomesLine}` : ""}

Tu tarea: responder con insights útiles y accionables, anclados en los datos. Sé conciso (3-6 oraciones), referenciá la data cuando sea relevante, sugerí 1-2 pasos concretos. No inventes datos que no te dieron. Si la pregunta es sobre qué puede APORTAR el usuario, enfocate en el gap entre su perfil personal y el agregado. Usá el vocabulario Six Seconds (KCG, drivers, pulse points) naturalmente sin sonar a clase.`;

    let openai;
    try {
      openai = await getOpenAIClient();
    } catch (e) {
      return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 400,
      temperature: 0.6,
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? "";

    // 📊 Tracking de consumo (patrón canónico del repo).
    const tokensIn = completion.usage?.prompt_tokens ?? 0;
    const tokensOut = completion.usage?.completion_tokens ?? 0;
    const costUsd = tokensIn * PRICE_INPUT_PER_TOKEN + tokensOut * PRICE_OUTPUT_PER_TOKEN;

    if (tokensIn > 0 || tokensOut > 0) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      try {
        await prisma.userUsage.upsert({
          where: {
            userId_day_feature: {
              userId: user.id,
              day,
              feature: FEATURE_KEY,
            },
          },
          create: {
            userId: user.id,
            tenantId: user.primaryTenantId ?? null,
            day,
            feature: FEATURE_KEY,
            tokensInput: tokensIn,
            tokensOutput: tokensOut,
          },
          update: {
            tokensInput: { increment: tokensIn },
            tokensOutput: { increment: tokensOut },
          },
        });

        // Agregado por tenant (cuando el user tiene tenant primario).
        // Usamos feature EQ del enum UsageFeature ya que Rowi Vital opera
        // sobre el modelo de Emotional Quotient (Six Seconds).
        if (user.primaryTenantId) {
          await prisma.usageDaily.upsert({
            where: {
              tenantId_feature_day_model: {
                tenantId: user.primaryTenantId,
                feature: "EQ",
                day,
                model: MODEL,
              },
            },
            create: {
              tenantId: user.primaryTenantId,
              feature: "EQ",
              day,
              model: MODEL,
              calls: 1,
              tokensInput: tokensIn,
              tokensOutput: tokensOut,
              costUsd,
            },
            update: {
              calls: { increment: 1 },
              tokensInput: { increment: tokensIn },
              tokensOutput: { increment: tokensOut },
              costUsd: { increment: costUsd },
            },
          });
        }
      } catch (trackErr) {
        // No bloquear la respuesta si falla el tracking; loguear.
        console.error("/api/vital-signs/ask tracking error:", trackErr);
      }
    }

    return NextResponse.json({
      ok: true,
      reply,
      suppressed: false,
      usage: { tokensInput: tokensIn, tokensOutput: tokensOut, costUsd },
    });
  } catch (e: unknown) {
    console.error("/api/vital-signs/ask error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
