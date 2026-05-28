/**
 * =========================================================
 * 🔐 API: System Settings CRUD
 * =========================================================
 *
 * GET /api/admin/settings - Lista todas las configuraciones
 * POST /api/admin/settings - Crear/actualizar una configuración
 * DELETE /api/admin/settings?key=XXX - Eliminar una configuración
 *
 * IMPORTANTE: Solo accesible para SUPER_ADMIN o usuarios en HUB_ADMINS
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  listSystemConfigs,
  setSystemConfig,
  deleteSystemConfig,
  getConfigValueForUI,
  SYSTEM_CONFIG_KEYS,
  type SystemConfigKey,
} from "@/lib/config/systemConfig";
import { logConfigChange } from "@/lib/audit/auditLog";
import { telemetry } from "@/lib/telemetry";
import { refreshStripeConfig } from "@/lib/stripe/client";
import { refreshSlackConfig } from "@/lib/slack/config";

const TELEMETRY_KEYS = new Set<SystemConfigKey>([
  "TELEMETRY_PROVIDER",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "AXIOM_TOKEN",
  "AXIOM_DATASET",
]);

const STRIPE_KEYS = new Set<SystemConfigKey>([
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PUBLISHABLE_KEY",
]);

const SLACK_KEYS = new Set<SystemConfigKey>([
  "SLACK_CLIENT_ID",
  "SLACK_CLIENT_SECRET",
  "SLACK_SIGNING_SECRET",
]);

/**
 * Verifica si el usuario es administrador del sistema
 */
async function isSystemAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  // Lista de admins desde variable de entorno
  const hubAdmins = process.env.HUB_ADMINS || "";
  const adminEmails = hubAdmins.split(",").map(e => e.trim().toLowerCase());

  return adminEmails.includes(email.toLowerCase());
}

// =========================================================
// GET - Lista todas las configuraciones
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const isAdmin = await isSystemAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de administrador." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") as SystemConfigKey | null;

    // Si se pide una clave específica, devolver su valor (parcialmente oculto si es secret)
    if (key && key in SYSTEM_CONFIG_KEYS) {
      const value = await getConfigValueForUI(key);
      return NextResponse.json({
        ok: true,
        key,
        value,
        config: SYSTEM_CONFIG_KEYS[key],
      });
    }

    // Listar todas las configuraciones
    const configs = await listSystemConfigs();

    // Agrupar por categoría
    const grouped = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, typeof configs>);

    return NextResponse.json({
      ok: true,
      configs,
      grouped,
      categories: Object.keys(SYSTEM_CONFIG_KEYS).reduce((acc, key) => {
        const k = key as SystemConfigKey;
        const cat = SYSTEM_CONFIG_KEYS[k].category;
        if (!acc.includes(cat)) acc.push(cat);
        return acc;
      }, [] as string[]),
    });
  } catch (error) {
    console.error("❌ Error en GET /api/admin/settings:", error);
    return NextResponse.json(
      { error: "Error al obtener configuraciones" },
      { status: 500 }
    );
  }
}

// =========================================================
// POST - Crear o actualizar una configuración
// =========================================================
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const isAdmin = await isSystemAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de administrador." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { key, value } = body;

    // Validar que la clave sea válida
    if (!key || !(key in SYSTEM_CONFIG_KEYS)) {
      return NextResponse.json(
        { error: "Clave de configuración inválida" },
        { status: 400 }
      );
    }

    // No permitir valor vacío
    if (!value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json(
        { error: "El valor no puede estar vacío" },
        { status: 400 }
      );
    }

    // Guardar la configuración
    await setSystemConfig(key as SystemConfigKey, value.trim(), session.user.email);

    // 📝 Log de auditoría
    await logConfigChange(session.user.id || null, key, "updated", req);

    // 🔄 Si tocamos algo del bloque de observability, invalidar el cache
    // del telemetry adapter para que la próxima captura use el nuevo
    // valor sin esperar al TTL de 5 min.
    if (TELEMETRY_KEYS.has(key as SystemConfigKey)) {
      telemetry.refreshConfig();
    }
    // Mismo principio para Stripe: si se actualiza una credencial,
    // el próximo webhook/checkout usa el valor nuevo sin esperar TTL.
    if (STRIPE_KEYS.has(key as SystemConfigKey)) {
      refreshStripeConfig();
    }
    // Mismo principio para Slack: rotar una credencial invalida el cache
    // para que el próximo OAuth/evento use el valor nuevo sin esperar TTL.
    if (SLACK_KEYS.has(key as SystemConfigKey)) {
      refreshSlackConfig();
    }

    return NextResponse.json({
      ok: true,
      message: "Configuración guardada correctamente",
      key,
    });
  } catch (error) {
    console.error("❌ Error en POST /api/admin/settings:", error);
    return NextResponse.json(
      { error: "Error al guardar configuración" },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE - Eliminar una configuración
// =========================================================
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const isAdmin = await isSystemAdmin(session.user.email);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requieren permisos de administrador." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") as SystemConfigKey | null;

    if (!key || !(key in SYSTEM_CONFIG_KEYS)) {
      return NextResponse.json(
        { error: "Clave de configuración inválida" },
        { status: 400 }
      );
    }

    await deleteSystemConfig(key);

    // 📝 Log de auditoría
    await logConfigChange(session.user.id || null, key, "deleted", req);

    // 🔄 Misma razón que en POST: invalida el cache si tocamos observability.
    if (TELEMETRY_KEYS.has(key as SystemConfigKey)) {
      telemetry.refreshConfig();
    }
    if (STRIPE_KEYS.has(key as SystemConfigKey)) {
      refreshStripeConfig();
    }
    if (SLACK_KEYS.has(key as SystemConfigKey)) {
      refreshSlackConfig();
    }

    return NextResponse.json({
      ok: true,
      message: "Configuración eliminada correctamente",
      key,
    });
  } catch (error) {
    console.error("❌ Error en DELETE /api/admin/settings:", error);
    return NextResponse.json(
      { error: "Error al eliminar configuración" },
      { status: 500 }
    );
  }
}
