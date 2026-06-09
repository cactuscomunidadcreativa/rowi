import { NextRequest, NextResponse } from "next/server";
import { cachedCompletion } from "@/lib/openai/cachedCompletion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { locale, aName, bName, context, plan } = await req.json();

    // 🔒 Restricción de acceso
    if (plan !== "pro") {
      return NextResponse.json({
        ok: true,
        text: "ℹ️ Resumen IA restringido a plan Pro.",
      });
    }

    const prompt = locale === "es"
      ? `Analiza la relación entre ${aName} y ${bName} en ${context}.`
      : `Analyze the relationship between ${aName} and ${bName} in ${context}.`;

    const { text, cached } = await cachedCompletion({
      kind: "affinity_ia",
      prompt,
      scope: "global",
      model: "gpt-4o-mini",
      fallback: "",
      call: async (openai) => {
        const resp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.6,
          max_tokens: 400,
          messages: [
            { role: "system", content: "Eres Rowi, analista de afinidad emocional." },
            { role: "user", content: prompt },
          ],
        });
        return resp.choices?.[0]?.message?.content ?? "";
      },
    });

    return NextResponse.json({ ok: true, text, cached });
  } catch (e: any) {
    console.error("IA affinity error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
