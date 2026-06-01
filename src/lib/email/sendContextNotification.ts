// src/lib/email/sendContextNotification.ts
// ============================================================
// Transactional emails for the contexts model (Bloque A/B).
//
// Mirrors the pattern of sendInviteEmail.ts — Resend, env-gated,
// returns skipped:true when RESEND_API_KEY is missing so callers
// can fall back to in-app notification only.
//
// Used by:
//   - POST /api/account/family             (relation requested)
//   - PATCH /api/account/family/[id]       (relation accepted/declined)
//   - POST /api/account/services           (engagement proposed)
//   - PATCH /api/account/services/[id]     (engagement accepted/ended)
// ============================================================

import { secureLog } from "@/lib/logging";

export type ContextNotificationKind =
  | "family.requested"
  | "family.accepted"
  | "family.declined"
  | "service.proposed"
  | "service.accepted"
  | "service.ended";

export type Locale = "es" | "en" | "pt" | "it";

export interface SendContextNotificationInput {
  to: string;
  kind: ContextNotificationKind;
  /** Who triggered the action (e.g. owner of the family declaration) */
  actorName?: string | null;
  /** Display label for what's being requested/changed */
  detail?: string | null;
  /** Where the recipient should land — e.g. /settings/family */
  ctaUrl: string;
  locale?: Locale | string;
}

export interface SendContextNotificationResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

type StringSet = {
  subject: (actor?: string | null, detail?: string | null) => string;
  greeting: string;
  body: (actor?: string | null, detail?: string | null) => string;
  cta: string;
  footer: string;
};

const STRINGS: Record<Locale, Record<ContextNotificationKind, StringSet>> = {
  es: {
    "family.requested": {
      subject: (a) => `${a || "Alguien"} te declaró como familiar en Rowi`,
      greeting: "¡Hola!",
      body: (a, d) =>
        `${a || "Una persona"} ha declarado una relación familiar contigo${d ? ` (${d})` : ""} en Rowi. Para que el vínculo aparezca en tu cuenta, debes aceptarlo desde la configuración de familia.`,
      cta: "Revisar el vínculo",
      footer: "Si no esperabas este mensaje, puedes ignorarlo o declinar el vínculo desde el enlace.",
    },
    "family.accepted": {
      subject: (a) => `${a || "Tu familiar"} aceptó el vínculo en Rowi`,
      greeting: "¡Hola!",
      body: (a, d) =>
        `${a || "La persona que invitaste"} aceptó el vínculo familiar${d ? ` (${d})` : ""} en Rowi.`,
      cta: "Ver vínculos",
      footer: "Rowi · vínculos personales",
    },
    "family.declined": {
      subject: (a) => `${a || "Tu familiar"} declinó el vínculo en Rowi`,
      greeting: "¡Hola!",
      body: (a, d) =>
        `${a || "La persona que invitaste"} declinó el vínculo familiar${d ? ` (${d})` : ""} en Rowi.`,
      cta: "Ver vínculos",
      footer: "Rowi · vínculos personales",
    },
    "service.proposed": {
      subject: (a) => `${a || "Un coach"} te propuso un engagement en Rowi`,
      greeting: "¡Hola!",
      body: (a, d) =>
        `${a || "Un proveedor de servicios"} te propuso un engagement${d ? ` (${d})` : ""} en Rowi. Revísalo y acéptalo si te corresponde.`,
      cta: "Revisar engagement",
      footer: "Rowi · servicios",
    },
    "service.accepted": {
      subject: (a) => `${a || "El cliente"} aceptó tu engagement en Rowi`,
      greeting: "¡Hola!",
      body: (a, d) =>
        `${a || "El cliente"} aceptó tu engagement${d ? ` (${d})` : ""} en Rowi.`,
      cta: "Ver servicios",
      footer: "Rowi · servicios",
    },
    "service.ended": {
      subject: () => `Engagement terminado en Rowi`,
      greeting: "¡Hola!",
      body: (a, d) =>
        `${a || "La contraparte"} marcó el engagement${d ? ` (${d})` : ""} como terminado en Rowi.`,
      cta: "Ver servicios",
      footer: "Rowi · servicios",
    },
  },
  en: {
    "family.requested": {
      subject: (a) => `${a || "Someone"} added you as family on Rowi`,
      greeting: "Hi!",
      body: (a, d) =>
        `${a || "Someone"} declared a family relation with you${d ? ` (${d})` : ""} on Rowi. For the link to show up on your account, you need to accept it from the family settings.`,
      cta: "Review the relation",
      footer: "If you weren't expecting this, you can ignore or decline from the link.",
    },
    "family.accepted": {
      subject: (a) => `${a || "Your family member"} accepted the relation on Rowi`,
      greeting: "Hi!",
      body: (a, d) =>
        `${a || "The person you invited"} accepted the family relation${d ? ` (${d})` : ""} on Rowi.`,
      cta: "View relations",
      footer: "Rowi · personal relations",
    },
    "family.declined": {
      subject: (a) => `${a || "Your family member"} declined the relation on Rowi`,
      greeting: "Hi!",
      body: (a, d) =>
        `${a || "The person you invited"} declined the family relation${d ? ` (${d})` : ""} on Rowi.`,
      cta: "View relations",
      footer: "Rowi · personal relations",
    },
    "service.proposed": {
      subject: (a) => `${a || "A coach"} proposed a service engagement on Rowi`,
      greeting: "Hi!",
      body: (a, d) =>
        `${a || "A service provider"} proposed an engagement${d ? ` (${d})` : ""} on Rowi. Review and accept if it's for you.`,
      cta: "Review engagement",
      footer: "Rowi · services",
    },
    "service.accepted": {
      subject: (a) => `${a || "The client"} accepted your engagement on Rowi`,
      greeting: "Hi!",
      body: (a, d) =>
        `${a || "The client"} accepted your engagement${d ? ` (${d})` : ""} on Rowi.`,
      cta: "View services",
      footer: "Rowi · services",
    },
    "service.ended": {
      subject: () => `Engagement ended on Rowi`,
      greeting: "Hi!",
      body: (a, d) =>
        `${a || "The counterpart"} marked the engagement${d ? ` (${d})` : ""} as ended on Rowi.`,
      cta: "View services",
      footer: "Rowi · services",
    },
  },
  pt: {
    "family.requested": {
      subject: (a) => `${a || "Alguém"} adicionou você como família no Rowi`,
      greeting: "Olá!",
      body: (a, d) =>
        `${a || "Alguém"} declarou uma relação familiar com você${d ? ` (${d})` : ""} no Rowi. Para o vínculo aparecer na sua conta, é preciso aceitá-lo nas configurações de família.`,
      cta: "Revisar o vínculo",
      footer: "Se você não esperava esta mensagem, pode ignorar ou recusar pelo link.",
    },
    "family.accepted": {
      subject: (a) => `${a || "Seu familiar"} aceitou o vínculo no Rowi`,
      greeting: "Olá!",
      body: (a, d) =>
        `${a || "A pessoa que você convidou"} aceitou o vínculo familiar${d ? ` (${d})` : ""} no Rowi.`,
      cta: "Ver vínculos",
      footer: "Rowi · vínculos pessoais",
    },
    "family.declined": {
      subject: (a) => `${a || "Seu familiar"} recusou o vínculo no Rowi`,
      greeting: "Olá!",
      body: (a, d) =>
        `${a || "A pessoa que você convidou"} recusou o vínculo familiar${d ? ` (${d})` : ""} no Rowi.`,
      cta: "Ver vínculos",
      footer: "Rowi · vínculos pessoais",
    },
    "service.proposed": {
      subject: (a) => `${a || "Um coach"} propôs um engagement no Rowi`,
      greeting: "Olá!",
      body: (a, d) =>
        `${a || "Um prestador de serviços"} propôs um engagement${d ? ` (${d})` : ""} no Rowi. Revise e aceite se for para você.`,
      cta: "Revisar engagement",
      footer: "Rowi · serviços",
    },
    "service.accepted": {
      subject: (a) => `${a || "O cliente"} aceitou seu engagement no Rowi`,
      greeting: "Olá!",
      body: (a, d) =>
        `${a || "O cliente"} aceitou seu engagement${d ? ` (${d})` : ""} no Rowi.`,
      cta: "Ver serviços",
      footer: "Rowi · serviços",
    },
    "service.ended": {
      subject: () => `Engagement encerrado no Rowi`,
      greeting: "Olá!",
      body: (a, d) =>
        `${a || "A contraparte"} marcou o engagement${d ? ` (${d})` : ""} como encerrado no Rowi.`,
      cta: "Ver serviços",
      footer: "Rowi · serviços",
    },
  },
  it: {
    "family.requested": {
      subject: (a) => `${a || "Qualcuno"} ti ha aggiunto come familiare su Rowi`,
      greeting: "Ciao!",
      body: (a, d) =>
        `${a || "Qualcuno"} ha dichiarato una relazione familiare con te${d ? ` (${d})` : ""} su Rowi. Perché il legame compaia sul tuo account, devi accettarlo dalle impostazioni di famiglia.`,
      cta: "Rivedi il legame",
      footer: "Se non ti aspettavi questo messaggio, puoi ignorarlo o rifiutarlo dal link.",
    },
    "family.accepted": {
      subject: (a) => `${a || "Il tuo familiare"} ha accettato il legame su Rowi`,
      greeting: "Ciao!",
      body: (a, d) =>
        `${a || "La persona che hai invitato"} ha accettato il legame familiare${d ? ` (${d})` : ""} su Rowi.`,
      cta: "Vedi legami",
      footer: "Rowi · legami personali",
    },
    "family.declined": {
      subject: (a) => `${a || "Il tuo familiare"} ha rifiutato il legame su Rowi`,
      greeting: "Ciao!",
      body: (a, d) =>
        `${a || "La persona che hai invitato"} ha rifiutato il legame familiare${d ? ` (${d})` : ""} su Rowi.`,
      cta: "Vedi legami",
      footer: "Rowi · legami personali",
    },
    "service.proposed": {
      subject: (a) => `${a || "Un coach"} ti ha proposto un engagement su Rowi`,
      greeting: "Ciao!",
      body: (a, d) =>
        `${a || "Un fornitore di servizi"} ti ha proposto un engagement${d ? ` (${d})` : ""} su Rowi. Rivedilo e accettalo se è per te.`,
      cta: "Rivedi engagement",
      footer: "Rowi · servizi",
    },
    "service.accepted": {
      subject: (a) => `${a || "Il cliente"} ha accettato il tuo engagement su Rowi`,
      greeting: "Ciao!",
      body: (a, d) =>
        `${a || "Il cliente"} ha accettato il tuo engagement${d ? ` (${d})` : ""} su Rowi.`,
      cta: "Vedi servizi",
      footer: "Rowi · servizi",
    },
    "service.ended": {
      subject: () => `Engagement terminato su Rowi`,
      greeting: "Ciao!",
      body: (a, d) =>
        `${a || "La controparte"} ha contrassegnato l'engagement${d ? ` (${d})` : ""} come terminato su Rowi.`,
      cta: "Vedi servizi",
      footer: "Rowi · servizi",
    },
  },
};

function buildHtml(input: SendContextNotificationInput) {
  const locale = ((input.locale || "es") as Locale) in STRINGS
    ? ((input.locale || "es") as Locale)
    : "es";
  const s = STRINGS[locale][input.kind];
  const subject = s.subject(input.actorName, input.detail);
  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 32px auto; padding: 24px; background: #fafafa; color: #111;">
  <h2 style="margin-top: 0;">${s.greeting}</h2>
  <p style="line-height: 1.5;">${s.body(input.actorName, input.detail)}</p>
  <p style="margin: 24px 0;">
    <a href="${input.ctaUrl}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(to right, #6366f1, #8b5cf6); color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">${s.cta}</a>
  </p>
  <p style="font-size: 12px; color: #666; margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px;">${s.footer}</p>
</body>
</html>`.trim();
  const text = `${s.greeting}\n\n${s.body(input.actorName, input.detail)}\n\n${s.cta}: ${input.ctaUrl}\n\n${s.footer}`;
  return { subject, html, text };
}

export async function sendContextNotification(
  input: SendContextNotificationInput,
): Promise<SendContextNotificationResult> {
  if (!input.to?.trim()) {
    return { ok: false, error: "Recipient email is required" };
  }
  if (!input.ctaUrl?.trim()) {
    return { ok: false, error: "ctaUrl is required" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith("re_")) {
    secureLog.warn(
      "[context-notification] RESEND_API_KEY ausente o placeholder — email NO enviado. Configura una key real (re_...) en el entorno.",
    );
    return { ok: true, skipped: true };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@rowiia.com";
  const fromName = process.env.RESEND_FROM_NAME || "Rowi";

  const { subject, html, text } = buildHtml(input);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [input.to.trim()],
        subject,
        html,
        text,
        tags: [
          { name: "kind", value: "context_notification" },
          { name: "type", value: input.kind },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[context-notification] Resend error:",
        response.status,
        errorText,
      );
      return { ok: false, error: `Resend ${response.status}` };
    }

    const data = await response.json();
    return { ok: true, id: data.id };
  } catch (err: any) {
    console.error("[context-notification] Failed to send:", err);
    return { ok: false, error: err?.message || "Unknown error" };
  }
}
