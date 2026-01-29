import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * 🩺 Run Doctor Script
 *
 * Este endpoint no está disponible en producción (Vercel)
 * ya que requiere ejecutar scripts locales
 */
export async function POST() {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

  if (isVercel) {
    return NextResponse.json(
      {
        ok: false,
        error: "Doctor script no disponible en producción. Usa /api/hub/system-health para verificar el estado del sistema.",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }

  // En desarrollo local, también retornamos un mensaje simplificado
  // ya que la ejecución de scripts es mejor hacerla desde terminal
  return NextResponse.json(
    {
      ok: false,
      error: "Para ejecutar el doctor, usa: npx tsx scripts/doctor.mjs desde la terminal",
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}
