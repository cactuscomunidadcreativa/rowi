/**
 * ECO como PUENTE sobre la brecha — capa relacional que envuelve a compose.
 *
 * Cuando ECO se invoca para una DÍADA (RelationshipDyad), añade tres cosas que
 * el compose base no tiene:
 *   1. el NIVEL de ECO (general / profile / sei) según el estado de la díada,
 *   2. la BRECHA de sintonía como instrucción de puente para el prompt,
 *   3. MEMORIA por persona (EcoThread/EcoMessage) — recurrencia estructural.
 *
 * Privacidad dura: el contenido de los mensajes NUNCA se contribuye al Rowiverse.
 */
import { prisma } from "@/core/prisma";
import { affinityAsGap } from "@/domains/affinity/lib/asGap";
import { applyEcoOutcomeToAffinity } from "@/ai/learning/affinityLearning";

export type EcoLevel = "general" | "profile" | "sei";

/** Determina el nivel de ECO desde el estado de la díada. */
export function ecoLevelForDyad(d: { otherJoined: boolean; otherSeiDone: boolean }): EcoLevel {
  if (d.otherSeiDone) return "sei";
  if (d.otherJoined) return "profile";
  return "general";
}

export interface DyadBridgeContext {
  level: EcoLevel;
  /** Frase de puente para inyectar en el prompt (ya localizada en clave i18n no — texto directo para el LLM). */
  bridgeInstruction: string;
  /** La brecha de sintonía aplicada (para auditoría en EcoMessage.gapUsed). */
  gap: ReturnType<typeof affinityAsGap>;
  otherName: string | null;
  relationType: string;
}

/** Texto de puente por nivel de sintonía (interno para el LLM, no UI). */
const BRIDGE_BY_LEVEL: Record<string, string> = {
  searching:
    "Sus estilos están bastante alejados hoy: el mensaje debe tender un primer puente, sin asumir entendimiento previo. Explica el porqué y evita dar por hecho el contexto compartido.",
  tuning:
    "Se están acercando pero aún hay diferencias de estilo: cruza la brecha nombrando lo que sí comparten y suavizando lo que podría chocar.",
  inSync:
    "Hay buena sintonía: el mensaje puede ser más directo, cuidando el tono para no romper la conexión existente.",
  connected:
    "Están muy conectados: aprovecha esa confianza para abordar lo difícil con franqueza y calidez.",
};

/**
 * Carga la díada y construye el contexto de puente. Devuelve null si no hay
 * dyadId o la díada no pertenece al usuario.
 */
export async function buildDyadBridge(
  dyadId: string,
  ownerUserId: string,
): Promise<DyadBridgeContext | null> {
  const dyad = await prisma.relationshipDyad.findFirst({
    where: { id: dyadId, ownerUserId },
  });
  if (!dyad) return null;

  const level = ecoLevelForDyad(dyad);
  const summary = (dyad.lastGapSummary ?? null) as { heat135?: number; heat100?: number } | null;
  const gap = summary ? affinityAsGap(summary) : null;
  const bridgeInstruction = gap
    ? BRIDGE_BY_LEVEL[gap.level]
    : "Aún no hay lectura de sintonía con esta persona: escribe un mensaje claro y cálido que abra la conversación.";

  return {
    level,
    bridgeInstruction,
    gap,
    otherName: dyad.otherName ?? null,
    relationType: dyad.relationType,
  };
}

/**
 * Persiste el turno en la memoria del hilo ECO de la díada (input + bridge).
 * Crea el thread si no existe. No crítico: el caller envuelve en try/catch.
 */
export async function recordEcoTurn(args: {
  dyadId: string;
  ownerUserId: string;
  goal: string;
  channel: string;
  text: string;
  insight?: string | null;
  level: EcoLevel;
  gapUsed?: unknown;
  tokensUsed?: number;
}): Promise<void> {
  let thread = await prisma.ecoThread.findFirst({
    where: { dyadId: args.dyadId, ownerUserId: args.ownerUserId },
    orderBy: { updatedAt: "desc" },
  });
  if (!thread) {
    thread = await prisma.ecoThread.create({
      data: {
        dyadId: args.dyadId,
        ownerUserId: args.ownerUserId,
        title: args.goal.slice(0, 60),
        channel: args.channel,
        lastGoal: args.goal,
      },
    });
  }

  await prisma.ecoMessage.createMany({
    data: [
      {
        threadId: thread.id,
        role: "input",
        goal: args.goal,
        channel: args.channel,
        text: args.goal,
        ecoLevel: args.level,
      },
      {
        threadId: thread.id,
        role: "bridge",
        goal: args.goal,
        channel: args.channel,
        text: args.text,
        insight: args.insight ?? null,
        gapUsed: (args.gapUsed ?? undefined) as never,
        ecoLevel: args.level,
        tokensUsed: args.tokensUsed ?? null,
      },
    ],
  });

  await prisma.ecoThread.update({
    where: { id: thread.id },
    data: {
      lastGoal: args.goal,
      channel: args.channel,
      messageCount: { increment: 2 },
    },
  });
}

/**
 * Cierre del loop ECO → outcome. Registra que el usuario ENVIÓ un mensaje
 * compuesto (por qué canal) y, más tarde, si FUNCIONÓ. Reusa EcoMessage con
 * roles "sent"/"feedback" (sin migración de schema). El feedback alimenta el
 * foso: "qué mensaje, con qué brecha, funcionó".
 */
export async function recordEcoSent(args: {
  dyadId: string;
  ownerUserId: string;
  channel: string;
  text: string;
}): Promise<void> {
  let thread = await prisma.ecoThread.findFirst({
    where: { dyadId: args.dyadId, ownerUserId: args.ownerUserId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  // Sin hilo previo (p.ej. compose sin dyadId): crearlo en vez de descartar
  // el envío en silencio — cada "sent" perdido es una fila menos del foso.
  if (!thread) {
    thread = await prisma.ecoThread.create({
      data: {
        dyadId: args.dyadId,
        ownerUserId: args.ownerUserId,
        title: args.text.slice(0, 60) || "ECO",
        channel: args.channel,
      },
      select: { id: true },
    });
  }
  await prisma.ecoMessage.create({
    data: {
      threadId: thread.id,
      role: "sent",
      channel: args.channel,
      text: args.text.slice(0, 4000),
    },
  });
  await prisma.ecoThread.update({
    where: { id: thread.id },
    data: { messageCount: { increment: 1 } },
  });
}

export async function recordEcoFeedback(args: {
  dyadId: string;
  ownerUserId: string;
  worked: boolean;
  note?: string | null;
}): Promise<void> {
  const thread = await prisma.ecoThread.findFirst({
    where: { dyadId: args.dyadId, ownerUserId: args.ownerUserId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (!thread) return;
  await prisma.ecoMessage.create({
    data: {
      threadId: thread.id,
      role: "feedback",
      text: args.note?.slice(0, 1000) ?? (args.worked ? "worked" : "did_not_work"),
      // gapUsed guarda el resultado estructurado para el dataset del foso.
      gapUsed: { worked: args.worked } as never,
    },
  });
  await prisma.ecoThread.update({
    where: { id: thread.id },
    data: { messageCount: { increment: 1 } },
  });

  // CIERRE DEL LOOP DEL MOAT: el outcome refina la lectura de la brecha
  // (heat135) y entra al canal de aprendizaje. Sin esto, el "¿funcionó?" era
  // un dato muerto. Resiliente: no rompe el guardado del feedback.
  await applyEcoOutcomeToAffinity({
    dyadId: args.dyadId,
    ownerUserId: args.ownerUserId,
    worked: args.worked,
  });
}

/**
 * Resumen de los últimos turnos para dar continuidad ("la última vez le
 * escribiste sobre…"). Acotado para no inflar tokens.
 */
export async function recentThreadSummary(
  dyadId: string,
  ownerUserId: string,
  maxChars = 240,
): Promise<string | null> {
  const thread = await prisma.ecoThread.findFirst({
    where: { dyadId, ownerUserId },
    orderBy: { updatedAt: "desc" },
    select: { lastGoal: true, messageCount: true },
  });
  if (!thread || thread.messageCount === 0 || !thread.lastGoal) return null;
  return `Antes le escribiste sobre: "${thread.lastGoal.slice(0, maxChars)}". Mantén continuidad sin repetir.`;
}
