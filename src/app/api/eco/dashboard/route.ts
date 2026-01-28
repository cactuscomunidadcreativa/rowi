import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * 🌱 ECO Dashboard — Estado emocional + comunicación recomendada
 * Combina EQ + Brain Style + micro sugerencias de comunicación.
 */
export async function GET() {
  try {
    // 1️⃣ Obtener último snapshot EQ
    const user = await prisma.user.findFirst({
      where: { email: "eduardo@cactuscomunidadcreativa.com" },
      include: { eqSnapshots: { orderBy: { at: "desc" }, take: 1 } },
    });

    if (!user) {
      return NextResponse.json({
        ok: false,
        error: "Usuario no encontrado",
      });
    }

    const snap = user.eqSnapshots?.[0];
    const band = (v?: number | null) =>
      v == null ? "mid" : v >= 70 ? "high" : v >= 50 ? "mid" : "low";

    const NE = band(snap?.NE);
    const ACT = band(snap?.ACT);
    const OP = band(snap?.OP);
    const EMP = band(snap?.EMP);

    // 2️⃣ Generar rutinas base (igual que tu ruta actual)
    const routines: Array<{ id: string; title: string; how: string; reason: string; minutes: number }> = [];
    if (NE === "low")
      routines.push({
        id: "ne-breath",
        title: "Regulación 2–3 min",
        how: "Respira 4-7-8 durante 2–3 minutos.",
        reason: "Cuidar NE (emociones).",
        minutes: 3,
      });
    if (ACT === "low")
      routines.push({
        id: "act-pause",
        title: "Micro-pausa ACT (60s)",
        how: "Antes de decidir, pausa 60s y enumera 3 consecuencias.",
        reason: "Fortalecer ACT.",
        minutes: 1,
      });
    if (OP === "low")
      routines.push({
        id: "op-gratitude",
        title: "3 gratitudes",
        how: "Escribe 3 cosas por las que te sientes agradecid@.",
        reason: "Sostener Optimism.",
        minutes: 2,
      });
    if (EMP === "low")
      routines.push({
        id: "emp-listening",
        title: "Escucha activa",
        how: "En tu próxima charla, usa 3 preguntas abiertas y parafrasea.",
        reason: "Aumentar Empathy.",
        minutes: 2,
      });

    // 3️⃣ Agregar análisis cognitivo del comunicador (Brain Style)
    const brainStyle = user.brainStyle || "Strategist";
    const COMM_PREFS: Record<string, { pattern: string; risk: string }> = {
      Strategist: { pattern: "preciso y enfocado en lógica", risk: "puede sonar distante" },
      Guardian: { pattern: "estructurado y seguro", risk: "evita riesgo o espontaneidad" },
      Energizer: { pattern: "entusiasta y directo", risk: "puede saturar o distraer" },
      Sage: { pattern: "profundo y reflexivo", risk: "puede extenderse o abstraerse" },
      Deliverer: { pattern: "orientado a resultados", risk: "puede omitir lo emocional" },
      Scientist: { pattern: "basado en evidencia", risk: "puede ser demasiado técnico" },
      Inventor: { pattern: "creativo e inspirador", risk: "puede dispersarse" },
    };

    const comm = COMM_PREFS[brainStyle] || COMM_PREFS.Strategist;

    // 4️⃣ Fusión: EQ + Comunicación
    return NextResponse.json({
      ok: true,
      user: {
        name: user.name,
        brainStyle,
        commPattern: comm.pattern,
        commRisk: comm.risk,
      },
      eqStatus: { NE, ACT, OP, EMP },
      routines: routines.slice(0, 3),
      insights: [
        `Tu comunicación natural es ${comm.pattern}.`,
        `Recordá que ${comm.risk}.`,
        NE === "low"
          ? "Tu regulación emocional necesita atención hoy."
          : "Tu estabilidad emocional está en buen nivel.",
      ],
    });
  } catch (e: any) {
    console.error("ECO Dashboard error:", e);
    return NextResponse.json({ ok: false, error: e.message });
  }
}