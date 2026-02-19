import fs from "fs";
import path from "path";
import { prisma } from "../prisma";

/**
 * 🎨 ensureLayoutsAndComponents.ts
 * --------------------------------------------
 * Escanea layouts y componentes del proyecto y los vincula
 * al System raíz ("rowi") dentro de la base de datos.
 * - Detecta layouts y componentes (.tsx)
 * - Sincroniza en DB (Layout / Component)
 * - Evita duplicados y actualiza descripciones
 */
export async function ensureLayoutsAndComponents() {
  console.log("🚀 Escaneando layouts y componentes del sistema...");

  // =====================================================
  // 🧩 Buscar System raíz (Rowi)
  // =====================================================
  const system = await prisma.system.findUnique({ where: { slug: "rowi" } });
  if (!system) {
    throw new Error("❌ No se encontró el System raíz 'rowi'. Ejecuta primero el seed.");
  }

  // Directorios raíz a escanear
  const roots = [
    path.resolve(process.cwd(), "src"),
    path.resolve(process.cwd(), "apps"),
  ];

  // Función recursiva para leer archivos .tsx
  function walk(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) results.push(...walk(full));
      else if (file.endsWith(".tsx")) results.push(full);
    }
    return results;
  }

  const allFiles: string[] = [];
  for (const base of roots) {
    if (!fs.existsSync(base)) continue;

    if (base.endsWith("apps")) {
      for (const app of fs.readdirSync(base)) {
        const appDir = path.join(base, app, "app");
        if (fs.existsSync(appDir)) allFiles.push(...walk(appDir));
      }
    } else {
      allFiles.push(...walk(base));
    }
  }

  const layoutFiles = allFiles.filter((f) => f.endsWith("layout.tsx"));
  const componentFiles = allFiles.filter(
    (f) => f.toLowerCase().includes("component") && f.endsWith(".tsx")
  );

  console.log(`📐 Detectados ${layoutFiles.length} layouts y ${componentFiles.length} componentes.`);

  let createdLayouts = 0;
  let updatedLayouts = 0;
  let createdComponents = 0;
  let updatedComponents = 0;

  // =====================================================
  // 🧱 Procesar Layouts
  // =====================================================
  for (const file of layoutFiles) {
    const rel = file.split("src")[1] || file;
    const name = path.basename(path.dirname(file));
    const source = fs.readFileSync(file, "utf8");

    const description =
      source.match(/summary:\s*["'`](.*?)["'`]/)?.[1] ||
      source.match(/\/\*\s*([\s\S]*?)\*\//)?.[1]?.trim() ||
      `Layout para ${name}`;

    let visibility = "global";
    if (rel.includes("/hub/admin")) visibility = "admin";
    else if (rel.includes("/hub/")) visibility = "hub";
    else if (rel.includes("/apps/")) visibility = "tenant";

    const existing = await prisma.layout.findFirst({
      where: { name, systemId: system.id },
    });

    if (!existing) {
      await prisma.layout.create({
        data: {
          name,
          description,
          systemId: system.id, // 🔗 Vinculación global
          isDefault: rel.includes("/app"),
          structure: {},
          theme: {},
        },
      });
      createdLayouts++;
      console.log(`✅ Nuevo layout: ${name}`);
    } else {
      const changed = existing.description !== description;
      if (changed) {
        await prisma.layout.update({
          where: { id: existing.id },
          data: { description, updatedAt: new Date() },
        });
        updatedLayouts++;
        console.log(`♻️ Layout actualizado: ${name}`);
      }
    }
  }

  // =====================================================
  // 🧩 Procesar Componentes
  // =====================================================
  for (const file of componentFiles) {
    const rel = file.split("src")[1] || file;
    const name = path.basename(file, ".tsx");
    const source = fs.readFileSync(file, "utf8");

    const type =
      source.match(/type:\s*["'`](.*?)["'`]/)?.[1] ||
      (source.includes("Card") ? "card" : "ui");

    const category =
      source.match(/category:\s*["'`](.*?)["'`]/)?.[1] ||
      (source.includes("AI") ? "AI" : "UI");

    const description =
      source.match(/summary:\s*["'`](.*?)["'`]/)?.[1] ||
      source.match(/\/\*\s*([\s\S]*?)\*\//)?.[1]?.trim() ||
      `Componente ${name}`;

    let visibility = "global";
    if (rel.includes("/hub/admin")) visibility = "admin";
    else if (rel.includes("/hub/")) visibility = "hub";
    else if (rel.includes("/apps/")) visibility = "tenant";

    const existing = await prisma.component.findFirst({
      where: { name, systemId: system.id },
    });

    if (!existing) {
      await prisma.component.create({
        data: {
          name,
          type,
          category,
          description,
          visibility,
          config: {},
          schema: {},
          style: {},
          aiEnabled: source.includes("ai") || source.includes("AI"),
          version: "1.0.0",
          systemId: system.id, // 🔗 Vinculación global
        },
      });
      createdComponents++;
      console.log(`✅ Nuevo componente: ${name}`);
    } else {
      const changed = existing.description !== description;
      if (changed) {
        await prisma.component.update({
          where: { id: existing.id },
          data: { description, updatedAt: new Date() },
        });
        updatedComponents++;
        console.log(`♻️ Componente actualizado: ${name}`);
      }
    }
  }

  console.log(
    `🎨 Layouts → ${createdLayouts} nuevos, ${updatedLayouts} actualizados.\n🧩 Componentes → ${createdComponents} nuevos, ${updatedComponents} actualizados.`
  );

  return {
    layouts: { created: createdLayouts, updated: updatedLayouts },
    components: { created: createdComponents, updated: updatedComponents },
  };
}

/**
 * 🧪 Ejecutar manualmente:
 * pnpm tsx src/core/startup/ensureLayoutsAndComponents.ts
 */
if (require.main === module) {
  ensureLayoutsAndComponents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error en ensureLayoutsAndComponents:", err);
      process.exit(1);
    });
}