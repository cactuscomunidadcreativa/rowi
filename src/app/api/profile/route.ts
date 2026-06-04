// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";
import {
  getCommunicationProfile,
  updateCommunicationProfile,
} from "@/domains/profile/lib/communicationProfile";

export const runtime = "nodejs";

/* =========================================================
   PATCH — Actualiza perfil del usuario autenticado
   ========================================================= */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      headline,
      bio,
      image,
      allowAI,
      values,
      commSelf,
      commPref,
      activates,
      drains,
      talents,
    } = body;

    // ✅ Solo actualiza los campos presentes (evita undefined)
    const data: any = {
      updatedAt: new Date(),
    };
    if (name !== undefined) data.name = name;
    if (headline !== undefined) data.headline = headline;
    if (bio !== undefined) data.bio = bio;
    if (image !== undefined) data.image = image;
    if (allowAI !== undefined) data.allowAI = allowAI;

    // NOTA: el perfil cognitivo (commSelf/commPref/...) ya NO se escribe a
    // `User.brainProfile` — ese campo no existe en el schema (la escritura legacy
    // nunca persistió). Ahora vive en la tabla estructurada CommunicationProfile
    // (más abajo). `talents` se ignora aquí hasta que se modele aparte.
    void talents;

    const updated = await prisma.user.update({
      where: { email: user.email },
      data,
    });

    // Cadena SIA: persistir las preferencias de comunicación también en la tabla
    // estructurada CommunicationProfile (marca editedAt → el usuario lo hizo suyo,
    // el seed del mini-SEI ya no lo sobrescribe). Mantiene brainProfile por compat.
    const commTouched =
      commSelf !== undefined ||
      commPref !== undefined ||
      activates !== undefined ||
      drains !== undefined ||
      values !== undefined ||
      body.channels !== undefined ||
      body.tone !== undefined;
    if (commTouched) {
      await updateCommunicationProfile(updated.id, {
        commSelf,
        commPref,
        activates,
        drains,
        values,
        channels: body.channels,
        tone: body.tone,
      });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (err: any) {
    console.error("❌ Error PATCH /api/profile:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET — Devuelve perfil completo del usuario autenticado
   ========================================================= */
export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        bio: true,
        image: true,
        allowAI: true,
        active: true,
        organizationRole: true,
        primaryTenantId: true,
        createdAt: true,
        updatedAt: true,
        csvUploads: {
          orderBy: { createdAt: "desc" },
          take: 3, // muestra los 3 últimos CSV importados
          select: {
            id: true,
            dataset: true,
            rowCount: true,
            createdAt: true,
          },
        },
      },
    });

    // Cadena SIA: incluir el CommunicationProfile (con backfill perezoso desde
    // el legacy brainProfile). isDraft=true significa que aún es el borrador
    // prellenado por el mini-SEI y la UI debe invitar a editarlo.
    const communicationProfile = profile
      ? await getCommunicationProfile(profile.id)
      : null;

    return NextResponse.json({ ok: true, user: profile, communicationProfile });
  } catch (err: any) {
    console.error("❌ Error GET /api/profile:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}