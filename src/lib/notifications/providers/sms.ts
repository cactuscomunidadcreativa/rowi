// src/lib/notifications/providers/sms.ts
// ============================================================
// SMS & WhatsApp Provider (Twilio)
// ============================================================

import { NotificationResult } from "../types";
import { NotificationType } from "@prisma/client";

interface SMSNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  actionUrl: string | null;
  recipient: {
    phone?: string;
  };
  locale: string;
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(notification: SMSNotification): Promise<NotificationResult> {
  const { recipient, title, message, id } = notification;

  if (!recipient.phone) {
    return { success: false, error: "No phone number provided" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn("[SMS] Twilio not configured, skipping SMS");
    return { success: false, error: "SMS provider not configured" };
  }

  try {
    // Build SMS message (max 160 chars for single SMS)
    const smsBody = title ? `${title}\n\n${message}` : message;
    const truncatedBody = smsBody.length > 1600 ? smsBody.slice(0, 1597) + "..." : smsBody;

    // Twilio API call
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formatPhoneNumber(recipient.phone),
        From: fromNumber,
        Body: truncatedBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[SMS] Twilio error:", error);
      return { success: false, error: error.message || `Twilio error: ${response.status}` };
    }

    const data = await response.json();
    console.log("[SMS] Sent successfully:", data.sid);

    return {
      success: true,
      notificationId: id,
      channel: "SMS",
      externalId: data.sid,
    };
  } catch (error) {
    console.error("[SMS] Error sending:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsApp(notification: SMSNotification): Promise<NotificationResult> {
  const { recipient, title, message, actionUrl, id } = notification;

  if (!recipient.phone) {
    return { success: false, error: "No phone number provided" };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !whatsappNumber) {
    console.warn("[WhatsApp] Twilio WhatsApp not configured, skipping");
    return { success: false, error: "WhatsApp provider not configured" };
  }

  try {
    // Build WhatsApp message (supports longer content)
    let body = title ? `*${title}*\n\n${message}` : message;

    // Add action URL if present
    if (actionUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://rowi.app";
      body += `\n\n${baseUrl}${actionUrl}`;
    }

    // Twilio API call
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `whatsapp:${formatPhoneNumber(recipient.phone)}`,
        From: `whatsapp:${whatsappNumber}`,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[WhatsApp] Twilio error:", error);
      return { success: false, error: error.message || `Twilio error: ${response.status}` };
    }

    const data = await response.json();
    console.log("[WhatsApp] Sent successfully:", data.sid);

    return {
      success: true,
      notificationId: id,
      channel: "WHATSAPP",
      externalId: data.sid,
    };
  } catch (error) {
    console.error("[WhatsApp] Error sending:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If already has country code (starts with +), return as is
  if (phone.startsWith("+")) {
    return `+${digits}`;
  }

  // If 10 digits, assume US/Mexico and add +1 or +52
  if (digits.length === 10) {
    // Default to Mexico (+52) - can be configured
    const defaultCountryCode = process.env.DEFAULT_PHONE_COUNTRY_CODE || "52";
    return `+${defaultCountryCode}${digits}`;
  }

  // If 11+ digits, assume country code is included
  if (digits.length >= 11) {
    return `+${digits}`;
  }

  // Return as-is with + prefix
  return `+${digits}`;
}

/**
 * Verify Twilio configuration
 */
export async function verifyTwilioConfig(): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) return false;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get SMS delivery status from Twilio
 */
export async function getSMSStatus(messageSid: string): Promise<string> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return "unknown";
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageSid}.json`;
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!response.ok) {
      return "unknown";
    }

    const data = await response.json();
    return data.status; // queued, sending, sent, delivered, undelivered, failed
  } catch {
    return "unknown";
  }
}
