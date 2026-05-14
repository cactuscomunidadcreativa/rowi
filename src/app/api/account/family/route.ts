// src/app/api/account/family/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";
import { prisma } from "@/core/prisma";

export const runtime = "nodejs";

const VALID_RELATIONSHIPS = new Set([
  "partner",
  "spouse",
  "child",
  "parent",
  "sibling",
  "other",
]);

/**
 * GET /api/account/family
 *
 * Returns both sides: relations the user OWNS (they declared the link)
 * and relations where they ARE the related person and have accepted.
 * Pending inbound relations are kept separate so the UI can offer
 * accept/decline buttons.
 */
export async function GET() {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
    );
  }

  const [owned, inbound] = await Promise.all([
    prisma.familyRelation.findMany({
      where: { ownerId: auth.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        relationship: true,
        relatedUserId: true,
        relatedEmail: true,
        relatedName: true,
        consentStatus: true,
        consentAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        relatedUser: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    }),
    prisma.familyRelation.findMany({
      where: { relatedUserId: auth.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        relationship: true,
        consentStatus: true,
        consentAt: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    }),
  ]);

  return NextResponse.json({ ok: true, owned, inbound });
}

/**
 * POST /api/account/family
 * Body: { relationship, relatedEmail?, relatedUserId?, relatedName?, notes? }
 *
 * Creates a relation owned by the current user. If relatedEmail matches
 * an existing user, we auto-link by id and start consent flow as
 * "pending" (the other user must accept). If there's no matching user,
 * we still store the email so signup can auto-link later.
 */
export async function POST(req: NextRequest) {
  const auth = await getServerAuthUser();
  if (!auth) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401 },
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

  const relationship = (body.relationship || "").trim();
  if (!VALID_RELATIONSHIPS.has(relationship)) {
    return NextResponse.json(
      {
        ok: false,
        error: "relationship inválido (partner|spouse|child|parent|sibling|other)",
      },
      { status: 400 },
    );
  }

  const relatedName = (body.relatedName || "").trim() || null;
  const notes = (body.notes || "").trim() || null;
  let relatedEmail = (body.relatedEmail || "").trim().toLowerCase() || null;
  let relatedUserId: string | null = body.relatedUserId || null;

  // At least one identifier required (or just a name for kids without contact).
  if (!relatedUserId && !relatedEmail && !relatedName) {
    return NextResponse.json(
      {
        ok: false,
        error: "Se requiere al menos relatedUserId, relatedEmail o relatedName",
      },
      { status: 400 },
    );
  }

  // Resolve email → user, if possible.
  if (relatedEmail && !relatedUserId) {
    const match = await prisma.user.findUnique({
      where: { email: relatedEmail },
      select: { id: true },
    });
    if (match) relatedUserId = match.id;
  }

  if (relatedUserId === auth.id) {
    return NextResponse.json(
      { ok: false, error: "No puedes vincularte contigo mismo" },
      { status: 400 },
    );
  }

  // Application-level dedup when the DB unique index can't help us.
  // Postgres treats NULLs as distinct, so @@unique([ownerId, relatedUserId])
  // doesn't catch (owner, null) duplicates. We dedup by email when the
  // related person has no account yet — declaring "wife@x.com" twice
  // should 409, not silently create two rows.
  if (relatedEmail && !relatedUserId) {
    const existing = await prisma.familyRelation.findFirst({
      where: { ownerId: auth.id, relatedEmail },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Ya existe una relación con ese email" },
        { status: 409 },
      );
    }
  }

  // If the related person has no account or no email, consent is N/A.
  // If they do have an account, consent starts pending.
  const consentStatus = relatedUserId ? "pending" : "not_required";

  try {
    const created = await prisma.familyRelation.create({
      data: {
        ownerId: auth.id,
        relatedUserId,
        relatedEmail,
        relatedName,
        relationship,
        consentStatus,
        notes,
      },
      select: {
        id: true,
        relationship: true,
        relatedUserId: true,
        relatedEmail: true,
        relatedName: true,
        consentStatus: true,
        notes: true,
        createdAt: true,
        relatedUser: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({ ok: true, relation: created });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Ya existe una relación con esta persona" },
        { status: 409 },
      );
    }
    console.error("❌ Error POST /api/account/family:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Error interno" },
      { status: 500 },
    );
  }
}
