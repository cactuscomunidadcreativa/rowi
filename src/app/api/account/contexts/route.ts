// src/app/api/account/contexts/route.ts
import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { getActiveContexts } from "@/lib/account/contexts";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await getServerAuthUser();
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
