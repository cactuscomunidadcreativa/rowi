// src/app/api/account/family/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";
import { telemetry } from "@/lib/telemetry";
import { sendContextNotification } from "@/lib/email/sendContextNotification";

export const runtime = "nodejs";

const VALID_CONSENT = new Set([
  "pending",
  "accepted",
  "declined",
  "not_required",
]);

const VALID_RELATIONSHIPS = new Set([
  "partner",
  "spouse",
  "child",
  "parent",
  "sibling",
  "other",
]);

async function loadRelation(id: string) {
  return prisma.familyRelation.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      relatedUserId: true,
      relatedEmail: true,
      relatedName: true,
      relationship: true,
      consentStatus: true,
      notes: true,
      owner: { select: { id: true, name: true, email: true, image: true } },
      relatedUser: { select: { id: true, name: true, email: true, image: true } },
    },
  });
}

/**
 * PATCH /api/account/family/[id]
 *
 * Two roles can edit:
 * - Owner: can change relatedName, notes, relationship — but NOT consent.
 * - Related user: can ONLY change consentStatus (accept/decline).
 *
 * This keeps the consent flow honest — the owner can't auto-accept on
 * the other person's behalf.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  const relation = await loadRelation(id);
  if (!relation) {
    return NextResponse.json(
      { ok: false, error: "Relación no encontrada" },
      { status: 404 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body JSON inválido" },
      { status: 400 },
    );
  }

  const isOwner = relation.ownerId === auth.id;
  const isRelated = relation.relatedUserId === auth.id;

  if (!isOwner && !isRelated) {
    return NextResponse.json(
      { ok: false, error: "No tienes acceso a esta relación" },
      { status: 403 },
    );
  }

  const data: Record<string, unknown> = {};

  if (isOwner) {
    if (typeof body.relatedName === "string") {
      data.relatedName = body.relatedName.trim() || null;
    }
    if (typeof body.notes === "string") {
      data.notes = body.notes.trim() || null;
    }
    if (typeof body.relationship === "string") {
      if (!VALID_RELATIONSHIPS.has(body.relationship)) {
        return NextResponse.json(
          { ok: false, error: "relationship inválido" },
          { status: 400 },
        );
      }
      data.relationship = body.relationship;
    }
  }

  if (isRelated && typeof body.consentStatus === "string") {
    if (!VALID_CONSENT.has(body.consentStatus)) {
      return NextResponse.json(
        { ok: false, error: "consentStatus inválido" },
        { status: 400 },
      );
    }
    if (body.consentStatus !== "accepted" && body.consentStatus !== "declined") {
      return NextResponse.json(
        {
          ok: false,
          error: "Solo puedes aceptar o declinar (accepted | declined)",
        },
        { status: 400 },
      );
    }
    data.consentStatus = body.consentStatus;
    data.consentAt = new Date();
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "Nada que actualizar" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.familyRelation.update({
      where: { id },
      data,
      select: {
        id: true,
        relationship: true,
        relatedUserId: true,
        relatedEmail: true,
        relatedName: true,
        consentStatus: true,
        consentAt: true,
        notes: true,
        updatedAt: true,
      },
    });

    // When the related user accepts or declines, notify the owner.
    if (
      isRelated &&
      (data.consentStatus === "accepted" || data.consentStatus === "declined") &&
      relation.owner?.email
    ) {
      const ctaUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.rowiia.com"}/settings/family`;
      const ownerPrefs = await prisma.user.findUnique({
        where: { id: relation.ownerId },
        select: { preferredLang: true, language: true },
      });
      sendContextNotification({
        to: relation.owner.email,
        kind:
          data.consentStatus === "accepted"
            ? "family.accepted"
            : "family.declined",
        actorName: auth.name,
        detail: updated.relationship,
        ctaUrl,
        locale: ownerPrefs?.preferredLang || ownerPrefs?.language || "es",
      }).catch((e) => {
        telemetry.captureException(e, { route: "/api/account/family/[id]", op: "notify_family_consent", fatal: false });
      });
    }

    return NextResponse.json({ ok: true, relation: updated });
  } catch (err: any) {
    telemetry.captureException(err, { route: "/api/account/family/[id]", op: "PATCH" });
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/account/family/[id]
 *
 * Only the owner can delete the relation. The related user, if they
 * don't want it, should set consentStatus to "declined" instead.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  const { id } = await ctx.params;
  const relation = await loadRelation(id);
  if (!relation) {
    return NextResponse.json(
      { ok: false, error: "Relación no encontrada" },
      { status: 404 },
    );
  }

  if (relation.ownerId !== auth.id) {
    return NextResponse.json(
      { ok: false, error: "Solo el dueño de la relación puede eliminarla" },
      { status: 403 },
    );
  }

  await prisma.familyRelation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
