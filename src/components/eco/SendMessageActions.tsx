"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  ExternalLink,
  Copy,
  Check,
  Slack,
  Send,
  User,
  Inbox,
  MessageCircle,
  Zap,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   📤 SendMessageActions
   ---------------------------------------------------------
   Permite enviar el mensaje generado por ECO a una persona
   elegida vía:
     - Envío DIRECTO por Gmail / WhatsApp si la integración
       está conectada (POST /api/eco/deliver)
     - Deep-link a Gmail compose (sale del Gmail real del usuario)
     - mailto: (clientes de correo no-Gmail)
     - Copiar el mensaje al portapapeles
   Slack queda como placeholder (depende del bot, fuera de scope).
========================================================= */

type SendMessageActionsProps = {
  subject?: string;
  body: string;
  recipientEmail?: string;
  recipientName?: string;
  dyadId?: string;
};

type DeliverChannels = {
  gmail: { connected: boolean; email: string | null };
  whatsapp: { connected: boolean };
};

export default function SendMessageActions({
  subject,
  body,
  recipientEmail,
  recipientName,
  dyadId,
}: SendMessageActionsProps) {
  const { t } = useI18n();

  const [email, setEmail] = useState(recipientEmail ?? "");
  const [name, setName] = useState(recipientName ?? "");
  const [phone, setPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [channels, setChannels] = useState<DeliverChannels | null>(null);
  const [sending, setSending] = useState<"gmail" | "whatsapp" | null>(null);
  const [sendResult, setSendResult] = useState<
    { ok: boolean; channel: string; error?: string } | null
  >(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/eco/deliver")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.ok) {
          setChannels({ gmail: data.gmail, whatsapp: data.whatsapp });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const deliverDirect = async (channel: "gmail" | "whatsapp") => {
    const to = channel === "gmail" ? email.trim() : phone.trim();
    if (!to || sending) return;
    setSending(channel);
    setSendResult(null);
    try {
      const res = await fetch("/api/eco/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, to, subject, text: body, dyadId }),
      });
      const data = await res.json().catch(() => ({}));
      setSendResult(
        data?.ok
          ? { ok: true, channel }
          : {
              ok: false,
              channel,
              error:
                res.status === 429
                  ? t("eco.send.rateLimited", "Has alcanzado el límite de envíos por ahora")
                  : t("eco.send.sendError", "No se pudo enviar el mensaje"),
            },
      );
    } catch {
      setSendResult({
        ok: false,
        channel,
        error: t("eco.send.sendError", "No se pudo enviar el mensaje"),
      });
    } finally {
      setSending(null);
    }
  };

  const trimmedEmail = email.trim();
  const subj = subject ?? "";

  const gmailUrl =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(trimmedEmail)}` +
    `&su=${encodeURIComponent(subj)}` +
    `&body=${encodeURIComponent(body)}`;

  const mailtoUrl =
    `mailto:${encodeURIComponent(trimmedEmail)}` +
    `?subject=${encodeURIComponent(subj)}` +
    `&body=${encodeURIComponent(body)}`;

  const outlookUrl =
    `https://outlook.office.com/mail/deeplink/compose` +
    `?to=${encodeURIComponent(trimmedEmail)}` +
    `&subject=${encodeURIComponent(subj)}` +
    `&body=${encodeURIComponent(body)}`;

  // WhatsApp no admite asunto ni destinatario por email: prefijamos el asunto
  // al texto y dejamos que el usuario elija el contacto en WhatsApp.
  const whatsappText = (subj ? `${subj}\n\n` : "") + body;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const canSend = trimmedEmail.length > 0;

  // Registrar el "sent" en la díada (foso de datos): antes los deep-links
  // solo hacían window.open() y el outcome jamás se capturaba (P0 auditoría).
  // Fire-and-forget: nunca bloquea ni rompe el envío.
  const recordSent = (sentChannel: string) => {
    if (!dyadId) return;
    void fetch("/api/eco/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sent", dyadId, channel: sentChannel, text: body }),
    }).catch(() => {});
  };

  const openGmail = () => {
    if (!canSend) return;
    recordSent("gmail_link");
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const openMailto = () => {
    if (!canSend) return;
    recordSent("mailto");
    window.location.href = mailtoUrl;
  };

  const openOutlook = () => {
    if (!canSend) return;
    recordSent("outlook_link");
    window.open(outlookUrl, "_blank", "noopener,noreferrer");
  };

  const openWhatsApp = () => {
    recordSent("whatsapp_link");
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const copyMessage = () => {
    void navigator.clipboard.writeText(body).then(() => {
      recordSent("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
        <Send className="w-5 h-5 text-[var(--rowi-g2)]" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {t("eco.send.title", "Enviar mensaje")}
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Selector de destinatario */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t("eco.send.emailLabel", "Correo del destinatario")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("eco.send.emailPlaceholder", "persona@correo.com")}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {t("eco.send.nameLabel", "Nombre (opcional)")}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("eco.send.namePlaceholder", "Nombre del destinatario")}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all"
              />
            </div>
          </div>
          {channels?.whatsapp.connected && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t("eco.send.phoneLabel", "WhatsApp del destinatario")}
              </label>
              <div className="relative">
                <MessageCircle className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("eco.send.phonePlaceholder", "+593 99 999 9999")}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Envío directo — integraciones conectadas */}
        {(channels?.gmail.connected || channels?.whatsapp.connected) && (
          <div className="flex flex-wrap gap-2">
            {channels?.gmail.connected && (
              <button
                type="button"
                onClick={() => void deliverDirect("gmail")}
                disabled={!canSend || sending !== null}
                title={
                  canSend
                    ? `${t("eco.send.directGmailTip", "Rowi lo envía desde tu Gmail conectado")}${channels.gmail.email ? ` (${channels.gmail.email})` : ""}`
                    : t("eco.send.needEmail", "Escribe un correo primero")
                }
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  canSend && sending === null
                    ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white hover:shadow-md hover:shadow-[var(--rowi-g2)]/25"
                    : "bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {sending === "gmail" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {t("eco.send.directGmail", "Enviar directo (Gmail)")}
              </button>
            )}

            {channels?.whatsapp.connected && (
              <button
                type="button"
                onClick={() => void deliverDirect("whatsapp")}
                disabled={!phone.trim() || sending !== null}
                title={
                  phone.trim()
                    ? t("eco.send.directWhatsappTip", "Rowi lo envía por WhatsApp al número indicado")
                    : t("eco.send.needPhone", "Escribe el número de WhatsApp primero")
                }
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  phone.trim() && sending === null
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-md hover:shadow-emerald-500/25"
                    : "bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {sending === "whatsapp" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {t("eco.send.directWhatsapp", "Enviar directo (WhatsApp)")}
              </button>
            )}
          </div>
        )}

        {sendResult && (
          <p
            className={`text-sm ${
              sendResult.ok
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {sendResult.ok
              ? t("eco.send.sentOk", "Mensaje enviado")
              : sendResult.error}
          </p>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          {/* Enviar por Gmail */}
          <button
            type="button"
            onClick={openGmail}
            disabled={!canSend}
            title={
              canSend
                ? t("eco.send.gmailTip", "Abre Gmail con el mensaje listo para enviar")
                : t("eco.send.needEmail", "Escribe un correo primero")
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              canSend
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-md hover:shadow-red-500/25"
                : "bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Mail className="w-4 h-4" />
            {t("eco.send.gmail", "Enviar por Gmail")}
          </button>

          {/* Enviar por Outlook (deep-link compose) */}
          <button
            type="button"
            onClick={openOutlook}
            disabled={!canSend}
            title={
              canSend
                ? t("eco.send.outlookTip", "Abre Outlook con el mensaje listo para enviar")
                : t("eco.send.needEmail", "Escribe un correo primero")
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              canSend
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-md hover:shadow-blue-500/25"
                : "bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Inbox className="w-4 h-4" />
            {t("eco.send.outlook", "Enviar por Outlook")}
          </button>

          {/* Abrir en mi correo (mailto) */}
          <button
            type="button"
            onClick={openMailto}
            disabled={!canSend}
            title={
              canSend
                ? t("eco.send.mailtoTip", "Abre tu cliente de correo predeterminado")
                : t("eco.send.needEmail", "Escribe un correo primero")
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              canSend
                ? "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:border-[var(--rowi-g2)] hover:text-[var(--rowi-g2)]"
                : "border-gray-200 dark:border-zinc-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            {t("eco.send.mailto", "Abrir en mi correo")}
          </button>

          {/* Enviar por WhatsApp (wa.me — el usuario elige el contacto) */}
          <button
            type="button"
            onClick={openWhatsApp}
            title={t("eco.send.whatsappTip", "Abre WhatsApp con el mensaje listo; eliges el contacto")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:shadow-md hover:shadow-green-500/25 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            {t("eco.send.whatsapp", "Enviar por WhatsApp")}
          </button>

          {/* Copiar mensaje */}
          <button
            type="button"
            onClick={copyMessage}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              copied
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                {t("eco.send.copied", "Copiado")}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                {t("eco.send.copy", "Copiar mensaje")}
              </>
            )}
          </button>

          {/* Slack — placeholder deshabilitado */}
          <button
            type="button"
            disabled
            title={t("eco.send.slackSoon", "Próximamente")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-dashed border-gray-300 dark:border-zinc-600 text-gray-400 cursor-not-allowed"
          >
            <Slack className="w-4 h-4" />
            {t("eco.send.slack", "Enviar por Slack")}
          </button>
        </div>

        {!canSend && (
          <p className="text-xs text-gray-400">
            {t(
              "eco.send.hint",
              "Escribe el correo del destinatario para habilitar el envío.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
