// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { deriveAccountType, ACCOUNT_TYPE_META } from "@/lib/account/accountType";

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

    // Pull workspace roles to derive the account-type tier.
    const workspaceMemberships = await prisma.rowiCommunityUser.findMany({
      where: { userId: auth.id },
      select: { role: true },
    });

    const accountType = deriveAccountType({
      isSuperAdmin: auth.isSuperAdmin,
      permissions: auth.permissions || [],
      workspaceRoles: workspaceMemberships.map((m) => m.role),
    });

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

        // 🏷️ Account tier (single source of truth for UI badges + routing)
        accountType,
        accountTypeMeta: ACCOUNT_TYPE_META[accountType],
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