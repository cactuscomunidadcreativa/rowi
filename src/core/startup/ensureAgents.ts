import { prisma } from "../prisma";
import fs from "fs";
import path from "path";

/**
 * 🤖 Sincroniza agentes IA base globales (nivel GLOBAL puro)
 * ---------------------------------------------------------
 * • Lee agentes desde src/ai/agents/
 * • Lee prompts desde src/ai/prompts/modules/
 * • Crea o actualiza agentes globales
 * • Sin systemId (compatibilidad total con tu modelo actual)
 */
export async function ensureBaseAgents() {
  console.log("🚀 ensureBaseAgents: cargando agentes globales...");

  try {
    const agentsDir = path.resolve(process.cwd(), "src/ai/agents");
    const promptsDir = path.resolve(process.cwd(), "src/ai/prompts/modules");

    if (!fs.existsSync(agentsDir)) {
      console.warn("⚠️ No existe carpeta src/ai/agents");
      return;
    }

    function walk(dir: string): string[] {
      const out: string[] = [];
      if (!fs.existsSync(dir)) return out;

      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);

        if (stat.isDirectory()) out.push(...walk(full));
        else if (/\.(ts|txt|md)$/i.test(f) && !f.startsWith("_") && f !== "index.ts") {
          out.push(full);
        }
      }
      return out;
    }

    const agentFiles = walk(agentsDir);
    const promptFiles = walk(promptsDir);

    console.log(`🧩 Encontrados ${agentFiles.length} agentes base.`);

    for (const file of agentFiles) {
      const slug = path.basename(file, path.extname(file));
      const content = fs.readFileSync(file, "utf8").toString();

      // Metadatos del archivo del agente
      const name =
        content.match(/name:\s*["'`](.*?)["'`]/)?.[1] ||
        `Rowi ${slug.charAt(0).toUpperCase() + slug.slice(1)}`;

      const model =
        content.match(/model:\s*["'`](.*?)["'`]/)?.[1] ||
        "gpt-4o-mini";

      const type =
        content.match(/type:\s*["'`](.*?)["'`]/)?.[1]?.toUpperCase() ||
        slug.toUpperCase();

      const description =
        content.match(/description:\s*["'`](.*?)["'`]/)?.[1] ||
        `Agente ${slug} de Rowi`;

      // Buscar prompt inline o externo
      let prompt = "";
      const inline =
        content.match(/prompt:\s*(?:["'`](.*?)["'`]|\`([\s\S]*?)\`)/);
      if (inline) {
        prompt = (inline[1] || inline[2] || "").trim();
      }

      if (!prompt && promptFiles.length > 0) {
        const promptPath = promptFiles.find(
          (p) => path.basename(p, path.extname(p)).toLowerCase() === slug
        );
        if (promptPath) {
          const raw = fs.readFileSync(promptPath, "utf8");
          const match = raw.match(/`([\s\S]*?)`/);
          prompt = match ? match[1].trim() : raw.trim();
          console.log(`💬 Prompt cargado: ${slug}`);
        }
      }

      // Buscar agente global existente (sin tenant, superhub, org)
      const existing = await prisma.agentConfig.findFirst({
        where: {
          slug,
          tenantId: null,
          superHubId: null,
          organizationId: null,
          hubId: null,
        },
      });

      if (!existing) {
        await prisma.agentConfig.create({
          data: {
            slug,
            name,
            model,
            type,
            description,
            prompt,
            isActive: true,
            visibility: "public",
            accessLevel: "global",
          },
        });

        console.log(`🆕 Agente global creado: ${slug}`);
      } else {
        const changed =
          existing.prompt !== prompt ||
          existing.description !== description ||
          existing.model !== model;

        if (changed) {
          await prisma.agentConfig.update({
            where: { id: existing.id },
            data: {
              name,
              model,
              type,
              description,
              prompt,
              updatedAt: new Date(),
            },
          });

          console.log(`♻️ Agente actualizado: ${slug}`);
        } else {
          console.log(`⚙️ Sin cambios: ${slug}`);
        }
      }
    }

    console.log("✅ ensureBaseAgents completado (GLOBAL OK)");
  } catch (err) {
    console.error("❌ Error en ensureBaseAgents:", err);
  }
}