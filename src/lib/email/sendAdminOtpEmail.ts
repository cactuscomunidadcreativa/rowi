// src/lib/email/sendAdminOtpEmail.ts
// ============================================================
// Envía el código OTP de acceso al panel admin (Resend).
// Mismo wiring que sendVerificationEmail. No duplicar el cliente
// Resend: si en el futuro se centraliza, migrar todos juntos.
// ============================================================

import { secureLog } from "@/lib/logging";

export type AdminOtpLocale = "es" | "en" | "pt" | "it";

export interface SendAdminOtpEmailInput {
  to: string;
  name?: string | null;
  code: string;
  locale?: AdminOtpLocale | string;
}

export interface SendAdminOtpEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

const STRINGS: Record<AdminOtpLocale, {
  subject: string;
  greeting: (name?: string | null) => string;
  intro: string;
  expiry: string;
  ignore: string;
  footer: string;
}> = {
  es: {
    subject: "Tu código de acceso al panel de administración",
    greeting: (n) => (n ? `Hola ${n},` : "Hola,"),
    intro: "Usa este código para acceder al panel de administración de Rowi:",
    expiry: "El código vence en 10 minutos.",
    ignore: "Si no intentaste acceder al panel, ignora este correo y considera cambiar tu contraseña.",
    footer: "Rowi · Seguridad",
  },
  en: {
    subject: "Your admin panel access code",
    greeting: (n) => (n ? `Hi ${n},` : "Hi,"),
    intro: "Use this code to access the Rowi admin panel:",
    expiry: "The code expires in 10 minutes.",
    ignore: "If you didn't try to access the panel, ignore this email and consider changing your password.",
    footer: "Rowi · Security",
  },
  pt: {
    subject: "Seu código de acesso ao painel de administração",
    greeting: (n) => (n ? `Olá ${n},` : "Olá,"),
    intro: "Use este código para acessar o painel de administração da Rowi:",
    expiry: "O código expira em 10 minutos.",
    ignore: "Se você não tentou acessar o painel, ignore este e-mail e considere trocar sua senha.",
    footer: "Rowi · Segurança",
  },
  it: {
    subject: "Il tuo codice di accesso al pannello di amministrazione",
    greeting: (n) => (n ? `Ciao ${n},` : "Ciao,"),
    intro: "Usa questo codice per accedere al pannello di amministrazione di Rowi:",
    expiry: "Il codice scade tra 10 minuti.",
    ignore: "Se non hai tentato di accedere al pannello, ignora questa email e valuta di cambiare la password.",
    footer: "Rowi · Sicurezza",
  },
};

function pickLocale(locale?: string): AdminOtpLocale {
  if (locale === "en" || locale === "pt" || locale === "it") return locale;
  return "es";
}

export async function sendAdminOtpEmail(
  input: SendAdminOtpEmailInput,
): Promise<SendAdminOtpEmailResult> {
  if (!input.to) return { ok: false, error: "recipient is required" };
  if (!input.code) return { ok: false, error: "code is required" };

  const apiKey = process.env.RESEND_API_KEY;
  // El OTP de admin es crítico: a diferencia de otros emails, NO debe fallar
  // en silencio. Una API key ausente o placeholder (toda key de Resend real
  // empieza con "re_") significa que el código nunca llegaría, dejando al
  // admin fuera sin saberlo. Devolvemos error explícito.
  if (!apiKey || !apiKey.startsWith("re_")) {
    secureLog.info("[admin-otp] RESEND_API_KEY ausente o inválida — OTP no enviado");
    return {
      ok: false,
      error:
        "El envío de email no está configurado (RESEND_API_KEY). Contacta al administrador o usa el bypass de emergencia.",
    };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@rowiia.com";
  const fromName = process.env.RESEND_FROM_NAME || "Rowi";
  const s = STRINGS[pickLocale(input.locale)];

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <p style="font-size:15px;color:#333;">${s.greeting(input.name)}</p>
      <p style="font-size:15px;color:#333;">${s.intro}</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#5B2A86;text-align:center;margin:24px 0;">${input.code}</p>
      <p style="font-size:13px;color:#666;">${s.expiry}</p>
      <p style="font-size:13px;color:#999;">${s.ignore}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#aaa;">${s.footer}</p>
    </div>`;
  const text = `${s.greeting(input.name)}\n\n${s.intro}\n\n${input.code}\n\n${s.expiry}\n${s.ignore}\n\n${s.footer}`;

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
        subject: s.subject,
        html,
        text,
        tags: [{ name: "kind", value: "admin-otp" }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[admin-otp] Resend error:", response.status, errorText);
      return { ok: false, error: `Resend ${response.status}` };
    }

    const data = await response.json();
    secureLog.info(`[admin-otp] sent to=${input.to} id=${data.id}`);
    return { ok: true, id: data.id };
  } catch (err: unknown) {
    console.error("[admin-otp] Failed to send:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
