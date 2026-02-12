// src/services/social-notifications.ts
import { prisma } from "@/core/prisma";

/* =========================================================
   🔔 Social Notification Service

   Funciones que conectan eventos sociales al sistema de
   notificaciones existente (NotificationQueue).
   Cada función crea una notificación IN_APP y un ActivityLog.
========================================================= */

/* =========================================================
   👥 Solicitud de conexión
========================================================= */
export async function notifyConnectionRequest(
  fromUserId: string,
  toUserId: string
) {
  const from = await prisma.user.findUnique({
    where: { id: fromUserId },
    select: { name: true },
  });

  await Promise.all([
    prisma.notificationQueue.create({
      data: {
        userId: toUserId,
        type: "NEW_CONNECTION",
        channel: "IN_APP",
        title: "Solicitud de conexión",
        message: `${from?.name || "Alguien"} quiere conectar contigo`,
        priority: 1,
        status: "PENDING",
        actionUrl: "/social/connections?tab=pending",
        metadata: { fromUserId },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: fromUserId,
        targetUserId: toUserId,
        action: "CONNECTION_REQUEST",
        entity: "RowiRelation",
        details: {},
      },
    }),
  ]);
}

/* =========================================================
   ✅ Conexión aceptada
========================================================= */
export async function notifyConnectionAccepted(
  fromUserId: string,
  toUserId: string
) {
  const from = await prisma.user.findUnique({
    where: { id: fromUserId },
    select: { name: true },
  });

  await Promise.all([
    prisma.notificationQueue.create({
      data: {
        userId: toUserId,
        type: "NEW_CONNECTION",
        channel: "IN_APP",
        title: "¡Conexión aceptada!",
        message: `${from?.name || "Alguien"} aceptó tu solicitud de conexión`,
        priority: 1,
        status: "PENDING",
        actionUrl: "/social/connections",
        metadata: { fromUserId, action: "accepted" },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: fromUserId,
        targetUserId: toUserId,
        action: "CONNECTION_ACCEPTED",
        entity: "RowiRelation",
        details: {},
      },
    }),
  ]);
}

/* =========================================================
   💬 Comentario en feed
========================================================= */
export async function notifyFeedComment(
  postAuthorId: string,
  commenterId: string,
  postId: string
) {
  if (postAuthorId === commenterId) return; // No notificar a uno mismo

  const commenter = await prisma.user.findUnique({
    where: { id: commenterId },
    select: { name: true },
  });

  await Promise.all([
    prisma.notificationQueue.create({
      data: {
        userId: postAuthorId,
        type: "COMMENT",
        channel: "IN_APP",
        title: "Nuevo comentario",
        message: `${commenter?.name || "Alguien"} comentó en tu publicación`,
        priority: 1,
        status: "PENDING",
        actionUrl: `/social/feed?post=${postId}`,
        metadata: { postId, commenterId },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: commenterId,
        targetUserId: postAuthorId,
        action: "FEED_COMMENT",
        entity: "FeedComment",
        targetId: postId,
        details: {},
      },
    }),
  ]);
}

/* =========================================================
   ❤️ Reacción en feed
========================================================= */
export async function notifyFeedReaction(
  postAuthorId: string,
  reactorId: string,
  postId: string,
  reactionType: string = "like"
) {
  if (postAuthorId === reactorId) return;

  const reactor = await prisma.user.findUnique({
    where: { id: reactorId },
    select: { name: true },
  });

  await Promise.all([
    prisma.notificationQueue.create({
      data: {
        userId: postAuthorId,
        type: "REACTION",
        channel: "IN_APP",
        title: "Nueva reacción",
        message: `${reactor?.name || "Alguien"} reaccionó a tu publicación`,
        priority: 0,
        status: "PENDING",
        actionUrl: `/social/feed?post=${postId}`,
        metadata: { postId, reactorId, reactionType },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: reactorId,
        targetUserId: postAuthorId,
        action: "FEED_REACTION",
        entity: "FeedReaction",
        targetId: postId,
        details: { reactionType },
      },
    }),
  ]);
}

/* =========================================================
   🎯 Alguien se unió a tu Noble Goal
========================================================= */
export async function notifyGoalJoined(
  goalAuthorId: string,
  joinerId: string,
  goalId: string,
  goalTitle: string
) {
  if (goalAuthorId === joinerId) return;

  const joiner = await prisma.user.findUnique({
    where: { id: joinerId },
    select: { name: true },
  });

  await Promise.all([
    prisma.notificationQueue.create({
      data: {
        userId: goalAuthorId,
        type: "NEW_CONNECTION",
        channel: "IN_APP",
        title: "Nuevo participante",
        message: `${joiner?.name || "Alguien"} se unió a "${goalTitle}"`,
        priority: 1,
        status: "PENDING",
        actionUrl: `/social/goals/${goalId}`,
        metadata: { goalId, joinerId },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: joinerId,
        targetUserId: goalAuthorId,
        action: "NOBLE_GOAL_JOINED",
        entity: "NobleGoal",
        targetId: goalId,
        details: { goalTitle },
      },
    }),
  ]);
}

/* =========================================================
   📝 Update de Noble Goal (notificar a participantes)
========================================================= */
export async function notifyGoalUpdate(goalId: string, authorId: string) {
  const goal = await prisma.nobleGoal.findUnique({
    where: { id: goalId },
    select: { title: true, participants: { select: { userId: true } } },
  });
  if (!goal) return;

  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { name: true },
  });

  // Notificar a todos los participantes excepto al autor
  const recipients = goal.participants.filter((p) => p.userId !== authorId);

  await Promise.all(
    recipients.map((p) =>
      prisma.notificationQueue.create({
        data: {
          userId: p.userId,
          type: "SYSTEM_UPDATE",
          channel: "IN_APP",
          title: "Actualización de causa noble",
          message: `${author?.name || "Alguien"} publicó una actualización en "${goal.title}"`,
          priority: 0,
          status: "PENDING",
          actionUrl: `/social/goals/${goalId}`,
          metadata: { goalId, authorId },
        },
      })
    )
  );
}

/* =========================================================
   💬 Respuesta en foro
========================================================= */
export async function notifyForumReply(
  postAuthorId: string,
  replierId: string,
  postId: string
) {
  if (postAuthorId === replierId) return;

  const replier = await prisma.user.findUnique({
    where: { id: replierId },
    select: { name: true },
  });

  await Promise.all([
    prisma.notificationQueue.create({
      data: {
        userId: postAuthorId,
        type: "COMMENT",
        channel: "IN_APP",
        title: "Nueva respuesta",
        message: `${replier?.name || "Alguien"} respondió a tu publicación en el foro`,
        priority: 1,
        status: "PENDING",
        actionUrl: `/community?post=${postId}`,
        metadata: { postId, replierId },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: replierId,
        targetUserId: postAuthorId,
        action: "FORUM_REPLY",
        entity: "RowiCommunityPost",
        targetId: postId,
        details: {},
      },
    }),
  ]);
}

/* =========================================================
   📩 Nuevo mensaje
========================================================= */
export async function notifyNewMessage(
  senderId: string,
  receiverId: string,
  threadId: string,
  preview: string
) {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true },
  });

  await prisma.notificationQueue.create({
    data: {
      userId: receiverId,
      type: "MESSAGE_RECEIVED",
      channel: "IN_APP",
      title: "Nuevo mensaje",
      message: `${sender?.name || "Alguien"}: ${preview.slice(0, 50)}`,
      priority: 1,
      status: "PENDING",
      actionUrl: `/social/messages?thread=${threadId}`,
      metadata: { threadId, senderId },
    },
  });
}

/* =========================================================
   📢 Mención
========================================================= */
export async function notifyMention(
  mentionedUserId: string,
  mentionerId: string,
  context: string,
  contextId: string
) {
  if (mentionedUserId === mentionerId) return;

  const mentioner = await prisma.user.findUnique({
    where: { id: mentionerId },
    select: { name: true },
  });

  await Promise.all([
    prisma.notificationQueue.create({
      data: {
        userId: mentionedUserId,
        type: "MENTION",
        channel: "IN_APP",
        title: "Te han mencionado",
        message: `${mentioner?.name || "Alguien"} te mencionó en ${context === "feed" ? "una publicación" : "un comentario"}`,
        priority: 2,
        status: "PENDING",
        actionUrl: context === "feed" ? `/social/feed?post=${contextId}` : `/community?post=${contextId}`,
        metadata: { context, contextId, mentionerId },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: mentionerId,
        targetUserId: mentionedUserId,
        action: "MENTION",
        entity: context === "feed" ? "RowiFeed" : "FeedComment",
        targetId: contextId,
        details: { context },
      },
    }),
  ]);
}
