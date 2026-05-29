// src/lib/email/sendBillingNotification.ts
// ============================================================
// Transactional billing emails (Resend).
//
// Disparados desde los handlers de Stripe webhook:
//   - trial_will_end                   → "Tu trial termina en 3 días"
//   - payment_failed                   → "Tu pago falló — actualiza método"
//   - payment_action_required          → "Tu banco pide confirmar el pago"
//
// Sigue el mismo patrón que sendInviteEmail / sendContextNotification:
// 4 locales (es/en/pt/it), `skipped:true` si falta RESEND_API_KEY,
// secureLog.info en envío exitoso.
// ============================================================

import { secureLog } from "@/lib/logging";

export type BillingNotificationKind =
  | "trial_will_end"
  | "payment_failed"
  | "payment_action_required";

export type BillingLocale = "es" | "en" | "pt" | "it";

export interface SendBillingNotificationInput {
  to: string;
  kind: BillingNotificationKind;
  /** Nombre del destinatario para el saludo. */
  name?: string | null;
  /** URL para llevar al usuario a acción (típicamente customer portal). */
  ctaUrl: string;
  /** Días restantes del trial (solo para trial_will_end). */
  trialDaysLeft?: number;
  /** Monto en cents y currency, para payment_failed. */
  amountCents?: number;
  currency?: string;
  locale?: BillingLocale | string;
}

export interface SendBillingNotificationResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

type StringSet = {
  subject: (input: SendBillingNotificationInput) => string;
  greeting: (name?: string | null) => string;
  body: (input: SendBillingNotificationInput) => string;
  cta: string;
  footer: string;
};

const STRINGS: Record<BillingLocale, Record<BillingNotificationKind, StringSet>> = {
  es: {
    trial_will_end: {
      subject: (i) =>
        `Tu trial de Rowi termina en ${i.trialDaysLeft ?? 3} días`,
      greeting: (n) => (n ? `¡Hola, ${n}!` : "¡Hola!"),
      body: (i) =>
        `Tu período de prueba en Rowi termina en ${i.trialDaysLeft ?? 3} días. Después se activará el cobro automático con el método de pago que tengas registrado. Si querés cambiar de plan o pausar la suscripción antes, podés hacerlo desde tu panel.`,
      cta: "Gestionar mi suscripción",
      footer: "Rowi · facturación",
    },
    payment_failed: {
      subject: () => "No pudimos procesar tu pago en Rowi",
      greeting: (n) => (n ? `Hola, ${n}` : "Hola"),
      body: () =>
        `Tu pago más reciente no se pudo procesar — esto suele ser por un método de pago vencido, sin saldo o bloqueado por el banco. Para no perder acceso a Rowi, actualizá tu método de pago lo antes posible.`,
      cta: "Actualizar método de pago",
      footer: "Rowi · facturación",
    },
    payment_action_required: {
      subject: () => "Tu banco pide confirmar el pago en Rowi",
      greeting: (n) => (n ? `Hola, ${n}` : "Hola"),
      body: () =>
        `Tu banco requiere una confirmación adicional (autenticación 3D Secure) para completar el pago. Es un paso rápido. Confirmalo desde tu panel para mantener tu suscripción activa.`,
      cta: "Confirmar el pago",
      footer: "Rowi · facturación",
    },
  },
  en: {
    trial_will_end: {
      subject: (i) =>
        `Your Rowi trial ends in ${i.trialDaysLeft ?? 3} days`,
      greeting: (n) => (n ? `Hi ${n}!` : "Hi!"),
      body: (i) =>
        `Your Rowi trial ends in ${i.trialDaysLeft ?? 3} days. After that, automatic billing kicks in with your saved payment method. If you want to change plans or pause your subscription, you can do it from your dashboard before then.`,
      cta: "Manage my subscription",
      footer: "Rowi · billing",
    },
    payment_failed: {
      subject: () => "We couldn't process your payment on Rowi",
      greeting: (n) => (n ? `Hi ${n}` : "Hi"),
      body: () =>
        `Your most recent payment didn't go through — usually due to an expired card, insufficient funds, or a bank block. To keep your Rowi access, please update your payment method as soon as possible.`,
      cta: "Update payment method",
      footer: "Rowi · billing",
    },
    payment_action_required: {
      subject: () => "Your bank needs to confirm your Rowi payment",
      greeting: (n) => (n ? `Hi ${n}` : "Hi"),
      body: () =>
        `Your bank requires an additional confirmation (3D Secure authentication) to complete the payment. It's a quick step. Confirm it from your dashboard to keep your subscription active.`,
      cta: "Confirm payment",
      footer: "Rowi · billing",
    },
  },
  pt: {
    trial_will_end: {
      subject: (i) =>
        `Seu trial do Rowi termina em ${i.trialDaysLeft ?? 3} dias`,
      greeting: (n) => (n ? `Olá, ${n}!` : "Olá!"),
      body: (i) =>
        `Seu período de teste no Rowi termina em ${i.trialDaysLeft ?? 3} dias. Depois, a cobrança automática começa com o método de pagamento cadastrado. Se quiser trocar de plano ou pausar a assinatura antes, faça isso no seu painel.`,
      cta: "Gerenciar minha assinatura",
      footer: "Rowi · cobrança",
    },
    payment_failed: {
      subject: () => "Não conseguimos processar seu pagamento no Rowi",
      greeting: (n) => (n ? `Olá, ${n}` : "Olá"),
      body: () =>
        `Seu pagamento mais recente não foi processado — geralmente é por cartão vencido, sem saldo ou bloqueado pelo banco. Para não perder acesso ao Rowi, atualize seu método de pagamento o quanto antes.`,
      cta: "Atualizar método de pagamento",
      footer: "Rowi · cobrança",
    },
    payment_action_required: {
      subject: () => "Seu banco pede confirmação do pagamento no Rowi",
      greeting: (n) => (n ? `Olá, ${n}` : "Olá"),
      body: () =>
        `Seu banco precisa de uma confirmação adicional (autenticação 3D Secure) para completar o pagamento. É rápido. Confirme no seu painel para manter sua assinatura ativa.`,
      cta: "Confirmar pagamento",
      footer: "Rowi · cobrança",
    },
  },
  it: {
    trial_will_end: {
      subject: (i) =>
        `La tua prova di Rowi finisce tra ${i.trialDaysLeft ?? 3} giorni`,
      greeting: (n) => (n ? `Ciao ${n}!` : "Ciao!"),
      body: (i) =>
        `Il tuo periodo di prova su Rowi termina tra ${i.trialDaysLeft ?? 3} giorni. Dopo, partirà l'addebito automatico con il metodo di pagamento salvato. Se vuoi cambiare piano o mettere in pausa l'abbonamento, fallo dal tuo pannello prima della scadenza.`,
      cta: "Gestisci il mio abbonamento",
      footer: "Rowi · fatturazione",
    },
    payment_failed: {
      subject: () => "Non siamo riusciti a elaborare il tuo pagamento su Rowi",
      greeting: (n) => (n ? `Ciao ${n}` : "Ciao"),
      body: () =>
        `Il tuo ultimo pagamento non è andato a buon fine — di solito è per una carta scaduta, fondi insufficienti o un blocco della banca. Per non perdere l'accesso a Rowi, aggiorna al più presto il metodo di pagamento.`,
      cta: "Aggiorna metodo di pagamento",
      footer: "Rowi · fatturazione",
    },
    payment_action_required: {
      subject: () => "La tua banca chiede di confermare il pagamento su Rowi",
      greeting: (n) => (n ? `Ciao ${n}` : "Ciao"),
      body: () =>
        `La tua banca richiede una conferma aggiuntiva (autenticazione 3D Secure) per completare il pagamento. È un passaggio veloce. Confermalo dal tuo pannello per mantenere attivo l'abbonamento.`,
      cta: "Conferma il pagamento",
      footer: "Rowi · fatturazione",
    },
  },
};

function buildHtml(input: SendBillingNotificationInput) {
  const locale = (["es", "en", "pt", "it"] as const).includes(input.locale as any)
    ? (input.locale as BillingLocale)
    : "es";
  const s = STRINGS[locale][input.kind];
  const subject = s.subject(input);
  const greeting = s.greeting(input.name);
  const body = s.body(input);

  const text = [
    greeting,
    "",
    body,
    "",
    `${s.cta}: ${input.ctaUrl}`,
    "",
    s.footer,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 32px auto; padding: 24px; background: #fafafa; color: #111;">
  <h2 style="margin-top: 0;">${greeting}</h2>
  <p style="line-height: 1.5;">${body}</p>
  <p style="margin: 24px 0;">
    <a href="${input.ctaUrl}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(to right, #6366f1, #8b5cf6); color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">${s.cta}</a>
  </p>
  <p style="font-size: 12px; color: #666; margin-top: 32px; border-top: 1px solid #ddd; padding-top: 16px;">${s.footer}</p>
</body>
</html>`.trim();

  return { subject, html, text };
}

export async function sendBillingNotification(
  input: SendBillingNotificationInput,
): Promise<SendBillingNotificationResult> {
  if (!input.to?.trim()) {
    return { ok: false, error: "Recipient email is required" };
  }
  if (!input.ctaUrl?.trim()) {
    return { ok: false, error: "ctaUrl is required" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    secureLog.info(
      `[billing-notification] RESEND_API_KEY not set — kind=${input.kind} not sent`,
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
          { name: "kind", value: "billing_notification" },
          { name: "type", value: input.kind },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[billing-notification] Resend error:", response.status, errorText);
      return { ok: false, error: `Resend ${response.status}` };
    }

    const data = await response.json();
    secureLog.info(
      `[billing-notification] sent kind=${input.kind} to=${input.to} id=${data.id}`,
    );
    return { ok: true, id: data.id };
  } catch (err: any) {
    console.error("[billing-notification] Failed to send:", err);
    return { ok: false, error: err?.message || "Unknown error" };
  }
}
