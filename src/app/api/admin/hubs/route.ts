// src/app/api/admin/hubs/route.ts
import { NextResponse } from "next/server";

/**
 * =========================================================
 * 🧱 ADMIN / HUBS — Índice de rutas administrativas
 * ---------------------------------------------------------
 * Este endpoint solo devuelve una descripción base del módulo.
 * Sirve como documento de referencia o prueba de conexión.
 * =========================================================
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      module: "admin.hubs",
      description: "Endpoints administrativos para gestión de Hubs.",
      endpoints: [
        { path: "/api/admin/hubs", method: "GET", purpose: "Listar todos los Hubs" },
        { path: "/api/admin/hubs", method: "POST", purpose: "Crear un nuevo Hub" },
        { path: "/api/admin/hubs/[hubId]", method: "GET", purpose: "Obtener un Hub específico" },
        { path: "/api/admin/hubs/[hubId]", method: "PUT", purpose: "Editar un Hub" },
        { path: "/api/admin/hubs/[hubId]", method: "DELETE", purpose: "Eliminar un Hub" },
        { path: "/api/admin/hubs/[hubId]/roles", method: "GET", purpose: "Listar roles dinámicos por Hub" },
        { path: "/api/admin/hubs/[hubId]/roles", method: "POST", purpose: "Crear un rol en el Hub" },
      ],
    },
    { headers: { "cache-control": "no-store" } }
  );
}