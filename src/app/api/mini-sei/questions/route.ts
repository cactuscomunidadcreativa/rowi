/**
 * GET /api/mini-sei/questions?lang=es
 *
 * Serves the mini-SEI questionnaire to the signed-in user as OPAQUE positions
 * plus localized stems ONLY. The competency mapping, reverse-keys, weights and
 * real item ids never leave the server — that mapping is the moat. The client
 * answers by position; /submit maps positions back to items server-side.
 *
 * Auth required (this is the user's own assessment, not a public hook).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/core/prisma";
import { publicQuestions, type MiniSeiLang } from "@/lib/mini-sei/items";
import { telemetry } from "@/lib/telemetry";

const LANGS: MiniSeiLang[] = ["es", "en", "pt", "it"];
function resolveLang(raw: string | null): MiniSeiLang {
  return LANGS.includes(raw as MiniSeiLang) ? (raw as MiniSeiLang) : "es";
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const lang = resolveLang(req.nextUrl.searchParams.get("lang"));
    // publicQuestions returns ONLY { pos, stem } — no competency/reverse/id.
    const questions = publicQuestions(lang);
    return NextResponse.json({ ok: true, lang, questions });
  } catch (e: unknown) {
    telemetry.captureException(e, { route: "/api/mini-sei/questions" });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
