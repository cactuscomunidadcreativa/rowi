import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import crypto from "crypto";

export const runtime = "nodejs";

/* =========================================================
   📨 GET → Listar invitaciones activas
========================================================= */
export async function GET(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId") ?? undefined;

    const invites = await prisma.inviteToken.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (e: any) {
    console.error("❌ [GET /admin/users/invite] Error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al listar invitaciones" },
      { status: 500 }
    );
  }
}

/* =========================================================
   ➕ POST → Crear invitación (token único + expiry)
========================================================= */
export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { email, tenantId, role = "VIEWER", planId, expiresInDays = 7 } = body;

    if (!email) return NextResponse.json({ error: "Falta email" }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invite = await prisma.inviteToken.create({
      data: {
        userId: actor.id,
        tenantId: tenantId || null,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    // Aquí puedes integrar envío de correo si quieres:
    // await sendInviteEmail(email, token, tenantId);

    return NextResponse.json({
      ok: true,
      message: "Invitación generada correctamente ✅",
      invite,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
    });
  } catch (e: any) {
    console.error("❌ [POST /admin/users/invite] Error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al crear invitación" },
      { status: 500 }
    );
  }
}

/* =========================================================
   🗑️ DELETE → Revocar invitación
========================================================= */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Falta ID de invitación" }, { status: 400 });

    await prisma.inviteToken.delete({ where: { id } });

    return NextResponse.json({
      ok: true,
      message: "Invitación eliminada correctamente 🗑️",
    });
  } catch (e: any) {
    console.error("❌ [DELETE /admin/users/invite] Error:", e);
    return NextResponse.json(
      { error: e?.message || "Error al eliminar invitación" },
      { status: 500 }
    );
  }
}