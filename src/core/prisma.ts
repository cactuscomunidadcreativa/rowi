import { PrismaClient } from "@prisma/client";

/* =========================================================
   🔥 PrismaClient — Optimizado para Neon + Vercel Serverless
   ---------------------------------------------------------
   - Evita instancias duplicadas
   - Optimizado para connection pooling de Neon (5 conexiones)
   - Funciona en App Router + Route Handlers
========================================================= */

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

// 🔹 Instancia única con configuración optimizada para serverless
export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    // Solo logs de errores en producción para reducir overhead
    log: process.env.NODE_ENV === "production"
      ? ["error"]
      : ["query", "info", "warn", "error"],
  });

// 🔥 Conexión lazy - no forzar $connect() en serverless
// Prisma se conectará automáticamente en la primera query
if (process.env.NODE_ENV !== "production") {
  // Solo en desarrollo conectamos eagerly
  prisma.$connect().catch((err) => {
    console.error("❌ Prisma failed to connect:", err);
  });
}

// 🔹 Guardar instancia en desarrollo (HMR seguro)
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}