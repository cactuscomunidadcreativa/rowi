// apps/rowi/src/app/api/auth/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    scope: "auth",
    note: "Raíz del módulo de autenticación. Usa /api/auth/[...nextauth]"
  });
}