// src/lib/notifications/providers/push.ts
// ============================================================
// Push Notifications Provider (Web Push)
// ============================================================

import { prisma } from "@/core/prisma";
import { NotificationResult } from "../types";
import { NotificationType } from "@prisma/client";

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
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
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
  const failedSubscriptions: string[] = [];

  for (const subscription of subscriptions) {
    try {
      const success = await sendWebPush(
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

      results.push(success);

      if (!success) {
        failedSubscriptions.push(subscription.id);
      }

      // Update last used
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      console.error("[Push] Error sending to subscription:", subscription.id, error);
      results.push(false);
      failedSubscriptions.push(subscription.id);
    }
  }

  // Deactivate failed subscriptions (likely unsubscribed)
  if (failedSubscriptions.length > 0) {
    await prisma.pushSubscription.updateMany({
      where: { id: { in: failedSubscriptions } },
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
 * Send a single web push notification
 * Uses the Web Push protocol
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
): Promise<boolean> {
  try {
    // For production, you'd use a library like web-push
    // This is a simplified implementation using fetch

    // In production, use the web-push library:
    // const webpush = require('web-push');
    // webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    // await webpush.sendNotification(subscription, payload);

    // For now, we'll use a simple fetch implementation
    // Note: This requires proper VAPID signing which is complex
    // In production, use the web-push npm package

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "86400",
        // In production, add proper VAPID headers
        // Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      },
      body: payload,
    });

    // 201 = Success, 410 = Subscription gone
    if (response.status === 410) {
      console.log("[Push] Subscription expired:", subscription.endpoint);
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error("[Push] Web push error:", error);
    return false;
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
