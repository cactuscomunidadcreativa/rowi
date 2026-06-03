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
    return NextResponse.json({ ok: true, lang, questions });
  } catch (error) {
    console.error("❌ Error GET /api/public/pre-sei/questions:", error);
    return NextResponse.json({ ok: false, error: "Error loading questions" }, { status: 500 });
  }
}
