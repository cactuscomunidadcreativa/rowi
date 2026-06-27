/**
 * Upsert del agente "practice" (AI Practice Partner · Track B).
 *
 * Asegura un AgentConfig GLOBAL slug="practice" con provider+model por defecto
 * (Anthropic Claude Sonnet) — el motor del roleplay. Es PLUGGABLE: cambiar el
 * provider/model aquí (o vía env PRACTICE_MODEL) reenchufa cualquier IA sin
 * tocar código. El AgentConfig también da el gancho para cultura/conocimiento
 * (buildAgentPromptContext) igual que Rowi Sales / Rowi ECO.
 *
 * Idempotente: actualiza si existe, crea si no.
 *
 * Ejecutar: `tsx scripts/upsert-practice-agent.ts`
 */

import { PrismaClient } from "@prisma/client";
import { PRACTICE_AGENT_PROMPT } from "../src/lib/agents/prompts";

const prisma = new PrismaClient();

const PRACTICE = {
  name: "Rowi Practice Partner",
  description:
    "Compañero de práctica de roleplay: encarna escenarios para que la persona practique conversaciones difíciles y desarrolle competencias SEI.",
  avatar: "/agents/rowi-practice.png",
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  tone: "encouraging",
  prompt: PRACTICE_AGENT_PROMPT,
};

async function main() {
  const existing = await prisma.agentConfig.findFirst({
    where: { slug: "practice", tenantId: null, hubId: null, organizationId: null, superHubId: null },
    select: { id: true },
  });

  if (existing) {
    await prisma.agentConfig.update({
      where: { id: existing.id },
      data: {
        name: PRACTICE.name,
        description: PRACTICE.description,
        provider: PRACTICE.provider,
        model: PRACTICE.model,
        tone: PRACTICE.tone,
        prompt: PRACTICE.prompt,
        isActive: true,
      },
    });
    console.log("[upsert-practice-agent] updated global practice agent");
    return;
  }

  await prisma.agentConfig.create({
    data: {
      slug: "practice",
      name: PRACTICE.name,
      type: "PRACTICE_PARTNER",
      description: PRACTICE.description,
      avatar: PRACTICE.avatar,
      provider: PRACTICE.provider,
      model: PRACTICE.model,
      tone: PRACTICE.tone,
      prompt: PRACTICE.prompt,
      accessLevel: "public",
      visibility: "public",
      isActive: true,
    },
  });
  console.log("[upsert-practice-agent] created global practice agent");
}

main()
  .catch((e) => {
    console.error("[upsert-practice-agent] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
