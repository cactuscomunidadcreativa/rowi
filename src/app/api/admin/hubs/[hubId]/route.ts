// src/app/api/admin/hubs/[hubId]/route.ts
import { NextResponse } from "next/server";

/**
 * =========================================================
 * 🧩 ADMIN / HUBS / [hubId]
 * ---------------------------------------------------------
 * Endpoint base de un Hub específico.
 * Devuelve metadatos y subrutas disponibles.
 * 
 * ✅ Usa ctx.params para leer el hubId dinámico
 * ✅ Incluye referencia al submódulo de roles
 * =========================================================
 */
export async function GET(
  _req: Request,
  ctx: { params: { hubId: string } }
) {
  const { hubId } = ctx.params || {};

  return NextResponse.json(
    {
      ok: true,
      hubId,
      module: "admin.hubs",
      description: "Recurso dinámico para un Hub específico dentro del sistema administrativo.",
      endpoints: [
        { path: `/api/admin/hubs/${hubId}/roles`, method: "GET", purpose: "Listar roles dinámicos asociados al Hub" },
        { path: `/api/admin/hubs/${hubId}/roles`, method: "POST", purpose: "Crear un rol dinámico en el Hub" },
        { path: `/api/admin/hubs/${hubId}/roles/[roleId]`, method: "PUT", purpose: "Actualizar un rol específico" },
        { path: `/api/admin/hubs/${hubId}/roles/[roleId]`, method: "DELETE", purpose: "Eliminar un rol específico" }
      ],
      note: "🔹 Placeholder. Conecta con Prisma si deseas devolver datos reales del Hub (nombre, descripción, etc.)"
    },
    { headers: { "cache-control": "no-store" } }
  );
}