// src/app/api/hub/system-health/run-deep/route.ts
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

/**
 * POST — Endpoint deshabilitado por seguridad (execSync removido)
 */
export async function POST() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  return NextResponse.json(
    {
      ok: false,
      error: "Endpoint deshabilitado. Use el panel de admin.",
    },
    { status: 403 }
  );
}

export const dynamic = "force-dynamic";
