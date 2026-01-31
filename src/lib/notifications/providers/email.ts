// src/lib/notifications/providers/email.ts
// ============================================================
// Email Provider (Resend)
// ============================================================

import { NotificationResult } from "../types";
import { NotificationType } from "@prisma/client";

interface EmailNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  actionUrl: string | null;
  recipient: {
    email?: string;
  };
  locale: string;
}

// Simple email template
function buildEmailHtml(
  title: string,
  message: string,
  actionUrl: string | null,
  locale: string
): string {
  const buttonText = locale === "es" ? "Ver mas" : "View more";
  const footerText =
    locale === "es"
      ? "Este correo fue enviado por Rowi. Si no deseas recibir mas notificaciones, actualiza tus preferencias."
      : "This email was sent by Rowi. If you don't want to receive more notifications, update your preferences.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px 32px;">
      <img src="https://rowi.app/logo-white.png" alt="Rowi" style="height: 32px; display: block;" />
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1f2937;">${title}</h1>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">${message}</p>

      ${
        actionUrl
          ? `
      <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">
        ${buttonText}
      </a>
      `
          : ""
      }
    </div>

    <!-- Footer -->
    <div style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
        ${footerText}
      </p>
    </div>
  </div>
</body>
</html>
`;
}

export async function sendEmail(notification: EmailNotification): Promise<NotificationResult> {
  const { recipient, title, message, actionUrl, locale, id } = notification;

  if (!recipient.email) {
    return { success: false, error: "No email address provided" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email provider not configured" };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@rowi.app";
  const fromName = process.env.RESEND_FROM_NAME || "Rowi";

  try {
    const html = buildEmailHtml(title || "Notification", message, actionUrl, locale);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [recipient.email],
        subject: title || "Notification from Rowi",
        html,
        text: message,
        tags: [
          { name: "notification_id", value: id },
          { name: "type", value: notification.type },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Email] Resend error:", error);
      return { success: false, error: `Resend error: ${response.status}` };
    }

    const data = await response.json();
    console.log("[Email] Sent successfully:", data.id);

    return {
      success: true,
      notificationId: id,
      channel: "EMAIL",
      externalId: data.id,
    };
  } catch (error) {
    console.error("[Email] Error sending:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
