// src/lib/notifications/service.ts
// ============================================================
// Core Notification Service
// ============================================================

import { prisma } from "@/core/prisma";
import {
  NotificationChannel,
  NotificationType,
  NotificationScope,
  NotificationStatus,
} from "@prisma/client";
import {
  NotificationPayload,
  NotificationResult,
  DEFAULT_CHANNELS,
  PRIORITY,
} from "./types";
import { buildNotificationContent } from "./templates";

// Provider imports (will be created)
import { sendEmail } from "./providers/email";
import { sendSMS, sendWhatsApp } from "./providers/sms";
import { sendPush } from "./providers/push";
import { sendSlack, sendTeams } from "./providers/integrations";

/**
 * Main notification service - queues and sends notifications
 */
export const NotificationService = {
  /**
   * Queue a notification for delivery
   */
  async queue(payload: NotificationPayload): Promise<string[]> {
    const {
      userId,
      type,
      title,
      message,
      channels,
      scope = "PERSONAL",
      priority = PRIORITY.NORMAL,
      scheduledFor,
      metadata,
      actionUrl,
      tenantId,
      hubId,
    } = payload;

    // Get user preferences
    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Determine which channels to use
    const targetChannels = channels || DEFAULT_CHANNELS[type] || ["IN_APP"];
    const enabledChannels = filterEnabledChannels(targetChannels, prefs);

    if (enabledChannels.length === 0) {
      console.log(`[Notifications] No enabled channels for user ${userId}`);
      return [];
    }

    // Check quiet hours
    if (prefs?.quietHoursEnabled && isQuietHours(prefs)) {
      // Schedule for after quiet hours end
      const scheduledTime = getNextActiveTime(prefs);
      console.log(`[Notifications] Quiet hours active, scheduling for ${scheduledTime}`);
    }

    // Create notification records for each channel
    const notifications = await Promise.all(
      enabledChannels.map((channel) =>
        prisma.notificationQueue.create({
          data: {
            userId,
            tenantId,
            hubId,
            channel,
            type,
            title: title || undefined,
            message,
            metadata: metadata as object | undefined,
            priority,
            scheduledFor,
            status: scheduledFor ? "SCHEDULED" : "PENDING",
            actionUrl,
            scope,
          },
        })
      )
    );

    return notifications.map((n) => n.id);
  },

  /**
   * Send a notification immediately (bypass queue)
   */
  async sendNow(payload: NotificationPayload): Promise<NotificationResult[]> {
    const ids = await this.queue(payload);
    const results: NotificationResult[] = [];

    for (const id of ids) {
      const result = await this.processOne(id);
      results.push(result);
    }

    return results;
  },

  /**
   * Process a single notification from the queue
   */
  async processOne(notificationId: string): Promise<NotificationResult> {
    const notification = await prisma.notificationQueue.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            language: true,
          },
        },
      },
    });

    if (!notification) {
      return { success: false, error: "Notification not found" };
    }

    // Mark as processing
    await prisma.notificationQueue.update({
      where: { id: notificationId },
      data: {
        status: "PROCESSING",
        attempts: { increment: 1 },
      },
    });

    try {
      // Get user preferences for recipient info
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: notification.userId },
      });

      // Build content
      const locale = (notification.user.language as "es" | "en") || "es";
      const content = notification.title
        ? { title: notification.title, body: notification.message }
        : buildNotificationContent(
            notification.type,
            notification.metadata as Record<string, unknown> | null,
            locale
          );

      // Send based on channel
      const result = await sendByChannel(
        notification.channel,
        {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: content.title,
          message: content.body,
          metadata: notification.metadata as Record<string, unknown> | null,
          actionUrl: notification.actionUrl,
          recipient: {
            email: notification.user.email || undefined,
            phone: prefs?.phoneNumber || undefined,
            slackWebhook: prefs?.slackWebhookUrl || undefined,
            teamsWebhook: prefs?.teamsWebhookUrl || undefined,
          },
          locale,
        },
        notification.userId
      );

      // Update status
      await prisma.notificationQueue.update({
        where: { id: notificationId },
        data: {
          status: result.success ? "SENT" : "FAILED",
          sentAt: result.success ? new Date() : undefined,
          externalId: result.externalId,
          lastError: result.error,
        },
      });

      // Log the event
      await prisma.notificationLog.create({
        data: {
          notificationId,
          event: result.success ? "sent" : "failed",
          channel: notification.channel,
          externalId: result.externalId,
          metadata: { error: result.error },
        },
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await prisma.notificationQueue.update({
        where: { id: notificationId },
        data: {
          status: "FAILED",
          lastError: errorMessage,
        },
      });

      return { success: false, error: errorMessage };
    }
  },

  /**
   * Process pending notifications (call from cron job)
   */
  async processPending(limit: number = 100): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const pending = await prisma.notificationQueue.findMany({
      where: {
        status: { in: ["PENDING", "SCHEDULED"] },
        OR: [
          { scheduledFor: null },
          { scheduledFor: { lte: new Date() } },
        ],
        attempts: { lt: 3 }, // Max 3 attempts
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      take: limit,
    });

    let successful = 0;
    let failed = 0;

    for (const notification of pending) {
      const result = await this.processOne(notification.id);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      processed: pending.length,
      successful,
      failed,
    };
  },

  /**
   * Get unread notifications for a user (IN_APP channel)
   */
  async getUnread(
    userId: string,
    limit: number = 50
  ): Promise<{
    notifications: Array<{
      id: string;
      type: NotificationType;
      title: string | null;
      message: string;
      actionUrl: string | null;
      createdAt: Date;
      metadata: unknown;
    }>;
    total: number;
  }> {
    const [notifications, total] = await Promise.all([
      prisma.notificationQueue.findMany({
        where: {
          userId,
          channel: "IN_APP",
          status: { in: ["SENT", "DELIVERED"] },
          readAt: null,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          actionUrl: true,
          createdAt: true,
          metadata: true,
        },
      }),
      prisma.notificationQueue.count({
        where: {
          userId,
          channel: "IN_APP",
          status: { in: ["SENT", "DELIVERED"] },
          readAt: null,
        },
      }),
    ]);

    return { notifications, total };
  },

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[], userId: string): Promise<number> {
    const result = await prisma.notificationQueue.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: "DELIVERED",
      },
    });

    // Log read events
    for (const id of notificationIds) {
      await prisma.notificationLog.create({
        data: {
          notificationId: id,
          event: "opened",
          channel: "IN_APP",
        },
      });
    }

    return result.count;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notificationQueue.updateMany({
      where: {
        userId,
        channel: "IN_APP",
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: "DELIVERED",
      },
    });

    return result.count;
  },
};

// ============================================================
// Helper Functions
// ============================================================

function filterEnabledChannels(
  channels: NotificationChannel[],
  prefs: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    slackEnabled: boolean;
    teamsEnabled: boolean;
  } | null
): NotificationChannel[] {
  if (!prefs) {
    // Default: only IN_APP and EMAIL enabled
    return channels.filter((c) => c === "IN_APP" || c === "EMAIL");
  }

  return channels.filter((channel) => {
    switch (channel) {
      case "EMAIL":
        return prefs.emailEnabled;
      case "PUSH":
        return prefs.pushEnabled;
      case "SMS":
        return prefs.smsEnabled;
      case "WHATSAPP":
        return prefs.whatsappEnabled;
      case "SLACK":
        return prefs.slackEnabled;
      case "TEAMS":
        return prefs.teamsEnabled;
      case "IN_APP":
        return true; // Always enabled
      default:
        return false;
    }
  });
}

function isQuietHours(prefs: {
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
}): boolean {
  if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const [startHour, startMin] = prefs.quietHoursStart.split(":").map(Number);
  const [endHour, endMin] = prefs.quietHoursEnd.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Handle overnight quiet hours (e.g., 22:00 - 08:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

function getNextActiveTime(prefs: {
  quietHoursEnd: string | null;
  timezone: string;
}): Date {
  const now = new Date();
  if (!prefs.quietHoursEnd) return now;

  const [endHour, endMin] = prefs.quietHoursEnd.split(":").map(Number);
  const nextActive = new Date(now);
  nextActive.setHours(endHour, endMin, 0, 0);

  if (nextActive <= now) {
    nextActive.setDate(nextActive.getDate() + 1);
  }

  return nextActive;
}

async function sendByChannel(
  channel: NotificationChannel,
  notification: {
    id: string;
    userId: string;
    type: NotificationType;
    title: string | null;
    message: string;
    metadata: Record<string, unknown> | null;
    actionUrl: string | null;
    recipient: {
      email?: string;
      phone?: string;
      slackWebhook?: string;
      teamsWebhook?: string;
    };
    locale: string;
  },
  userId: string
): Promise<NotificationResult> {
  switch (channel) {
    case "EMAIL":
      return sendEmail(notification);
    case "PUSH":
      return sendPush(notification, userId);
    case "SMS":
      return sendSMS(notification);
    case "WHATSAPP":
      return sendWhatsApp(notification);
    case "SLACK":
      return sendSlack(notification);
    case "TEAMS":
      return sendTeams(notification);
    case "IN_APP":
      // IN_APP is automatically "sent" when created
      return { success: true, notificationId: notification.id };
    default:
      return { success: false, error: `Unknown channel: ${channel}` };
  }
}

// ============================================================
// Convenience Functions for Common Notifications
// ============================================================

export async function notifyAchievement(
  userId: string,
  achievement: string,
  xp: number,
  tenantId?: string
): Promise<string[]> {
  return NotificationService.queue({
    userId,
    type: "ACHIEVEMENT_UNLOCKED",
    message: `Has desbloqueado: ${achievement}`,
    metadata: { achievement, xp },
    tenantId,
  });
}

export async function notifyLevelUp(
  userId: string,
  level: number,
  tenantId?: string
): Promise<string[]> {
  return NotificationService.queue({
    userId,
    type: "LEVEL_UP",
    message: `Has subido al nivel ${level}`,
    metadata: { level },
    priority: PRIORITY.HIGH,
    tenantId,
  });
}

export async function notifyTaskAssigned(
  userId: string,
  taskTitle: string,
  assignerName: string,
  taskId: string,
  hubId?: string
): Promise<string[]> {
  return NotificationService.queue({
    userId,
    type: "TASK_ASSIGNED",
    message: `${assignerName} te ha asignado: ${taskTitle}`,
    metadata: { task: taskTitle, assigner: assignerName, taskId },
    actionUrl: `/weekflow/tasks/${taskId}`,
    hubId,
  });
}

export async function notifyHubInvitation(
  userId: string,
  hubName: string,
  inviterName: string,
  hubSlug: string
): Promise<string[]> {
  return NotificationService.queue({
    userId,
    type: "HUB_INVITATION",
    message: `${inviterName} te invita a unirte a ${hubName}`,
    metadata: { hub: hubName, inviter: inviterName },
    actionUrl: `/hub/join/${hubSlug}`,
    priority: PRIORITY.HIGH,
  });
}

export async function notifyWelcome(
  userId: string,
  userName: string
): Promise<string[]> {
  return NotificationService.queue({
    userId,
    type: "WELCOME",
    message: `Bienvenido a Rowi, ${userName}!`,
    metadata: { name: userName },
    priority: PRIORITY.HIGH,
    channels: ["EMAIL", "PUSH", "IN_APP"],
  });
}

export async function notifyMicrolearningReminder(
  userId: string,
  lessonTitle?: string
): Promise<string[]> {
  return NotificationService.queue({
    userId,
    type: "MICROLEARNING_REMINDER",
    message: lessonTitle
      ? `No olvides tu leccion: ${lessonTitle}`
      : "No olvides completar tu leccion de hoy",
    metadata: lessonTitle ? { lesson: lessonTitle } : {},
  });
}

export async function notifyWeekflowReminder(
  userId: string,
  hubId?: string
): Promise<string[]> {
  return NotificationService.queue({
    userId,
    type: "WEEKFLOW_REMINDER",
    message: "Es hora de tu sesion semanal de WeekFlow",
    hubId,
    actionUrl: "/weekflow",
  });
}

export async function notifyAvatarEvolved(
  userId: string,
  stage: string
): Promise<string[]> {
  return NotificationService.queue({
    userId,
    type: "AVATAR_EVOLVED",
    message: `Tu Rowi ha evolucionado a ${stage}!`,
    metadata: { stage },
    priority: PRIORITY.HIGH,
  });
}

export default NotificationService;
