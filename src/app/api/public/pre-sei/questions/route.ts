/**
 * 🎯 API pública: Pre-SEI questions
 * GET /api/public/pre-sei/questions?lang=es
 *
 * Devuelve las 8 preguntas del Pre-SEI (una por competencia SEI), localizadas,
 * en orden SEI_ORDER. Pública, sin auth (gancho EQ Day). Cubierta por
 * /api/public en PUBLIC_API_PATHS del middleware.
 */
import { NextRequest, NextResponse } from "next/server";
import { preSeiQuestions, type PulseLang } from "@/lib/pre-sei/questions";
import { PREF_AXES } from "@/lib/mini-sei/preferences";

export const dynamic = "force-dynamic";

const LANGS: PulseLang[] = ["es", "en", "pt", "it"];

function resolveLang(raw: string | null): PulseLang {
  return LANGS.includes(raw as PulseLang) ? (raw as PulseLang) : "es";
}

export async function GET(req: NextRequest) {
  try {
    const lang = resolveLang(req.nextUrl.searchParams.get("lang"));
    const questions = preSeiQuestions(lang).map((q) => ({
      sei: q.sei,
      index: q.index,
      prompt: q.prompt,
    }));
    // Capa de preferencias (estilo): MISMO cuestionario que el Rowi Test del
    // onboarding (decisión Eduardo F7). Solo claves i18n + posición — el
    // mapeo de ejes vive server-side, igual que en /api/mini-sei/preferences.
    const preferences = PREF_AXES.map((def, pos) => ({
      pos,
      promptKey: def.promptKey,
      leftKey: def.leftKey,
      rightKey: def.rightKey,
    }));
    return NextResponse.json({ ok: true, lang, questions, preferences });
  } catch (error) {
    console.error("❌ Error GET /api/public/pre-sei/questions:", error);
    return NextResponse.json({ ok: false, error: "Error loading questions" }, { status: 500 });
  }
}
