// src/app/api/affinity/interpret/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cachedCompletion } from "@/lib/openai/cachedCompletion";

export const runtime = "nodejs";

const hasAI = !!process.env.OPENAI_API_KEY;

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
   🧠 Handler principal POST
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userName, memberName, project, affinity, parts, locale } = body || {};

    // 🧱 Validación básica
    if (!userName || !memberName) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos de usuario o miembro" },
        { status: 400 }
      );
    }

    const lang = normLocale(locale);
    const affinityNum = typeof affinity === "number" ? affinity : Number(affinity) || 0;

    /* =========================================================
       🧩 Fallback determinista sin IA (también default si no hay key)
    ========================================================== */
    const topDim =
      (parts?.growth ?? 0) > (parts?.collaboration ?? 0) &&
      (parts?.growth ?? 0) > (parts?.understanding ?? 0)
        ? "Crecimiento"
        : (parts?.collaboration ?? 0) > (parts?.understanding ?? 0)
        ? "Colaboración"
        : "Entendimiento";

    const fallback: Record<string, string> = {
      es: `Afinidad entre ${userName} y ${memberName}: ${affinityNum}%. Mayor fortaleza en ${topDim}.`,
      en: `Affinity between ${userName} and ${memberName}: ${affinityNum}%. Strongest in ${topDim.toLowerCase()}.`,
      pt: `Afinidade entre ${userName} e ${memberName}: ${affinityNum}%. Maior força em ${topDim.toLowerCase()}.`,
      it: `Affinità tra ${userName} e ${memberName}: ${affinityNum}%. Punti di forza in ${topDim.toLowerCase()}.`,
    };

    if (!hasAI) {
      return NextResponse.json({ ok: true, text: fallback[lang], cached: false });
    }

    /* =========================================================
       🤖 Generación con IA (vía cache de respuestas)
    ========================================================== */
    const prompt = `
Eres Affinity Coach. Explica de forma breve y emocional (máximo 3–4 frases) los resultados de afinidad entre "${userName}" y "${memberName}".
Idioma: ${lang}.
Proyecto: ${project}.
Afinidad total: ${affinityNum}%.
Desglose:
- Crecimiento: ${parts?.growth ?? "—"}
- Colaboración: ${parts?.collaboration ?? "—"}
- Entendimiento: ${parts?.understanding ?? "—"}

Usa un tono empático, reflexivo y motivador. Termina con una pregunta abierta breve.
`;

    const { text, cached } = await cachedCompletion({
      kind: "affinity_interpret",
      prompt,
      scope: "global",
      model: "gpt-4o-mini",
      fallback: fallback[lang],
      call: async (openai) => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 150,
          messages: [
            { role: "system", content: `You are Affinity Coach. Always reply in ${lang}. Be concise.` },
            { role: "user", content: prompt },
          ],
        });
        return completion.choices?.[0]?.message?.content?.trim() || fallback[lang];
      },
    });

    return NextResponse.json({ ok: true, text, cached });
  } catch (e: any) {
    console.error("[affinity/interpret] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: "Error interpretando afinidad: " + (e?.message || "Error desconocido"),
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✅ Configuración runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";