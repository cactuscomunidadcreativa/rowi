// src/lib/notifications/types.ts
// ============================================================
// Notification System Types
// ============================================================

import {
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  NotificationScope,
} from "@prisma/client";

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title?: string;
  message: string;
  channels?: NotificationChannel[];
  scope?: NotificationScope;
  priority?: number;
  scheduledFor?: Date;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  tenantId?: string;
  hubId?: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  channel?: NotificationChannel;
  externalId?: string;
  error?: string;
}

export interface ChannelProvider {
  send(notification: ChannelNotification): Promise<NotificationResult>;
  validateConfig(): Promise<boolean>;
  getStatus(externalId: string): Promise<string>;
}

export interface ChannelNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  actionUrl?: string | null;
  recipient: {
    email?: string;
    phone?: string;
    pushEndpoint?: string;
    slackWebhook?: string;
    teamsWebhook?: string;
  };
  locale: string;
}

export interface NotificationTemplate {
  subject: string;
  body: string;
  html?: string;
}

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  whatsappNumber?: string;
}

export interface PushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
}

export interface SlackConfig {
  webhookUrl: string;
}

export interface TeamsConfig {
  webhookUrl: string;
}

// Notification event types for triggers
export type NotificationEvent =
  | "achievement_unlocked"
  | "level_up"
  | "streak_milestone"
  | "xp_earned"
  | "avatar_evolved"
  | "microlearning_available"
  | "microlearning_reminder"
  | "task_assigned"
  | "task_due_soon"
  | "task_overdue"
  | "task_completed"
  | "weekflow_reminder"
  | "weekflow_summary"
  | "affinity_calculated"
  | "affinity_improved"
  | "hub_invitation"
  | "hub_announcement"
  | "eq_assessment_ready"
  | "eq_insight_available"
  | "emotional_pattern_detected"
  | "welcome"
  | "message_received"
  | "mention"
  | "comment";

// Default channel preferences by notification type
export const DEFAULT_CHANNELS: Record<NotificationType, NotificationChannel[]> = {
  ACHIEVEMENT_UNLOCKED: ["PUSH", "IN_APP"],
  LEVEL_UP: ["PUSH", "IN_APP"],
  STREAK_MILESTONE: ["PUSH", "IN_APP"],
  XP_EARNED: ["IN_APP"],
  AVATAR_EVOLVED: ["PUSH", "IN_APP"],
  MICROLEARNING_AVAILABLE: ["PUSH", "EMAIL"],
  MICROLEARNING_REMINDER: ["PUSH"],
  COURSE_RECOMMENDATION: ["EMAIL", "IN_APP"],
  CERTIFICATION_EARNED: ["EMAIL", "PUSH", "IN_APP"],
  LEARNING_STREAK: ["PUSH", "IN_APP"],
  TASK_ASSIGNED: ["PUSH", "EMAIL", "IN_APP"],
  TASK_DUE_SOON: ["PUSH", "IN_APP"],
  TASK_OVERDUE: ["PUSH", "EMAIL"],
  TASK_COMPLETED: ["IN_APP"],
  WEEKFLOW_REMINDER: ["PUSH", "EMAIL"],
  WEEKFLOW_SUMMARY: ["EMAIL"],
  AFFINITY_CALCULATED: ["IN_APP"],
  AFFINITY_IMPROVED: ["PUSH", "IN_APP"],
  NEW_CONNECTION: ["PUSH", "IN_APP"],
  RELATIONSHIP_INSIGHT: ["IN_APP"],
  HUB_INVITATION: ["EMAIL", "PUSH", "IN_APP"],
  HUB_ANNOUNCEMENT: ["PUSH", "IN_APP"],
  TEAM_UPDATE: ["IN_APP"],
  MEMBER_JOINED: ["IN_APP"],
  ROLE_CHANGED: ["EMAIL", "PUSH", "IN_APP"],
  EQ_ASSESSMENT_READY: ["EMAIL", "PUSH", "IN_APP"],
  EQ_INSIGHT_AVAILABLE: ["PUSH", "IN_APP"],
  EMOTIONAL_PATTERN_DETECTED: ["IN_APP"],
  COACHING_SUGGESTION: ["IN_APP"],
  WELCOME: ["EMAIL", "PUSH", "IN_APP"],
  PROFILE_INCOMPLETE: ["EMAIL", "IN_APP"],
  SECURITY_ALERT: ["EMAIL", "PUSH", "SMS"],
  SYSTEM_UPDATE: ["EMAIL", "IN_APP"],
  MENTION: ["PUSH", "IN_APP"],
  COMMENT: ["PUSH", "IN_APP"],
  REACTION: ["IN_APP"],
  MESSAGE_RECEIVED: ["PUSH", "IN_APP"],
};

// Priority levels
export const PRIORITY = {
  CRITICAL: 1,
  HIGH: 3,
  NORMAL: 5,
  LOW: 7,
  BACKGROUND: 10,
} as const;
