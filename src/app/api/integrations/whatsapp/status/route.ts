/**
 * 💬 GET /api/integrations/whatsapp/status
 * ============================================================
 * Estado de conexión de WhatsApp (Twilio) para el panel de integraciones.
 * A diferencia de Slack (OAuth por workspace), WhatsApp/Twilio se conecta por
 * credenciales en SystemConfig, así que "conectado" = hay credenciales válidas
 * configuradas. NUNCA devuelve las claves — solo el booleano y el número.
 * ============================================================
 */
import { NextResponse } from "next/server";
import { requireAuth } from "@/core/auth/requireAdmin";
import { getWhatsAppConfig, getWhatsAppWebhookUrl } from "@/lib/whatsapp/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const cfg = await getWhatsAppConfig();
  const connected = !!(cfg.accountSid && cfg.authToken && cfg.whatsappNumber);

  return NextResponse.json({
    ok: true,
    connected,
    // Solo metadatos no sensibles para mostrar en el panel.
    number: connected ? cfg.whatsappNumber : null,
    webhookUrl: getWhatsAppWebhookUrl(),
  });
}
