import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth)
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const actor = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!actor || !["SUPERADMIN", "ADMIN"].includes(actor.organizationRole || ""))
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { email, name, tenantId, role } = body;

    if (!email)
      return NextResponse.json({ ok: false, error: "Falta el correo electrónico" });

    const normalizedEmail = email.toLowerCase();

    // 🔒 Determinar tenant destino
    const targetTenantId =
      actor.organizationRole === "SUPERADMIN"
        ? tenantId || actor.primaryTenantId
        : actor.primaryTenantId;

    if (!targetTenantId)
      return NextResponse.json({
        ok: false,
        error: "No se puede determinar el tenant de destino",
      });

    // 👤 Buscar usuario existente o crear nuevo
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || null,
          primaryTenantId: targetTenantId,
          organizationRole:
            role === "ADMIN" && actor.organizationRole === "SUPERADMIN" ? "ADMIN" : "USER",
          active: false,
        },
      });
    }

    // 🧩 Crear token de invitación (válido 48h)
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await prisma.inviteToken.upsert({
      where: { userId: user.id },
      update: {
        token,
        expiresAt,
        createdAt: new Date(),
        tenantId: targetTenantId,
        email: normalizedEmail,
      },
      create: {
        userId: user.id,
        token,
        expiresAt,
        tenantId: targetTenantId,
        email: normalizedEmail,
        role: role || "USER",
      },
    });

    // 💌 Enviar correo con invitación
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          name,
          token,
          tenantName:
            actor.organizationRole === "SUPERADMIN"
              ? "Rowi Master"
              : actor.name || "Tu equipo",
        }),
      });
    } catch (err: any) {
      console.warn("⚠️ No se pudo enviar el correo de invitación:", err);
    }

    // 🧾 Registrar actividad
    await prisma.activityLog.create({
      data: {
        userId: actor.id,
        action: "INVITE_USER",
        targetId: user.id,
        entity: "User",
        details: {
          email: normalizedEmail,
          tenantId: targetTenantId,
          invitedBy: actor.email,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Invitación generada y enviada a ${normalizedEmail}`,
      invite: {
        email: normalizedEmail,
        token,
        expiresAt,
        tenantId: targetTenantId,
      },
    });
  } catch (e: any) {
    console.error("❌ Error /api/admin/users/invite:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";