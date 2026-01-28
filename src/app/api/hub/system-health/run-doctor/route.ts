import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

/**
 * 🚀 Ejecuta Doctor.mjs sin rutas duplicadas y guarda log
 */
export async function POST() {
  try {
    // 📍 Detecta la raíz del monorepo (2 niveles arriba de /apps/rowi/src/...)
    const projectRoot = path.resolve(process.cwd(), "../..");

    // ✅ Ruta corregida — ahora es absoluta al archivo real
    const doctorPath = path.join(projectRoot, "apps", "rowi", "scripts", "doctor.mjs");

    // 🚀 Ejecutar script doctor
    const output = execSync(`pnpm tsx ${doctorPath}`, {
      encoding: "utf8",
      cwd: projectRoot,
      stdio: "pipe",
    });

    // 💾 Guardar backup en apps/rowi/.backups/
    const backupDir = path.join(projectRoot, "apps", "rowi", ".backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const logPath = path.join(backupDir, "doctor-last-run.json");
    fs.writeFileSync(logPath, JSON.stringify({ output, date: new Date().toISOString() }, null, 2));

    return NextResponse.json({
      ok: true,
      output,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        output: err.stdout?.toString() || "",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}