// src/core/startup/ensureBaseAgents.ts
import { prisma } from "../prisma";
import fs from "fs";
import path from "path";

export async function ensureBaseAgents() {
  console.log("🚀 ensureBaseAgents: inicio\n");

  // 👉 DETECTA ROOT REAL DEL PROYECTO (el que tú tienes)
  const root = path.resolve(process.cwd());
  const agentsDir = path.join(root, "src/ai/agents");
  const promptsDir = path.join(root, "src/ai/prompts/modules");

  console.log("📌 Root:", root);
  console.log("📌 Agents dir:", agentsDir);
  console.log("📌 Prompts dir:", promptsDir);

  if (!fs.existsSync(agentsDir)) {
    console.error("❌ No existe carpeta de agentes:", agentsDir);
    return;
  }

  // Buscar recursivamente
  const walk = (dir: string): string[] => {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) out.push(...walk(full));
      else if (/\.(ts|txt|md)$/i.test(f) && !f.startsWith("_")) out.push(full);
    }
    return out;
  };

  const agentFiles = walk(agentsDir);
  const promptFiles = walk(promptsDir);

  console.log(`📁 Agentes detectados: ${agentFiles.length}`);
  console.log(`💬 Prompts detectados: ${promptFiles.length}`);

  for (const file of agentFiles) {
    const slug = path.basename(file, path.extname(file));
    const content = fs.readFileSync(file, "utf8");

    const name = `Rowi ${slug}`;
    const type = slug.toUpperCase();
    const model = "gpt-4o-mini";
    const description = `Agente ${slug}`;

    let prompt = "";
    const promptFile = promptFiles.find(
      (p) => path.basename(p, path.extname(p)).toLowerCase() === slug
    );
    if (promptFile) {
      prompt = fs.readFileSync(promptFile, "utf8").trim();
    }

    const existing = await prisma.agentConfig.findFirst({
      where: {
        slug,
        tenantId: null,
        hubId: null,
        superHubId: null,
        organizationId: null,
      },
    });

    if (!existing) {
      await prisma.agentConfig.create({
        data: {
          slug,
          name,
          description,
          type,
          model,
          prompt,
          visibility: "public",
          isActive: true,
        },
      });
      console.log("🟢 Creado:", slug);
    } else {
      console.log("⚙️ Ya existe:", slug);
    }
  }

  console.log("✅ ensureBaseAgents completado\n");
}