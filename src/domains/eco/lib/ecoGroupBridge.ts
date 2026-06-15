/**
 * ECO de GRUPO como puente — espejo de ecoBridge.ts para RelationshipGroup.
 *
 * Carga el grupo + perfiles de afinidad de sus miembros, calcula la brecha
 * AGREGADA por centroide (groupCentroid), y arma el contexto de puente con la
 * misma forma que la díada 1:1 (level + bridgeInstruction + gap). Persiste los
 * turnos en EcoGroupThread/EcoGroupMessage.
 *
 * Privacidad dura: el contenido de los mensajes NUNCA se contribuye al Rowiverse.
 */
import { prisma } from "@/core/prisma";
import { affinityAsGap } from "@/domains/affinity/lib/asGap";
import { groupGapSummary, type AffinityProfile } from "@/domains/affinity/lib/groupCentroid";
import type { Project, CompKey } from "@/domains/affinity/lib/affinityEngine";
import type { EcoLevel } from "./ecoBridge";

const COMP_KEYS: CompKey[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

// Mismo texto de puente por nivel que la díada (reusado conceptualmente).
const BRIDGE_BY_LEVEL: Record<string, string> = {
  searching:
    "El grupo mezcla estilos bastante distintos: el mensaje debe tender puentes para todos, sin asumir un entendimiento común. Explica el porqué y nombra lo que sí comparten.",
  tuning:
    "El grupo se está alineando pero aún hay diferencias de estilo: cruza la brecha nombrando lo común y suavizando lo que podría chocar con algunos.",
  inSync:
    "Hay buena sintonía en el grupo: el mensaje puede ser más directo, cuidando el tono para no dejar a nadie fuera.",
  connected:
    "El grupo está muy conectado: aprovecha esa confianza compartida para abordar lo difícil con franqueza y calidez.",
};

export interface GroupBridgeContext {
  level: EcoLevel;
  bridgeInstruction: string;
  gap: ReturnType<typeof affinityAsGap>;
  groupName: string | null;
  memberIds: string[];
  /** resumen agregado por centroide (para EcoGroupMessage.gapUsed). */
  gapSummary: ReturnType<typeof groupGapSummary>;
}

/** Carga el perfil de afinidad de un memberId ("user_<id>" o CommunityMember.id). */
async function loadMemberProfile(memberId: string): Promise<AffinityProfile | null> {
  const isUser = memberId.startsWith("user_");
  const realUserId = isUser ? memberId.slice("user_".length) : null;
  const snap = await prisma.eqSnapshot.findFirst({
    where: realUserId ? { userId: realUserId } : { memberId },
    orderBy: { at: "desc" },
    include: { talents: true, outcomes: true },
  });
  if (!snap) return null;
  const comp = Object.fromEntries(
    COMP_KEYS.map((k) => [k, typeof snap[k] === "number" ? snap[k] : null]),
  ) as Record<CompKey, number | null>;
  const tals: Record<string, number | null> = {};
  for (const t of snap.talents) tals[t.key] = typeof t.score === "number" ? t.score : null;
  const outs = snap.outcomes.map((o) => ({ key: o.key, score: typeof o.score === "number" ? o.score : null }));
  return { name: memberId, comp, tals, outs, brain: snap.brainStyle ?? null };
}

/** Nivel de ECO del grupo = el mínimo común (si todos hicieron SEI → sei; etc.). */
function groupLevel(profilesFound: number, total: number): EcoLevel {
  if (profilesFound === total && total > 0) return "sei";
  if (profilesFound > 0) return "profile";
  return "general";
}

/**
 * Construye el contexto de puente del grupo. Devuelve null si el grupo no
 * pertenece al usuario o tiene menos de 2 miembros con perfil.
 */
export async function buildGroupBridge(groupId: string, ownerUserId: string): Promise<GroupBridgeContext | null> {
  const group = await prisma.relationshipGroup.findFirst({
    where: { id: groupId, ownerUserId },
    include: { members: true },
  });
  if (!group) return null;

  const memberIds = group.members.map((m) => m.memberId);
  const profiles = (await Promise.all(memberIds.map(loadMemberProfile))).filter(
    (p): p is AffinityProfile => p !== null,
  );
  const gapSummary = profiles.length >= 2 ? groupGapSummary(profiles, group.context as Project) : null;
  const gap = gapSummary ? affinityAsGap(gapSummary) : null;
  const bridgeInstruction = gap
    ? BRIDGE_BY_LEVEL[gap.level]
    : "Aún no hay lectura de sintonía del grupo: escribe un mensaje claro y cálido que abra la conversación con todos.";

  return {
    level: groupLevel(profiles.length, memberIds.length),
    bridgeInstruction,
    gap,
    groupName: group.name ?? null,
    memberIds,
    gapSummary,
  };
}

/** Cachea la brecha agregada del grupo en RelationshipGroup.lastGapSummary. */
export async function refreshGroupGap(groupId: string, ownerUserId: string): Promise<void> {
  const bridge = await buildGroupBridge(groupId, ownerUserId);
  if (!bridge?.gapSummary) return;
  await prisma.relationshipGroup.update({
    where: { id: groupId },
    data: { lastGapSummary: bridge.gapSummary as never, lastGapAt: new Date() },
  });
}

/**
 * Persiste el turno en la memoria del hilo ECO del grupo (input + bridge).
 * Espejo de recordEcoTurn. No crítico: el caller envuelve en try/catch.
 */
export async function recordEcoGroupTurn(args: {
  groupId: string;
  ownerUserId: string;
  goal: string;
  channel: string;
  text: string;
  insight?: string | null;
  level: EcoLevel;
  gapUsed?: unknown;
  tokensUsed?: number;
}): Promise<void> {
  let thread = await prisma.ecoGroupThread.findFirst({
    where: { groupId: args.groupId, ownerUserId: args.ownerUserId },
    orderBy: { updatedAt: "desc" },
  });
  if (!thread) {
    thread = await prisma.ecoGroupThread.create({
      data: {
        groupId: args.groupId,
        ownerUserId: args.ownerUserId,
        title: args.goal.slice(0, 60),
        channel: args.channel,
        lastGoal: args.goal,
      },
    });
  }

  await prisma.ecoGroupMessage.createMany({
    data: [
      { groupThreadId: thread.id, role: "input", goal: args.goal, channel: args.channel, text: args.goal, ecoLevel: args.level },
      {
        groupThreadId: thread.id, role: "bridge", goal: args.goal, channel: args.channel,
        text: args.text, insight: args.insight ?? null,
        gapUsed: (args.gapUsed ?? undefined) as never, ecoLevel: args.level, tokensUsed: args.tokensUsed ?? null,
      },
    ],
  });

  await prisma.ecoGroupThread.update({
    where: { id: thread.id },
    data: { lastGoal: args.goal, channel: args.channel, messageCount: { increment: 2 } },
  });
}
