// src/lib/notifications/triggers.ts
// ============================================================
// Notification Triggers - Call from various system events
// ============================================================

import { NotificationService } from "./service";
import { NotificationType, NotificationScope } from "@prisma/client";
import { PRIORITY } from "./types";
import { prisma } from "@/core/prisma";

// ============================================================
// Achievement & Gamification Triggers
// ============================================================

export async function triggerAchievementUnlocked(
  userId: string,
  achievement: { name: string; xp: number; rarity?: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "ACHIEVEMENT_UNLOCKED",
    message: `Has desbloqueado: ${achievement.name}`,
    metadata: {
      achievement: achievement.name,
      xp: achievement.xp,
      rarity: achievement.rarity,
    },
    priority: PRIORITY.HIGH,
  });
}

export async function triggerLevelUp(
  userId: string,
  level: number,
  rewards?: string[]
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "LEVEL_UP",
    message: `Has subido al nivel ${level}`,
    metadata: { level, rewards },
    priority: PRIORITY.HIGH,
  });
}

export async function triggerStreakMilestone(
  userId: string,
  days: number,
  type: string
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "STREAK_MILESTONE",
    message: `${days} dias consecutivos de ${type}!`,
    metadata: { days, streakType: type },
    priority: PRIORITY.NORMAL,
  });
}

export async function triggerXPEarned(
  userId: string,
  xp: number,
  action: string
): Promise<void> {
  // Only notify for significant XP gains
  if (xp >= 25) {
    await NotificationService.queue({
      userId,
      type: "XP_EARNED",
      message: `+${xp} XP por ${action}`,
      metadata: { xp, action },
      priority: PRIORITY.LOW,
      channels: ["IN_APP"], // Only in-app for XP
    });
  }
}

export async function triggerAvatarEvolved(
  userId: string,
  stage: string,
  previousStage: string
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "AVATAR_EVOLVED",
    message: `Tu Rowi ha evolucionado a ${stage}!`,
    metadata: { stage, previousStage },
    priority: PRIORITY.HIGH,
  });
}

// ============================================================
// Learning & Development Triggers
// ============================================================

export async function triggerMicrolearningAvailable(
  userId: string,
  lesson: { title: string; category: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "MICROLEARNING_AVAILABLE",
    message: `Nueva leccion disponible: ${lesson.title}`,
    metadata: { lesson: lesson.title, category: lesson.category },
    actionUrl: "/learn",
  });
}

export async function triggerCourseRecommendation(
  userId: string,
  course: { title: string; reason: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "COURSE_RECOMMENDATION",
    message: `Te recomendamos: ${course.title}`,
    metadata: { course: course.title, reason: course.reason },
    actionUrl: "/learn/courses",
    priority: PRIORITY.LOW,
  });
}

export async function triggerCertificationEarned(
  userId: string,
  certification: { name: string; issuer: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "CERTIFICATION_EARNED",
    message: `Has obtenido la certificacion: ${certification.name}`,
    metadata: certification,
    priority: PRIORITY.HIGH,
  });
}

// ============================================================
// Task & WeekFlow Triggers
// ============================================================

export async function triggerTaskAssigned(
  userId: string,
  task: { id: string; title: string },
  assignerName: string,
  hubId?: string
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "TASK_ASSIGNED",
    message: `${assignerName} te ha asignado: ${task.title}`,
    metadata: { task: task.title, assigner: assignerName, taskId: task.id },
    actionUrl: `/weekflow/tasks/${task.id}`,
    hubId,
    priority: PRIORITY.HIGH,
  });
}

export async function triggerTaskDueSoon(
  userId: string,
  task: { id: string; title: string },
  dueIn: string
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "TASK_DUE_SOON",
    message: `La tarea "${task.title}" vence ${dueIn}`,
    metadata: { task: task.title, when: dueIn, taskId: task.id },
    actionUrl: `/weekflow/tasks/${task.id}`,
  });
}

export async function triggerTaskOverdue(
  userId: string,
  task: { id: string; title: string },
  daysPast: number
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "TASK_OVERDUE",
    message: `La tarea "${task.title}" esta vencida hace ${daysPast} dias`,
    metadata: { task: task.title, daysPast, taskId: task.id },
    actionUrl: `/weekflow/tasks/${task.id}`,
    priority: PRIORITY.HIGH,
  });
}

export async function triggerWeekflowReminder(
  userId: string,
  hubId?: string
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "WEEKFLOW_REMINDER",
    message: "Es hora de tu sesion semanal de WeekFlow",
    hubId,
    actionUrl: "/weekflow",
  });
}

export async function triggerWeekflowSummary(
  userId: string,
  summary: { tasksCompleted: number; tasksCreated: number; week: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "WEEKFLOW_SUMMARY",
    message: `Resumen semana ${summary.week}: ${summary.tasksCompleted} tareas completadas`,
    metadata: summary,
    actionUrl: "/weekflow",
    channels: ["EMAIL", "IN_APP"],
  });
}

// ============================================================
// Affinity & Relationship Triggers
// ============================================================

export async function triggerAffinityCalculated(
  userId: string,
  member: { name: string; heat: number }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "AFFINITY_CALCULATED",
    message: `Afinidad con ${member.name}: ${member.heat}%`,
    metadata: member,
    actionUrl: "/affinity",
    priority: PRIORITY.LOW,
    channels: ["IN_APP"],
  });
}

export async function triggerAffinityImproved(
  userId: string,
  member: { name: string; previousLevel: string; newLevel: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "AFFINITY_IMPROVED",
    message: `Tu afinidad con ${member.name} ha mejorado a ${member.newLevel}`,
    metadata: member,
    actionUrl: "/affinity",
  });
}

// ============================================================
// Hub & Team Triggers
// ============================================================

export async function triggerHubInvitation(
  userId: string,
  hub: { name: string; slug: string },
  inviterName: string
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "HUB_INVITATION",
    message: `${inviterName} te invita a unirte a ${hub.name}`,
    metadata: { hub: hub.name, inviter: inviterName },
    actionUrl: `/hub/join/${hub.slug}`,
    priority: PRIORITY.HIGH,
  });
}

export async function triggerHubAnnouncement(
  hubId: string,
  announcement: { title: string; message: string },
  excludeUserId?: string
): Promise<void> {
  // Get all hub members
  const memberships = await prisma.hubMembership.findMany({
    where: {
      hubId,
      userId: excludeUserId ? { not: excludeUserId } : undefined,
    },
    select: { userId: true },
  });

  // Send to all members
  for (const membership of memberships) {
    await NotificationService.queue({
      userId: membership.userId,
      type: "HUB_ANNOUNCEMENT",
      title: announcement.title,
      message: announcement.message,
      hubId,
      scope: "HUB",
    });
  }
}

export async function triggerMemberJoined(
  hubId: string,
  member: { name: string },
  excludeUserId?: string
): Promise<void> {
  // Get all hub members (admins only for this notification)
  const memberships = await prisma.hubMembership.findMany({
    where: {
      hubId,
      userId: excludeUserId ? { not: excludeUserId } : undefined,
      role: { level: { gte: 50 } }, // Admin level or higher
    },
    include: { hub: { select: { name: true } } },
    take: 10, // Limit notifications
  });

  for (const membership of memberships) {
    await NotificationService.queue({
      userId: membership.userId,
      type: "MEMBER_JOINED",
      message: `${member.name} se ha unido a ${membership.hub.name}`,
      metadata: { name: member.name, hub: membership.hub.name },
      hubId,
      scope: "HUB",
      priority: PRIORITY.LOW,
      channels: ["IN_APP"],
    });
  }
}

export async function triggerRoleChanged(
  userId: string,
  hub: { name: string },
  newRole: string
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "ROLE_CHANGED",
    message: `Tu rol en ${hub.name} ha sido actualizado a ${newRole}`,
    metadata: { hub: hub.name, role: newRole },
    priority: PRIORITY.HIGH,
  });
}

// ============================================================
// EQ & Insights Triggers
// ============================================================

export async function triggerEQAssessmentReady(userId: string): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "EQ_ASSESSMENT_READY",
    message: "Tu evaluacion de inteligencia emocional esta lista",
    actionUrl: "/eq",
    priority: PRIORITY.HIGH,
  });
}

export async function triggerEQInsightAvailable(
  userId: string,
  insight: { title: string; category: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "EQ_INSIGHT_AVAILABLE",
    message: `Nuevo insight: ${insight.title}`,
    metadata: insight,
    actionUrl: "/eq/insights",
  });
}

export async function triggerEmotionalPatternDetected(
  userId: string,
  pattern: { name: string; description: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "EMOTIONAL_PATTERN_DETECTED",
    message: `Patron detectado: ${pattern.name}`,
    metadata: pattern,
    actionUrl: "/eq/patterns",
    priority: PRIORITY.LOW,
    channels: ["IN_APP"],
  });
}

export async function triggerCoachingSuggestion(
  userId: string,
  suggestion: string
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "COACHING_SUGGESTION",
    message: suggestion,
    metadata: { suggestion },
    channels: ["IN_APP"],
  });
}

// ============================================================
// System & Welcome Triggers
// ============================================================

export async function triggerWelcome(userId: string, userName: string): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "WELCOME",
    message: `Bienvenido a Rowi, ${userName}!`,
    metadata: { name: userName },
    actionUrl: "/onboarding",
    priority: PRIORITY.HIGH,
    channels: ["EMAIL", "PUSH", "IN_APP"],
  });
}

export async function triggerProfileIncomplete(
  userId: string,
  missingFields: string[]
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "PROFILE_INCOMPLETE",
    message: "Tu perfil esta incompleto. Completalo para desbloquear funciones",
    metadata: { missingFields },
    actionUrl: "/profile",
    priority: PRIORITY.LOW,
    channels: ["EMAIL", "IN_APP"],
  });
}

export async function triggerSecurityAlert(
  userId: string,
  alert: { type: string; message: string; ip?: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "SECURITY_ALERT",
    message: alert.message,
    metadata: alert,
    priority: PRIORITY.CRITICAL,
    channels: ["EMAIL", "PUSH", "SMS"],
  });
}

// ============================================================
// Social Triggers
// ============================================================

export async function triggerMention(
  userId: string,
  mention: { byName: string; context: string; url: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "MENTION",
    message: `${mention.byName} te menciono en ${mention.context}`,
    metadata: mention,
    actionUrl: mention.url,
  });
}

export async function triggerComment(
  userId: string,
  comment: { byName: string; context: string; preview: string; url: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "COMMENT",
    message: `${comment.byName} comento: "${comment.preview}"`,
    metadata: comment,
    actionUrl: comment.url,
  });
}

export async function triggerMessageReceived(
  userId: string,
  message: { fromName: string; preview: string; threadId: string }
): Promise<void> {
  await NotificationService.queue({
    userId,
    type: "MESSAGE_RECEIVED",
    message: `${message.fromName}: ${message.preview}`,
    metadata: message,
    actionUrl: `/messages/${message.threadId}`,
    priority: PRIORITY.HIGH,
  });
}

// ============================================================
// Bulk Notification Helpers
// ============================================================

export async function triggerHubNotification(
  hubId: string,
  type: NotificationType,
  message: string,
  metadata?: Record<string, unknown>,
  excludeUserId?: string
): Promise<number> {
  const memberships = await prisma.hubMembership.findMany({
    where: {
      hubId,
      userId: excludeUserId ? { not: excludeUserId } : undefined,
    },
    select: { userId: true },
  });

  for (const membership of memberships) {
    await NotificationService.queue({
      userId: membership.userId,
      type,
      message,
      metadata,
      hubId,
      scope: "HUB",
    });
  }

  return memberships.length;
}

export async function triggerTenantNotification(
  tenantId: string,
  type: NotificationType,
  message: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      primaryTenantId: tenantId,
      active: true,
    },
    select: { id: true },
  });

  for (const user of users) {
    await NotificationService.queue({
      userId: user.id,
      type,
      message,
      metadata,
      tenantId,
      scope: "TENANT",
    });
  }

  return users.length;
}
