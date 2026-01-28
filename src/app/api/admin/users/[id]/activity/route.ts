import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/**
 * 🧠 GET → Logs de actividad del usuario
 * ---------------------------------------------------------
 * Devuelve los registros del modelo ActivityLog
 * accesibles para ADMIN o SUPERADMIN.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 👉 CORRECCIÓN: await context.params
  const { params } = await context;
  const userId = params.id;

  const auth = await getServerAuthUser();
  if (!auth)
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const actor = await prisma.user.findUnique({ where: { id: auth.id } });
  if (!actor || !["SUPERADMIN", "ADMIN"].includes(actor.organizationRole || ""))
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ ok: true, logs });
  } catch (e: any) {
    console.error("❌ Error GET /users/[id]/activity:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}