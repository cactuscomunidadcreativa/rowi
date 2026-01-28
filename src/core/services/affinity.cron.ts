// src/lib/cron/affinity.cron.ts
import { prisma } from "@/core/prisma";
import { autoRecalcAffinity } from "@/ai/learning/affinityAutoRecalc";

/**
 * 🧠 Rowi AI — Cron automático de afinidad
 * ----------------------------------------------------
 * - Ejecuta recalculo de afinidad para todos los usuarios activos
 * - Se ejecuta cada 15 días (puede dispararse desde Vercel o cron local)
 * - Usa el modo rápido de autoRecalcAffinity()
 * - Registra un Batch global con el resultado
 */

export async function runAffinityCron() {
  const startTime = Date.now();
  console.log("🕓 Iniciando cron de afinidad...");

  try {
    // Obtener todos los usuarios con actividad reciente
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
      where: { email: { not: undefined } },
    });

    let totalUsers = 0;
    let totalRelations = 0;
    const skipped: string[] = [];

    for (const u of users) {
      try {
        // Buscar último recalculo
        const lastBatch = await prisma.batch.findFirst({
          where: { ownerId: u.id, type: "affinity" },
          orderBy: { startedAt: "desc" },
        });

        const daysSince = lastBatch
          ? (Date.now() - new Date(lastBatch.startedAt).getTime()) / (1000 * 60 * 60 * 24)
          : Infinity;

        if (daysSince < 15) {
          skipped.push(u.email ?? "unknown");
          continue;
        }

        console.log(`🔁 Recalculando afinidad para ${u.email}...`);

        const data = await autoRecalcAffinity({
          userId: u.id,
          context: "execution", // se puede extender a otros contextos
        });

        if (data?.count) {
          totalUsers++;
          totalRelations += data.count;
        }

        // Registrar batch individual
        await prisma.batch.create({
          data: {
            ownerId: u.id,
            name: `Auto Recalculo Afinidad (cron)`,
            description: `Procesadas ${data.count ?? 0} relaciones.`,
            type: "affinity",
            count: data.count ?? 0,
            status: "completado",
          },
        });
      } catch (err: any) {
        console.error(`❌ Error en usuario ${u.email}:`, err?.message);
        await prisma.batch.create({
          data: {
            ownerId: u.id,
            name: "Auto Recalculo Afinidad (cron)",
            description: `Error: ${err?.message || "desconocido"}`,
            type: "affinity",
            count: 0,
            status: "fallido",
          },
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Cron completado: ${totalUsers} usuarios, ${totalRelations} relaciones (${duration}s)`);

    // Log global del cron
    await prisma.batch.create({
      data: {
        ownerId: "system",
        name: "Cron Afinidad Global",
        description: `Usuarios procesados: ${totalUsers}, relaciones: ${totalRelations}, omitidos: ${skipped.length}`,
        type: "affinity-global",
        count: totalRelations,
        status: "completado",
      },
    });

    return {
      ok: true,
      processed: totalUsers,
      relations: totalRelations,
      skipped,
      duration: `${duration}s`,
    };
  } catch (e: any) {
    console.error("💥 Error en cron global:", e);
    await prisma.batch.create({
      data: {
        ownerId: "system",
        name: "Cron Afinidad Global (error)",
        description: e?.message || "Error desconocido",
        type: "affinity-global",
        count: 0,
        status: "fallido",
      },
    });
    return { ok: false, error: e?.message || "Error" };
  }
}