// apps/rowi/src/lib/kernel/runtime.ts
import { prisma } from "../db";
import {
  scheduleTrainingJob,
  runTrainingJobOnce,
} from "./training.service";
import { emitAlert } from "./alerts.service";
import { detectPatternsForEngine } from "./patterns.service";

/**
 * Arranque del “kernel”: agenda trabajos, vigila colas y ejecuta en segundo plano.
 * Usa BackgroundTask de Prisma como cola persistente (sin libs externas).
 */
export class EmotionalKernel {
  private static isRunning = false;
  private ticker?: NodeJS.Timeout;

  static start(pollMs = 5000) {
    if (this.isRunning) return;
    this.isRunning = true;

    // Bucle: pulsa tareas “pending” → “running” → ejecuta → done/failed
    this.ticker = setInterval(async () => {
      try {
        // 1) Procesa tareas pendientes
        const task = await prisma.backgroundTask.findFirst({
          where: { status: "pending" },
          orderBy: { createdAt: "asc" },
        });

        if (task) {
          await prisma.backgroundTask.update({
            where: { id: task.id },
            data: { status: "running", startedAt: new Date() },
          });

          // Despacho simple por tipo:
          if (task.type === "training") {
            const result = await runTrainingJobOnce(task);
            await prisma.backgroundTask.update({
              where: { id: task.id },
              data: {
                status: "done",
                finishedAt: new Date(),
                result,
              },
            });
          } else if (task.type === "analysis") {
            const payload = task.payload as Record<string, any> | null;
            const result = await detectPatternsForEngine({
              engineId: payload?.engineId,
            });
            await prisma.backgroundTask.update({
              where: { id: task.id },
              data: {
                status: "done",
                finishedAt: new Date(),
                result,
              },
            });
          } else if (task.type === "alert") {
            const payload = task.payload as Record<string, any> | null;
            await emitAlert({
              tenantId: payload?.tenantId ?? undefined,
              hubId: payload?.hubId ?? undefined,
              userId: payload?.userId,
              type: payload?.type ?? "system",
              title: payload?.title ?? "Notificación",
              message: payload?.message ?? "Evento generado",
              severity: payload?.severity ?? 1,
            });
            await prisma.backgroundTask.update({
              where: { id: task.id },
              data: { status: "done", finishedAt: new Date() },
            });
          } else {
            await prisma.backgroundTask.update({
              where: { id: task.id },
              data: {
                status: "failed",
                finishedAt: new Date(),
                error: `Tipo de tarea no soportado: ${task.type}`,
              },
            });
          }
        }

        // 2) (Opcional) scheduling periódico simple:
        // Lanza 1 análisis de patrones diario (ejemplo)
        // (Marca tu propia lógica de scheduling)
      } catch (err) {
        // Evita que caiga el loop entero
        // Puedes emitir alerta si se repite
        console.error("[Kernel Loop Error]", err);
      }
    }, pollMs);
  }

  static stop() {
    if (this.ticker) clearInterval(this.ticker);
    this.isRunning = false;
  }
}

// Arráncalo en import (en entornos server-only, si no usas edge)
// Sugerencia: arranca desde un entry server o middleware server side
EmotionalKernel.start(5000);