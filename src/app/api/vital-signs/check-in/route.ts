export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { PULSE_POINTS } from "@/lib/vital-signs/catalog";

/**
 * Intelligent check-in: returns 1 rotating question dirigida al Pulse Point con
 * la lectura más antigua (>30d sin signal fresco) o vacía.
 *
 * Patrón del libro cap. 18: el sistema pregunta poco y a propósito —
 * 1 pregunta a la semana, no 36 preguntas a la vez.
 */

const PP_QUESTIONS_ES: Record<string, string> = {
  TRUST_TRANSPARENCY: "Esta semana, ¿sentiste que las decisiones importantes se explicaron con claridad?",
  TRUST_COHERENCE: "¿Las personas que lideran están cumpliendo los compromisos que prometieron?",
  TRUST_CARE: "¿Sentiste que alguien en tu equipo notó cómo estabas, no solo qué entregabas?",
  MOTIVATION_MEANING: "¿El trabajo de esta semana se conectó con algo que te importa?",
  MOTIVATION_MASTERY: "¿Aprendiste o desarrollaste algo nuevo esta semana?",
  MOTIVATION_AUTONOMY: "¿Tuviste espacio real para decidir cómo hacer tu trabajo?",
  CHANGE_IMAGINATION: "¿Hubo momentos esta semana donde imaginaste cómo podría ser mejor?",
  CHANGE_EXPLORATION: "¿Probaste algo nuevo esta semana, aunque podría no funcionar?",
  CHANGE_CELEBRATION: "¿Reconocieron algo logrado esta semana, o pasó sin marca?",
  TEAMWORK_DIVERGENCE: "¿Pudiste expresar una opinión diferente sin pagar costo?",
  TEAMWORK_CONNECTION: "¿Hubo conversaciones esta semana sin agenda, solo de estar?",
  TEAMWORK_JOY: "¿Hubo momentos de risa genuina con el equipo esta semana?",
  EXECUTION_FOCUS: "¿Pudiste concentrarte en lo esencial, o todo se sintió urgente?",
  EXECUTION_ACCOUNTABILITY: "¿Tus resultados de esta semana fueron visibles para quien importa?",
  EXECUTION_FEEDBACK: "¿Recibiste feedback honesto y útil sobre algo concreto esta semana?",
};

const PP_QUESTIONS_EN: Record<string, string> = {
  TRUST_TRANSPARENCY: "This week, did you feel important decisions were explained with clarity?",
  TRUST_COHERENCE: "Are the people leading delivering on the commitments they promised?",
  TRUST_CARE: "Did you feel anyone on your team noticed how you were, not just what you delivered?",
  MOTIVATION_MEANING: "Did this week's work connect with something that matters to you?",
  MOTIVATION_MASTERY: "Did you learn or develop something new this week?",
  MOTIVATION_AUTONOMY: "Did you have real space to decide how to do your work?",
  CHANGE_IMAGINATION: "Were there moments this week where you imagined how it could be better?",
  CHANGE_EXPLORATION: "Did you try something new this week, even if it might not work?",
  CHANGE_CELEBRATION: "Did you celebrate something achieved this week, or did it pass unmarked?",
  TEAMWORK_DIVERGENCE: "Could you express a different opinion without paying a cost?",
  TEAMWORK_CONNECTION: "Were there conversations this week without agenda, just being?",
  TEAMWORK_JOY: "Were there moments of genuine laughter with the team this week?",
  EXECUTION_FOCUS: "Could you focus on the essential, or did everything feel urgent?",
  EXECUTION_ACCOUNTABILITY: "Were your results this week visible to those who matter?",
  EXECUTION_FEEDBACK: "Did you receive honest and useful feedback on something concrete this week?",
};

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const locale = new URL(req.url).searchParams.get("locale") ?? "es";

    // For each PP, find the most recent signal from this user
    const signals = await prisma.pulsePointSignal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { pulsePointCode: true, createdAt: true },
    });

    const latestByCode = new Map<string, Date>();
    for (const s of signals) {
      if (!latestByCode.has(s.pulsePointCode)) {
        latestByCode.set(s.pulsePointCode, s.createdAt);
      }
    }

    // Find the stalest pulse point (oldest signal or no signal at all)
    const candidates = PULSE_POINTS.map((pp) => {
      const last = latestByCode.get(pp.code);
      const ageDays = last
        ? (Date.now() - last.getTime()) / (24 * 60 * 60 * 1000)
        : Infinity;
      return { pp, ageDays, last };
    }).sort((a, b) => b.ageDays - a.ageDays);

    const target = candidates[0];
    if (!target || target.ageDays < 7) {
      return NextResponse.json({
        ok: true,
        question: null,
        reason: "all_fresh",
      });
    }

    const questionPool = locale === "en" ? PP_QUESTIONS_EN : PP_QUESTIONS_ES;
    const question = questionPool[target.pp.code] ?? null;

    return NextResponse.json({
      ok: true,
      pulsePointCode: target.pp.code,
      driver: target.pp.driver,
      ageDays: target.ageDays === Infinity ? null : Math.round(target.ageDays),
      question,
      scale: { min: 1, max: 5 },
    });
  } catch (e: unknown) {
    console.error("/api/vital-signs/check-in error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
