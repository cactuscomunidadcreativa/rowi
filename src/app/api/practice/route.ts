/**
 * /api/practice — motor multi-turno del AI Practice Partner (Track B).
 *
 * Roleplay puntuado contra un escenario (ScenarioBank). El motor IA es
 * PLUGGABLE (resolvePracticeModel): Claude por defecto, cualquier modelo vía
 * env / AgentConfig. Cada turno se persiste como CoachingTurn; al cerrar se
 * puntúa contra la rúbrica y se conecta a gamificación + loop diario.
 *
 * Acciones (POST { action }):
 *   - "start"  { scenarioId, tz? }           → crea sesión + primer turno del partner
 *   - "turn"   { sessionId, message, tz? }   → guarda turno del usuario + responde el partner
 *   - "finish" { sessionId, tz? }            → puntúa, recompensa, marca práctica del día
 *
 * GET ?scenarios=1[&locale=]   → escenarios activos para elegir
 * GET ?sessionId=<id>          → estado + transcript de una sesión
 *
 * Auth: getToken → userId. Respuestas { ok: true, ... } / { ok: false, error }.
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { parseTz } from "@/lib/daily-pulse/timezone";
import { generateText } from "@/lib/ai/generate";
import { buildAgentPromptContext } from "@/lib/ai/agentPromptContext";
import {
  resolvePracticeModel,
  regionFromLocale,
} from "@/lib/practice/practiceModel";
import {
  resolveFocusSei,
  buildPartnerSystemPrompt,
  buildTurnPrompt,
  PRACTICE_TURN_MAX_TOKENS,
  PRACTICE_MAX_USER_TURNS,
  type TurnForPrompt,
} from "@/lib/practice/practiceEngine";
import { parseRubric, scorePracticeSession } from "@/lib/practice/practiceScore";
import { completePractice } from "@/lib/practice/practiceComplete";
import type { SeiKey } from "@/lib/vital-signs/catalog";

const SEI_KEYS: SeiKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

/** Foco SEI persistido en la sesión → SeiKey válido (default EL). */
function resolveSessionFocus(focus: string | null | undefined): SeiKey {
  return focus && SEI_KEYS.includes(focus as SeiKey) ? (focus as SeiKey) : "EL";
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email?.toLowerCase();
  if (!email) return null;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? null;
}

/** AgentConfig "practice" global (provider/model/cultura). Best-effort. */
async function getPracticeAgent() {
  try {
    return await prisma.agentConfig.findFirst({
      where: { slug: "practice", isActive: true },
      orderBy: [{ tenantId: "asc" }], // los globales (null) primero por nulls-first de Postgres
    });
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────── GET ───────────

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "auth.unauthorized" }, { status: 401 });
    }
    const url = new URL(req.url);

    // Lista de escenarios para elegir.
    if (url.searchParams.get("scenarios")) {
      const locale = url.searchParams.get("locale") || undefined;
      const scenarios = await prisma.scenarioBank.findMany({
        where: { isActive: true, ...(locale ? { locale } : {}) },
        orderBy: [{ difficulty: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          summary: true,
          locale: true,
          focusSei: true,
          difficulty: true,
        },
      });
      return NextResponse.json({ ok: true, scenarios });
    }

    // Estado + transcript de una sesión.
    const sessionId = url.searchParams.get("sessionId");
    if (sessionId) {
      const session = await prisma.practiceSession.findFirst({
        where: { id: sessionId, userId },
        include: {
          scenario: { select: { title: true, summary: true, focusSei: true } },
          turns: { orderBy: { turnIndex: "asc" } },
        },
      });
      if (!session) {
        return NextResponse.json({ ok: false, error: "session.notFound" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, session });
    }

    return NextResponse.json({ ok: false, error: "query.invalid" }, { status: 400 });
  } catch (e) {
    console.error("/api/practice GET error:", e);
    return NextResponse.json({ ok: false, error: "server.error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────── POST ───────────

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "auth.unauthorized" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const tz = parseTz(body.tz);

    if (action === "start") return startSession(userId, body);
    if (action === "turn") return takeTurn(userId, body);
    if (action === "finish") return finishSession(userId, body, tz);

    return NextResponse.json({ ok: false, error: "action.invalid" }, { status: 400 });
  } catch (e) {
    console.error("/api/practice POST error:", e);
    return NextResponse.json({ ok: false, error: "server.error" }, { status: 500 });
  }
}

// ─── start ───────────────────────────────────────────────────────────────────

async function startSession(userId: string, body: Record<string, unknown>) {
  const scenarioId = String(body.scenarioId || "");
  if (!scenarioId) {
    return NextResponse.json({ ok: false, error: "scenarioId.required" }, { status: 400 });
  }
  const scenario = await prisma.scenarioBank.findFirst({
    where: { id: scenarioId, isActive: true },
  });
  if (!scenario) {
    return NextResponse.json({ ok: false, error: "scenario.notFound" }, { status: 404 });
  }

  const agent = await getPracticeAgent();
  const choice = resolvePracticeModel(agent, regionFromLocale(scenario.locale));
  const focusSei = await resolveFocusSei(userId, scenario.focusSei);

  // Bloque de cultura/conocimiento del agente (si existe el AgentConfig).
  let culturePrefix = "";
  if (agent) {
    try {
      culturePrefix = await buildAgentPromptContext(agent, { tenantId: agent.tenantId });
    } catch {
      culturePrefix = "";
    }
  }
  const system = buildPartnerSystemPrompt(
    { title: scenario.title, brief: scenario.brief, locale: scenario.locale, focusSei },
    focusSei,
    culturePrefix || undefined,
  );

  // Primer turno del partner: abre la escena.
  const opening = await generateText({
    provider: choice.provider,
    model: choice.model,
    system,
    prompt:
      "Abre la escena en personaje con una primera intervención breve y natural " +
      "que invite a la persona a responder. No expliques el ejercicio.",
    maxTokens: PRACTICE_TURN_MAX_TOKENS,
    temperature: 0.8,
  });

  const session = await prisma.practiceSession.create({
    data: {
      userId,
      tenantId: scenario.tenantId,
      scenarioId: scenario.id,
      locale: scenario.locale,
      status: "ACTIVE",
      focusSei,
      aiProvider: choice.provider,
      aiModel: opening.model,
      turnCount: 1,
      turns: {
        create: {
          userId,
          role: "PARTNER",
          content: opening.text,
          turnIndex: 0,
          aiModel: opening.model,
        },
      },
    },
    include: { turns: { orderBy: { turnIndex: "asc" } } },
  });

  return NextResponse.json({ ok: true, session });
}

// ─── turn ────────────────────────────────────────────────────────────────────

async function takeTurn(userId: string, body: Record<string, unknown>) {
  const sessionId = String(body.sessionId || "");
  const message = String(body.message || "").slice(0, 2000).trim();
  if (!sessionId || !message) {
    return NextResponse.json({ ok: false, error: "params.required" }, { status: 400 });
  }

  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      scenario: true,
      turns: { orderBy: { turnIndex: "asc" } },
    },
  });
  if (!session) {
    return NextResponse.json({ ok: false, error: "session.notFound" }, { status: 404 });
  }
  if (session.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "session.closed" }, { status: 409 });
  }

  const userTurns = session.turns.filter((t) => t.role === "USER").length;
  const reachedLimit = userTurns + 1 >= PRACTICE_MAX_USER_TURNS;

  const agent = await getPracticeAgent();
  const choice = resolvePracticeModel(agent, regionFromLocale(session.locale));
  let culturePrefix = "";
  if (agent) {
    try {
      culturePrefix = await buildAgentPromptContext(agent, { tenantId: agent.tenantId });
    } catch {
      culturePrefix = "";
    }
  }
  const focusSei = resolveSessionFocus(session.focusSei);
  const system = buildPartnerSystemPrompt(
    {
      title: session.scenario.title,
      brief: session.scenario.brief,
      locale: session.locale,
      focusSei,
    },
    focusSei,
    culturePrefix || undefined,
  );

  const history: TurnForPrompt[] = session.turns.map((t) => ({
    role: t.role,
    content: t.content,
  }));
  const partner = await generateText({
    provider: choice.provider,
    model: choice.model,
    system,
    prompt: buildTurnPrompt(history, message),
    maxTokens: PRACTICE_TURN_MAX_TOKENS,
    temperature: 0.8,
  });

  const baseIndex = session.turns.length;
  // Persistir el turno del usuario y la respuesta del partner.
  await prisma.$transaction([
    prisma.coachingTurn.create({
      data: {
        sessionId: session.id,
        userId,
        role: "USER",
        content: message,
        turnIndex: baseIndex,
      },
    }),
    prisma.coachingTurn.create({
      data: {
        sessionId: session.id,
        userId,
        role: "PARTNER",
        content: partner.text,
        turnIndex: baseIndex + 1,
        aiModel: partner.model,
      },
    }),
    prisma.practiceSession.update({
      where: { id: session.id },
      data: { turnCount: { increment: 2 } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    partner: { content: partner.text },
    reachedLimit,
  });
}

// ─── finish ──────────────────────────────────────────────────────────────────

async function finishSession(userId: string, body: Record<string, unknown>, tz: number) {
  const sessionId = String(body.sessionId || "");
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "sessionId.required" }, { status: 400 });
  }
  const session = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      scenario: true,
      turns: { orderBy: { turnIndex: "asc" } },
    },
  });
  if (!session) {
    return NextResponse.json({ ok: false, error: "session.notFound" }, { status: 404 });
  }
  if (session.status === "SCORED") {
    return NextResponse.json({
      ok: true,
      session: { id: session.id, score: session.score, feedback: session.feedback },
      alreadyScored: true,
    });
  }

  const agent = await getPracticeAgent();
  const choice = resolvePracticeModel(agent, regionFromLocale(session.locale));
  const transcript: TurnForPrompt[] = session.turns.map((t) => ({
    role: t.role,
    content: t.content,
  }));
  const feedback = await scorePracticeSession({
    scenarioTitle: session.scenario.title,
    brief: session.scenario.brief,
    rubric: parseRubric(session.scenario.rubric),
    transcript,
    locale: session.locale,
    provider: choice.provider,
    model: choice.model,
  });

  // Gamificación + loop diario (resiliente).
  const completion = await completePractice(userId, feedback.overall, tz);

  await prisma.$transaction([
    prisma.practiceSession.update({
      where: { id: session.id },
      data: {
        status: "SCORED",
        score: feedback.overall,
        feedback: feedback as unknown as object,
        pointsAwarded: completion.pointsAdded,
        scoredAt: new Date(),
      },
    }),
    prisma.scenarioBank.update({
      where: { id: session.scenarioId },
      data: { usageCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    score: feedback.overall,
    feedback,
    reward: {
      pointsAdded: completion.pointsAdded,
      evolution: completion.evolution,
    },
  });
}
