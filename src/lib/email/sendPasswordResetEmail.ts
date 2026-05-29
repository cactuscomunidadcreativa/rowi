// src/lib/email/sendPasswordResetEmail.ts
// ============================================================
// Password reset email sender (Resend)
// ============================================================
// Sent from /api/auth/forgot-password when a user requests a
// reset. The link points to /reset-password?token=... which lets
// the user set a new password via /api/auth/reset-password.
// ============================================================

import { secureLog } from "@/lib/logging";

export type PasswordResetEmailLocale = "es" | "en" | "pt" | "it";

export interface SendPasswordResetEmailInput {
  to: string;
  name?: string | null;
  /** Absolute URL that lets the user set a new password. */
  resetUrl: string;
  /** Language for subject + body. Defaults to "es". */
  locale?: PasswordResetEmailLocale | string;
}

export interface SendPasswordResetEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

const STRINGS: Record<PasswordResetEmailLocale, {
  subject: string;
  greeting: (name?: string | null) => string;
  intro: string;
  cta: string;
  expiry: string;
  fallbackUrl: string;
  footer: string;
}> = {
  es: {
    subject: "Restablece tu contraseña en Rowi",
    greeting: (n) => (n ? `¡Hola, ${n}!` : "¡Hola!"),
    intro:
      "Recibimos una solicitud para restablecer tu contraseña en Rowi. Haz click en el botón para crear una nueva.",
    cta: "Restablecer contraseña",
    expiry: "Este enlace expira en 30 minutos.",
    fallbackUrl: "Si el botón no funciona, copia este enlace en tu navegador:",
    footer:
      "Si no solicitaste este cambio, ignora este correo. Tu contraseña actual sigue siendo válida.",
  },
  en: {
    subject: "Reset your Rowi password",
    greeting: (n) => (n ? `Hi ${n}!` : "Hi!"),
    intro:
      "We received a request to reset your Rowi password. Click the button to create a new one.",
    cta: "Reset password",
    expiry: "This link expires in 30 minutes.",
    fallbackUrl: "If the button doesn't work, copy this link into your browser:",
    footer:
      "If you didn't request this change, ignore this email. Your current password is still valid.",
  },
  pt: {
    subject: "Redefina sua senha no Rowi",
    greeting: (n) => (n ? `Olá, ${n}!` : "Olá!"),
    intro:
      "Recebemos uma solicitação para redefinir sua senha no Rowi. Clique no botão para criar uma nova.",
    cta: "Redefinir senha",
    expiry: "Este link expira em 30 minutos.",
    fallbackUrl: "Se o botão não funcionar, copie este link no seu navegador:",
    footer:
      "Se você não solicitou esta mudança, ignore este e-mail. Sua senha atual continua válida.",
  },
  it: {
    subject: "Reimposta la tua password Rowi",
    greeting: (n) => (n ? `Ciao ${n}!` : "Ciao!"),
    intro:
      "Abbiamo ricevuto una richiesta per reimpostare la tua password Rowi. Clicca sul pulsante per crearne una nuova.",
    cta: "Reimposta password",
    expiry: "Questo link scade tra 30 minuti.",
    fallbackUrl: "Se il pulsante non funziona, copia questo link nel tuo browser:",
    footer:
      "Se non hai richiesto questa modifica, ignora questa email. La tua password attuale rimane valida.",
  },
};

function buildHtml(input: SendPasswordResetEmailInput) {
  const locale = (["es", "en", "pt", "it"] as const).includes(
    input.locale as PasswordResetEmailLocale,
  )
    ? (input.locale as PasswordResetEmailLocale)
    : "es";
  const s = STRINGS[locale];
  const greeting = s.greeting(input.name);

  const text = [
    greeting,
    "",
    s.intro,
    "",
    `${s.cta}: ${input.resetUrl}`,
    "",
    s.expiry,
    "",
    s.footer,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #d797cf 0%, #31a2e3 100%); padding: 24px 32px;">
      <h2 style="margin: 0; color: white; font-size: 22px; font-weight: 600;">Rowi</h2>
    </div>
    <div style="padding: 32px;">
      <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1f2937;">${greeting}</h1>
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563;">${s.intro}</p>
      <a href="${input.resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #d797cf 0%, #31a2e3 100%); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 500; font-size: 15px; margin: 8px 0 24px;">
        ${s.cta}
      </a>
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af;">${s.fallbackUrl}</p>
      <p style="margin: 0 0 20px; font-size: 12px; color: #6b7280; word-break: break-all;">
        <a href="${input.resetUrl}" style="color: #6b7280;">${input.resetUrl}</a>
      </p>
      <p style="margin: 0; font-size: 13px; color: #9ca3af;">${s.expiry}</p>
    </div>
    <div style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">${s.footer}</p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject: s.subject, html, text };
}

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
): Promise<SendPasswordResetEmailResult> {
  if (!input.to?.trim()) {
    return { ok: false, error: "Recipient email is required" };
  }
  if (!input.resetUrl?.trim()) {
    return { ok: false, error: "resetUrl is required" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    secureLog.info(
      "[password-reset-email] RESEND_API_KEY not set — reset email not sent",
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
        tags: [{ name: "kind", value: "password-reset" }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[password-reset-email] Resend error:",
        response.status,
        errorText,
      );
      return { ok: false, error: `Resend ${response.status}` };
    }

    const data = await response.json();
    secureLog.info(`[password-reset-email] sent to=${input.to} id=${data.id}`);
    return { ok: true, id: data.id };
  } catch (err: unknown) {
    console.error("[password-reset-email] Failed to send:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
