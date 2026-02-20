import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma"; // ✅ consistente con las demás rutas
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

/**
 * POST /api/community/members/bulk
 * ---------------------------------------------------------
 * Actualiza en lote a varios miembros.
 * Permite cambiar grupo, tipo de conexión o cercanía.
 *
 * Body:
 * {
 *   "ids": ["id1","id2","id3"],
 *   "set": {
 *     "group": "Trabajo",
 *     "connectionType": "Cliente",
 *     "closeness": "Cercano"
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 🔐 Autenticación
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toLowerCase() || null;
    if (!email)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const owner = await prisma.user.findUnique({ where: { email } });
    if (!owner)
      return NextResponse.json({ ok: false, error: "Owner not found" }, { status: 404 });

    // 📦 Leer body
    const body = await req.json().catch(() => ({}));
    const { ids, set } = body || {};

    if (!Array.isArray(ids) || ids.length === 0 || typeof set !== "object") {
      return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
    }

    // 🧱 Construir campos válidos
    const data: Record<string, any> = {};

    if (typeof set.group === "string" && set.group.trim())
      data.group = set.group.trim();

    if (
      "connectionType" in set &&
      (typeof set.connectionType === "string" || set.connectionType === null)
    )
      data.connectionType = set.connectionType ?? null;

    if (
      typeof set.closeness === "string" &&
      ["Cercano", "Neutral", "Lejano"].includes(set.closeness)
    )
      data.closeness = set.closeness;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // 🧮 Ejecutar actualización masiva
    const updated = await prisma.communityMember.updateMany({
      where: { id: { in: ids }, ownerId: owner.id },
      data,
    });

    return NextResponse.json({
      ok: true,
      count: updated.count,
      message: `✅ ${updated.count} miembros actualizados correctamente.`,
    });
  } catch (e: any) {
    console.error("❌ /api/community/members/bulk error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ✅ Configuración runtime
========================================================= */
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";