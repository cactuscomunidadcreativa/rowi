/**
 * 🧠 API: Get/Update Single Member EQ Data
 * GET /api/admin/eq/member?userId=xxx - Get member's latest EQ snapshot
 * POST /api/admin/eq/member - Create/update EQ snapshot for member
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/core/prisma";
import { syncSeiLevel, createInitialAvatar } from "@/services/avatar-evolution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toInt = (v: any): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * GET - Obtener EQ snapshot más reciente del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId_required" }, { status: 400 });
    }

    // Obtener usuario con su último EQ snapshot
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        eqSnapshots: {
          orderBy: { at: "desc" },
          take: 1,
          select: {
            id: true,
            at: true,
            dataset: true,
            K: true,
            C: true,
            G: true,
            EL: true,
            RP: true,
            ACT: true,
            NE: true,
            IM: true,
            OP: true,
            EMP: true,
            NG: true,
            brainStyle: true,
            country: true,
            overall4: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      snapshot: user.eqSnapshots[0] || null,
    });
  } catch (error) {
    console.error("❌ Error GET /api/admin/eq/member:", error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}

/**
 * POST - Crear o actualizar EQ snapshot para un usuario
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, K, C, G, EL, RP, ACT, NE, IM, OP, EMP, NG, brainStyle, country } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId_required" }, { status: 400 });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Buscar o crear CommunityMember
    let member = await prisma.communityMember.findFirst({
      where: { email: user.email! },
    });

    if (!member) {
      member = await prisma.communityMember.create({
        data: {
          email: user.email!,
          name: user.name || user.email!,
          userId: user.id,
          role: "member",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });
    }

    // Crear nuevo EQ Snapshot
    const snapshot = await prisma.eqSnapshot.create({
      data: {
        userId: user.id,
        memberId: member.id,
        dataset: "SEI_MANUAL",
        email: user.email,
        country: country || null,
        at: new Date(),
        K: toInt(K),
        C: toInt(C),
        G: toInt(G),
        EL: toInt(EL),
        RP: toInt(RP),
        ACT: toInt(ACT),
        NE: toInt(NE),
        IM: toInt(IM),
        OP: toInt(OP),
        EMP: toInt(EMP),
        NG: toInt(NG),
        brainStyle: brainStyle || null,
      },
    });

    // Sincronizar avatar
    try {
      await createInitialAvatar(user.id, brainStyle);
      await syncSeiLevel(user.id);
    } catch (avatarError) {
      console.warn(`⚠️ Error syncing avatar for ${user.email}:`, avatarError);
    }

    return NextResponse.json({
      ok: true,
      message: "EQ snapshot creado correctamente",
      snapshot: {
        id: snapshot.id,
        at: snapshot.at,
        K: snapshot.K,
        C: snapshot.C,
        G: snapshot.G,
      },
    });
  } catch (error) {
    console.error("❌ Error POST /api/admin/eq/member:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
