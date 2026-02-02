// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();

    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "No autenticado", user: null },
        { status: 401 }
      );
    }

    // 🟦 Construimos el perfil completo usando getServerAuthUser()
    return NextResponse.json({
      ok: true,
      user: {
        id: auth.id,
        email: auth.email,
        name: auth.name,

        // 🔐 Permisos reales
        isSuperAdmin: auth.isSuperAdmin,
        permissions: auth.permissions,
        memberships: auth.memberships,

        // 📌 Identidad jerárquica
        primaryTenantId: auth.primaryTenantId,
        superHubs: auth.superHubs,

        // 🤖 IA y uso
        allowAI: true,
      },
    });
  } catch (err: any) {
    console.error("❌ Error GET /api/auth/me:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Error interno" },
      { status: 500 }
    );
  }
}