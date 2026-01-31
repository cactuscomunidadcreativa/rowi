// src/lib/notifications/index.ts
// ============================================================
// Notification System - Main Export
// ============================================================

// Core service
export { default as NotificationService } from "./service";
export {
  notifyAchievement,
  notifyLevelUp,
  notifyTaskAssigned,
  notifyHubInvitation,
  notifyWelcome,
  notifyMicrolearningReminder,
  notifyWeekflowReminder,
  notifyAvatarEvolved,
} from "./service";

// Types
export * from "./types";

// Templates
export { getTemplate, renderTemplate, buildNotificationContent } from "./templates";

// Providers
export { sendEmail, verifyEmailConfig } from "./providers/email";
export { sendSMS, sendWhatsApp, verifyTwilioConfig, getSMSStatus } from "./providers/sms";
export {
  sendPush,
  subscribePush,
  unsubscribePush,
  getVapidPublicKey,
} from "./providers/push";
export {
  sendSlack,
  sendTeams,
  verifySlackWebhook,
  verifyTeamsWebhook,
} from "./providers/integrations";

// Triggers - for calling from various system events
export * from "./triggers";
