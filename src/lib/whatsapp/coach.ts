/**
 * =========================================================
 * 💬 Rowi Coach AI — adaptador para WhatsApp (Twilio)
 * =========================================================
 * Espejo del adaptador de Slack. NO reimplementa la lógica de IA: reutiliza
 * `askRowiCoach` (src/lib/slack/coach.ts), que ya resuelve el AgentConfig por
 * contexto, carga historial, construye el prompt y llama a OpenAI. Aquí solo
 * resolvemos la IDENTIDAD: número de WhatsApp entrante → User de Rowi.
 *
 * Identidad sin tabla nueva: el número se busca en
 * NotificationPreference.whatsappNumber (campo ya existente, usado por el
 * canal saliente). Así no duplicamos un SlackUserLink-equivalente — el
 * usuario vincula su WhatsApp en sus preferencias de notificación.
 * =========================================================
 */

import { prisma } from "@/core/prisma";
import { askRowiCoach, type AskRowiCoachResult } from "@/lib/slack/coach";

/** Normaliza un número a solo dígitos para comparar variantes de formato. */
function digitsOnly(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

/**
 * Resuelve el User de Rowi a partir del número de WhatsApp entrante.
 * Compara por dígitos (ignora `+`, espacios, guiones y el prefijo
 * `whatsapp:` que Twilio antepone). Solo considera números verificados.
 *
 * @returns userId o null si no hay vínculo.
 */
export async function resolveUserByWhatsApp(fromNumber: string): Promise<string | null> {
  const incoming = digitsOnly(fromNumber.replace(/^whatsapp:/i, ""));
  if (!incoming) return null;

  // El set de números verificados suele ser pequeño; traemos candidatos y
  // comparamos por sufijo de dígitos para tolerar diferencias de formato
  // (con/sin código de país, con/sin cero inicial).
  const prefs = await prisma.notificationPreference.findMany({
    where: { whatsappVerified: true, whatsappNumber: { not: null } },
    select: { userId: true, whatsappNumber: true },
  });

  for (const p of prefs) {
    const stored = digitsOnly(p.whatsappNumber || "");
    if (!stored) continue;
    if (stored === incoming || incoming.endsWith(stored) || stored.endsWith(incoming)) {
      return p.userId;
    }
  }
  return null;
}

/**
 * Procesa un mensaje entrante de WhatsApp: resuelve identidad y delega al
 * coach compartido. Devuelve el texto a responder (o un mensaje de ayuda si
 * el número no está vinculado).
 */
export async function handleWhatsAppMessage(
  fromNumber: string,
  text: string
): Promise<AskRowiCoachResult> {
  const userId = await resolveUserByWhatsApp(fromNumber);
  if (!userId) {
    return {
      ok: false,
      text:
        "Para conversar conmigo por WhatsApp, primero vincula y verifica este número en tus preferencias de notificación dentro de Rowi (www.rowiia.com).",
    };
  }
  return askRowiCoach(userId, text, { channel: "whatsapp" });
}
