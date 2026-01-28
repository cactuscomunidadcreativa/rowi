// src/core/startup/ensurePermissions.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* =========================================================
   🔐 ensurePermissions()
   ---------------------------------------------------------
   Asegura permisos base y jerárquicos:
   - SuperAdmin Global (RowiVerse root)
   - Admin SuperHub (Cactus Hub)
   - Manager Tenant (Rowi Master)
========================================================= */
export async function ensurePermissions() {
  console.log("⚙️ Paso 6️⃣ — Permisos base");

  // Usuario principal
  const user = await prisma.user.findFirst({
    where: { email: "eduardo@cactuscomunidadcreativa.com" },
  });

  if (!user) {
    console.warn("⚠️ Usuario base no encontrado, se omite ensurePermissions.");
    return;
  }

  // Evitar duplicados
  const existing = await prisma.userPermission.findMany({
    where: { userId: user.id },
  });
  if (existing.length > 0) {
    console.log("✅ Permisos ya existen, no se duplican.");
    return;
  }

  // Contextos jerárquicos
  const rowiverse = await prisma.rowiVerse.findFirst({ where: { slug: "rowiverse" } });
  const cactusHub = await prisma.superHub.findFirst({ where: { slug: "cactus-hub" } });
  const rowiMaster = await prisma.tenant.findFirst({ where: { slug: "rowi-master" } });

  // Permisos base
  const permissions = [
    // 🌍 SUPERADMIN GLOBAL (RowiVerse raíz)
    {
      userId: user.id,
      role: "superadmin",
      scopeType: "rowiverse",
      scopeId: rowiverse?.id || "rowiverse_root",
    },

    // 🏛 ADMIN SUPERHUB
    {
      userId: user.id,
      role: "admin",
      scopeType: "superhub",
      scopeId: cactusHub?.id || "",
    },

    // 🧱 MANAGER TENANT
    {
      userId: user.id,
      role: "manager",
      scopeType: "tenant",
      scopeId: rowiMaster?.id || "",
    },
  ];

  await prisma.userPermission.createMany({ data: permissions });

  console.log("✅ Permisos base creados correctamente.");
}