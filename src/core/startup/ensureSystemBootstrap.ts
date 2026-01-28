// apps/rowi/src/core/startup/ensureSystemBootstrap.ts
import { PrismaClient } from "@prisma/client";

// ✅ rutas relativas (NO alias @/)
import { ensureSystemHierarchy } from "./ensureSystemHierarchy";
import { ensureLayoutsAndComponents } from "./ensureLayoutsAndComponents";
import { ensurePages } from "./ensurePages";
import { ensureTranslations } from "./ensureTranslations";
import { ensureBaseAgents } from "./ensureBaseAgents";
import { ensurePermissions } from "./ensurePermissions"; // 🆕 permisos base

const prisma = new PrismaClient();

/* =========================================================
   🌍 ensureSystemBootstrap()
   ---------------------------------------------------------
   🧩 Ejecuta el arranque global del ecosistema CACTUS/ROWI:
   1️⃣ Jerarquía (System / Tenant / Org / Hub)
   2️⃣ Layouts & Componentes
   3️⃣ Páginas
   4️⃣ Traducciones globales (solo BD)
   5️⃣ Agentes IA base
   6️⃣ Permisos base (superadmin, rowiverse, superhub, tenant)
   ⚠️ NO MERGE AUTOMÁTICO: el merge BD ⇄ JSON se hace
      manualmente desde el Translation Center.
========================================================= */
export async function ensureSystemBootstrap() {
  console.log("\n🌍 ====== BOOTSTRAP GLOBAL DEL ECOSISTEMA CACTUS / ROWI ======\n");

  try {
    console.log("⚙️ Paso 1️⃣ — Jerarquía Global");
    await ensureSystemHierarchy();

    console.log("⚙️ Paso 2️⃣ — Layouts & Componentes");
    await ensureLayoutsAndComponents();

    console.log("⚙️ Paso 3️⃣ — Páginas del sistema");
    await ensurePages();

    console.log("⚙️ Paso 4️⃣ — Traducciones globales (solo BD)");
    await ensureTranslations();
    // ❌ NO AUTO MERGE AQUÍ
    // Si necesitas sincronizar JSON locales, hazlo manualmente desde:
    //   /hub/admin/translations → botón "Exportar JSON"

    console.log("⚙️ Paso 5️⃣ — Agentes IA base");
    await ensureBaseAgents();

    console.log("⚙️ Paso 6️⃣ — Permisos del sistema");
    await ensurePermissions();

    console.log("🎯 Bootstrap completado sin errores 🎯");
  } catch (err) {
    console.error("❌ Error durante el bootstrap:", err);
  } finally {
    await prisma.$disconnect();
    console.log("🔚 Prisma desconectado correctamente");
  }
}

/* =========================================================
   🧪 Ejecutar manualmente
   pnpm tsx apps/rowi/src/core/startup/ensureSystemBootstrap.ts
========================================================= */
if (require.main === module) {
  ensureSystemBootstrap()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Error al ejecutar ensureSystemBootstrap:", err);
      process.exit(1);
    });
}