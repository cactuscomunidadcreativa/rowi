/**
 * 📧 Gmail — config (OAuth Google).
 *
 * Lazy loader desde SystemConfig (DB encriptada) → env, cache 5 min, espejo de
 * lib/slack/config.ts. Permite a un usuario conectar su Gmail para que ECO envíe
 * los mensajes compuestos directamente desde su cuenta (en vez de mailto:).
 *
 * Credenciales: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (consola Google Cloud).
 * El redirect_uri es canónico y estable (no derivado del host, que en Vercel
 * resuelve a la URL interna que Google rechaza — mismo motivo que Slack).
 */
type GmailCfg = {
  clientId: string;
  clientSecret: string;
  loadedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: GmailCfg | null = null;

async function loadGmailConfig(): Promise<GmailCfg> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache;

  let clientId = "";
  let clientSecret = "";
  try {
    const { getSystemConfigs } = await import("@/lib/config/systemConfig");
    const cfg = await getSystemConfigs(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]);
    clientId = cfg.GOOGLE_CLIENT_ID || "";
    clientSecret = cfg.GOOGLE_CLIENT_SECRET || "";
  } catch {
    // build/tests sin DB → env.
  }
  if (!clientId) clientId = process.env.GOOGLE_CLIENT_ID || "";
  if (!clientSecret) clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  cache = { clientId, clientSecret, loadedAt: Date.now() };
  return cache;
}

export async function getGmailConfig(): Promise<{ clientId: string; clientSecret: string }> {
  const cfg = await loadGmailConfig();
  return { clientId: cfg.clientId, clientSecret: cfg.clientSecret };
}

export function refreshGmailConfig(): void {
  cache = null;
}

/** redirect_uri canónico (debe coincidir EXACTO con el de la consola Google). */
export function getGmailRedirectUri(): string {
  const override = process.env.GOOGLE_GMAIL_REDIRECT_URI;
  if (override) return override.replace(/\/$/, "");
  return "https://www.rowiia.com/api/integrations/gmail/callback";
}

/** Scope mínimo para ENVIAR correo en nombre del usuario. */
export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");
