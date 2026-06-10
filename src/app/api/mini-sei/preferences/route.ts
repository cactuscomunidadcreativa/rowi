/**
 * GET /api/mini-sei/preferences?lang=es
 *
 * Sirve la capa de PREFERENCIAS del mini-SEI: pocas preguntas capciosas con
 * escala 1-5 que capturan el estilo (procesamiento / cambio / horizonte /
 * canal) — lo que ECO/Afinidad consumen. El cliente responde por POSICIÓN
 * (el orden de PREF_AXES); /submit las mapea server-side. Auth required.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PREF_AXES } from "@/lib/mini-sei/preferences";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // Devuelve solo la estructura i18n; la UI resuelve los textos por clave.
    const questions = PREF_AXES.map((def, pos) => ({
      pos,
      axis: def.axis,
      promptKey: def.promptKey,
      leftKey: def.leftKey,
      rightKey: def.rightKey,
    }));
    return NextResponse.json({ ok: true, questions });
  } catch (e: unknown) {
    console.error("/api/mini-sei/preferences error:", e);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
