import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import { prisma } from "@/core/prisma";

/**
 * 🌱 ECO Dashboard — Estado emocional + comunicación recomendada
 * Combina EQ + Brain Style + micro sugerencias de comunicación.
 * Usa el usuario autenticado de la sesión.
 */
export async function GET() {
  try {
    // 1️⃣ Obtener usuario de la sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({
        ok: false,
        error: "No autenticado",
      });
    }

    // 2️⃣ Buscar usuario con sus snapshots EQ
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
      v == null ? null : v >= 70 ? "high" : v >= 50 ? "mid" : "low";

    const NE = band(snap?.NE);
    const ACT = band(snap?.ACT);
    const OP = band(snap?.OP);
    const EMP = band(snap?.EMP);

    // Solo mostrar eqStatus si hay datos reales
    const hasEqData = snap && (snap.NE != null || snap.ACT != null || snap.OP != null || snap.EMP != null);
    const eqStatus = hasEqData ? { NE, ACT, OP, EMP } : null;

    // 3️⃣ Generar rutinas base solo si hay datos EQ
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

    // 4️⃣ Análisis cognitivo del comunicador (Brain Style) - solo si el usuario lo tiene configurado
    const brainStyle = user.brainStyle || null;

    const COMM_PREFS: Record<string, { pattern: string; risk: string }> = {
      Strategist: { pattern: "preciso y enfocado en lógica", risk: "puede sonar distante" },
      Guardian: { pattern: "estructurado y seguro", risk: "evita riesgo o espontaneidad" },
      Energizer: { pattern: "entusiasta y directo", risk: "puede saturar o distraer" },
      Sage: { pattern: "profundo y reflexivo", risk: "puede extenderse o abstraerse" },
      Deliverer: { pattern: "orientado a resultados", risk: "puede omitir lo emocional" },
      Scientist: { pattern: "basado en evidencia", risk: "puede ser demasiado técnico" },
      Inventor: { pattern: "creativo e inspirador", risk: "puede dispersarse" },
    };

    const comm = brainStyle ? COMM_PREFS[brainStyle] : null;

    // 5️⃣ Generar insights solo si hay datos
    const insights: string[] = [];
    if (comm) {
      insights.push(`Tu comunicación natural es ${comm.pattern}.`);
      insights.push(`Recordá que ${comm.risk}.`);
    }
    if (NE === "low") {
      insights.push("Tu regulación emocional necesita atención hoy.");
    } else if (NE === "high") {
      insights.push("Tu estabilidad emocional está en buen nivel.");
    }

    // 6️⃣ Respuesta
    return NextResponse.json({
      ok: true,
      user: {
        name: user.name,
        brainStyle: brainStyle,
        commPattern: comm?.pattern || null,
        commRisk: comm?.risk || null,
      },
      eqStatus,
      routines: routines.slice(0, 3),
      insights: insights.length > 0 ? insights : null,
    });
  } catch (e: any) {
    console.error("ECO Dashboard error:", e);
    return NextResponse.json({ ok: false, error: e.message });
  }
}
