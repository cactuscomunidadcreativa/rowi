/**
 * Script para restaurar acceso de superadmin.
 *
 * Uso:
 *   npx ts-node scripts/restore-superadmin.ts usuario@email.com
 *
 * O con variable de entorno:
 *   SUPERADMIN_EMAIL=usuario@email.com npx ts-node scripts/restore-superadmin.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email =
    process.argv[2] || process.env.SUPERADMIN_EMAIL;

  if (!email) {
    console.error("Uso: npx ts-node scripts/restore-superadmin.ts <email>");
    console.error("  O: SUPERADMIN_EMAIL=<email> npx ts-node scripts/restore-superadmin.ts");
    process.exit(1);
  }

  console.log("Buscando usuario con email:", email);

  // Buscar el usuario
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { email: { contains: email.split("@")[0], mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    console.log("Usuario no encontrado. Usuarios disponibles:");
    const users = await prisma.user.findMany({
      take: 10,
      select: { id: true, email: true, name: true },
    });
    console.table(users);
    return;
  }

  console.log("Usuario encontrado:", user.email, user.name);

  // Verificar permisos existentes
  const existingPermission = await prisma.userPermission.findFirst({
    where: {
      userId: user.id,
      role: "SUPERADMIN",
      scopeType: "rowiverse",
    },
  });

  if (existingPermission) {
    console.log("Ya tiene permiso SUPERADMIN en ROWIVERSE");
    return;
  }

  // Crear permiso de superadmin
  const permission = await prisma.userPermission.create({
    data: {
      userId: user.id,
      scopeType: "rowiverse",
      scopeId: null,
      role: "SUPERADMIN",
      scope: "global",
    },
  });

  console.log("Permiso SUPERADMIN creado:", permission.id);

  // Buscar tenant del usuario por dominio del email
  const domain = email.split("@")[1]?.replace(/\./g, "");
  if (domain) {
    const tenant = await prisma.tenant.findFirst({
      where: { slug: { contains: domain, mode: "insensitive" } },
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
          role: "SUPERADMIN",
        },
        create: {
          userId: user.id,
          tenantId: tenant.id,
          role: "SUPERADMIN",
        },
      });
      console.log("Membresia actualizada a SUPERADMIN en tenant:", tenant.name);
    }
  }

  console.log("\nListo! Ahora puedes acceder como superadmin.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
