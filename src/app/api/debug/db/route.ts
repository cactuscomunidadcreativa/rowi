// src/app/api/debug/db/route.ts
/**
 * ENDPOINT DESHABILITADO POR SEGURIDAD
 * Este endpoint permitia acceso no autenticado a cualquier modelo de la BD.
 * Si necesitas debug de BD, usa Prisma Studio: npx prisma studio
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error: "Endpoint deshabilitado por seguridad.",
      alternativa: "Usa `npx prisma studio` en desarrollo local.",
    },
    { status: 403 }
  );
}
