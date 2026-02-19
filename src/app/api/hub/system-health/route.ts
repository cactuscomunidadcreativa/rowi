// src/app/api/hub/system-health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/core/prisma";
import { requireAuth } from "@/core/auth/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🩺 Rowi System Health Check API
 *
 * Verifica el estado de los componentes principales del sistema
 * sin ejecutar scripts externos (compatible con Vercel)
 */

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const timestamp = new Date().toISOString();
  const modules: Record<string, "ok" | "warn" | "fail"> = {};
  const details: Record<string, string> = {};

  try {
    // 1. 🗄️ Verificar Prisma/Database
    try {
      const userCount = await prisma.user.count();
      const planCount = await prisma.plan.count();
      const tenantCount = await prisma.tenant.count();

      modules.prisma = "ok";
      details.prisma = `✅ DB conectada: ${userCount} usuarios, ${planCount} planes, ${tenantCount} tenants`;
    } catch (dbErr: any) {
      modules.prisma = "fail";
      details.prisma = `❌ Error DB: ${dbErr.message}`;
    }

    // 2. 🌐 Verificar i18n (traducciones básicas)
    try {
      const translationCount = await prisma.translation.count();
      modules.i18n = translationCount > 0 ? "ok" : "warn";
      details.i18n = translationCount > 0
        ? `✅ ${translationCount} traducciones en DB`
        : `⚠️ Sin traducciones en DB (usando archivos locales)`;
    } catch {
      modules.i18n = "warn";
      details.i18n = "⚠️ Tabla de traducciones no disponible (usando archivos)";
    }

    // 3. 🔐 Verificar configuración de Auth (sin exponer nombres de variables)
    const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID;
    const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;

    if (hasGoogleId && hasGoogleSecret && hasNextAuthSecret) {
      modules.auth = "ok";
      details.auth = "✅ OAuth configurado correctamente";
    } else {
      modules.auth = "fail";
      details.auth = "❌ Faltan variables de autenticación";
    }

    // 4. 🤖 Verificar OpenAI API Key
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    modules.ai = hasOpenAI ? "ok" : "warn";
    details.ai = hasOpenAI ? "✅ IA configurada" : "⚠️ API de IA no configurada";

    // 5. 📊 Verificar datos básicos
    try {
      const rowiVerseCount = await prisma.rowiVerse.count();
      const agentCount = await prisma.agentConfig.count();

      if (rowiVerseCount > 0 && agentCount > 0) {
        modules.data = "ok";
        details.data = `✅ ${rowiVerseCount} RowiVerses, ${agentCount} agentes`;
      } else {
        modules.data = "warn";
        details.data = `⚠️ Datos base incompletos: ${rowiVerseCount} RowiVerses, ${agentCount} agentes`;
      }
    } catch {
      modules.data = "warn";
      details.data = "⚠️ No se pudieron verificar datos base";
    }

    // 6. 🚀 Estado general (si llegamos aquí, el build está OK)
    modules.build = "ok";
    details.build = "✅ Aplicación desplegada correctamente";

    // Calcular estado general
    const allOk = Object.values(modules).every((v) => v === "ok");
    const hasFails = Object.values(modules).some((v) => v === "fail");

    return NextResponse.json({
      ok: allOk,
      status: hasFails ? "error" : allOk ? "healthy" : "degraded",
      timestamp,
      modules,
      details,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    });
  } catch (err: any) {
    console.error("❌ Error en system-health:", err);
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: err.message || "Error inesperado",
        timestamp,
        modules,
        details,
      },
      { status: 500 }
    );
  }
}
