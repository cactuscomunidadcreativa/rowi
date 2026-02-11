/**
 * Script para otorgar acceso SuperAdmin a Chris Draper
 * Ejecutar: npx tsx prisma/grant-admin.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "chris.draper@6seconds.org";

  // 1. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, organizationRole: true, permissions: true },
  });

  if (!user) {
    console.error(`❌ No se encontró usuario con email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Usuario encontrado: ${user.name} (${user.id})`);
  console.log(`   Role actual: ${user.organizationRole}`);

  // 2. Actualizar organizationRole a SUPERADMIN
  await prisma.user.update({
    where: { id: user.id },
    data: { organizationRole: "SUPERADMIN" },
  });
  console.log(`✅ organizationRole actualizado a SUPERADMIN`);

  // 3. Crear permiso rowiverse si no existe
  const existingPermission = await prisma.userPermission.findFirst({
    where: {
      userId: user.id,
      scopeType: "rowiverse",
      scopeId: "rowiverse_root",
    },
  });

  if (existingPermission) {
    console.log(`ℹ️  Ya tiene permiso rowiverse_root (${existingPermission.id})`);
  } else {
    const perm = await prisma.userPermission.create({
      data: {
        userId: user.id,
        role: "SUPERADMIN",
        scopeType: "rowiverse",
        scopeId: "rowiverse_root",
        scope: "global",
      },
    });
    console.log(`✅ Permiso UserPermission creado: ${perm.id}`);
  }

  console.log(`\n🎉 Chris Draper ahora es SuperAdmin y puede ver todo en la plataforma.`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
