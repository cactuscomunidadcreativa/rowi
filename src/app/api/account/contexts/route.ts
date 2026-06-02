// src/app/api/account/contexts/route.ts
import { NextResponse } from "next/server";
import { getAuthIdentity } from "@/core/auth";
import { getActiveContexts } from "@/lib/account/contexts";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Identidad ligera (0 queries): esta ruta sólo necesita el id.
    // Antes llamaba getServerAuthUser() — el grafo de 8 niveles — para
    // leer un único campo que el JWT ya transporta.
    const auth = await getAuthIdentity();
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "No autenticado", contexts: [] },
        { status: 401 },
      );
    }

    const contexts = await getActiveContexts(auth.id);

    return NextResponse.json({
      ok: true,
      userId: auth.id,
      contexts,
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/account/contexts:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno", contexts: [] },
      { status: 500 },
    );
  }
}
