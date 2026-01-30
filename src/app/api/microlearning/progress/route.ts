// src/app/api/microlearning/progress/route.ts
// ============================================================
// API para actualizar progreso de MicroLearning
// POST: Actualizar progreso/completar micro-acción
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { microLearningId, action, rating, notes, reflection } = body;

    if (!microLearningId) {
      return NextResponse.json({ ok: false, error: "microLearningId required" }, { status: 400 });
    }

    // Verificar que existe el microlearning
    const microLearning = await prisma.microLearning.findUnique({
      where: { id: microLearningId },
    });

    if (!microLearning) {
      return NextResponse.json({ ok: false, error: "MicroLearning not found" }, { status: 404 });
    }

    // Obtener o crear progreso
    let userProgress = await prisma.userMicroLearning.findUnique({
      where: {
        userId_microLearningId: {
          userId: user.id,
          microLearningId,
        },
      },
    });

    const now = new Date();

    if (action === "start") {
      // Iniciar micro-learning
      if (!userProgress) {
        userProgress = await prisma.userMicroLearning.create({
          data: {
            userId: user.id,
            microLearningId,
            status: "IN_PROGRESS",
            progress: 10,
            startedAt: now,
            lastAccessAt: now,
          },
        });
      } else {
        userProgress = await prisma.userMicroLearning.update({
          where: { id: userProgress.id },
          data: {
            status: "IN_PROGRESS",
            lastAccessAt: now,
          },
        });
      }
    } else if (action === "complete") {
      // Completar micro-learning
      const pointsToAward = microLearning.points;

      const result = await prisma.$transaction(async (tx) => {
        // Actualizar progreso
        const progress = await tx.userMicroLearning.upsert({
          where: {
            userId_microLearningId: {
              userId: user.id,
              microLearningId,
            },
          },
          update: {
            status: "COMPLETED",
            progress: 100,
            completedAt: now,
            lastAccessAt: now,
            pointsEarned: pointsToAward,
            rating,
            notes,
            reflection,
          },
          create: {
            userId: user.id,
            microLearningId,
            status: "COMPLETED",
            progress: 100,
            startedAt: now,
            completedAt: now,
            lastAccessAt: now,
            pointsEarned: pointsToAward,
            rating,
            notes,
            reflection,
          },
        });

        // Actualizar puntos del usuario
        let userLevel = await tx.userLevel.findUnique({
          where: { userId: user.id },
        });

        if (!userLevel) {
          userLevel = await tx.userLevel.create({
            data: {
              userId: user.id,
              level: 1,
              totalPoints: pointsToAward,
              pointsToNextLevel: 100,
            },
          });
        } else {
          userLevel = await tx.userLevel.update({
            where: { userId: user.id },
            data: {
              totalPoints: { increment: pointsToAward },
            },
          });
        }

        // Registrar transacción de puntos
        await tx.userPoints.create({
          data: {
            userId: user.id,
            amount: pointsToAward,
            balance: userLevel.totalPoints,
            reason: "MICRO_LEARNING",
            reasonId: microLearningId,
            description: `Completado: ${microLearning.title}`,
          },
        });

        // Verificar logros relacionados
        const completedCount = await tx.userMicroLearning.count({
          where: { userId: user.id, status: "COMPLETED" },
        });

        // Actualizar achievement de microlearning si existe
        const achievementSlugs = [
          { slug: "first_microlearning", threshold: 1 },
          { slug: "microlearning_10", threshold: 10 },
          { slug: "microlearning_50", threshold: 50 },
        ];

        for (const { slug, threshold } of achievementSlugs) {
          if (completedCount >= threshold) {
            const achievement = await tx.achievement.findUnique({ where: { slug } });
            if (achievement) {
              await tx.userAchievement.upsert({
                where: {
                  userId_achievementId: {
                    userId: user.id,
                    achievementId: achievement.id,
                  },
                },
                update: {
                  progress: completedCount,
                  completed: true,
                  completedAt: completedCount === threshold ? now : undefined,
                },
                create: {
                  userId: user.id,
                  achievementId: achievement.id,
                  progress: completedCount,
                  completed: completedCount >= threshold,
                  completedAt: completedCount >= threshold ? now : null,
                },
              });
            }
          }
        }

        return { progress, userLevel, pointsAwarded: pointsToAward };
      });

      return NextResponse.json({
        ok: true,
        data: {
          progress: result.progress,
          pointsAwarded: result.pointsAwarded,
          newTotalPoints: result.userLevel.totalPoints,
          newLevel: result.userLevel.level,
        },
      });
    } else if (action === "skip") {
      // Saltar micro-learning
      userProgress = await prisma.userMicroLearning.upsert({
        where: {
          userId_microLearningId: {
            userId: user.id,
            microLearningId,
          },
        },
        update: {
          status: "SKIPPED",
          lastAccessAt: now,
        },
        create: {
          userId: user.id,
          microLearningId,
          status: "SKIPPED",
          lastAccessAt: now,
        },
      });
    } else if (action === "rate" && rating) {
      // Solo actualizar rating
      userProgress = await prisma.userMicroLearning.update({
        where: {
          userId_microLearningId: {
            userId: user.id,
            microLearningId,
          },
        },
        data: { rating },
      });
    }

    return NextResponse.json({
      ok: true,
      data: { progress: userProgress },
    });
  } catch (e: any) {
    console.error("Error in microlearning/progress POST:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
