/**
 * Script para otorgar acceso SuperAdmin a un usuario existente.
 *
 * Uso:
 *   npx tsx prisma/grant-admin.ts usuario@email.com
 *
 * O con variable de entorno:
 *   SUPERADMIN_EMAIL=usuario@email.com npx tsx prisma/grant-admin.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email =
    process.argv[2] || process.env.SUPERADMIN_EMAIL;

  if (!email) {
    console.error("Uso: npx tsx prisma/grant-admin.ts <email>");
    console.error("  O: SUPERADMIN_EMAIL=<email> npx tsx prisma/grant-admin.ts");
    process.exit(1);
  }

  // 1. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      organizationRole: true,
      permissions: true,
    },
  });

  if (!user) {
    console.error(`No se encontro usuario con email: ${email}`);
    process.exit(1);
  }

  console.log(`Usuario encontrado: ${user.name} (${user.id})`);
  console.log(`   Role actual: ${user.organizationRole}`);

  // 2. Actualizar organizationRole a SUPERADMIN
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationRole: "SUPERADMIN" },
  });
  console.log(`organizationRole actualizado a SUPERADMIN`);

  // 3. Crear permiso rowiverse si no existe
  const existingPermission = await prisma.userPermission.findFirst({
    where: {
      userId: user.id,
      scopeType: "rowiverse",
    },
  });

  if (existingPermission) {
    console.log(`Ya tiene permiso rowiverse (${existingPermission.id})`);
  } else {
    // Buscar el rowiverse existente en lugar de hardcodear un ID
    const rowiverse = await prisma.rowiVerse.findFirst({
      select: { id: true },
    });

    const perm = await prisma.userPermission.create({
      data: {
        userId: user.id,
        role: "SUPERADMIN",
        scopeType: "rowiverse",
        scopeId: rowiverse?.id || null,
        scope: "global",
      },
    });
    console.log(`Permiso UserPermission creado: ${perm.id}`);
  }

  console.log(`\n${user.name || email} ahora es SuperAdmin y puede ver todo en la plataforma.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
