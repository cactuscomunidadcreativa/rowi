/**
 * 💳 Stripe Client Configuration
 * ============================================================
 * Lazy + async loader: lee credenciales primero desde SystemConfig
 * (tabla DB editable vía /hub/admin/settings, encriptada AES-256-GCM)
 * y cae a `process.env.STRIPE_*` como fallback.
 *
 * Cache 5 min por instancia serverless (igual patrón que telemetry).
 * Admin puede rotar claves en el UI y los cambios entran a producción
 * en máximo 5 min sin redeploy. Para forzar refresh inmediato hay
 * `refreshStripeConfig()` (llamado desde el endpoint que actualiza
 * SystemConfig).
 *
 * Para retro-compat con módulos legacy se exporta un getter `stripe`
 * vía Proxy que dispara la carga sync usando solo env vars — el patrón
 * recomendado es `await getStripeClient()`.
 * ============================================================
 */

import Stripe from "stripe";

type StripeCfg = {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
  loadedAt: number;
  stripeClient: Stripe | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: StripeCfg | null = null;

function buildStripe(secretKey: string): Stripe | null {
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
    typescript: true,
  });
}

/**
 * Resuelve la configuración de Stripe — primero SystemConfig (DB)
 * con fallback a env. Cached 5 min.
 */
async function loadStripeConfig(): Promise<StripeCfg> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache;
  }

  let secretKey = "";
  let webhookSecret = "";
  let publishableKey = "";

  try {
    // Dynamic import para no traer prisma en bundles que no lo necesiten
    // (e.g. client components que importen tipos de aquí).
    const { getSystemConfigs } = await import("@/lib/config/systemConfig");
    const cfg = await getSystemConfigs([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PUBLISHABLE_KEY",
    ]);
    secretKey = cfg.STRIPE_SECRET_KEY || "";
    webhookSecret = cfg.STRIPE_WEBHOOK_SECRET || "";
    publishableKey = cfg.STRIPE_PUBLISHABLE_KEY || "";
  } catch {
    // DB no alcanzable (build time, tests, etc) — fallback a env.
  }

  // Env override siempre — si el admin no llenó SystemConfig, env gana.
  if (!secretKey) secretKey = process.env.STRIPE_SECRET_KEY || "";
  if (!webhookSecret) webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!publishableKey) {
    publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  }

  cache = {
    secretKey,
    webhookSecret,
    publishableKey,
    loadedAt: Date.now(),
    stripeClient: buildStripe(secretKey),
  };
  return cache;
}

/**
 * Cliente Stripe inicializado con la secret key actual.
 * `null` si no hay clave configurada en ningún lado.
 */
export async function getStripeClient(): Promise<Stripe | null> {
  const cfg = await loadStripeConfig();
  return cfg.stripeClient;
}

/**
 * Webhook signing secret actual. Vacío si no está configurado.
 */
export async function getStripeWebhookSecret(): Promise<string> {
  const cfg = await loadStripeConfig();
  return cfg.webhookSecret;
}

/**
 * Publishable key (segura de exponer al cliente; va en el bundle).
 */
export async function getStripePublishableKey(): Promise<string> {
  const cfg = await loadStripeConfig();
  return cfg.publishableKey;
}

/**
 * Invalida el cache. Llamar desde el endpoint que actualiza
 * SystemConfig (/api/admin/settings) para que los cambios entren
 * sin esperar al TTL.
 */
export function refreshStripeConfig(): void {
  cache = null;
}

/**
 * Helper sync que devuelve true si la secret key está disponible
 * (sea por env o por SystemConfig pre-cargado). No fuerza load —
 * para chequeo inmediato durante request.
 */
export async function isStripeConfigured(): Promise<boolean> {
  return !!(await getStripeClient());
}

/**
 * @deprecated Usa `getStripeClient()`. Este export usa solo env vars
 * y se queda atrás si el admin rota la clave en SystemConfig.
 */
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? buildStripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * @deprecated Usa `getStripeWebhookSecret()`. Este export es estático
 * desde process.env y no refleja cambios en SystemConfig.
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Publishable key estática (env-only). Es seguro exponerla; sigue siendo
 * env-first porque vive en el bundle del cliente vía NEXT_PUBLIC_*.
 */
export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
