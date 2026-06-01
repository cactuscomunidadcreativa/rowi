// src/lib/email/sendInviteEmail.ts
// ============================================================
// Reusable invite email sender (Resend)
// ============================================================
// Used by:
//   - /api/workspaces/[id]/invite       (workspace member invites)
//   - /api/admin/users/invite           (admin invites)
//   - /api/community/invite             (community invites)
//
// NO duplicates the Resend wiring already present in
// src/lib/notifications/providers/email.ts — that file is for the
// generic notification pipeline (NotificationType-based). This file
// is purely for transactional invite emails and exposes a small,
// focused API.
// ============================================================

import { secureLog } from "@/lib/logging";

export type InviteEmailLocale = "es" | "en" | "pt" | "it";

export type InviteEmailKind = "initial" | "reminder";

export interface SendInviteEmailInput {
  to: string;
  inviteUrl: string;
  /** Optional: shown as "X invited you" */
  inviterName?: string | null;
  /** Optional: workspace/community/tenant name shown in the subject */
  workspaceName?: string | null;
  /** Optional: role label shown to the recipient */
  role?: string | null;
  /** Language for subject + body. Defaults to "es". */
  locale?: InviteEmailLocale | string;
  /** Email variant. "initial" = first send (default), "reminder" = expiry reminder. */
  kind?: InviteEmailKind;
  /** Días hasta que el token expira. Solo se usa cuando kind="reminder". */
  expiresInDays?: number;
}

export interface SendInviteEmailResult {
  ok: boolean;
  /** Resend message id when successful */
  id?: string;
  error?: string;
  /** True if Resend wasn't configured — caller can still rely on the
   *  invite link being returned in the API response. */
  skipped?: boolean;
}

const STRINGS: Record<InviteEmailLocale, {
  subject: (workspace?: string | null) => string;
  subjectReminder: (workspace?: string | null) => string;
  greeting: string;
  intro: (inviter?: string | null) => string;
  introReminder: (inviter?: string | null) => string;
  workspaceLine: (name?: string | null) => string;
  roleLine: (role?: string | null) => string;
  cta: string;
  expiry: string;
  expiryDays: (days: number) => string;
  fallbackUrl: string;
  footer: string;
}> = {
  es: {
    subject: (w) => w ? `Te invitaron a "${w}" en Rowi` : "Te invitaron a Rowi",
    subjectReminder: (w) =>
      w
        ? `Recordatorio: tu invitación a "${w}" expira mañana`
        : "Recordatorio: tu invitación a Rowi expira mañana",
    greeting: "¡Hola!",
    intro: (inviter) =>
      inviter
        ? `${inviter} te ha invitado a colaborar en Rowi, la plataforma de inteligencia emocional con IA.`
        : `Te han invitado a colaborar en Rowi, la plataforma de inteligencia emocional con IA.`,
    introReminder: (inviter) =>
      inviter
        ? `Este es un recordatorio: ${inviter} te invitó a Rowi y tu invitación está a punto de expirar.`
        : `Este es un recordatorio: tu invitación a Rowi está a punto de expirar.`,
    workspaceLine: (name) => name ? `Workspace: <strong>${name}</strong>` : "",
    roleLine: (role) => role ? `Rol asignado: <strong>${role}</strong>` : "",
    cta: "Aceptar invitación",
    expiry: "Este enlace expira en 14 días.",
    expiryDays: (d) => `Este enlace expira en ${d} ${d === 1 ? "día" : "días"}.`,
    fallbackUrl: "Si el botón no funciona, copia este enlace en tu navegador:",
    footer: "Si no esperabas esta invitación, puedes ignorar este correo.",
  },
  en: {
    subject: (w) => w ? `You were invited to "${w}" on Rowi` : "You were invited to Rowi",
    subjectReminder: (w) =>
      w
        ? `Reminder: your invitation to "${w}" expires tomorrow`
        : "Reminder: your Rowi invitation expires tomorrow",
    greeting: "Hi!",
    intro: (inviter) =>
      inviter
        ? `${inviter} has invited you to collaborate on Rowi, the AI-powered emotional intelligence platform.`
        : `You've been invited to collaborate on Rowi, the AI-powered emotional intelligence platform.`,
    introReminder: (inviter) =>
      inviter
        ? `Friendly reminder: ${inviter} invited you to Rowi and your invitation is about to expire.`
        : `Friendly reminder: your invitation to Rowi is about to expire.`,
    workspaceLine: (name) => name ? `Workspace: <strong>${name}</strong>` : "",
    roleLine: (role) => role ? `Assigned role: <strong>${role}</strong>` : "",
    cta: "Accept invitation",
    expiry: "This link expires in 14 days.",
    expiryDays: (d) => `This link expires in ${d} ${d === 1 ? "day" : "days"}.`,
    fallbackUrl: "If the button doesn't work, copy this link into your browser:",
    footer: "If you didn't expect this invitation, you can safely ignore this email.",
  },
  pt: {
    subject: (w) => w ? `Você foi convidado para "${w}" no Rowi` : "Você foi convidado para o Rowi",
    subjectReminder: (w) =>
      w
        ? `Lembrete: seu convite para "${w}" expira amanhã`
        : "Lembrete: seu convite para o Rowi expira amanhã",
    greeting: "Olá!",
    intro: (inviter) =>
      inviter
        ? `${inviter} convidou você para colaborar no Rowi, a plataforma de inteligência emocional com IA.`
        : `Você foi convidado para colaborar no Rowi, a plataforma de inteligência emocional com IA.`,
    introReminder: (inviter) =>
      inviter
        ? `Lembrete amigável: ${inviter} convidou você para o Rowi e seu convite está prestes a expirar.`
        : `Lembrete amigável: seu convite para o Rowi está prestes a expirar.`,
    workspaceLine: (name) => name ? `Workspace: <strong>${name}</strong>` : "",
    roleLine: (role) => role ? `Papel atribuído: <strong>${role}</strong>` : "",
    cta: "Aceitar convite",
    expiry: "Este link expira em 14 dias.",
    expiryDays: (d) => `Este link expira em ${d} ${d === 1 ? "dia" : "dias"}.`,
    fallbackUrl: "Se o botão não funcionar, copie este link no seu navegador:",
    footer: "Se você não esperava este convite, pode ignorar este email.",
  },
  it: {
    subject: (w) => w ? `Sei stato invitato a "${w}" su Rowi` : "Sei stato invitato a Rowi",
    subjectReminder: (w) =>
      w
        ? `Promemoria: il tuo invito a "${w}" scade domani`
        : "Promemoria: il tuo invito a Rowi scade domani",
    greeting: "Ciao!",
    intro: (inviter) =>
      inviter
        ? `${inviter} ti ha invitato a collaborare su Rowi, la piattaforma di intelligenza emotiva con IA.`
        : `Sei stato invitato a collaborare su Rowi, la piattaforma di intelligenza emotiva con IA.`,
    introReminder: (inviter) =>
      inviter
        ? `Promemoria: ${inviter} ti ha invitato su Rowi e il tuo invito sta per scadere.`
        : `Promemoria: il tuo invito a Rowi sta per scadere.`,
    workspaceLine: (name) => name ? `Workspace: <strong>${name}</strong>` : "",
    roleLine: (role) => role ? `Ruolo assegnato: <strong>${role}</strong>` : "",
    cta: "Accetta invito",
    expiry: "Questo link scade tra 14 giorni.",
    expiryDays: (d) => `Questo link scade tra ${d} ${d === 1 ? "giorno" : "giorni"}.`,
    fallbackUrl: "Se il pulsante non funziona, copia questo link nel tuo browser:",
    footer: "Se non ti aspettavi questo invito, puoi ignorare questa email.",
  },
};

function buildHtml(input: SendInviteEmailInput): { subject: string; html: string; text: string } {
  const locale = (["es", "en", "pt", "it"] as const).includes(input.locale as any)
    ? (input.locale as InviteEmailLocale)
    : "es";
  const s = STRINGS[locale];
  const kind: InviteEmailKind = input.kind ?? "initial";
  const subject = kind === "reminder"
    ? s.subjectReminder(input.workspaceName)
    : s.subject(input.workspaceName);
  const introText = kind === "reminder"
    ? s.introReminder(input.inviterName)
    : s.intro(input.inviterName);
  const expiryStr = typeof input.expiresInDays === "number"
    ? s.expiryDays(input.expiresInDays)
    : s.expiry;

  const text = [
    `${s.greeting}`,
    "",
    introText.replace(/<[^>]+>/g, ""),
    "",
    input.workspaceName ? `Workspace: ${input.workspaceName}` : null,
    input.role ? `${locale === "es" ? "Rol" : locale === "pt" ? "Papel" : locale === "it" ? "Ruolo" : "Role"}: ${input.role}` : null,
    "",
    `${s.cta}: ${input.inviteUrl}`,
    "",
    expiryStr,
    s.footer,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #d797cf 0%, #31a2e3 100%); padding: 24px 32px;">
      <h2 style="margin: 0; color: white; font-size: 22px; font-weight: 600;">Rowi</h2>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1f2937;">${s.greeting}</h1>
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">${introText}</p>

      ${input.workspaceName ? `<p style="margin: 0 0 8px; font-size: 15px; color: #4b5563;">${s.workspaceLine(input.workspaceName)}</p>` : ""}
      ${input.role ? `<p style="margin: 0 0 24px; font-size: 15px; color: #4b5563;">${s.roleLine(input.role)}</p>` : ""}

      <a href="${input.inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #d797cf 0%, #31a2e3 100%); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 500; font-size: 15px; margin: 8px 0 24px;">
        ${s.cta}
      </a>

      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af;">${s.fallbackUrl}</p>
      <p style="margin: 0 0 20px; font-size: 12px; color: #6b7280; word-break: break-all;">
        <a href="${input.inviteUrl}" style="color: #6b7280;">${input.inviteUrl}</a>
      </p>

      <p style="margin: 0; font-size: 13px; color: #9ca3af;">${expiryStr}</p>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">${s.footer}</p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject, html, text };
}

/**
 * Send an invite email via Resend. Idempotent in the sense that the
 * caller is responsible for creating the InviteToken first and passing
 * the resulting inviteUrl here.
 *
 * Returns `skipped: true` (success-ish) when RESEND_API_KEY is missing,
 * so callers can decide to fall back to "show the link in the UI".
 */
export async function sendInviteEmail(input: SendInviteEmailInput): Promise<SendInviteEmailResult> {
  if (!input.to?.trim()) {
    return { ok: false, error: "Recipient email is required" };
  }
  if (!input.inviteUrl?.trim()) {
    return { ok: false, error: "inviteUrl is required" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.startsWith("re_")) {
    secureLog.warn("[invite-email] RESEND_API_KEY ausente o placeholder — email NO enviado. Configura una key real (re_...) en el entorno.");
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
        tags: [{ name: "kind", value: input.kind === "reminder" ? "invite_reminder" : "invite" }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[invite-email] Resend error:", response.status, errorText);
      return { ok: false, error: `Resend ${response.status}` };
    }

    const data = await response.json();
    return { ok: true, id: data.id };
  } catch (err: any) {
    console.error("[invite-email] Failed to send:", err);
    return { ok: false, error: err?.message || "Unknown error" };
  }
}
