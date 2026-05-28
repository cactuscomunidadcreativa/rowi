// src/lib/email/sendWelcomeEmail.ts
// ============================================================
// Welcome email sender (Resend)
// ============================================================
// Sent immediately after a successful signup via /api/auth/register.
// Confirms the account and points the user to the next step.
// ============================================================

import { secureLog } from "@/lib/logging";

export type WelcomeEmailLocale = "es" | "en" | "pt" | "it";

export interface SendWelcomeEmailInput {
  to: string;
  name?: string | null;
  /** Absolute URL where the user should land after clicking the CTA. */
  appUrl: string;
  /** Language for subject + body. Defaults to "es". */
  locale?: WelcomeEmailLocale | string;
}

export interface SendWelcomeEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

const STRINGS: Record<WelcomeEmailLocale, {
  subject: string;
  greeting: (name?: string | null) => string;
  intro: string;
  bullets: string[];
  cta: string;
  fallbackUrl: string;
  footer: string;
}> = {
  es: {
    subject: "Bienvenido a Rowi",
    greeting: (n) => (n ? `¡Hola, ${n}!` : "¡Hola!"),
    intro:
      "Tu cuenta en Rowi está lista. Rowi es la plataforma de inteligencia emocional con IA basada en el modelo Six Seconds.",
    bullets: [
      "Mide tus Vital Signs y descubre tus cinco motores emocionales.",
      "Explora tus 18 Brain Talents y aplícalos en el día a día.",
      "Conecta con tu Rowi Coach personal cuando lo necesites.",
    ],
    cta: "Entrar a mi panel",
    fallbackUrl: "Si el botón no funciona, copia este enlace en tu navegador:",
    footer: "Si no te registraste, puedes ignorar este correo.",
  },
  en: {
    subject: "Welcome to Rowi",
    greeting: (n) => (n ? `Hi ${n}!` : "Hi!"),
    intro:
      "Your Rowi account is ready. Rowi is the AI-powered emotional intelligence platform built on the Six Seconds model.",
    bullets: [
      "Measure your Vital Signs and discover your five emotional drivers.",
      "Explore your 18 Brain Talents and apply them day-to-day.",
      "Talk to your personal Rowi Coach whenever you need it.",
    ],
    cta: "Open my dashboard",
    fallbackUrl: "If the button doesn't work, copy this link into your browser:",
    footer: "If you didn't sign up, you can safely ignore this email.",
  },
  pt: {
    subject: "Bem-vindo ao Rowi",
    greeting: (n) => (n ? `Olá, ${n}!` : "Olá!"),
    intro:
      "Sua conta no Rowi está pronta. O Rowi é a plataforma de inteligência emocional com IA baseada no modelo Six Seconds.",
    bullets: [
      "Meça seus Vital Signs e descubra seus cinco motores emocionais.",
      "Explore seus 18 Brain Talents e aplique-os no dia a dia.",
      "Converse com seu Rowi Coach pessoal sempre que precisar.",
    ],
    cta: "Abrir meu painel",
    fallbackUrl: "Se o botão não funcionar, copie este link no seu navegador:",
    footer: "Se você não se registrou, pode ignorar este email.",
  },
  it: {
    subject: "Benvenuto su Rowi",
    greeting: (n) => (n ? `Ciao ${n}!` : "Ciao!"),
    intro:
      "Il tuo account su Rowi è pronto. Rowi è la piattaforma di intelligenza emotiva con IA basata sul modello Six Seconds.",
    bullets: [
      "Misura i tuoi Vital Signs e scopri i tuoi cinque motori emotivi.",
      "Esplora i tuoi 18 Brain Talents e applicali ogni giorno.",
      "Parla con il tuo Rowi Coach personale quando vuoi.",
    ],
    cta: "Apri il mio pannello",
    fallbackUrl: "Se il pulsante non funziona, copia questo link nel tuo browser:",
    footer: "Se non ti sei registrato, puoi ignorare questa email.",
  },
};

function buildHtml(input: SendWelcomeEmailInput) {
  const locale = (["es", "en", "pt", "it"] as const).includes(input.locale as any)
    ? (input.locale as WelcomeEmailLocale)
    : "es";
  const s = STRINGS[locale];
  const greeting = s.greeting(input.name);
  const bulletsHtml = s.bullets
    .map((b) => `<li style="margin-bottom: 6px;">${b}</li>`)
    .join("");

  const text = [
    greeting,
    "",
    s.intro,
    "",
    ...s.bullets.map((b) => `• ${b}`),
    "",
    `${s.cta}: ${input.appUrl}`,
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
      <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #4b5563;">${s.intro}</p>
      <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 15px; color: #4b5563; line-height: 1.6;">
        ${bulletsHtml}
      </ul>
      <a href="${input.appUrl}" style="display: inline-block; background: linear-gradient(135deg, #d797cf 0%, #31a2e3 100%); color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 500; font-size: 15px; margin: 8px 0 24px;">
        ${s.cta}
      </a>
      <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af;">${s.fallbackUrl}</p>
      <p style="margin: 0; font-size: 12px; color: #6b7280; word-break: break-all;">
        <a href="${input.appUrl}" style="color: #6b7280;">${input.appUrl}</a>
      </p>
    </div>
    <div style="padding: 20px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">${s.footer}</p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject: s.subject, html, text };
}

export async function sendWelcomeEmail(
  input: SendWelcomeEmailInput,
): Promise<SendWelcomeEmailResult> {
  if (!input.to?.trim()) {
    return { ok: false, error: "Recipient email is required" };
  }
  if (!input.appUrl?.trim()) {
    return { ok: false, error: "appUrl is required" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    secureLog.info(
      "[welcome-email] RESEND_API_KEY not set — welcome email not sent",
    );
    return { ok: true, skipped: true };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@rowi.app";
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
        tags: [{ name: "kind", value: "welcome" }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[welcome-email] Resend error:", response.status, errorText);
      return { ok: false, error: `Resend ${response.status}` };
    }

    const data = await response.json();
    secureLog.info(`[welcome-email] sent to=${input.to} id=${data.id}`);
    return { ok: true, id: data.id };
  } catch (err: any) {
    console.error("[welcome-email] Failed to send:", err);
    return { ok: false, error: err?.message || "Unknown error" };
  }
}
