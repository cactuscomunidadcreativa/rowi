import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * 🌐 AFFINITY MODULE GATEWAY
 * ---------------------------------------------------------
 * Punto de entrada del motor modular de afinidad.
 * Si recibe ?project y ?memberId, redirige a la subruta correspondiente.
 * Si no, devuelve la lista de subrutas activas y metadatos del sistema.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const project = url.searchParams.get("project");
  const memberId = url.searchParams.get("memberId");
  const force = url.searchParams.get("force");

  // Si tenemos project y memberId, redirigimos internamente a la subruta
  if (project && memberId) {
    // Build the base URL from the request
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    const targetUrl = `${baseUrl}/api/affinity/${project}?memberId=${memberId}${force ? "&force=1" : ""}`;
    console.log("[Affinity Gateway] Proxying to:", targetUrl);

    try {
      // Forward cookies for auth
      const cookieHeader = req.headers.get("cookie") || "";
      const response = await fetch(targetUrl, {
        headers: {
          cookie: cookieHeader,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("[Affinity Gateway] Proxy error:", response.status, response.statusText);
        return NextResponse.json({ ok: false, error: `Upstream error: ${response.status}` }, { status: response.status });
      }

      const data = await response.json();
      console.log("[Affinity Gateway] Upstream response ok:", data.ok);

      // Wrap in items array for compatibility with affinity page
      if (data.ok && !data.items) {
        return NextResponse.json({
          ok: true,
          items: [
            {
              memberId: data.memberId,
              member: data.member,
              heat135: data.heat135 ?? (data.heat ? Math.round((data.heat * 135) / 100) : null),
              heat: data.heat,
              heat100: data.heat,
              affinity_level: data.affinity_level,
              band: data.band,
              ai_summary: data.ai_summary,
              parts: data.parts,
              brainStyles: data.brainStyles,
              sharedTalents: data.sharedTalents,
              complementaryTalents: data.complementaryTalents,
              strongCompetencies: data.strongCompetencies,
              closeness: data.closeness,
              connectionType: data.connectionType,
            },
          ],
        });
      }

      return NextResponse.json(data);
    } catch (e: any) {
      console.error("[Affinity Gateway] Proxy error:", e);
      return NextResponse.json({ ok: false, error: e.message || "Gateway proxy error" }, { status: 500 });
    }
  }

  // Sin parámetros, devolver info del módulo
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