// src/app/api/debug/full/route.ts
/**
 * ENDPOINT DESHABILITADO POR SEGURIDAD
 * Este endpoint exponia datos completos del usuario autenticado.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "Endpoint deshabilitado por seguridad.",
      alternativa: "Usa getServerAuthUser() en tu componente server-side.",
    },
    { status: 403 }
  );
}
