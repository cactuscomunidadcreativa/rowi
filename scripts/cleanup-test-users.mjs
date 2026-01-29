// Script para limpiar usuarios de test y duplicados
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("🧹 Iniciando limpieza de usuarios de test...\n");

  // 1. Buscar usuarios de test (emails con @test, @example, etc.)
  const testUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: "@test" } },
        { email: { contains: "@example" } },
        { email: { contains: "test-sixseconds" } },
      ],
    },
    select: { id: true, email: true, name: true },
  });

  console.log(`📋 Encontrados ${testUsers.length} usuarios de test:`);
  testUsers.forEach((u) => console.log(`   - ${u.email} (${u.name})`));

  if (testUsers.length > 0) {
    // Eliminar en orden correcto (dependencias primero)
    const userIds = testUsers.map((u) => u.id);

    // Eliminar relaciones
    await prisma.rowiCommunityUser.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.eqSnapshot.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.rowiChat.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userPermission.deleteMany({ where: { userId: { in: userIds } } });

    // Eliminar usuarios
    const deleted = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    console.log(`\n✅ Eliminados ${deleted.count} usuarios de test`);
  }

  // 2. Buscar CommunityMembers huérfanos (sin userId o con userId inválido)
  const orphanMembers = await prisma.communityMember.findMany({
    where: {
      AND: [
        { userId: { not: null } },
        {
          user: null, // No existe el usuario
        },
      ],
    },
    select: { id: true, name: true, email: true },
  });

  console.log(`\n📋 CommunityMembers huérfanos: ${orphanMembers.length}`);

  // 3. Buscar duplicados en RowiCommunityUser
  const allCommunityUsers = await prisma.rowiCommunityUser.findMany({
    select: { id: true, userId: true, communityId: true },
  });

  const seen = new Map();
  const duplicateIds = [];

  for (const cu of allCommunityUsers) {
    const key = `${cu.userId}-${cu.communityId}`;
    if (seen.has(key)) {
      duplicateIds.push(cu.id);
    } else {
      seen.set(key, cu.id);
    }
  }

  console.log(`\n📋 RowiCommunityUser duplicados: ${duplicateIds.length}`);

  if (duplicateIds.length > 0) {
    await prisma.rowiCommunityUser.deleteMany({
      where: { id: { in: duplicateIds } },
    });
    console.log(`✅ Eliminados ${duplicateIds.length} duplicados`);
  }

  console.log("\n🎉 Limpieza completada!");
}

cleanup()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
