/**
 * Upsert the Rowi Ventas (sales) + Rowi Asesor (asesor) agents into the DB.
 *
 *   pnpm dlx tsx scripts/upsert-consulting-agents.ts
 *
 * - Updates every existing `sales` AgentConfig row (name/description/prompt).
 * - Mirrors an `asesor` row for each scope where `sales` exists, copying the
 *   scope + Six Seconds culture fields so it resolves identically.
 * - Ensures a GLOBAL sales + asesor exist even on a fresh DB.
 *
 * Idempotent: safe to re-run. Prompts live in src/lib/agents/prompts.ts.
 */

import { PrismaClient } from "@prisma/client";
import { SALES_AGENT_PROMPT, ASESOR_AGENT_PROMPT } from "../src/lib/agents/prompts";

const prisma = new PrismaClient();

const SALES = {
  name: "Rowi Ventas",
  description:
    "Consultor de diseño comercial Six Seconds (EQ Proposal Accelerator): clarifica necesidades, diagnostica con el iceberg, recomienda herramientas y arma propuestas.",
  prompt: SALES_AGENT_PROMPT,
};
const ASESOR = {
  name: "Rowi Asesor",
  description:
    "Consultor senior de implementación Six Seconds: diseña, entrega y sostiene programas de inteligencia emocional con EAR y medición de impacto.",
  prompt: ASESOR_AGENT_PROMPT,
};

async function main() {
  let sales = await prisma.agentConfig.findMany({ where: { slug: "sales" } });

  // Ensure at least a GLOBAL sales row exists (fresh DB safety).
  if (sales.length === 0) {
    const created = await prisma.agentConfig.create({
      data: {
        slug: "sales",
        name: SALES.name,
        type: "SALES_EXPERT",
        description: SALES.description,
        avatar: "/agents/rowi-sales.png",
        model: "gpt-4o-mini",
        tone: "confident",
        prompt: SALES.prompt,
        accessLevel: "premium",
        visibility: "public",
        isActive: true,
        autoLearn: true,
        tools: { web_search: true, code_interpreter: false },
      },
    });
    sales = [created];
    console.log("created GLOBAL sales agent (none existed)");
  }

  // Update every sales row to the new prompt/name/description.
  for (const r of sales) {
    await prisma.agentConfig.update({
      where: { id: r.id },
      data: {
        name: SALES.name,
        description: SALES.description,
        prompt: SALES.prompt,
        isActive: true,
      },
    });
  }
  console.log(`sales updated: ${sales.length}`);

  // Mirror an asesor row for each sales scope.
  let asesorCount = 0;
  for (const r of sales) {
    const existing = await prisma.agentConfig.findFirst({
      where: {
        slug: "asesor",
        tenantId: r.tenantId,
        superHubId: r.superHubId,
        organizationId: r.organizationId,
        hubId: r.hubId,
      },
    });
    if (existing) {
      await prisma.agentConfig.update({
        where: { id: existing.id },
        data: {
          name: ASESOR.name,
          description: ASESOR.description,
          prompt: ASESOR.prompt,
          isActive: true,
        },
      });
    } else {
      await prisma.agentConfig.create({
        data: {
          slug: "asesor",
          name: ASESOR.name,
          type: "CONSULTING_EXPERT",
          description: ASESOR.description,
          avatar: r.avatar ?? "/agents/rowi-sales.png",
          model: r.model ?? "gpt-4o-mini",
          tone: "professional",
          prompt: ASESOR.prompt,
          accessLevel: r.accessLevel,
          visibility: r.visibility,
          tenantId: r.tenantId,
          superHubId: r.superHubId,
          organizationId: r.organizationId,
          hubId: r.hubId,
          systemId: r.systemId,
          isActive: true,
          autoLearn: true,
          tools: { web_search: true, code_interpreter: false },
          culturePrompt: r.culturePrompt,
          companyValues: r.companyValues,
          companyMission: r.companyMission,
          companyTone: r.companyTone,
          industryContext: r.industryContext,
        },
      });
    }
    asesorCount++;
  }
  console.log(`asesor upserted: ${asesorCount}`);
}

main()
  .then(() => console.log("✅ done"))
  .catch((e) => {
    console.error("❌ failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
