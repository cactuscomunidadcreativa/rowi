// src/app/api/hub/community/link-all/route.ts
import { prisma } from "@/core/prisma";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";

/**
 * Vincula automáticamente miembros de comunidad con usuarios globales.
 * 🔐 Job masivo que reasigna datos psicométricos (EqSnapshot, EqProgress,
 * EmotionalEvent, AffinitySnapshot) en TODA la plataforma: solo SuperAdmin.
 */
export async function POST() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;

  try {
    // 🔹 Buscar miembros sin userId
    const unlinkedMembers = await prisma.rowiCommunityUser.findMany({
      where: { userId: null },
      include: {
        rowiverseUser: true, // ⬅ email correcto
        community: { select: { name: true } },
      },
    });

    if (unlinkedMembers.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No hay miembros pendientes por vincular.",
        total: 0,
      });
    }

    let linked = 0;
    let notFound = 0;
    const details: any[] = [];

    // Lotes para no saturar la DB
    const batchSize = 10;

    for (let i = 0; i < unlinkedMembers.length; i += batchSize) {
      const batch = unlinkedMembers.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (member) => {
          try {
            // 1️⃣ Buscar email en rowiverseUser
            let email = member.rowiverseUser?.email?.toLowerCase().trim();

            // 2️⃣ Si no hay email, buscar en EQ snapshots
            if (!email) {
              const snap = await prisma.eqSnapshot.findFirst({
                where: { memberId: member.rowiverseUserId },
                select: { email: true },
              });
              if (snap?.email) {
                email = snap.email.toLowerCase().trim();
              }
            }

            // 3️⃣ Si sigue sin email → no se puede vincular
            if (!email) {
              notFound++;
              details.push({
                memberId: member.id,
                community: member.community?.name,
                status: "❌ No tiene email disponible",
              });
              return;
            }

            // 4️⃣ Buscar usuario global real
            const user = await prisma.user.findUnique({
              where: { email },
            });

            if (!user) {
              notFound++;
              details.push({
                memberId: member.id,
                email,
                community: member.community?.name,
                status: "⚠️ Usuario global no existe",
              });
              return;
            }

            // 5️⃣ Vincular miembro
            await prisma.rowiCommunityUser.update({
              where: { id: member.id },
              data: { userId: user.id },
            });

            // ═══════════════════════════════════════════════════════════════
            // 6️⃣ COPIAR TODOS LOS DATOS DEL MIEMBRO AL USUARIO
            // ═══════════════════════════════════════════════════════════════

            const copyResults = {
              eqSnapshots: 0,
              eqProgress: 0,
              emotionalEvents: 0,
              affinitySnapshots: 0,
              contributions: 0,
              benchmarkOutcomes: 0,
            };

            // EqSnapshots (evaluaciones SEI con talentos y competencias)
            const snapshotsResult = await prisma.eqSnapshot.updateMany({
              where: { memberId: member.id },
              data: { userId: user.id },
            });
            copyResults.eqSnapshots = snapshotsResult.count;

            // EqProgress (progreso emocional)
            const progressResult = await prisma.eqProgress.updateMany({
              where: { memberId: member.id },
              data: { userId: user.id },
            });
            copyResults.eqProgress = progressResult.count;

            // EmotionalEvents (eventos emocionales)
            const eventsResult = await prisma.emotionalEvent.updateMany({
              where: { memberId: member.id },
              data: { userId: user.id },
            });
            copyResults.emotionalEvents = eventsResult.count;

            // AffinitySnapshots (afinidad)
            const affinityResult = await prisma.affinitySnapshot.updateMany({
              where: { memberId: member.id },
              data: { userId: user.id },
            });
            copyResults.affinitySnapshots = affinityResult.count;

            // RowiVerseContributions
            const contributionsResult = await prisma.rowiVerseContribution.updateMany({
              where: { memberId: member.id },
              data: { userId: user.id },
            });
            copyResults.contributions = contributionsResult.count;

            // BenchmarkOutcomePatterns (antes: benchmarkOutcome — modelo unificado)
            const outcomesResult = await prisma.benchmarkOutcomePattern.updateMany({
              where: { tenantId: member.community?.name ? undefined : undefined },
              data: {},
            }).catch(() => ({ count: 0 }));
            // NOTA: BenchmarkOutcomePattern no tiene memberId/userId directo.
            // Se mantiene el counter en 0 por compatibilidad.
            copyResults.benchmarkOutcomes = 0;

            // 7️⃣ Actualizar seiCompletedAt del usuario si tiene snapshots
            if (copyResults.eqSnapshots > 0) {
              const latestSnapshot = await prisma.eqSnapshot.findFirst({
                where: { userId: user.id },
                orderBy: { at: "desc" },
              });

              if (latestSnapshot) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: {
                    seiCompletedAt: latestSnapshot.at,
                    seiRequested: true,
                    ...(latestSnapshot.country && { country: latestSnapshot.country }),
                  },
                });
              }
            }

            const totalCopied = Object.values(copyResults).reduce((a, b) => a + b, 0);

            linked++;
            details.push({
              memberId: member.id,
              email,
              userId: user.id,
              userName: user.name,
              community: member.community?.name,
              dataCopied: copyResults,
              totalRecordsCopied: totalCopied,
              status: "✅ Vinculado correctamente",
            });
          } catch (err: any) {
            console.error("⚠️ Error procesando miembro:", member.id, err);

            details.push({
              memberId: member.id,
              community: member.community?.name,
              status: "❌ Error interno",
            });
          }
        })
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Sincronización completada.",
      totalPendientes: unlinkedMembers.length,
      vinculados: linked,
      noEncontrados: notFound,
      detalles: details,
    });
  } catch (error: any) {
    console.error("❌ Error general en link-all:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Error al vincular miembros" },
      { status: 500 }
    );
  }
}