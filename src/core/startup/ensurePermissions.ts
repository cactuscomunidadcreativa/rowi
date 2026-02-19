// src/core/startup/ensurePermissions.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* =========================================================
   🔐 ensurePermissions()
   ---------------------------------------------------------
   Asegura permisos base y jerárquicos:
   - SuperAdmin Global (RowiVerse root)
   - Admin SuperHub (Six Seconds)
   - Admin Tenant (Six Seconds Global)
   - Admin Hub (Six Seconds Hub)
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

  // Contextos jerárquicos (slugs alineados con seed-minimal.ts)
  const rowiverse = await prisma.rowiVerse.findFirst({ where: { slug: "rowiverse" } });
  const superHub = await prisma.superHub.findFirst({ where: { slug: "six-seconds" } });
  const tenant = await prisma.tenant.findFirst({ where: { slug: "six-seconds-global" } });
  const hub = await prisma.hub.findFirst({ where: { slug: "six-seconds-hub" } });

  // Permisos base - verificar uno por uno para no duplicar
  const permDefs = [
    // 🌍 SUPERADMIN GLOBAL (RowiVerse raíz)
    {
      userId: user.id,
      role: "superadmin",
      scopeType: "rowiverse",
      scopeId: rowiverse?.id || "rowiverse_root",
      scope: rowiverse?.id || "rowiverse_root",
    },
    // 🏛 SUPERADMIN SUPERHUB (Six Seconds)
    ...(superHub ? [{
      userId: user.id,
      role: "SUPERADMIN",
      scopeType: "superhub",
      scopeId: superHub.id,
      scope: superHub.id,
    }] : []),
    // 🏢 ADMIN TENANT (Six Seconds Global)
    ...(tenant ? [{
      userId: user.id,
      role: "ADMIN",
      scopeType: "tenant",
      scopeId: tenant.id,
      scope: tenant.id,
    }] : []),
    // 🧱 ADMIN HUB (Six Seconds Hub)
    ...(hub ? [{
      userId: user.id,
      role: "ADMIN",
      scopeType: "hub",
      scopeId: hub.id,
      scope: hub.id,
    }] : []),
  ];

  for (const perm of permDefs) {
    const existing = await prisma.userPermission.findFirst({
      where: {
        userId: perm.userId,
        role: perm.role,
        scopeType: perm.scopeType,
        scopeId: perm.scopeId,
      },
    });
    if (!existing) {
      await prisma.userPermission.create({ data: perm });
      console.log(`  ✅ Permiso creado: ${perm.scopeType} → ${perm.role}`);
    } else {
      console.log(`  ⏭️ Permiso ya existe: ${perm.scopeType} → ${perm.role}`);
    }
  }

  console.log("✅ Permisos base verificados correctamente.");
}
