import fs from "fs";
import path from "path";
import { prisma } from "../prisma";

/**
 * 🌍 ensurePages.ts
 * ----------------------------------------------------------
 * Escanea todas las rutas `page.tsx` en el proyecto y sincroniza
 * sus metadatos (slug, título, resumen) con la base de datos.
 * 
 * 🔹 Vincula todas las páginas al `System` raíz ("rowi")
 * 🔹 Distingue entre visibilidad: admin / hub / tenant / public
 * 🔹 Actualiza título o resumen si detecta cambios
 * 🔹 No duplica páginas ya registradas
 */
export async function ensurePages() {
  console.log("🚀 Escaneando todas las páginas del sistema...");

  // =====================================================
  // 🔹 Buscar System raíz (Rowi)
  // =====================================================
  const system = await prisma.system.findUnique({ where: { slug: "rowi" } });
  if (!system) {
    throw new Error("❌ No se encontró el System raíz 'rowi'. Ejecuta primero el seed.");
  }

  // =====================================================
  // 📂 Directorios base
  // =====================================================
  const roots = [
    path.resolve(process.cwd(), "src/app"),
    path.resolve(process.cwd(), "apps"),
  ];

  // =====================================================
  // 🔍 Función recursiva para encontrar `page.tsx`
  // =====================================================
  function walk(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) results.push(...walk(full));
      else if (file === "page.tsx") results.push(full);
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

  console.log(`📄 Detectadas ${allFiles.length} páginas en total.`);

  let created = 0;
  let updated = 0;

  // =====================================================
  // 🧩 Procesar cada página detectada
  // =====================================================
  for (const file of allFiles) {
    const relPath = file.split("src")[1]?.replace(/\/page\.tsx$/, "") || "";
    const slug =
      relPath
        .replace(/\/app/, "")
        .replace(/index$/, "")
        .replace(/\/+/g, "/")
        .replace(/\/$/, "")
        .trim() || "/";

    const source = fs.readFileSync(file, "utf8");

    // Extraer título y resumen
    const title =
      source.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1]?.trim() ||
      source.match(/title:\s*["'`](.*?)["'`]/)?.[1]?.trim() ||
      path.basename(path.dirname(file));

    const summary =
      source.match(/summary:\s*["'`](.*?)["'`]/)?.[1]?.trim() ||
      source.match(/\/\*\s*([\s\S]*?)\*\//)?.[1]?.trim() ||
      null;

    // Determinar visibilidad según ruta
    let visibility = "global";
    if (slug.includes("/hub/admin")) visibility = "admin";
    else if (slug.includes("/hub/")) visibility = "hub";
    else if (slug.includes("/apps/")) visibility = "tenant";
    else if (slug.includes("/public/")) visibility = "public";

    const accessLevel =
      visibility === "public"
        ? "public"
        : visibility === "admin"
        ? "restricted"
        : "internal";

    // Buscar página existente (por slug + system)
    const existing = await prisma.page.findFirst({
      where: { slug, systemId: system.id },
    });

    if (!existing) {
      await prisma.page.create({
        data: {
          slug,
          title,
          summary: summary || "",
          lang: "es",
          visibility,
          accessLevel,
          published: true,
          systemId: system.id, // 🔗 Vinculación global
        },
      });
      created++;
      console.log(`✅ Nueva página registrada: ${slug}`);
    } else {
      const changed = existing.title !== title || existing.summary !== summary;
      if (changed) {
        await prisma.page.update({
          where: { id: existing.id },
          data: {
            title,
            summary: summary || existing.summary,
            updatedAt: new Date(),
          },
        });
        updated++;
        console.log(`♻️ Página actualizada: ${slug}`);
      }
    }
  }

  console.log(
    `✅ Sincronización completada: ${created} nuevas, ${updated} actualizadas, ${allFiles.length} totales.`
  );

  return { created, updated, total: allFiles.length };
}

/**
 * 🧪 Ejecutar manualmente:
 * pnpm tsx src/core/startup/ensurePages.ts
 */
if (require.main === module) {
  ensurePages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error en ensurePages:", err);
      process.exit(1);
    });
}