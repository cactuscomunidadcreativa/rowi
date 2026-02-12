/**
 * Script para otorgar acceso SuperAdmin a un usuario.
 *
 * Uso:
 *   npx ts-node scripts/add-superadmin.ts usuario@email.com
 *
 * O con variable de entorno:
 *   SUPERADMIN_EMAIL=usuario@email.com npx ts-node scripts/add-superadmin.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email =
    process.argv[2] || process.env.SUPERADMIN_EMAIL;

  if (!email) {
    console.error("Uso: npx ts-node scripts/add-superadmin.ts <email>");
    console.error("  O: SUPERADMIN_EMAIL=<email> npx ts-node scripts/add-superadmin.ts");
    process.exit(1);
  }

  // 1. Buscar el usuario
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log("Usuario no existe, creandolo...");
    user = await prisma.user.create({
      data: {
        email,
        name: "SuperAdmin",
        active: true,
        onboardingStatus: "ACTIVE",
        preferredLang: "es",
        timezone: "America/Lima",
      },
    });
    console.log("Usuario creado:", user.id);
  } else {
    console.log("Usuario encontrado:", user.id);
  }

  // 2. Obtener todos los rowiverses
  const rowiverses = await prisma.rowiVerse.findMany();
  console.log("\nRowiverses encontrados:", rowiverses.length);

  if (rowiverses.length === 0) {
    console.log("No hay rowiverses. Creando rowiverse_root...");
    const rowiverse = await prisma.rowiVerse.create({
      data: {
        name: "Rowiverse Root",
        slug: "rowiverse_root",
        description: "Sistema principal de Rowi",
        active: true,
        createdById: user.id,
      },
    });
    rowiverses.push(rowiverse);
    console.log("Rowiverse creado:", rowiverse.id);
  }

  // 3. Para cada rowiverse, crear permiso de superadmin
  for (const rowiverse of rowiverses) {
    console.log(`\nProcesando rowiverse: ${rowiverse.name}`);

    const existing = await prisma.userPermission.findFirst({
      where: {
        userId: user.id,
        scopeType: "rowiverse",
        scopeId: rowiverse.id,
      },
    });

    if (!existing) {
      await prisma.userPermission.create({
        data: {
          userId: user.id,
          scopeType: "rowiverse",
          scopeId: rowiverse.id,
          role: "superadmin",
        },
      });
      console.log(`  Permiso superadmin creado para ${rowiverse.name}`);
    } else {
      await prisma.userPermission.update({
        where: { id: existing.id },
        data: { role: "superadmin" },
      });
      console.log(`  Permiso actualizado a superadmin para ${rowiverse.name}`);
    }

    // 4. Tambien agregar permisos a superhubs de este rowiverse
    const superHubs = await prisma.superHub.findMany({
      where: { rowiVerseId: rowiverse.id },
    });

    for (const superHub of superHubs) {
      const existingSH = await prisma.userPermission.findFirst({
        where: {
          userId: user.id,
          scopeType: "superhub",
          scopeId: superHub.id,
        },
      });

      if (!existingSH) {
        await prisma.userPermission.create({
          data: {
            userId: user.id,
            scopeType: "superhub",
            scopeId: superHub.id,
            role: "superadmin",
          },
        });
        console.log(`  Permiso superadmin creado para SuperHub: ${superHub.name}`);
      } else {
        await prisma.userPermission.update({
          where: { id: existingSH.id },
          data: { role: "superadmin" },
        });
        console.log(`  Permiso actualizado para SuperHub: ${superHub.name}`);
      }
    }
  }

  // 5. Mostrar resumen de permisos
  const permisos = await prisma.userPermission.findMany({
    where: { userId: user.id },
  });

  console.log("\nPermisos del usuario:");
  permisos.forEach((p) => {
    console.log(`   - ${p.scopeType}: ${p.role}`);
  });

  console.log("\nUsuario configurado como superadmin:", email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
