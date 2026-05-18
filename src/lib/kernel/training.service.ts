// apps/rowi/src/lib/kernel/training.service.ts
import { prisma } from "../db";

/** Agenda un trabajo de entrenamiento con BackgroundTask */
export async function scheduleTrainingJob(params: {
  agentId: string;
  datasetId?: string;
  tenantId?: string;
  hubId?: string;
}) {
  // BackgroundTask has no tenantId/hubId columns — scope context lives
  // in the payload Json instead.
  return prisma.backgroundTask.create({
    data: {
      type: "training",
      status: "pending",
      payload: {
        agentId: params.agentId,
        datasetId: params.datasetId,
        tenantId: params.tenantId ?? null,
        hubId: params.hubId ?? null,
      },
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

  // AgentModelVersion schema: agentId / version / modelName /
  // description / metrics. Extra fields (modelRef, datasetSize,
  // changelog, deployed) don't exist — fold the info into the
  // description string and the metrics Json.
  const datasetSize = await prisma.agentTrainingSample.count({
    where: { agentId },
  });
  const model = await prisma.agentModelVersion.create({
    data: {
      agentId,
      version: nextVersion,
      modelName: `cactus-rowi-${agentId}-v${nextVersion}`,
      description: datasetId
        ? `Fine-tune con dataset ${datasetId}`
        : "Entrenamiento base",
      metrics: {
        loss: 0.12,
        accuracy: 0.83,
        datasetSize,
        deployed: false,
      },
    },
  });

  // Actualiza EmotionalAIEngine si existe: activa el modelo
  const engine = await prisma.emotionalAIEngine.findFirst({
    where: { tenantId: task.tenantId ?? undefined, hubId: task.hubId ?? undefined },
  });

  if (engine) {
    // EmotionalAIEngine doesn't track activeModelId at a column level;
    // just mark the engine as active. If we need to remember which
    // model is active, add a column in a future migration.
    await prisma.emotionalAIEngine.update({
      where: { id: engine.id },
      data: { state: "active", updatedAt: new Date() },
    });
  }

  return { ok: true, modelVersionId: model.id, version: nextVersion };
}