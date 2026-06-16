// src/lib/notifications/providers/push.ts
// ============================================================
// Push Notifications Provider (Web Push)
// ============================================================

import webpush from "web-push";
import { prisma } from "@/core/prisma";
import { NotificationResult } from "../types";
import { NotificationType } from "@prisma/client";

/**
 * web-push exige configurar las VAPID details una vez por proceso. Lo hacemos
 * de forma perezosa e idempotente: la primera vez que hay claves, se aplica;
 * si las claves no están, sendPush corta antes de llegar aquí.
 */
let vapidConfigured = false;
function ensureVapid(publicKey: string, privateKey: string, subject: string): void {
  if (vapidConfigured) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

interface PushNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  actionUrl: string | null;
  locale: string;
}

/**
 * Send push notification via Web Push API
 */
export async function sendPush(
  notification: PushNotification,
  userId: string
): Promise<NotificationResult> {
  const { title, message, actionUrl, id, type, metadata } = notification;

  // Get user's push subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      userId,
      active: true,
    },
  });

  if (subscriptions.length === 0) {
    console.log("[Push] No active subscriptions for user:", userId);
    return { success: false, error: "No push subscriptions found" };
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@rowi.app";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured, skipping push");
    return { success: false, error: "Push provider not configured" };
  }

  // Build push payload
  const payload = JSON.stringify({
    title: title || "Rowi",
    body: message,
    // Iconos que SÍ existen en public/ (los antiguos /icons/* daban 404; el SW
    // ya cae a este mismo asset). Mantiene coherencia con public/sw.js.
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png",
    tag: type,
    data: {
      notificationId: id,
      type,
      actionUrl,
      ...metadata,
    },
    actions: actionUrl
      ? [
          {
            action: "open",
            title: notification.locale === "es" ? "Abrir" : "Open",
          },
          {
            action: "dismiss",
            title: notification.locale === "es" ? "Cerrar" : "Dismiss",
          },
        ]
      : undefined,
    requireInteraction: type === "TASK_OVERDUE" || type === "SECURITY_ALERT",
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  });

  // Send to all subscriptions
  const results: boolean[] = [];
  // Solo desactivamos suscripciones MUERTAS (404/410). Un fallo transitorio
  // (red, 5xx del push service) NO debe borrar la suscripción del usuario.
  const goneSubscriptions: string[] = [];

  for (const subscription of subscriptions) {
    try {
      const { sent, gone } = await sendWebPush(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );

      results.push(sent);

      if (gone) {
        goneSubscriptions.push(subscription.id);
      } else if (sent) {
        // Update last used (solo en éxito real)
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { lastUsedAt: new Date() },
        });
      }
    } catch (error) {
      console.error("[Push] Error sending to subscription:", subscription.id, error);
      results.push(false);
    }
  }

  // Desactivar solo las suscripciones que el push service reportó como muertas.
  if (goneSubscriptions.length > 0) {
    await prisma.pushSubscription.updateMany({
      where: { id: { in: goneSubscriptions } },
      data: { active: false },
    });
  }

  const successCount = results.filter(Boolean).length;

  return {
    success: successCount > 0,
    notificationId: id,
    channel: "PUSH",
    externalId: `push_${successCount}_of_${subscriptions.length}`,
  };
}

/**
 * Resultado de un envío individual. `gone` distingue una suscripción muerta
 * (404/410 del push service → desactivar) de un fallo transitorio (reintentable).
 */
interface WebPushResult {
  sent: boolean;
  gone: boolean;
}

/**
 * Envía un push individual firmado con VAPID usando la librería web-push
 * (cifrado aes128gcm + JWT VAPID). Reemplaza el antiguo stub de fetch sin firma,
 * que los push services siempre rechazaban.
 */
async function sendWebPush(
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<WebPushResult> {
  try {
    ensureVapid(vapidPublicKey, vapidPrivateKey, vapidSubject);
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
      payload,
      { TTL: 86400 }
    );
    return { sent: true, gone: false };
  } catch (error) {
    // 404/410 = la suscripción ya no existe en el push service → desactivar.
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error as { statusCode?: number }).statusCode
        : undefined;
    if (statusCode === 404 || statusCode === 410) {
      console.log("[Push] Subscription gone:", subscription.endpoint);
      return { sent: false, gone: true };
    }
    console.error("[Push] Web push error:", error);
    return { sent: false, gone: false };
  }
}

/**
 * Subscribe a device for push notifications
 */
export async function subscribePush(
  userId: string,
  subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  },
  userAgent?: string,
  deviceName?: string
): Promise<string> {
  // Check if already exists
  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: subscription.endpoint },
  });

  if (existing) {
    // Reactivate if same user
    if (existing.userId === userId) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { active: true },
      });
      return existing.id;
    }
    // Transfer to new user (edge case)
    await prisma.pushSubscription.delete({ where: { id: existing.id } });
  }

  const record = await prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
      deviceName,
    },
  });

  return record.id;
}

/**
 * Unsubscribe a device from push notifications
 */
export async function unsubscribePush(endpoint: string): Promise<boolean> {
  try {
    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: { active: false },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get VAPID public key for client
 */
export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Generate VAPID keys (run once during setup)
 * node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log(keys);"
 */
export function generateVapidKeysCommand(): string {
  return `
To generate VAPID keys, run:
npx web-push generate-vapid-keys

Then add to your .env:
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:support@rowi.app
`;
}
