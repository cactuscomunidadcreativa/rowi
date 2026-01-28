// src/app/api/hub/system-health/run-deep/route.ts
import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

/**
 * 🧠 Ejecuta la auditoría profunda (deep-repair.mjs)
 * Llama al script Node directamente y devuelve su salida + log guardado
 */
export async function POST() {
  try {
    const root = process.cwd();
    const scriptPath = path.join(root, "apps", "rowi", "scripts", "deep-repair.mjs");

    const output = execSync(`pnpm tsx ${scriptPath}`, {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
    });

    const timestamp = new Date().toISOString();

    return NextResponse.json({
      ok: true,
      message: "✅ Auditoría profunda completada",
      timestamp,
      output,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        stack: err.stderr?.toString() || err.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";