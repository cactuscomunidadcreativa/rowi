// src/app/hub/admin/system-health/api/route.ts
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

export const runtime = "nodejs";

/**
 * 🩺 Rowi System Health Check API
 *
 * - Lee el último log de verificación (.backups/verify-health-YYYY-MM-DD.json)
 * - Si no existe o está desactualizado (día distinto), ejecuta el script verify-rowi-health.ts una sola vez
 * - Devuelve los resultados en JSON listos para la UI del panel de monitoreo
 */

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd());
    const scriptPath = path.join(projectRoot, "scripts", "verify-rowi-health.ts");
    const backupDir = path.join(projectRoot, ".backups");

    // 📁 Asegurar que el directorio existe
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // 🧩 Nombre del archivo log de hoy
    const today = new Date().toISOString().slice(0, 10);
    const logFile = path.join(backupDir, `verify-health-${today}.json`);

    // ✅ Si ya existe un log de hoy, lo usamos (cache diario)
    if (fs.existsSync(logFile)) {
      const cached = JSON.parse(fs.readFileSync(logFile, "utf-8"));
      return NextResponse.json({ ...cached, cached: true });
    }

    // ⚙️ Ejecutar el script SOLO si no hay log actual
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { ok: false, error: `❌ Script no encontrado en ${scriptPath}` },
        { status: 404 }
      );
    }

    console.log("🩺 Ejecutando verificación de salud completa (no cacheada)...");

    let stdout = "";
    let stderr = "";
    try {
      // Ejecuta en modo síncrono sin interferir con Next.js
      stdout = execSync(`npx tsx ${scriptPath}`, {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: "pipe",
        timeout: 30000, // 30 segundos máximo
      });
    } catch (err: any) {
      stderr = err.stderr?.toString() || err.message || "Error desconocido al ejecutar script";
    }

    // 🧠 Analizar módulos del reporte
    const modules: Record<string, "ok" | "warn" | "fail"> = {};
    const find = (pattern: RegExp) => pattern.test(stdout + stderr);

    modules.typescript = find(/TypeScript.*OK|SUCCESS|PASSED/i)
      ? "ok"
      : find(/TypeScript.*WARN/i)
      ? "warn"
      : "fail";

    modules.prisma = find(/Prisma.*OK|modelo Translation presente/i) ? "ok" : "fail";
    modules.i18n = find(/i18n.*OK/i) ? "ok" : "warn";

    modules.api = find(/API routes.*OK/i)
      ? "ok"
      : find(/Faltan.*rutas/i)
      ? "warn"
      : "fail";

    modules.build = find(/Next\.js build.*OK|successfully/i) ? "ok" : "fail";

    // 🧾 Estructura del resultado
    const data = {
      ok: Object.values(modules).every((v) => v === "ok"),
      timestamp: new Date().toISOString(),
      modules,
      output: stdout,
      errors: stderr,
      cached: false,
    };

    // 💾 Guardar el nuevo log
    fs.writeFileSync(logFile, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("❌ Error ejecutando verificación de salud:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Error inesperado durante la verificación",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}