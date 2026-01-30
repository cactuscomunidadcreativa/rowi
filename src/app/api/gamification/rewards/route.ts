// src/app/api/gamification/rewards/route.ts
// ============================================================
// API de rewards/recompensas
// GET: Listar rewards disponibles
// POST: Reclamar un reward
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

// GET: Listar rewards disponibles
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Obtener puntos actuales del usuario
    const userLevel = await prisma.userLevel.findUnique({
      where: { userId: user.id },
      select: { totalPoints: true },
    });

    const currentPoints = userLevel?.totalPoints || 0;

    // Obtener todos los rewards activos
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { cost: "asc" },
    });

    // Obtener rewards ya reclamados por el usuario
    const claimedRewards = await prisma.userReward.findMany({
      where: { userId: user.id },
      select: { rewardId: true, status: true },
    });

    const claimedMap = new Map(claimedRewards.map((cr) => [cr.rewardId, cr.status]));

    // Agregar info de disponibilidad a cada reward
    const rewardsWithAvailability = rewards.map((reward) => {
      const claimCount = claimedRewards.filter((cr) => cr.rewardId === reward.id).length;
      const canClaim = currentPoints >= reward.cost &&
        claimCount < reward.maxPerUser &&
        (reward.stock === null || reward.stock > 0) &&
        (!reward.expiresAt || new Date(reward.expiresAt) > new Date());

      return {
        id: reward.id,
        slug: reward.slug,
        name: reward.name,
        nameEN: reward.nameEN,
        description: reward.description,
        descriptionEN: reward.descriptionEN,
        icon: reward.icon,
        image: reward.image,
        color: reward.color,
        cost: reward.cost,
        type: reward.type,
        stock: reward.stock,
        maxPerUser: reward.maxPerUser,
        expiresAt: reward.expiresAt,
        isFeatured: reward.isFeatured,
        // Disponibilidad
        canClaim,
        claimCount,
        status: claimedMap.get(reward.id) || null,
        affordability: currentPoints >= reward.cost ? "affordable" : "not_enough_points",
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        currentPoints,
        rewards: rewardsWithAvailability,
        categories: [...new Set(rewards.map((r) => r.type))],
      },
    });
  } catch (e: any) {
    console.error("Error in gamification/rewards GET:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

// POST: Reclamar un reward
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const email = token?.email?.toString().toLowerCase() || null;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rewardId, rewardSlug } = body;

    if (!rewardId && !rewardSlug) {
      return NextResponse.json({ ok: false, error: "rewardId or rewardSlug required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Obtener el reward
    const reward = await prisma.reward.findFirst({
      where: rewardId ? { id: rewardId } : { slug: rewardSlug },
    });

    if (!reward) {
      return NextResponse.json({ ok: false, error: "Reward not found" }, { status: 404 });
    }

    if (!reward.isActive) {
      return NextResponse.json({ ok: false, error: "Reward is not active" }, { status: 400 });
    }

    // Verificar expiración
    if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
      return NextResponse.json({ ok: false, error: "Reward has expired" }, { status: 400 });
    }

    // Verificar stock
    if (reward.stock !== null && reward.stock <= 0) {
      return NextResponse.json({ ok: false, error: "Reward out of stock" }, { status: 400 });
    }

    // Obtener nivel/puntos del usuario
    const userLevel = await prisma.userLevel.findUnique({
      where: { userId: user.id },
    });

    if (!userLevel || userLevel.totalPoints < reward.cost) {
      return NextResponse.json({
        ok: false,
        error: "Not enough points",
        currentPoints: userLevel?.totalPoints || 0,
        required: reward.cost,
      }, { status: 400 });
    }

    // Verificar límite por usuario
    const existingClaims = await prisma.userReward.count({
      where: { userId: user.id, rewardId: reward.id },
    });

    if (existingClaims >= reward.maxPerUser) {
      return NextResponse.json({
        ok: false,
        error: "Maximum claims reached for this reward",
        maxPerUser: reward.maxPerUser,
      }, { status: 400 });
    }

    // Realizar la transacción
    const [newClaim, updatedLevel, pointsRecord] = await prisma.$transaction([
      // Crear el claim
      prisma.userReward.create({
        data: {
          userId: user.id,
          rewardId: reward.id,
          status: "CLAIMED",
          metadata: { claimedPoints: reward.cost },
        },
      }),
      // Descontar puntos del usuario (mantenemos totalPoints pero registramos el gasto)
      prisma.userLevel.update({
        where: { userId: user.id },
        data: {
          // No descontamos puntos del total, solo registramos
          // totalPoints: { decrement: reward.cost },
        },
      }),
      // Registrar la transacción de puntos
      prisma.userPoints.create({
        data: {
          userId: user.id,
          amount: -reward.cost,
          balance: userLevel.totalPoints, // Balance actual (sin descontar)
          reason: "ADMIN_DEDUCT",
          reasonId: reward.id,
          description: `Canjeado: ${reward.name}`,
        },
      }),
    ]);

    // Actualizar stock si aplica
    if (reward.stock !== null) {
      await prisma.reward.update({
        where: { id: reward.id },
        data: { stock: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        claim: {
          id: newClaim.id,
          status: newClaim.status,
          claimedAt: newClaim.claimedAt,
        },
        reward: {
          id: reward.id,
          slug: reward.slug,
          name: reward.name,
          type: reward.type,
        },
        pointsSpent: reward.cost,
        // remainingPoints: userLevel.totalPoints - reward.cost,
      },
    });
  } catch (e: any) {
    console.error("Error in gamification/rewards POST:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
