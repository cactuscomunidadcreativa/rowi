"use client";

import { useState } from "react";
import {
  Mail,
  ExternalLink,
  Copy,
  Check,
  Slack,
  Send,
  User,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   📤 SendMessageActions
   ---------------------------------------------------------
   Permite enviar el mensaje generado por ECO a una persona
   elegida vía:
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
};

export default function SendMessageActions({
  subject,
  body,
  recipientEmail,
  recipientName,
}: SendMessageActionsProps) {
  const { t } = useI18n();

  const [email, setEmail] = useState(recipientEmail ?? "");
  const [name, setName] = useState(recipientName ?? "");
  const [copied, setCopied] = useState(false);

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

  const canSend = trimmedEmail.length > 0;

  const openGmail = () => {
    if (!canSend) return;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const openMailto = () => {
    if (!canSend) return;
    window.location.href = mailtoUrl;
  };

  const copyMessage = () => {
    void navigator.clipboard.writeText(body).then(() => {
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
        </div>

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
