/**
 * 🔗 API: Invitación relacional — el HOOK de la cadena SIA.
 * POST /api/relationships/invite
 *
 * "Invito a una persona que me importa a ver NUESTRA afinidad y mejorar el
 * vínculo." Distinta de /api/family/invite (que es a nivel tenant y exige plan
 * familiar): esta NO está gated por plan — es adquisición. Crea/resuelve una
 * RelationshipDyad y un RelationshipInvite con deep link público /r/[token].
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";
import { trackFunnel } from "@/domains/metrics/lib/funnel";
import { sendContextNotification } from "@/lib/email/sendContextNotification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RELATION_TYPES = ["partner", "child", "parent", "friend", "colleague", "boss", "other"];
const INVITE_TTL_DAYS = 30;
// Límite blando anti-abuso en free (no gated por plan, pero acotado).
const MAX_PENDING_INVITES = 25;

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userEmail = token?.email?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, rowiverseId: true, name: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    // La UI (RelationshipsTab) envía `otherName`; clientes antiguos enviaban `name`.
    const inviteeName =
      ((body.otherName ?? body.name) as string)?.trim() || null;
    const inviteeEmail = (body.email as string)?.toLowerCase().trim() || null;
    const message = (body.message as string)?.trim()?.slice(0, 1000) || null;
    const relationType = RELATION_TYPES.includes(body.relationType) ? body.relationType : "other";
    const locale = ["es", "en", "pt", "it"].includes(body.locale) ? body.locale : "es";

    if (!inviteeName && !inviteeEmail) {
      return NextResponse.json(
        { ok: false, error: "Se requiere al menos un nombre o email" },
        { status: 400 },
      );
    }
    if (inviteeEmail && inviteeEmail === userEmail) {
      return NextResponse.json({ ok: false, error: "No puedes invitarte a ti mismo" }, { status: 400 });
    }

    // Anti-abuso: límite blando de invitaciones pendientes.
    const pending = await prisma.relationshipInvite.count({
      where: { inviterUserId: user.id, status: "pending", expiresAt: { gt: new Date() } },
    });
    if (pending >= MAX_PENDING_INVITES) {
      return NextResponse.json(
        { ok: false, error: "Tienes demasiadas invitaciones pendientes" },
        { status: 429 },
      );
    }

    // Resolver/crear la díada (por email del otro, si lo hay).
    let dyad = inviteeEmail
      ? await prisma.relationshipDyad.findFirst({
          where: { ownerUserId: user.id, otherEmail: inviteeEmail },
        })
      : null;
    if (!dyad) {
      dyad = await prisma.relationshipDyad.create({
        data: {
          ownerUserId: user.id,
          ownerGlobalId: user.rowiverseId ?? null,
          otherName: inviteeName,
          otherEmail: inviteeEmail,
          relationType,
        },
      });
    }

    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    await prisma.relationshipInvite.create({
      data: {
        dyadId: dyad.id,
        inviterUserId: user.id,
        token: inviteToken,
        relationType,
        inviteeName,
        inviteeEmail,
        message,
        locale,
        expiresAt,
      },
    });

    await trackFunnel("rel_invite_sent", {
      userId: user.id,
      details: { dyadId: dyad.id, relationType },
    });

    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
    const inviteUrl = `${base}/r/${inviteToken}`;

    // Email del deep link (si hay email). Fire-and-forget: un fallo de email
    // jamás rompe la creación de la invitación — el link siempre se devuelve
    // para compartir directo (WhatsApp-first, móvil).
    let emailSent = false;
    if (inviteeEmail) {
      try {
        const result = await sendContextNotification({
          to: inviteeEmail,
          kind: "relationship.invited",
          actorName: user.name,
          detail: null,
          ctaUrl: inviteUrl,
          locale,
        });
        emailSent = !!result.ok;
      } catch {
        /* el link compartible sigue siendo el camino principal */
      }
    }

    return NextResponse.json({
      ok: true,
      dyadId: dyad.id,
      token: inviteToken,
      inviteUrl,
      emailSent,
      expiresAt,
    });
  } catch (e: any) {
    console.error("❌ POST /api/relationships/invite:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Error creando invitación" },
      { status: 500 },
    );
  }
}
