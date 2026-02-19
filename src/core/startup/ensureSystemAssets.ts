import { prisma } from "../prisma";
import fs from "fs";
import path from "path";

/**
 * 🌍 ensureSystemAssets()
 * --------------------------------------------------------
 * Sincroniza el System raíz ("rowi") con sus activos globales:
 * - Logos, colores y branding visual
 * - Archivos base (layouts, componentes y páginas por defecto)
 * - Archivos de configuración o temas globales (src/theme, src/config)
 */
export async function ensureSystemAssets() {
  console.log("🚀 Iniciando sincronización de activos del System Global (Rowi)...");

  // =====================================================
  // 1️⃣ Buscar System raíz
  // =====================================================
  const system = await prisma.system.findUnique({ where: { slug: "rowi" } });
  if (!system) {
    throw new Error("❌ No se encontró el System raíz 'rowi'. Ejecuta primero el seed maestro.");
  }

  // =====================================================
  // 2️⃣ Definir rutas base del sistema
  // =====================================================
  const assetsDir = path.resolve(process.cwd(), "public/assets/system");
  const themeDir = path.resolve(process.cwd(), "src/theme");
  const configDir = path.resolve(process.cwd(), "src/config");

  // Crea directorios si no existen
  for (const dir of [assetsDir, themeDir, configDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // =====================================================
  // 3️⃣ Detectar logos e íconos globales
  // =====================================================
  const logos = fs
    .readdirSync(assetsDir)
    .filter((f) => /\.(png|jpg|jpeg|svg|webp)$/i.test(f))
    .map((f) => `/assets/system/${f}`);

  const primaryLogo =
    logos.find((f) => f.includes("logo") && f.endsWith(".png")) ||
    logos.find((f) => f.endsWith(".svg")) ||
    "/rowi-logo.png";

  console.log(`🎨 Logos detectados: ${logos.length} | Usando: ${primaryLogo}`);

  // =====================================================
  // 4️⃣ Detectar configuración de tema global
  // =====================================================
  let themeJson: any = {};
  const themeFile = path.join(themeDir, "theme.json");
  if (fs.existsSync(themeFile)) {
    themeJson = JSON.parse(fs.readFileSync(themeFile, "utf8"));
    console.log("🎨 Tema global encontrado en src/theme/theme.json");
  } else {
    themeJson = {
      name: "Rowi Default Theme",
      colors: {
        primary: "#0F172A",
        secondary: "#F97316",
        background: "#FFFFFF",
        accent: "#FF6B35",
      },
      fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif",
      },
    };
    fs.writeFileSync(themeFile, JSON.stringify(themeJson, null, 2));
    console.log("✨ Tema global por defecto creado en src/theme/theme.json");
  }

  // =====================================================
  // 5️⃣ Detectar layouts y componentes por defecto
  // =====================================================
  const layouts = await prisma.layout.findMany({
    where: { systemId: system.id },
    select: { id: true, name: true },
  });

  const components = await prisma.component.findMany({
    where: { systemId: system.id },
    select: { id: true, name: true },
  });

  const defaultLayout = layouts.find((l) => l.name.toLowerCase().includes("main")) || layouts[0];
  const defaultComponents = components.filter((c) => /header|footer|card/i.test(c.name));

  console.log(
    `📐 Layout por defecto: ${defaultLayout?.name || "ninguno"} | Componentes base: ${
      defaultComponents.length
    }`
  );

  // =====================================================
  // 6️⃣ Actualizar System en la base de datos
  // =====================================================
  await prisma.system.update({
    where: { id: system.id },
    data: {
      logo: primaryLogo,
      primaryColor: themeJson.colors?.primary || "#0F172A",
      secondaryColor: themeJson.colors?.secondary || "#F97316",
      description: themeJson.name || "Rowi Global System Theme",
    },
  });

  // Upsert settings separately
  const settingsData = [
    { key: "theme-config", value: JSON.stringify(themeJson), type: "json" },
    { key: "default-layout", value: defaultLayout?.id || "", type: "string" },
    { key: "base-components", value: JSON.stringify(defaultComponents), type: "json" },
  ];

  for (const s of settingsData) {
    await prisma.systemSetting.upsert({
      where: { systemId_key: { systemId: system.id, key: s.key } },
      update: { value: s.value },
      create: { systemId: system.id, key: s.key, value: s.value, type: s.type },
    });
  }

  console.log("✅ System 'rowi' sincronizado con branding y configuraciones globales.");

  // =====================================================
  // 7️⃣ (Opcional) Sincronizar páginas públicas
  // =====================================================
  const publicPages = await prisma.page.findMany({
    where: { visibility: "public", systemId: system.id },
  });
  console.log(`🌐 Páginas públicas registradas: ${publicPages.length}`);

  return {
    system: system.slug,
    logos: logos.length,
    layouts: layouts.length,
    components: components.length,
    pages: publicPages.length,
  };
}

/**
 * 🧪 Ejecutar manualmente:
 * pnpm tsx src/core/startup/ensureSystemAssets.ts
 */
if (require.main === module) {
  ensureSystemAssets()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error en ensureSystemAssets:", err);
      process.exit(1);
    });
}