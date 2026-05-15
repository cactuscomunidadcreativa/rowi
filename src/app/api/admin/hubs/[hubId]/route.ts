// src/app/api/admin/hubs/[hubId]/route.ts
import { NextResponse } from "next/server";
import { requireAdminWithScope } from "@/core/auth/requireAdmin";
import { scopeCanAdminHub } from "@/core/admin/hubScope";

/**
 * =========================================================
 * 🧩 ADMIN / HUBS / [hubId]
 * ---------------------------------------------------------
 * Endpoint base de un Hub específico — scope-aware.
 * =========================================================
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ hubId: string }> },
) {
  const auth = await requireAdminWithScope();
  if (auth.error) return auth.error;

  const { hubId } = await ctx.params;
  if (!(await scopeCanAdminHub(auth.scope, hubId))) {
    return NextResponse.json(
      { ok: false, error: "Hub fuera de tu scope" },
      { status: 403 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      hubId,
      module: "admin.hubs",
      description:
        "Recurso dinámico para un Hub específico dentro del sistema administrativo.",
      endpoints: [
        { path: `/api/admin/hubs/${hubId}/roles`, method: "GET", purpose: "Listar roles dinámicos asociados al Hub" },
        { path: `/api/admin/hubs/${hubId}/roles`, method: "POST", purpose: "Crear un rol dinámico en el Hub" },
        { path: `/api/admin/hubs/${hubId}/roles/[roleId]`, method: "PUT", purpose: "Actualizar un rol específico" },
        { path: `/api/admin/hubs/${hubId}/roles/[roleId]`, method: "DELETE", purpose: "Eliminar un rol específico" },
      ],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
