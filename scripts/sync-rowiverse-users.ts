import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌍 Sincronizando usuarios con RowiVerse Global...\n");

  // 1️⃣ Verificar existencia del RowiVerse
  let verse = await prisma.rowiVerse.findFirst();
  if (!verse) {
    verse = await prisma.rowiVerse.create({
      data: {
        name: "RowiVerse Global",
        slug: "rowiverse",
        description:
          "Ecosistema emocional mundial — comunidades, usuarios y afinidades activas.",
        visibility: "public",
      },
    });
    console.log(`✅ Creado RowiVerse Global (${verse.id})`);
  }

  // 2️⃣ Obtener usuarios activos
  const users = await prisma.user.findMany({
    where: { active: true },
    include: { eqSnapshots: true },
  });

  let updatedCountries = 0;
  let createdVerseUsers = 0;

  for (const user of users) {
    let country = user.country?.trim();

    // Si no tiene país → lo tomamos de su último snapshot
    if (!country && user.eqSnapshots.length > 0) {
      const last = user.eqSnapshots[user.eqSnapshots.length - 1];
      if (last.country) {
        country = last.country.trim();
        await prisma.user.update({
          where: { id: user.id },
          data: { country },
        });
        updatedCountries++;
      }
    }

    // Crear identidad RowiVerseUser si no existe
    const existingVerseUser = await prisma.rowiVerseUser.findFirst({
      where: { userId: user.id, rowiVerseId: verse.id },
    });

    if (!existingVerseUser) {
      await prisma.rowiVerseUser.create({
        data: {
          userId: user.id,
          rowiVerseId: verse.id,
          country: country || "NONE",
          language: "es",
          status: "active",
        },
      });
      createdVerseUsers++;
    }
  }

  // 3️⃣ Reporte final
  const countries = await prisma.user.groupBy({
    by: ["country"],
    where: { country: { not: null } },
    _count: { _all: true },
  });

  console.log(`🌎 Países detectados: ${countries.length}`);
  console.log(`🧠 Usuarios con país actualizado: ${updatedCountries}`);
  console.log(`🔗 RowiVerseUser creados: ${createdVerseUsers}`);
  console.log(`✅ Sincronización completa.`);
}

main()
  .catch((err) => console.error("❌ Error:", err))
  .finally(() => prisma.$disconnect());