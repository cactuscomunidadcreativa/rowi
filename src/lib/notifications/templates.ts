// src/lib/notifications/templates.ts
// ============================================================
// Notification Templates (i18n ready)
// ============================================================

import { NotificationType } from "@prisma/client";

type Locale = "es" | "en";

interface TemplateStrings {
  title: string;
  body: string;
  emailSubject?: string;
}

type Templates = Record<NotificationType, Record<Locale, TemplateStrings>>;

// Dynamic placeholders: {{name}}, {{level}}, {{xp}}, {{task}}, {{hub}}, etc.
export const NOTIFICATION_TEMPLATES: Templates = {
  ACHIEVEMENT_UNLOCKED: {
    es: {
      title: "Logro desbloqueado!",
      body: "Has desbloqueado el logro: {{achievement}}. +{{xp}} XP",
      emailSubject: "Felicidades! Has desbloqueado un nuevo logro",
    },
    en: {
      title: "Achievement Unlocked!",
      body: "You've unlocked: {{achievement}}. +{{xp}} XP",
      emailSubject: "Congratulations! You've unlocked a new achievement",
    },
  },
  LEVEL_UP: {
    es: {
      title: "Subiste de nivel!",
      body: "Felicidades! Ahora eres nivel {{level}}",
      emailSubject: "Has subido al nivel {{level}} en Rowi",
    },
    en: {
      title: "Level Up!",
      body: "Congratulations! You're now level {{level}}",
      emailSubject: "You've reached level {{level}} on Rowi",
    },
  },
  STREAK_MILESTONE: {
    es: {
      title: "Racha de {{days}} dias!",
      body: "Increible! Llevas {{days}} dias consecutivos. Sigue asi!",
      emailSubject: "Tu racha de {{days}} dias en Rowi",
    },
    en: {
      title: "{{days}}-day streak!",
      body: "Amazing! You've been active for {{days}} consecutive days. Keep it up!",
      emailSubject: "Your {{days}}-day streak on Rowi",
    },
  },
  XP_EARNED: {
    es: {
      title: "+{{xp}} XP",
      body: "Has ganado {{xp}} puntos de experiencia por {{action}}",
    },
    en: {
      title: "+{{xp}} XP",
      body: "You earned {{xp}} experience points for {{action}}",
    },
  },
  AVATAR_EVOLVED: {
    es: {
      title: "Tu Rowi ha evolucionado!",
      body: "Tu Rowi ha evolucionado a {{stage}}!",
      emailSubject: "Tu Rowi ha evolucionado",
    },
    en: {
      title: "Your Rowi has evolved!",
      body: "Your Rowi has evolved to {{stage}}!",
      emailSubject: "Your Rowi has evolved",
    },
  },
  MICROLEARNING_AVAILABLE: {
    es: {
      title: "Nuevo micro-aprendizaje",
      body: "Tienes una nueva leccion disponible: {{lesson}}",
      emailSubject: "Nueva leccion de micro-aprendizaje disponible",
    },
    en: {
      title: "New micro-learning",
      body: "You have a new lesson available: {{lesson}}",
      emailSubject: "New micro-learning lesson available",
    },
  },
  MICROLEARNING_REMINDER: {
    es: {
      title: "Recordatorio de aprendizaje",
      body: "No olvides completar tu leccion de hoy",
    },
    en: {
      title: "Learning reminder",
      body: "Don't forget to complete today's lesson",
    },
  },
  COURSE_RECOMMENDATION: {
    es: {
      title: "Curso recomendado",
      body: "Basado en tu perfil, te recomendamos: {{course}}",
      emailSubject: "Curso recomendado para ti",
    },
    en: {
      title: "Course recommendation",
      body: "Based on your profile, we recommend: {{course}}",
      emailSubject: "Course recommended for you",
    },
  },
  CERTIFICATION_EARNED: {
    es: {
      title: "Certificacion obtenida!",
      body: "Has obtenido la certificacion: {{certification}}",
      emailSubject: "Felicidades por tu nueva certificacion",
    },
    en: {
      title: "Certification earned!",
      body: "You've earned the certification: {{certification}}",
      emailSubject: "Congratulations on your new certification",
    },
  },
  LEARNING_STREAK: {
    es: {
      title: "Racha de aprendizaje!",
      body: "{{days}} dias aprendiendo consecutivamente!",
    },
    en: {
      title: "Learning streak!",
      body: "{{days}} consecutive learning days!",
    },
  },
  TASK_ASSIGNED: {
    es: {
      title: "Nueva tarea asignada",
      body: "Te han asignado la tarea: {{task}}",
      emailSubject: "Nueva tarea asignada: {{task}}",
    },
    en: {
      title: "New task assigned",
      body: "You've been assigned the task: {{task}}",
      emailSubject: "New task assigned: {{task}}",
    },
  },
  TASK_DUE_SOON: {
    es: {
      title: "Tarea por vencer",
      body: "La tarea '{{task}}' vence {{when}}",
    },
    en: {
      title: "Task due soon",
      body: "Task '{{task}}' is due {{when}}",
    },
  },
  TASK_OVERDUE: {
    es: {
      title: "Tarea vencida",
      body: "La tarea '{{task}}' esta vencida",
      emailSubject: "Tarea vencida: {{task}}",
    },
    en: {
      title: "Task overdue",
      body: "Task '{{task}}' is overdue",
      emailSubject: "Task overdue: {{task}}",
    },
  },
  TASK_COMPLETED: {
    es: {
      title: "Tarea completada",
      body: "Has completado la tarea: {{task}}",
    },
    en: {
      title: "Task completed",
      body: "You've completed the task: {{task}}",
    },
  },
  WEEKFLOW_REMINDER: {
    es: {
      title: "Recordatorio WeekFlow",
      body: "Es hora de tu sesion semanal de WeekFlow",
      emailSubject: "Tu sesion semanal de WeekFlow te espera",
    },
    en: {
      title: "WeekFlow Reminder",
      body: "It's time for your weekly WeekFlow session",
      emailSubject: "Your weekly WeekFlow session awaits",
    },
  },
  WEEKFLOW_SUMMARY: {
    es: {
      title: "Resumen semanal",
      body: "Tu resumen de la semana esta listo",
      emailSubject: "Tu resumen semanal de WeekFlow",
    },
    en: {
      title: "Weekly summary",
      body: "Your weekly summary is ready",
      emailSubject: "Your WeekFlow weekly summary",
    },
  },
  AFFINITY_CALCULATED: {
    es: {
      title: "Afinidad calculada",
      body: "Se ha calculado tu afinidad con {{member}}",
    },
    en: {
      title: "Affinity calculated",
      body: "Your affinity with {{member}} has been calculated",
    },
  },
  AFFINITY_IMPROVED: {
    es: {
      title: "Afinidad mejorada!",
      body: "Tu afinidad con {{member}} ha mejorado a {{level}}",
    },
    en: {
      title: "Affinity improved!",
      body: "Your affinity with {{member}} has improved to {{level}}",
    },
  },
  NEW_CONNECTION: {
    es: {
      title: "Nueva conexion",
      body: "{{name}} se ha conectado contigo",
    },
    en: {
      title: "New connection",
      body: "{{name}} has connected with you",
    },
  },
  RELATIONSHIP_INSIGHT: {
    es: {
      title: "Insight de relacion",
      body: "Nuevo insight disponible sobre tu relacion con {{member}}",
    },
    en: {
      title: "Relationship insight",
      body: "New insight available about your relationship with {{member}}",
    },
  },
  HUB_INVITATION: {
    es: {
      title: "Invitacion a Hub",
      body: "Te han invitado a unirte al hub: {{hub}}",
      emailSubject: "Invitacion a unirte a {{hub}}",
    },
    en: {
      title: "Hub invitation",
      body: "You've been invited to join the hub: {{hub}}",
      emailSubject: "Invitation to join {{hub}}",
    },
  },
  HUB_ANNOUNCEMENT: {
    es: {
      title: "Anuncio de {{hub}}",
      body: "{{message}}",
    },
    en: {
      title: "{{hub}} announcement",
      body: "{{message}}",
    },
  },
  TEAM_UPDATE: {
    es: {
      title: "Actualizacion del equipo",
      body: "{{message}}",
    },
    en: {
      title: "Team update",
      body: "{{message}}",
    },
  },
  MEMBER_JOINED: {
    es: {
      title: "Nuevo miembro",
      body: "{{name}} se ha unido a {{hub}}",
    },
    en: {
      title: "New member",
      body: "{{name}} has joined {{hub}}",
    },
  },
  ROLE_CHANGED: {
    es: {
      title: "Cambio de rol",
      body: "Tu rol ha sido actualizado a {{role}} en {{hub}}",
      emailSubject: "Tu rol ha sido actualizado en {{hub}}",
    },
    en: {
      title: "Role changed",
      body: "Your role has been updated to {{role}} in {{hub}}",
      emailSubject: "Your role has been updated in {{hub}}",
    },
  },
  EQ_ASSESSMENT_READY: {
    es: {
      title: "Evaluacion lista",
      body: "Tu evaluacion de inteligencia emocional esta lista",
      emailSubject: "Tu evaluacion de inteligencia emocional esta lista",
    },
    en: {
      title: "Assessment ready",
      body: "Your emotional intelligence assessment is ready",
      emailSubject: "Your emotional intelligence assessment is ready",
    },
  },
  EQ_INSIGHT_AVAILABLE: {
    es: {
      title: "Nuevo insight EQ",
      body: "Tienes un nuevo insight sobre tu inteligencia emocional",
    },
    en: {
      title: "New EQ insight",
      body: "You have a new insight about your emotional intelligence",
    },
  },
  EMOTIONAL_PATTERN_DETECTED: {
    es: {
      title: "Patron detectado",
      body: "Hemos detectado un patron emocional en tu comportamiento",
    },
    en: {
      title: "Pattern detected",
      body: "We've detected an emotional pattern in your behavior",
    },
  },
  COACHING_SUGGESTION: {
    es: {
      title: "Sugerencia de coaching",
      body: "{{suggestion}}",
    },
    en: {
      title: "Coaching suggestion",
      body: "{{suggestion}}",
    },
  },
  WELCOME: {
    es: {
      title: "Bienvenido a Rowi!",
      body: "Hola {{name}}, bienvenido a tu viaje de desarrollo emocional",
      emailSubject: "Bienvenido a Rowi, {{name}}!",
    },
    en: {
      title: "Welcome to Rowi!",
      body: "Hi {{name}}, welcome to your emotional development journey",
      emailSubject: "Welcome to Rowi, {{name}}!",
    },
  },
  PROFILE_INCOMPLETE: {
    es: {
      title: "Completa tu perfil",
      body: "Tu perfil esta incompleto. Completa para desbloquear funciones",
      emailSubject: "Completa tu perfil en Rowi",
    },
    en: {
      title: "Complete your profile",
      body: "Your profile is incomplete. Complete it to unlock features",
      emailSubject: "Complete your profile on Rowi",
    },
  },
  SECURITY_ALERT: {
    es: {
      title: "Alerta de seguridad",
      body: "{{message}}",
      emailSubject: "Alerta de seguridad en tu cuenta Rowi",
    },
    en: {
      title: "Security alert",
      body: "{{message}}",
      emailSubject: "Security alert on your Rowi account",
    },
  },
  SYSTEM_UPDATE: {
    es: {
      title: "Actualizacion del sistema",
      body: "{{message}}",
      emailSubject: "Actualizacion de Rowi",
    },
    en: {
      title: "System update",
      body: "{{message}}",
      emailSubject: "Rowi update",
    },
  },
  MENTION: {
    es: {
      title: "Te mencionaron",
      body: "{{name}} te menciono en {{context}}",
    },
    en: {
      title: "You were mentioned",
      body: "{{name}} mentioned you in {{context}}",
    },
  },
  COMMENT: {
    es: {
      title: "Nuevo comentario",
      body: "{{name}} comento en {{context}}",
    },
    en: {
      title: "New comment",
      body: "{{name}} commented on {{context}}",
    },
  },
  REACTION: {
    es: {
      title: "Nueva reaccion",
      body: "{{name}} reacciono a tu {{context}}",
    },
    en: {
      title: "New reaction",
      body: "{{name}} reacted to your {{context}}",
    },
  },
  MESSAGE_RECEIVED: {
    es: {
      title: "Nuevo mensaje",
      body: "{{name}}: {{preview}}",
    },
    en: {
      title: "New message",
      body: "{{name}}: {{preview}}",
    },
  },
};

/**
 * Get template for a notification type and locale
 */
export function getTemplate(
  type: NotificationType,
  locale: Locale = "es"
): TemplateStrings {
  return NOTIFICATION_TEMPLATES[type]?.[locale] || NOTIFICATION_TEMPLATES[type]?.es;
}

/**
 * Render template with variables
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }
  return rendered;
}

/**
 * Build notification content from type and metadata
 */
export function buildNotificationContent(
  type: NotificationType,
  metadata: Record<string, unknown> | null,
  locale: Locale = "es"
): { title: string; body: string; emailSubject?: string } {
  const template = getTemplate(type, locale);
  const vars = (metadata || {}) as Record<string, string | number>;

  return {
    title: renderTemplate(template.title, vars),
    body: renderTemplate(template.body, vars),
    emailSubject: template.emailSubject
      ? renderTemplate(template.emailSubject, vars)
      : undefined,
  };
}
