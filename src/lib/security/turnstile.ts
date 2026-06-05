/**
 * Cloudflare Turnstile — verificación de captcha server-side.
 *
 * ACTIVACIÓN (sin esto, el captcha se omite y NO bloquea nada):
 *   1. Crear un widget en https://dash.cloudflare.com/?to=/:account/turnstile
 *   2. Env vars:
 *        TURNSTILE_SECRET_KEY            (servidor — secreto)
 *        NEXT_PUBLIC_TURNSTILE_SITE_KEY  (cliente — público, build-time)
 *   3. Renderizar el widget en login/register y enviar el token como
 *      `turnstileToken` en el body. El backend llama a verifyTurnstile().
 *
 * Diseño fail-safe: si TURNSTILE_SECRET_KEY no está configurada, verifyTurnstile
 * devuelve `{ ok: true, skipped: true }` — el captcha es opt-in y nunca rompe
 * el flujo existente. El rate limit (rateLimiters.authStrict) sigue activo como
 * primera capa aunque el captcha esté apagado.
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/** ¿Está Turnstile configurado (hay secret key)? */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

/**
 * Verifica un token de Turnstile contra la API de Cloudflare.
 * Si no está configurado, se omite (ok:true, skipped:true).
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };

  if (!token) return { ok: false, error: "missing_captcha" };

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteIp) form.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success ? { ok: true } : { ok: false, error: "captcha_failed" };
  } catch {
    // No bloqueamos por un fallo de red hacia Cloudflare: el rate limit ya
    // protege. Registramos como skipped para no romper el login legítimo.
    return { ok: true, skipped: true, error: "captcha_unreachable" };
  }
}
