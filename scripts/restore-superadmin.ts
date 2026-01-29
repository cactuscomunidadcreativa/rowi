/**
 * Script para restaurar acceso de superadmin
 * Ejecutar con: npx ts-node scripts/restore-superadmin.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "eduardo@cactuscomunidadcreativa.com";

  console.log("🔍 Buscando usuario con email:", email);

  // Buscar el usuario
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { email: { contains: "eduardo", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    console.log("❌ Usuario no encontrado. Usuarios disponibles:");
    const users = await prisma.user.findMany({
      take: 10,
      select: { id: true, email: true, name: true },
    });
    console.table(users);
    return;
  }

  console.log("✅ Usuario encontrado:", user.email, user.name);

  // Verificar permisos existentes
  const existingPermission = await prisma.userPermission.findFirst({
    where: {
      userId: user.id,
      role: "SUPERADMIN",
      scopeType: "rowiverse", // lowercase enum
    },
  });

  if (existingPermission) {
    console.log("⚠️ Ya tiene permiso SUPERADMIN en ROWIVERSE");
    return;
  }

  // Crear permiso de superadmin
  const permission = await prisma.userPermission.create({
    data: {
      userId: user.id,
      scopeType: "rowiverse", // lowercase enum
      scopeId: null,
      role: "SUPERADMIN",
      scope: "global",
    },
  });

  console.log("🎉 Permiso SUPERADMIN creado:", permission.id);

  // También asegurar que tenga membresía en el tenant principal si existe
  const tenant = await prisma.tenant.findFirst({
    where: { slug: "cactuscomunidadcreativa" },
  });

  if (tenant) {
    const membership = await prisma.membership.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id,
        },
      },
      update: {
        role: "SUPERADMIN", // TenantRole enum
      },
      create: {
        userId: user.id,
        tenantId: tenant.id,
        role: "SUPERADMIN", // TenantRole enum
      },
    });
    console.log("✅ Membresía actualizada a SUPERADMIN en tenant:", tenant.name);
  }

  console.log("\n🚀 ¡Listo! Ahora puedes acceder como superadmin.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
