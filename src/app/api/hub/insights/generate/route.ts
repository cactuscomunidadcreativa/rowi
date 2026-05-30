import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* =========================================================
   🧠 POST /api/hub/insights/generate
   Genera un insight cognitivo. 🔐 Solo administradores.
   (Antes usaba una clave compartida con fallback "rowi-key"
   embebido en el repo — eliminado por seguridad/costo.)
   ========================================================= */
export async function POST(req: NextRequest) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  try {
    const { type } = await req.json();

    let prompt = "";
    switch (type) {
      case "eq-affinity":
        prompt = `Analiza correlaciones hipotéticas entre EQ promedio y afinidad grupal. 
Incluye posibles aprendizajes y recomendaciones para equipos.`;
        break;
      case "eq-performance":
        prompt = `Evalúa cómo la inteligencia emocional podría influir en el rendimiento organizacional. 
Genera interpretaciones sobre competencias EQ clave.`;
        break;
      case "affinity-climate":
        prompt = `Explora cómo la afinidad y las emociones compartidas influyen en el clima organizacional.`;
        break;
      default:
        prompt = `Genera un insight cognitivo general sobre patrones emocionales, afinidad y desempeño.`;
        break;
    }

    // 🔮 Simulación con IA
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Eres un analista cognitivo de datos emocionales. Usa lenguaje humano, breve y profesional.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 500,
    });

    const result = completion.choices[0]?.message?.content || "Sin resultados disponibles.";

    return NextResponse.json({
      ok: true,
      type,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("❌ Error generando insight:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}