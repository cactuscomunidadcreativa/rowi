// apps/rowi/src/lib/kernel/training.service.ts
import { prisma } from "../db";

/** Agenda un trabajo de entrenamiento con BackgroundTask */
export async function scheduleTrainingJob(params: {
  agentId: string;
  datasetId?: string;
  tenantId?: string;
  hubId?: string;
}) {
  return prisma.backgroundTask.create({
    data: {
      type: "training",
      status: "pending",
      tenantId: params.tenantId ?? null,
      hubId: params.hubId ?? null,
      payload: { agentId: params.agentId, datasetId: params.datasetId },
    },
  });
}

/** Ejecuta 1 job “training” (mock) y genera un AgentModelVersion */
export async function runTrainingJobOnce(task: any) {
  const agentId = task?.payload?.agentId as string | undefined;
  const datasetId = task?.payload?.datasetId as string | undefined;
  if (!agentId) return { ok: false, reason: "agentId requerido" };

  // Simula entrenamiento
  const currentMax = await prisma.agentModelVersion.aggregate({
    where: { agentId },
    _max: { version: true },
  });
  const nextVersion = (currentMax._max.version ?? 0) + 1;

  const model = await prisma.agentModelVersion.create({
    data: {
      agentId,
      version: nextVersion,
      modelRef: `cactus-rowi-${agentId}-v${nextVersion}`,
      datasetSize: await prisma.agentTrainingSample.count({ where: { agentId } }),
      metrics: { loss: 0.12, accuracy: 0.83 }, // ejemplo
      changelog: datasetId ? `Fine-tune con dataset ${datasetId}` : "Entrenamiento base",
      deployed: false,
    },
  });

  // Actualiza EmotionalAIEngine si existe: activa el modelo
  const engine = await prisma.emotionalAIEngine.findFirst({
    where: { tenantId: task.tenantId ?? undefined, hubId: task.hubId ?? undefined },
  });

  if (engine) {
    await prisma.emotionalAIEngine.update({
      where: { id: engine.id },
      data: { activeModelId: model.id, state: "active", updatedAt: new Date() },
    });
  }

  return { ok: true, modelVersionId: model.id, version: nextVersion };
}