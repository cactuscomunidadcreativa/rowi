/**
 * 💬 Slack App Configuration
 * ============================================================
 * Lazy + async loader: lee credenciales primero desde SystemConfig
 * (tabla DB editable vía /hub/admin/settings, encriptada AES-256-GCM)
 * y cae a `process.env.SLACK_*` como fallback.
 *
 * Cache 5 min por instancia serverless (mismo patrón que
 * src/lib/stripe/client.ts y telemetry). El admin puede rotar las
 * claves en el UI y los cambios entran a producción en máximo 5 min
 * sin redeploy. Para forzar refresh inmediato hay `refreshSlackConfig()`
 * (llamado desde /api/admin/settings al actualizar SystemConfig).
 * ============================================================
 */

import crypto from "crypto";

type SlackCfg = {
  clientId: string;
  clientSecret: string;
  signingSecret: string;
  loadedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: SlackCfg | null = null;

/**
 * Resuelve la configuración de Slack — primero SystemConfig (DB)
 * con fallback a env. Cached 5 min.
 */
async function loadSlackConfig(): Promise<SlackCfg> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache;
  }

  let clientId = "";
  let clientSecret = "";
  let signingSecret = "";

  try {
    // Dynamic import para no traer prisma en bundles que no lo necesiten.
    const { getSystemConfigs } = await import("@/lib/config/systemConfig");
    const cfg = await getSystemConfigs([
      "SLACK_CLIENT_ID",
      "SLACK_CLIENT_SECRET",
      "SLACK_SIGNING_SECRET",
    ]);
    clientId = cfg.SLACK_CLIENT_ID || "";
    clientSecret = cfg.SLACK_CLIENT_SECRET || "";
    signingSecret = cfg.SLACK_SIGNING_SECRET || "";
  } catch {
    // DB no alcanzable (build time, tests, etc) — fallback a env.
  }

  // Env override siempre — si el admin no llenó SystemConfig, env gana.
  if (!clientId) clientId = process.env.SLACK_CLIENT_ID || "";
  if (!clientSecret) clientSecret = process.env.SLACK_CLIENT_SECRET || "";
  if (!signingSecret) signingSecret = process.env.SLACK_SIGNING_SECRET || "";

  cache = {
    clientId,
    clientSecret,
    signingSecret,
    loadedAt: Date.now(),
  };
  return cache;
}

/**
 * Configuración Slack actual (clientId / clientSecret / signingSecret).
 * Strings vacíos si no están configurados en ningún lado.
 */
export async function getSlackConfig(): Promise<{
  clientId: string;
  clientSecret: string;
  signingSecret: string;
}> {
  const cfg = await loadSlackConfig();
  return {
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    signingSecret: cfg.signingSecret,
  };
}

/**
 * Invalida el cache. Llamar desde el endpoint que actualiza
 * SystemConfig (/api/admin/settings) para que los cambios entren
 * sin esperar al TTL de 5 min.
 */
export function refreshSlackConfig(): void {
  cache = null;
}

/**
 * Verifica la firma de un request entrante de Slack.
 *
 * Implementación oficial:
 *   1. base string = `v0:${timestamp}:${rawBody}`
 *   2. HMAC-SHA256 de la base string con el signing secret
 *   3. comparar `v0=${hash}` con el header `x-slack-signature`
 *      usando crypto.timingSafeEqual (resistente a timing attacks).
 *
 * Rechaza si el timestamp tiene más de 5 min de antigüedad (replay).
 *
 * @returns true si la firma es válida y el timestamp es reciente.
 */
export function verifySlackSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  if (!signingSecret || !timestamp || !signature) return false;

  // Anti-replay: el timestamp viene en segundos epoch.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const fiveMinutes = 60 * 5;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - ts) > fiveMinutes) {
    return false;
  }

  const baseString = `v0:${timestamp}:${rawBody}`;
  const hmac = crypto.createHmac("sha256", signingSecret);
  hmac.update(baseString, "utf8");
  const expected = `v0=${hmac.digest("hex")}`;

  // Comparación en tiempo constante. timingSafeEqual exige buffers del
  // mismo tamaño, así que comparamos longitud primero.
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Devuelve el bot token (`xoxb-...`) en claro para un team de Slack,
 * desencriptando `botTokenEnc` de SlackInstallation. `null` si no hay
 * instalación para ese team.
 */
export async function getBotTokenForTeam(
  teamId: string
): Promise<string | null> {
  try {
    const { prisma } = await import("@/core/prisma");
    const { decryptValue } = await import("@/lib/config/systemConfig");

    const install = await prisma.slackInstallation.findUnique({
      where: { teamId },
      select: { botTokenEnc: true },
    });
    if (!install?.botTokenEnc) return null;
    return decryptValue(install.botTokenEnc);
  } catch {
    return null;
  }
}
