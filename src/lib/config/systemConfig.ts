/**
 * =========================================================
 * 🔐 System Config — Gestión segura de claves del sistema
 * =========================================================
 *
 * Este módulo maneja la lectura/escritura de configuraciones
 * sensibles del sistema (API keys, secrets, etc.)
 *
 * Prioridad de lectura:
 * 1. Base de datos (SystemConfig) - si existe y está activa
 * 2. Variables de entorno (.env) - como fallback
 *
 * Las claves se almacenan encriptadas en la BD usando AES-256-GCM
 */

import { prisma } from "@/core/prisma";
import crypto from "crypto";

// Clave de encriptación derivada del NEXTAUTH_SECRET
// 🔐 SEGURIDAD: No usar fallback predecible - NEXTAUTH_SECRET es requerido
const getEncryptionKey = (): Buffer => {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      "🔐 CRITICAL: NEXTAUTH_SECRET is required for encryption. " +
      "Please set this environment variable with a secure random string (min 32 chars)."
    );
  }

  if (secret.length < 32) {
    console.warn(
      "⚠️ WARNING: NEXTAUTH_SECRET should be at least 32 characters for security. " +
      "Current length: " + secret.length
    );
  }

  // Usar SHA-256 para obtener exactamente 32 bytes
  return crypto.createHash("sha256").update(secret).digest();
};

/**
 * Encripta un valor usando AES-256-GCM
 */
export function encryptValue(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Formato: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Desencripta un valor usando AES-256-GCM
 */
export function decryptValue(encryptedText: string): string {
  const parts = encryptedText.split(":");

  // Path de migración legítimo: el valor nunca se encriptó (no tiene la forma
  // iv:authTag:ciphertext). Devolverlo tal cual NO es un downgrade.
  if (parts.length !== 3) {
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    // El valor TENÍA forma de cifrado pero el descifrado falló: clave rotada,
    // datos corruptos o authTag inválido. NUNCA devolver el ciphertext crudo
    // (downgrade silencioso) — devolver vacío y registrar. Los callers tratan
    // "" como "sin valor configurado", no como secreto válido.
    console.error("[systemConfig] decryptValue failed — returning empty (no plaintext/ciphertext leak)");
    return "";
  }
}

/**
 * Categorías de configuración
 */
export type ConfigCategory =
  | "ai"
  | "auth"
  | "email"
  | "payments"
  | "general"
  | "database"
  | "observability"
  | "integrations";

/**
 * Definición de claves del sistema
 */
export const SYSTEM_CONFIG_KEYS = {
  // IA
  OPENAI_API_KEY: { category: "ai" as ConfigCategory, description: "API Key de OpenAI", isSecret: true },
  ANTHROPIC_API_KEY: { category: "ai" as ConfigCategory, description: "API Key de Anthropic (Claude) — modelos pesados: consultor, reportes, presentaciones", isSecret: true },

  // Auth
  GOOGLE_CLIENT_ID: { category: "auth" as ConfigCategory, description: "Google OAuth Client ID", isSecret: false },
  GOOGLE_CLIENT_SECRET: { category: "auth" as ConfigCategory, description: "Google OAuth Client Secret", isSecret: true },
  NEXTAUTH_SECRET: { category: "auth" as ConfigCategory, description: "NextAuth Secret", isSecret: true },

  // Email
  RESEND_API_KEY: { category: "email" as ConfigCategory, description: "Resend API Key para emails", isSecret: true },

  // Payments
  STRIPE_SECRET_KEY: { category: "payments" as ConfigCategory, description: "Stripe Secret Key", isSecret: true },
  STRIPE_WEBHOOK_SECRET: { category: "payments" as ConfigCategory, description: "Stripe Webhook Secret", isSecret: true },
  STRIPE_PUBLISHABLE_KEY: { category: "payments" as ConfigCategory, description: "Stripe Publishable Key", isSecret: false },

  // Database
  DATABASE_URL: { category: "database" as ConfigCategory, description: "URL de conexión a PostgreSQL", isSecret: true },

  // General
  HUB_ACCESS_KEY: { category: "general" as ConfigCategory, description: "Clave de acceso del Hub", isSecret: true },
  HUB_ADMINS: { category: "general" as ConfigCategory, description: "Emails de administradores (separados por coma)", isSecret: false },

  // Observability — Sentry / Axiom / slow-query tuning.
  // Server-side captures via src/lib/telemetry pick these up from DB first,
  // env vars as fallback. NEXT_PUBLIC_SENTRY_DSN must additionally be set
  // in Vercel env for the browser bundle to see it.
  TELEMETRY_PROVIDER: { category: "observability" as ConfigCategory, description: "Backend de telemetría: log_only | sentry | axiom", isSecret: false },
  SENTRY_DSN: { category: "observability" as ConfigCategory, description: "Sentry DSN (server + edge runtime)", isSecret: true },
  NEXT_PUBLIC_SENTRY_DSN: { category: "observability" as ConfigCategory, description: "Sentry DSN para el browser (también debe ir en Vercel env para que el bundle del cliente lo vea)", isSecret: true },
  AXIOM_TOKEN: { category: "observability" as ConfigCategory, description: "Axiom Ingest Token", isSecret: true },
  AXIOM_DATASET: { category: "observability" as ConfigCategory, description: "Axiom dataset name (default: rowi_errors)", isSecret: false },
  PRISMA_SLOW_QUERY_MS: { category: "observability" as ConfigCategory, description: "Threshold en ms para logear queries lentas (default: 500). NOTA: solo se lee al boot; cambios requieren redeploy.", isSecret: false },

  // Integrations — Slack App (OAuth + Events). El backend de Slack lee
  // estas claves desde SystemConfig primero, env vars como fallback
  // (mismo patrón que Stripe).
  SLACK_CLIENT_ID: { category: "integrations" as ConfigCategory, description: "Slack App Client ID", isSecret: false },
  SLACK_CLIENT_SECRET: { category: "integrations" as ConfigCategory, description: "Slack App Client Secret", isSecret: true },
  SLACK_SIGNING_SECRET: { category: "integrations" as ConfigCategory, description: "Slack App Signing Secret (verifica eventos entrantes)", isSecret: true },

  // Integrations — WhatsApp (Twilio). Bidireccional como Slack: el backend
  // lee estas claves desde SystemConfig primero, env vars como fallback.
  TWILIO_ACCOUNT_SID: { category: "integrations" as ConfigCategory, description: "Twilio Account SID (WhatsApp)", isSecret: false },
  TWILIO_AUTH_TOKEN: { category: "integrations" as ConfigCategory, description: "Twilio Auth Token (firma webhooks entrantes + envío)", isSecret: true },
  TWILIO_WHATSAPP_NUMBER: { category: "integrations" as ConfigCategory, description: "Número WhatsApp de Twilio (formato +14155238886, sin prefijo whatsapp:)", isSecret: false },
} as const;

export type SystemConfigKey = keyof typeof SYSTEM_CONFIG_KEYS;

/**
 * Obtiene una configuración del sistema
 * Prioridad: BD > ENV
 */
export async function getSystemConfig(key: SystemConfigKey): Promise<string | null> {
  try {
    // Intentar obtener de la BD primero
    const config = await prisma.systemConfig.findUnique({
      where: { key, isActive: true },
    });

    if (config?.value) {
      return decryptValue(config.value);
    }

    // Fallback a variable de entorno
    return process.env[key] || null;
  } catch {
    // Si hay error de BD, usar variable de entorno
    return process.env[key] || null;
  }
}

/**
 * Obtiene múltiples configuraciones del sistema
 */
export async function getSystemConfigs(keys: SystemConfigKey[]): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};

  // Obtener todas las claves de la BD en una sola query
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys }, isActive: true },
    });

    const configMap = new Map(configs.map(c => [c.key, decryptValue(c.value)]));

    for (const key of keys) {
      result[key] = configMap.get(key) || process.env[key] || null;
    }
  } catch {
    // Fallback a variables de entorno
    for (const key of keys) {
      result[key] = process.env[key] || null;
    }
  }

  return result;
}

/**
 * Guarda una configuración del sistema (encriptada)
 */
export async function setSystemConfig(
  key: SystemConfigKey,
  value: string,
  updatedBy?: string
): Promise<void> {
  const keyInfo = SYSTEM_CONFIG_KEYS[key];
  const encryptedValue = encryptValue(value);

  await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value: encryptedValue,
      updatedAt: new Date(),
      updatedBy,
    },
    create: {
      key,
      value: encryptedValue,
      category: keyInfo.category,
      description: keyInfo.description,
      isSecret: keyInfo.isSecret,
      updatedBy,
    },
  });
}

/**
 * Lista todas las configuraciones (sin valores sensibles)
 */
export async function listSystemConfigs(): Promise<Array<{
  key: string;
  category: string;
  description: string | null;
  isSecret: boolean;
  isActive: boolean;
  hasValue: boolean;
  updatedAt: Date;
}>> {
  const configs = await prisma.systemConfig.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });

  // Agregar claves que no están en BD pero sí en ENV
  const existingKeys = new Set(configs.map(c => c.key));
  const allConfigs = [...configs];

  for (const [key, info] of Object.entries(SYSTEM_CONFIG_KEYS)) {
    if (!existingKeys.has(key)) {
      const envValue = process.env[key];
      allConfigs.push({
        id: `env_${key}`,
        key,
        value: envValue || "",
        category: info.category,
        description: info.description,
        isSecret: info.isSecret,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: null,
      });
    }
  }

  return allConfigs.map(config => ({
    key: config.key,
    category: config.category,
    description: config.description,
    isSecret: config.isSecret,
    isActive: config.isActive,
    hasValue: !!config.value,
    updatedAt: config.updatedAt,
  }));
}

/**
 * Obtiene el valor de una configuración para mostrar en UI
 * (oculta parcialmente si es secret)
 */
export async function getConfigValueForUI(key: SystemConfigKey): Promise<string | null> {
  const value = await getSystemConfig(key);
  if (!value) return null;

  const keyInfo = SYSTEM_CONFIG_KEYS[key];
  if (keyInfo.isSecret && value.length > 8) {
    // Mostrar solo los primeros 4 y últimos 4 caracteres
    return `${value.slice(0, 4)}${"*".repeat(Math.min(value.length - 8, 20))}${value.slice(-4)}`;
  }

  return value;
}

/**
 * Elimina una configuración del sistema
 */
export async function deleteSystemConfig(key: SystemConfigKey): Promise<void> {
  await prisma.systemConfig.delete({
    where: { key },
  }).catch(() => {
    // Ignorar si no existe
  });
}

/**
 * Verifica si una clave tiene valor configurado
 */
export async function hasSystemConfig(key: SystemConfigKey): Promise<boolean> {
  const value = await getSystemConfig(key);
  return !!value;
}
