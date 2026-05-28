/**
 * 💬 WhatsApp outbound (Twilio) — enviar un mensaje a un número.
 *
 * Espejo de src/lib/slack/postMessage.ts. Lee credenciales desde
 * getWhatsAppConfig() (SystemConfig → env), no de process.env directo, para
 * que el canal entrante use la misma fuente que el resto de la integración.
 *
 * Nota: el provider de notificaciones saliente (src/lib/notifications/
 * providers/sms.ts) sigue leyendo de env por ahora; este helper es el camino
 * bidireccional (respuestas del Coach) y comparte la config cacheada.
 */

import { getWhatsAppConfig } from "./config";
import { secureLog } from "@/lib/logging";

/** Normaliza a `whatsapp:+E164` para la API de Twilio. */
function toWhatsAppAddress(phone: string): string {
  const cleaned = phone.replace(/^whatsapp:/i, "").trim();
  const withPlus = cleaned.startsWith("+") ? cleaned : `+${cleaned.replace(/\D/g, "")}`;
  return `whatsapp:${withPlus}`;
}

export async function postWhatsAppMessage(opts: {
  to: string;
  text: string;
}): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const { to, text } = opts;
  const { accountSid, authToken, whatsappNumber } = await getWhatsAppConfig();

  if (!accountSid || !authToken || !whatsappNumber) {
    secureLog.warn("whatsapp.post.not_configured");
    return { ok: false, error: "WhatsApp (Twilio) no configurado" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: toWhatsAppAddress(to),
        From: `whatsapp:${whatsappNumber.startsWith("+") ? whatsappNumber : `+${whatsappNumber.replace(/\D/g, "")}`}`,
        Body: text.slice(0, 1500),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      secureLog.warn("whatsapp.post.twilio_error", { status: response.status });
      return { ok: false, error: err.message || `Twilio ${response.status}` };
    }

    const data = await response.json();
    return { ok: true, sid: data.sid };
  } catch (err) {
    secureLog.error("whatsapp.post.failed", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
