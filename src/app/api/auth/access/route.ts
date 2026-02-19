import { NextResponse } from "next/server";
import { canAccess } from "@/core/auth/hasAccess";
import { requireAuth } from "@/core/auth/requireAdmin";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { userId, level, scopeId } = await req.json();

    // Solo permitir consultar permisos propios (no de otros usuarios)
    if (userId !== auth.user.id && !auth.user.isSuperAdmin) {
      return NextResponse.json({ allowed: false, error: "Solo puedes consultar tus propios permisos" }, { status: 403 });
    }

    const ok = await canAccess(userId, level, scopeId);
    return NextResponse.json({ allowed: ok });

  } catch (err: any) {
    console.error("❌ Error en /api/auth/access:", err);
    return NextResponse.json({ allowed: false }, { status: 500 });
  }
}