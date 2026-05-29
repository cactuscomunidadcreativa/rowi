// src/lib/email/sendVerificationEmail.ts
// ============================================================
// Email verification sender (Resend)
// ============================================================
// Sent after signup (and on-demand from /api/auth/send-verification)
// to confirm ownership of the email address. The link points to
// /verify-email?token=... which calls /api/auth/verify-email.
// ============================================================

import { secureLog } from "@/lib/logging";

export type VerificationEmailLocale = "es" | "en" | "pt" | "it";

export interface SendVerificationEmailInput {
  to: string;
  name?: string | null;
  /** Absolute URL that, when opened, verifies the token. */
  verifyUrl: string;
  /** Language for subject + body. Defaults to "es". */
  locale?: VerificationEmailLocale | string;
}

export interface SendVerificationEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

const STRINGS: Record<VerificationEmailLocale, {
  subject: string;
  greeting: (name?: string | null) => string;
  intro: string;
  cta: string;
  expiry: string;
  fallbackUrl: string;
  footer: string;
}> = {
  es: {
    subject: "Confirma tu email",
    greeting: (n) => (n ? `¡Hola, ${n}!` : "¡Hola!"),
    intro:
      "Para terminar de activar tu cuenta en Rowi, confirma que este es tu correo haciendo click en el botón.",
    cta: "Confirmar mi email",
    expiry: "Este enlace expira en 24 horas.",
    fallbackUrl: "Si el botón no funciona, copia este enlace en tu navegador:",
    footer:
      "Si no fuiste tú quien creó esta cuenta, puedes ignorar este correo sin problema.",
  },
  en: {
    subject: "Confirm your email",
    greeting: (n) => (n ? `Hi ${n}!` : "Hi!"),
    intro:
      "To finish activating your Rowi account, confirm this is your email by clicking the button.",
    cta: "Confirm my email",
    expiry: "This link expires in 24 hours.",
    fallbackUrl: "If the button doesn't work, copy this link into your browser:",
    footer:
      "If you didn't create this account, you can safely ignore this email.",
  },
  pt: {
    subject: "Confirme seu e-mail",
    greeting: (n) => (n ? `Olá, ${n}!` : "Olá!"),
    intro:
      "Para terminar de ativar sua conta no Rowi, confirme que este é seu e-mail clicando no botão.",
    cta: "Confirmar meu e-mail",
    expiry: "Este link expira em 24 horas.",
    fallbackUrl: "Se o botão não funcionar, copie este link no seu navegador:",
    footer:
      "Se você não criou esta conta, pode ignorar este e-mail sem problemas.",
  },
  it: {
    subject: "Conferma la tua email",
    greeting: (n) => (n ? `Ciao ${n}!` : "Ciao!"),
    intro:
      "Per terminare l'attivazione del tuo account Rowi, conferma che questa è la tua email cliccando sul pulsante.",
    cta: "Conferma la mia email",
    expiry: "Questo link scade tra 24 ore.",
    fallbackUrl: "Se il pulsante non funziona, copia questo link nel tuo browser:",
    footer:
      "Se non sei stato tu a creare questo account, puoi ignorare questa email.",
  },
};

function buildHtml(input: SendVerificationEmailInput) {
  const locale = (["es", "en", "pt", "it"] as const).includes(
    input.locale as VerificationEmailLocale,
  )
    ? (input.locale as VerificationEmailLocale)
    : "es";
  const s = STRINGS[locale];
  const greeting = s.greeting(input.name);

  const text = [
    greeting,
    "",
    s.intro,
    "",
    `${s.cta}: ${input.verifyUrl}`,
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
      <a href="${input.verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #d797cf 0%, #31a2e3 100%); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 500; font-size: 15px; margin: 8px 0 24px;">
        ${s.cta}
      </a>
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af;">${s.fallbackUrl}</p>
      <p style="margin: 0 0 20px; font-size: 12px; color: #6b7280; word-break: break-all;">
        <a href="${input.verifyUrl}" style="color: #6b7280;">${input.verifyUrl}</a>
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

export async function sendVerificationEmail(
  input: SendVerificationEmailInput,
): Promise<SendVerificationEmailResult> {
  if (!input.to?.trim()) {
    return { ok: false, error: "Recipient email is required" };
  }
  if (!input.verifyUrl?.trim()) {
    return { ok: false, error: "verifyUrl is required" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    secureLog.info(
      "[verify-email] RESEND_API_KEY not set — verification email not sent",
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
        tags: [{ name: "kind", value: "verify-email" }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[verify-email] Resend error:", response.status, errorText);
      return { ok: false, error: `Resend ${response.status}` };
    }

    const data = await response.json();
    secureLog.info(`[verify-email] sent to=${input.to} id=${data.id}`);
    return { ok: true, id: data.id };
  } catch (err: unknown) {
    console.error("[verify-email] Failed to send:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
