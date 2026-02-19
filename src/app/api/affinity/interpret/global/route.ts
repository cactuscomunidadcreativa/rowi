// src/app/api/affinity/interpret/global/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import { runAffinityRouter } from "@/ai/agents/affinity/router";

export const runtime = "nodejs";

/* =========================================================
   🌎 Normalizador de idioma
========================================================= */
function normLocale(s?: string | null) {
  const v = (s || "").toLowerCase();
  if (v.startsWith("pt")) return "pt";
  if (v.startsWith("en")) return "en";
  if (v.startsWith("it")) return "it";
  return "es";
}

/* =========================================================
   🧠 POST → Interpretación global de comunidad
========================================================= */
export async function POST(req: NextRequest) {
  try {
    // 🔐 Validar usuario autenticado
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // 👤 Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, plan: true, primaryTenantId: true },
    });
    if (!user)
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" });

    // 📦 Leer body
    const body = await req.json().catch(() => ({}));
    const { summary, locale } = body || {};
    const lang = normLocale(locale);

    if (!summary?.global)
      return NextResponse.json({
        ok: false,
        error: "Faltan datos de resumen global para interpretar.",
      });

    /* =========================================================
       🔒 Plan Free → fallback sin IA
    ========================================================== */
    if (user.plan?.name === "free" || !user.plan) {
      const g = summary.global;
      const topGroup = summary.byGroup?.[0] || { name: "Trabajo", heat: g.heat };
      const fallback: Record<string, string> = {
        es: `🔒 Modo gratuito: su comunidad tiene ${g.heat}% de afinidad promedio (${g.level}). Grupo destacado: ${topGroup.name}.`,
        en: `🔒 Free mode: your community shows ${g.heat}% affinity (${g.level}). Strongest group: ${topGroup.name}.`,
        pt: `🔒 Modo gratuito: sua comunidade tem ${g.heat}% de afinidade (${g.level}). Grupo em destaque: ${topGroup.name}.`,
        it: `🔒 Modalità gratuita: la tua comunità ha ${g.heat}% di affinità (${g.level}). Gruppo principale: ${topGroup.name}.`,
      };
      return NextResponse.json({ ok: true, text: fallback[lang] });
    }

    /* =========================================================
       🤖 Ejecutar el sub-agente Affinity "community"
    ========================================================== */
    const result = await runAffinityRouter({
      subIntent: "community",
      locale: lang,
      tenantId: user.primaryTenantId || "six-seconds-global",
      plan: user.plan?.name || "free",
      payload: { summary, project: "global" },
    });

    /* =========================================================
       📊 Registrar uso IA (UserUsage)
    ========================================================== */
    if (result?.meta?.tokens) {
      const tokens = result.meta.tokens as { input?: number; output?: number; prompt_tokens?: number; completion_tokens?: number };
      const tokensIn = tokens.input ?? tokens.prompt_tokens ?? 0;
      const tokensOut = tokens.output ?? tokens.completion_tokens ?? 0;
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      await prisma.userUsage.upsert({
        where: {
          userId_day_feature: {
            userId: user.id,
            day: todayDate,
            feature: "AFFINITY_INTERPRET_GLOBAL",
          },
        },
        create: {
          userId: user.id,
          day: todayDate,
          feature: "AFFINITY_INTERPRET_GLOBAL",
          tokensInput: tokensIn,
          tokensOutput: tokensOut,
        },
        update: {
          tokensInput: { increment: tokensIn },
          tokensOutput: { increment: tokensOut },
        },
      });
    }

    /* =========================================================
       🧠 Respuesta final
    ========================================================== */
    return NextResponse.json({
      ok: true,
      text:
        result.answer ||
        "Interpretación generada con Rowi Affinity Community Agent.",
      meta: {
        tokens: result.meta?.tokens || null,
        costUsd: result.meta?.costUsd || 0,
      },
    });
  } catch (e: any) {
    console.error("❌ [/api/affinity/interpret/global] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ⚙️ Configuración runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";