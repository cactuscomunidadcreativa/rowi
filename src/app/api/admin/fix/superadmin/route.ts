// src/app/api/admin/fix/superadmin/route.ts
/**
 * ENDPOINT DESHABILITADO POR SEGURIDAD
 *
 * Este endpoint permitia a CUALQUIERA otorgarse permisos de SuperAdmin
 * sin autenticacion. Ha sido deshabilitado permanentemente.
 *
 * Para restaurar superadmin usa:
 *   npx ts-node scripts/restore-superadmin.ts
 * (requiere acceso al servidor/terminal)
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Endpoint deshabilitado por seguridad.",
      alternativa:
        "Usa el script CLI: npx ts-node scripts/restore-superadmin.ts (requiere acceso al servidor).",
    },
    { status: 403 }
  );
}
