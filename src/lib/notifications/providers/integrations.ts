// src/lib/notifications/providers/integrations.ts
// ============================================================
// Slack & Microsoft Teams Providers
// ============================================================

import { NotificationResult } from "../types";
import { NotificationType } from "@prisma/client";

interface IntegrationNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  actionUrl: string | null;
  recipient: {
    slackWebhook?: string;
    teamsWebhook?: string;
  };
  locale: string;
}

// ============================================================
// Slack
// ============================================================

/**
 * Send notification via Slack webhook
 */
export async function sendSlack(
  notification: IntegrationNotification
): Promise<NotificationResult> {
  const { recipient, title, message, actionUrl, id, type } = notification;

  if (!recipient.slackWebhook) {
    return { success: false, error: "No Slack webhook configured" };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://rowi.app";

    // Build Slack Block Kit message
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: title || "Rowi Notification",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
    ];

    // Add action button if URL provided
    if (actionUrl) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: notification.locale === "es" ? "Ver en Rowi" : "View in Rowi",
              emoji: true,
            },
            url: `${baseUrl}${actionUrl}`,
            style: "primary",
          },
        ],
      } as any);
    }

    // Add context with notification type
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Rowi | ${formatNotificationType(type)}`,
        },
      ],
    } as any);

    const response = await fetch(recipient.slackWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blocks,
        text: `${title}: ${message}`, // Fallback text
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Slack] Webhook error:", error);
      return { success: false, error: `Slack error: ${response.status}` };
    }

    console.log("[Slack] Sent successfully");

    return {
      success: true,
      notificationId: id,
      channel: "SLACK",
    };
  } catch (error) {
    console.error("[Slack] Error sending:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================
// Microsoft Teams
// ============================================================

/**
 * Send notification via Microsoft Teams webhook
 */
export async function sendTeams(
  notification: IntegrationNotification
): Promise<NotificationResult> {
  const { recipient, title, message, actionUrl, id, type } = notification;

  if (!recipient.teamsWebhook) {
    return { success: false, error: "No Teams webhook configured" };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://rowi.app";

    // Build Adaptive Card for Teams
    const card = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                size: "Large",
                weight: "Bolder",
                text: title || "Rowi Notification",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: message,
                wrap: true,
              },
              {
                type: "TextBlock",
                text: formatNotificationType(type),
                size: "Small",
                color: "Accent",
                spacing: "Medium",
              },
            ],
            actions: actionUrl
              ? [
                  {
                    type: "Action.OpenUrl",
                    title:
                      notification.locale === "es" ? "Ver en Rowi" : "View in Rowi",
                    url: `${baseUrl}${actionUrl}`,
                  },
                ]
              : [],
            msteams: {
              width: "Full",
            },
          },
        },
      ],
    };

    const response = await fetch(recipient.teamsWebhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Teams] Webhook error:", error);
      return { success: false, error: `Teams error: ${response.status}` };
    }

    console.log("[Teams] Sent successfully");

    return {
      success: true,
      notificationId: id,
      channel: "TEAMS",
    };
  } catch (error) {
    console.error("[Teams] Error sending:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================
// Helper Functions
// ============================================================

function formatNotificationType(type: NotificationType): string {
  const typeLabels: Record<string, string> = {
    ACHIEVEMENT_UNLOCKED: "Achievement",
    LEVEL_UP: "Level Up",
    STREAK_MILESTONE: "Streak",
    XP_EARNED: "XP",
    AVATAR_EVOLVED: "Avatar",
    MICROLEARNING_AVAILABLE: "Learning",
    MICROLEARNING_REMINDER: "Learning",
    COURSE_RECOMMENDATION: "Course",
    CERTIFICATION_EARNED: "Certification",
    LEARNING_STREAK: "Learning",
    TASK_ASSIGNED: "Task",
    TASK_DUE_SOON: "Task",
    TASK_OVERDUE: "Task",
    TASK_COMPLETED: "Task",
    WEEKFLOW_REMINDER: "WeekFlow",
    WEEKFLOW_SUMMARY: "WeekFlow",
    AFFINITY_CALCULATED: "Affinity",
    AFFINITY_IMPROVED: "Affinity",
    NEW_CONNECTION: "Connection",
    RELATIONSHIP_INSIGHT: "Insight",
    HUB_INVITATION: "Hub",
    HUB_ANNOUNCEMENT: "Hub",
    TEAM_UPDATE: "Team",
    MEMBER_JOINED: "Team",
    ROLE_CHANGED: "Role",
    EQ_ASSESSMENT_READY: "EQ",
    EQ_INSIGHT_AVAILABLE: "EQ",
    EMOTIONAL_PATTERN_DETECTED: "Pattern",
    COACHING_SUGGESTION: "Coaching",
    WELCOME: "Welcome",
    PROFILE_INCOMPLETE: "Profile",
    SECURITY_ALERT: "Security",
    SYSTEM_UPDATE: "System",
    MENTION: "Mention",
    COMMENT: "Comment",
    REACTION: "Reaction",
    MESSAGE_RECEIVED: "Message",
  };

  return typeLabels[type] || type;
}

/**
 * Verify Slack webhook
 */
export async function verifySlackWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Rowi connection test",
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Verify Teams webhook
 */
export async function verifyTeamsWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "message",
        text: "Rowi connection test",
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
