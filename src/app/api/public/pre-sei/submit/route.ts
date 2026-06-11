/**
 * 🎯 API pública: Pre-SEI submit
 * POST /api/public/pre-sei/submit
 *
 * Recibe 8 respuestas 1-5 (+ demografía opcional), corre el scoring determinista
 * y la normativa en vivo, persiste una PreSeiSession anónima, setea cookie
 * httpOnly con el token y devuelve el insight. Pública (sin auth), pero NO exenta
 * de CSRF: el middleware exige Origin/Referer del mismo dominio. Rate-limit
 * endurecido a 10/min en middleware (RATE_LIMITS["/api/public/pre-sei"]).
 *
 * Anti-abuso: validación estricta (8 claves SEI, 1-5), honeypot, ipHash. Cero IA
 * → cero superficie de coste.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/core/prisma";
import { scorePreSei, validateAnswers, type PreSeiAnswers } from "@/lib/pre-sei/scoring";
import { normativeReadings } from "@/lib/pre-sei/normative";
import { buildPreSeiStatFetcher } from "@/lib/pre-sei/benchmark-source";
import type { PulseLang } from "@/lib/pre-sei/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRE_SEI_COOKIE = "rowi_pre_sei";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días
const LANGS: PulseLang[] = ["es", "en", "pt", "it"];

function resolveLang(raw: unknown): PulseLang {
  return LANGS.includes(raw as PulseLang) ? (raw as PulseLang) : "es";
}

function hashIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : null;
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }

    // Honeypot: campo oculto que solo un bot llenaría.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: false, error: "Invalid submission" }, { status: 400 });
    }

    // Validación estricta de las 8 respuestas.
    const validationError = validateAnswers(body.answers);
    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }
    const answers = body.answers as PreSeiAnswers;
    const lang = resolveLang(body.lang);

    // Capa de preferencias (estilo) — MISMO cuestionario que el Rowi Test.
    // Posicional "0".."7" con valores 1-5; opcional y saneada (anti-abuso).
    let preferences: Record<string, number> | null = null;
    if (body.preferences && typeof body.preferences === "object") {
      const clean: Record<string, number> = {};
      for (const [k, v] of Object.entries(body.preferences as Record<string, unknown>)) {
        const pos = Number(k);
        const val = Number(v);
        if (Number.isInteger(pos) && pos >= 0 && pos < 8 && Number.isInteger(val) && val >= 1 && val <= 5) {
          clean[String(pos)] = val;
        }
      }
      if (Object.keys(clean).length > 0) preferences = clean;
    }

    const demographics = {
      ageRange: typeof body.ageRange === "string" ? body.ageRange : null,
      gender: typeof body.gender === "string" ? body.gender : null,
      sector: typeof body.sector === "string" ? body.sector : null,
      country: typeof body.country === "string" ? body.country : null,
    };

    // Scoring determinista (sin IA).
    const result = scorePreSei(answers);

    // Normativa en vivo: pre-cargar stats del benchmark y comparar.
    const { fetcher, hasBenchmark } = await buildPreSeiStatFetcher({
      ageRange: demographics.ageRange,
      gender: demographics.gender,
    });
    const normative = normativeReadings(
      result.competencies,
      { country: demographics.country, sector: demographics.sector },
      fetcher,
    );

    const insight = { ...result, normative, hasBenchmark };
    // Coerción a Json plano para el campo Prisma Json (quita tipos/undefined).
    const insightJson = JSON.parse(JSON.stringify(insight));

    // Persistir la sesión anónima.
    const token = crypto.randomUUID();
    await prisma.preSeiSession.create({
      data: {
        token,
        locale: lang,
        answers,
        preferences: preferences ?? undefined,
        result: insightJson,
        ageRange: demographics.ageRange,
        gender: demographics.gender,
        sector: demographics.sector,
        country: demographics.country,
        source: "public",
        ipHash: hashIp(req),
      },
    });

    const res = NextResponse.json({ ok: true, token, insight });
    res.cookies.set(PRE_SEI_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return res;
  } catch (error) {
    console.error("❌ Error POST /api/public/pre-sei/submit:", error);
    return NextResponse.json({ ok: false, error: "Error processing Pre-SEI" }, { status: 500 });
  }
}
