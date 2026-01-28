import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * 🌐 AFFINITY MODULE GATEWAY
 * ---------------------------------------------------------
 * Punto de entrada del motor modular de afinidad.
 * Devuelve la lista de subrutas activas y metadatos del sistema.
 */
export async function GET() {
  const routes = [
    { path: "/api/affinity/relationship", desc: "Afinidad relacional (empatía, conexión, confianza)" },
    { path: "/api/affinity/leadership", desc: "Afinidad de liderazgo (influencia, visión, dirección)" },
    { path: "/api/affinity/execution", desc: "Afinidad de ejecución (acción, foco, disciplina)" },
    { path: "/api/affinity/innovation", desc: "Afinidad de innovación (creatividad, diseño, riesgo)" },
    { path: "/api/affinity/decision", desc: "Afinidad de decisión (análisis, juicio, pensamiento crítico)" },
    { path: "/api/affinity/conversation", desc: "Afinidad comunicacional (escucha, empatía, entendimiento)" },
    { path: "/api/affinity/composite", desc: "Composición global (fusión ponderada de los seis contextos)" },
    { path: "/api/affinity/snapshots", desc: "Gestión y cacheo de afinidades previas (optimización y backup)" },
  ];

  return NextResponse.json({
    ok: true,
    module: "Rowi SIA — Affinity Engine",
    version: "v3.0-modular",
    updated_at: new Date().toISOString(),
    message:
      "🧠 Módulo de afinidad emocional operativo. Usa las subrutas para cálculos específicos o composición global.",
    available_routes: routes,
    meta: {
      author: "Cactus Comunidad Creativa",
      lead: "Eduardo González Aguado",
      project: "Rowi SIA Affinity System",
      runtime: "Next.js API (Node)",
    },
  });
}

/**
 * POST (opcional)
 * ---------------------------------------------------------
 * Permite invocar cálculos de afinidad de manera dinámica,
 * enviando en el body { project, memberId, force }.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project, memberId, force } = body;

    if (!project || !memberId) {
      return NextResponse.json({ ok: false, error: "Faltan parámetros (project, memberId)" }, { status: 400 });
    }

    // Redirigir dinámicamente a la subruta correspondiente
    const target = `${process.env.BASE_URL || ""}/api/affinity/${project}?memberId=${memberId}${
      force ? "&force=1" : ""
    }`;

    return NextResponse.json({
      ok: true,
      redirect_to: target,
      note: "Usa este endpoint para invocar cálculos por proyecto vía POST.",
    });
  } catch (e: any) {
    console.error("Affinity gateway POST error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Error" }, { status: 500 });
  }
}