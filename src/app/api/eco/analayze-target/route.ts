// src/app/api/eco/analyze-target/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { name, bio, brainStyle } = await req.json();

    // Si hay Brain Style, lo usamos directamente
    if (brainStyle) {
      return NextResponse.json({
        ok: true,
        name,
        brainStyle,
        inferredTone: brainStyle === "Inventor" ? "creativo e intuitivo" : "lógico y empático",
      });
    }

    // Si hay bio, usamos IA para inferir estilo
    if (bio) {
      const prompt = `Analiza este texto y dime qué tipo de comunicación representa:
      - ${bio}
      Clasifícalo como uno de: Strategist, Scientist, Guardian, Deliverer, Inventor, Energizer, Sage.
      Devuelve JSON con: { brainStyle, inferredTone, keywords }`;

      const res = await ai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(res.choices[0].message?.content || "{}");
      return NextResponse.json({ ok: true, ...data });
    }

    return NextResponse.json({ ok: false, error: "Faltan datos" });
  } catch (e: any) {
    console.error("ECO analyze-target error:", e);
    return NextResponse.json({ ok: false, error: e.message });
  }
}