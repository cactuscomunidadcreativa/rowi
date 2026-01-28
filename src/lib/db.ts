// apps/rowi/src/lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/** Evita abrir demasiadas conexiones en next dev. */
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error", "warn"], // agrega "query" si quieres depurar
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;