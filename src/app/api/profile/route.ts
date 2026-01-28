// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getServerAuthUser } from "@/core/auth";

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

    // 🧠 Guarda todo el perfil cognitivo como JSON
    const brainProfile: Record<string, any> = {};
    if (values) brainProfile.values = values;
    if (commSelf) brainProfile.commSelf = commSelf;
    if (commPref) brainProfile.commPref = commPref;
    if (activates) brainProfile.activates = activates;
    if (drains) brainProfile.drains = drains;
    if (talents) brainProfile.talents = talents;
    if (Object.keys(brainProfile).length > 0) data.brainProfile = brainProfile;

    const updated = await prisma.user.update({
      where: { email: user.email },
      data,
    });

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

    return NextResponse.json({ ok: true, user: profile });
  } catch (err: any) {
    console.error("❌ Error GET /api/profile:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}