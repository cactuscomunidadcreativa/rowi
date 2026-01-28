// scripts/sync-user-country-language.ts
import { prisma } from "@/core/prisma";

async function main() {
  console.log("🌍 Sincronizando país e idioma desde EqSnapshot → User...\n");

  const snapshots = await prisma.eqSnapshot.findMany({
    where: {
      OR: [{ country: { not: null } }, { context: { not: null } }],
    },
    select: {
      userId: true,
      country: true,
      context: true,
    },
  });

  let updated = 0;

  for (const snap of snapshots) {
    if (!snap.userId) continue;

    await prisma.user.updateMany({
      where: { id: snap.userId },
      data: {
        country: snap.country ?? undefined,
        language: snap.context ?? undefined,
      },
    });

    updated++;
  }

  console.log(`✅ País e idioma sincronizados para ${updated} usuarios.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  prisma.$disconnect();
});