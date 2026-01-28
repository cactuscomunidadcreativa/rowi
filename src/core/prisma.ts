import { PrismaClient } from "@prisma/client";

/* =========================================================
   🔥 PrismaClient — Versión estable para Next.js 13-15
   ---------------------------------------------------------
   - Evita instancias duplicadas
   - Evita errores del engine "not yet connected"
   - Funciona en App Router + Route Handlers
========================================================= */

declare global {
  // Asegura que prisma esté disponible en desarrollo sin re-instanciar
  var prismaGlobal: PrismaClient | undefined;
}

// 🔹 Instancia única (modo recomendado)
export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

// 🔥 SOLUCIÓN DEFINITIVA:
// Forzar conexión al engine una sola vez.
// Esto evita el error: "Engine is not yet connected"
prisma
  .$connect()
  .catch((err) => {
    console.error("❌ Prisma failed to connect:", err);
  });

// 🔹 Guardar instancia en desarrollo (HMR seguro)
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}