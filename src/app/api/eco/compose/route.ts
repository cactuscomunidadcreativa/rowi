// src/app/api/eco/compose/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { isEcoLLMEnabled } from "@/domains/eco/libAI";

export const dynamic = "force-dynamic";

/* =========================================================
   🌐 ECO — Communication Engine con fallback sin IA
========================================================= */
type Channel = "email" | "whatsapp" | "sms" | "call" | "speech";
type ComposeInput = {
  goal: string;
  channel: Channel;
  memberIds?: string[];
  freeTargets?: { name: string; brainStyle?: string; description?: string }[];
  refine?: boolean;
  ask?: string;
  locale?: "es" | "en" | "pt" | "it";
};

/* =========================================================
   ⚙️ Setup IA (si está permitido)
========================================================= */
const ai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const PREFS: Record<string, { prefers: string; tone: string }> = {
  Strategist: { prefers: "claridad, foco y estructura", tone: "directo y preciso" },
  Scientist: { prefers: "datos y método", tone: "analítico y sobrio" },
  Guardian: { prefers: "estabilidad y confianza", tone: "cauto y formal" },
  Deliverer: { prefers: "acción rápida y resultados", tone: "concreto y resuelto" },
  Inventor: { prefers: "ideas y posibilidades", tone: "creativo e inspirador" },
  Energizer: { prefers: "impacto y entusiasmo", tone: "motivado y ágil" },
  Sage: { prefers: "significado y propósito", tone: "reflexivo y profundo" },
};

/* =========================================================
   🧠 POST handler — usa IA solo si está habilitada
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || "";
    const user = await prisma.user.findUnique({ where: { email } });

    const body = (await req.json()) as ComposeInput;

    const allowAI = user?.allowAI || false;
    const ecoEnabled = allowAI && isEcoLLMEnabled();

    // === Contexto base ===
    const target = body.freeTargets?.[0] || { brainStyle: "Strategist", name: "tu interlocutor" };
    const style = PREFS[target.brainStyle || "Strategist"];

    /* =========================================================
       🧩 Si IA no está permitida → fallback local
    ========================================================== */
    if (!ecoEnabled) {
      const base = {
        subject: `Comunicación con ${target.name}`,
        text: `Hola ${target.name},\n\n${body.goal}.\n\nComunica con un tono ${style.tone}, priorizando ${style.prefers}.`,
        labels: {},
        tone: style.tone,
        locale: "es",
      };

      return NextResponse.json({
        ok: true,
        mode: "no-ia",
        base,
        refined: null,
        note: "⚙️ Modo sin IA: mensaje generado localmente según tu estilo.",
      });
    }

    /* =========================================================
       🤖 Si IA está habilitada → usar OpenAI
    ========================================================== */
    const basePrompt = `
Eres ECO, estratega de comunicación.
Genera un mensaje profesional y empático.

Objetivo: ${body.goal}
Canal: ${body.channel}
Receptor: ${target.name} (${target.brainStyle})
Tono preferido: ${style.tone}
Idioma: español

Responde en formato JSON con:
{
  "subject": "Asunto",
  "text": "Cuerpo del mensaje"
}`;

    const completion = await ai!.chat.completions.create({
      model: body.refine ? "gpt-4o" : "gpt-4o-mini",
      temperature: 0.6,
      messages: [{ role: "system", content: basePrompt }],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message?.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      ok: true,
      mode: body.refine ? "pro-llm" : "base-ia",
      base: parsed,
      refined: body.refine ? parsed : null,
    });
  } catch (e: any) {
    console.error("❌ /api/eco/compose error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno en ECO" },
      { status: 500 }
    );
  }
}