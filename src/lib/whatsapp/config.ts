/**
 * 💬 WhatsApp (Twilio) Configuration
 * ============================================================
 * Lazy + async loader: lee credenciales primero desde SystemConfig
 * (tabla DB editable vía /hub/admin/settings, encriptada AES-256-GCM)
 * y cae a `process.env.TWILIO_*` como fallback.
 *
 * Mismo patrón que src/lib/slack/config.ts y stripe/client.ts: cache 5 min
 * por instancia serverless. El admin puede rotar las claves en el UI y los
 * cambios entran a producción en máximo 5 min sin redeploy. Para forzar
 * refresh inmediato hay `refreshWhatsAppConfig()` (llamado desde
 * /api/admin/settings al actualizar SystemConfig).
 * ============================================================
 */

import crypto from "crypto";

type WhatsAppCfg = {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
  loadedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: WhatsAppCfg | null = null;

async function loadWhatsAppConfig(): Promise<WhatsAppCfg> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache;
  }

  let accountSid = "";
  let authToken = "";
  let whatsappNumber = "";

  try {
    const { getSystemConfigs } = await import("@/lib/config/systemConfig");
    const cfg = await getSystemConfigs([
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_WHATSAPP_NUMBER",
    ]);
    accountSid = cfg.TWILIO_ACCOUNT_SID || "";
    authToken = cfg.TWILIO_AUTH_TOKEN || "";
    whatsappNumber = cfg.TWILIO_WHATSAPP_NUMBER || "";
  } catch {
    // DB no alcanzable (build time, tests) — fallback a env.
  }

  if (!accountSid) accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  if (!authToken) authToken = process.env.TWILIO_AUTH_TOKEN || "";
  if (!whatsappNumber) whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "";

  cache = { accountSid, authToken, whatsappNumber, loadedAt: Date.now() };
  return cache;
}

/**
 * Configuración Twilio/WhatsApp actual. Strings vacíos si no está
 * configurado en ningún lado.
 */
export async function getWhatsAppConfig(): Promise<{
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}> {
  const cfg = await loadWhatsAppConfig();
  return {
    accountSid: cfg.accountSid,
    authToken: cfg.authToken,
    whatsappNumber: cfg.whatsappNumber,
  };
}

/**
 * Invalida el cache. Llamar desde /api/admin/settings al actualizar una
 * credencial TWILIO_* para que el cambio entre sin esperar al TTL.
 */
export function refreshWhatsAppConfig(): void {
  cache = null;
}

/**
 * Verifica la firma de un webhook entrante de Twilio.
 *
 * Algoritmo oficial de Twilio (distinto al de Slack):
 *   1. Tomar la URL completa del webhook (tal como Twilio la llamó).
 *   2. Ordenar los parámetros POST por nombre y concatenar key+value
 *      (sin separadores) a la URL.
 *   3. HMAC-SHA1 de esa cadena con el Auth Token, codificado en base64.
 *   4. Comparar con el header `X-Twilio-Signature` en tiempo constante.
 *
 * @param url        URL pública exacta del webhook (https://www.rowiia.com/...).
 * @param params     parámetros POST (form-urlencoded) como objeto plano.
 * @param signature  valor del header X-Twilio-Signature.
 * @param authToken  Twilio Auth Token.
 * @returns true si la firma es válida.
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): boolean {
  if (!authToken || !signature || !url) return false;

  // Cadena base = URL + concatenación de (key + value) ordenados por key.
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");

  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * URL pública canónica del webhook entrante de WhatsApp. Debe coincidir
 * EXACTAMENTE con la configurada en la consola de Twilio y con la que se
 * usa para verificar la firma (Twilio firma sobre la URL que llamó). Por
 * el mismo motivo que Slack, hardcodeamos producción; override solo vía
 * TWILIO_WHATSAPP_WEBHOOK_URL si hiciera falta (e.g. staging).
 */
export function getWhatsAppWebhookUrl(): string {
  const override = process.env.TWILIO_WHATSAPP_WEBHOOK_URL;
  if (override) return override.replace(/\/$/, "");
  return "https://www.rowiia.com/api/integrations/whatsapp/webhook";
}
