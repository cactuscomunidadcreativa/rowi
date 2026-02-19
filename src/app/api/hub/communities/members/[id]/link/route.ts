import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";

/**
 * 🔗 Link Account API
 * Vincula un miembro de comunidad con un usuario global
 * y COPIA TODOS los datos (EQ, talentos, competencias, outcomes, etc.) al perfil del usuario
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await req.json().catch(() => ({}));
    const providedUserId = body.userId as string | undefined;

    const member = await prisma.rowiCommunityUser.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!member)
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });

    let targetUserId: string | null = null;

    // 🔹 Si se envía un userId manualmente, lo usamos directo
    if (providedUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: providedUserId } });
      if (!userExists)
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      targetUserId = providedUserId;
    } else {
      // 🔹 Si no se envía userId, usar vinculación automática por email
      let email = member.user?.email || member.email || null;
      if (!email) {
        const snapshot = await prisma.eqSnapshot.findFirst({
          where: { memberId: id },
          select: { email: true },
        });
        email = snapshot?.email || null;
      }

      if (!email)
        return NextResponse.json({ error: "No se encontró email para vincular." }, { status: 400 });

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user)
        return NextResponse.json({ error: "Usuario global no encontrado." }, { status: 404 });
      targetUserId = user.id;
    }

    // 🔹 Actualizar el miembro con el userId
    const updated = await prisma.rowiCommunityUser.update({
      where: { id },
      data: { userId: targetUserId },
      include: { user: true, community: true },
    });

    // ═══════════════════════════════════════════════════════════════════
    // 🔄 COPIAR TODOS LOS DATOS DEL MIEMBRO AL USUARIO
    // ═══════════════════════════════════════════════════════════════════

    const copyResults = {
      eqSnapshots: 0,
      eqProgress: 0,
      emotionalEvents: 0,
      affinitySnapshots: 0,
      contributions: 0,
      benchmarkOutcomes: 0,
    };

    // 1️⃣ EqSnapshots (evaluaciones SEI con talentos y competencias)
    const snapshotsResult = await prisma.eqSnapshot.updateMany({
      where: { memberId: id },
      data: { userId: targetUserId },
    });
    copyResults.eqSnapshots = snapshotsResult.count;

    // 2️⃣ EqProgress (progreso emocional)
    const progressResult = await prisma.eqProgress.updateMany({
      where: { memberId: id },
      data: { userId: targetUserId },
    });
    copyResults.eqProgress = progressResult.count;

    // 3️⃣ EmotionalEvents (eventos emocionales)
    const eventsResult = await prisma.emotionalEvent.updateMany({
      where: { memberId: id },
      data: { userId: targetUserId },
    });
    copyResults.emotionalEvents = eventsResult.count;

    // 4️⃣ AffinitySnapshots (afinidad - como miembro)
    const affinityResult = await prisma.affinitySnapshot.updateMany({
      where: { memberId: id },
      data: { userId: targetUserId },
    });
    copyResults.affinitySnapshots = affinityResult.count;

    // 5️⃣ RowiVerseContributions (contribuciones al rowiverse)
    const contributionsResult = await prisma.rowiVerseContribution.updateMany({
      where: { memberId: id },
      data: { userId: targetUserId },
    });
    copyResults.contributions = contributionsResult.count;

    // 6️⃣ BenchmarkOutcomes — modelo BenchmarkOutcome ya no existe
    // BenchmarkOutcomePattern no tiene memberId/userId directo.
    // Se deja en 0 por compatibilidad hasta migrar el modelo.
    copyResults.benchmarkOutcomes = 0;

    // ═══════════════════════════════════════════════════════════════════
    // 🔄 Actualizar el perfil del usuario con datos del último snapshot
    // ═══════════════════════════════════════════════════════════════════

    if (copyResults.eqSnapshots > 0) {
      const latestSnapshot = await prisma.eqSnapshot.findFirst({
        where: { userId: targetUserId },
        orderBy: { at: "desc" },
      });

      if (latestSnapshot) {
        await prisma.user.update({
          where: { id: targetUserId! },
          data: {
            seiCompletedAt: latestSnapshot.at,
            seiRequested: true,
            // Actualizar datos demográficos si están vacíos en el usuario
            ...(latestSnapshot.country && { country: latestSnapshot.country }),
          },
        });
      }
    }

    const totalCopied = Object.values(copyResults).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      ok: true,
      message: targetUserId === providedUserId
        ? "Vinculación manual completada."
        : "Vinculación automática completada.",
      member: updated,
      dataCopied: copyResults,
      totalRecordsCopied: totalCopied,
    });
  } catch (err: any) {
    console.error("❌ Error al vincular miembro:", err);
    return NextResponse.json({ error: "Error al vincular miembro" }, { status: 500 });
  }
}
