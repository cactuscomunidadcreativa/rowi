/**
 * 🔐 Backfill: mover el hash de contraseña del legacy Account.access_token
 * al campo dedicado User.passwordHash.
 *
 * Contexto: históricamente el hash bcrypt de credentials se guardaba en
 * Account.access_token (un campo pensado para tokens OAuth). Migramos a
 * User.passwordHash. El authorize() de NextAuth ya lee passwordHash con
 * fallback al legacy, así que este script no es bloqueante para el login,
 * pero conviene correrlo una vez para poder eliminar el fallback después.
 *
 * Uso:  node scripts/backfill-password-hash.mjs            (dry-run)
 *       node scripts/backfill-password-hash.mjs --commit   (aplica cambios)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const COMMIT = process.argv.includes("--commit");

async function main() {
  const accounts = await prisma.account.findMany({
    where: {
      provider: "credentials",
      access_token: { not: null },
    },
    select: { id: true, userId: true, access_token: true },
  });

  console.log(`Encontradas ${accounts.length} cuentas credentials con hash legacy.`);

  let migrated = 0;
  let skipped = 0;

  for (const acc of accounts) {
    const user = await prisma.user.findUnique({
      where: { id: acc.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      console.warn(`  ⚠️  Account ${acc.id} apunta a user inexistente ${acc.userId}, omitida.`);
      skipped++;
      continue;
    }

    if (user.passwordHash) {
      // Ya migrado: solo limpiar el legacy.
      if (COMMIT) {
        await prisma.account.update({
          where: { id: acc.id },
          data: { access_token: null },
        });
      }
      skipped++;
      continue;
    }

    if (COMMIT) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: acc.access_token },
        }),
        prisma.account.update({
          where: { id: acc.id },
          data: { access_token: null },
        }),
      ]);
    }
    migrated++;
  }

  console.log(
    `${COMMIT ? "✅ Aplicado" : "🔍 Dry-run"}: ${migrated} migrados, ${skipped} omitidos.`
  );
  if (!COMMIT) console.log("Re-ejecuta con --commit para aplicar.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
