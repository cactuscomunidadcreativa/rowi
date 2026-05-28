"use client";

/**
 * 💬 ConnectSlackButton — botón reutilizable de conexión Slack
 * ---------------------------------------------------------
 * Client component. Redirige a `/api/integrations/slack/install`,
 * que inicia el OAuth v2 de Slack (requiere sesión NextAuth).
 *
 * Detecta el estado en la URL: `?slack=connected` muestra el estado
 * "Slack conectado ✓". Otros valores (`denied`, `error`,
 * `misconfigured`) muestran un aviso de error legible.
 *
 * Se usa en el wizard de onboarding (paso 3) y en el admin de
 * integraciones — por eso vive en `components/` y no inline.
 */

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

const INSTALL_URL = "/api/integrations/slack/install";

interface ConnectSlackButtonProps {
  /** Clases extra para el contenedor (opcional). */
  className?: string;
  /** Texto del botón cuando aún no está conectado. */
  label?: string;
}

export default function ConnectSlackButton({
  className = "",
  label,
}: ConnectSlackButtonProps) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const slackStatus = searchParams.get("slack");
  const [redirecting, setRedirecting] = useState(false);

  const connected = slackStatus === "connected";

  const errorMessage =
    slackStatus === "denied"
      ? t(
          "integrations.slack.denied",
          "Cancelaste la conexión con Slack. Puedes intentarlo de nuevo.",
        )
      : slackStatus === "misconfigured"
        ? t(
            "integrations.slack.misconfigured",
            "Slack no está configurado todavía. Contacta al administrador.",
          )
        : slackStatus === "error"
          ? t(
              "integrations.slack.error",
              "No se pudo conectar con Slack. Intenta de nuevo.",
            )
          : null;

  function connect() {
    setRedirecting(true);
    window.location.href = INSTALL_URL;
  }

  if (connected) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium ${className}`}
      >
        <Check className="w-4 h-4" />
        {t("integrations.slack.connected", "Slack conectado ✓")}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={connect}
        disabled={redirecting}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A154B] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity shadow-sm"
      >
        {redirecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <SlackMark />
        )}
        {label || t("integrations.slack.connect", "Conectar Slack")}
      </button>

      {errorMessage && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

/** Logo simplificado de Slack (4 colores), inline para no añadir assets. */
function SlackMark() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 122.8 122.8"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9z"
        fill="#36C5F0"
      />
      <path
        d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9z"
        fill="#2EB67D"
      />
      <path
        d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9z"
        fill="#ECB22E"
      />
      <path
        d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9z"
        fill="#E01E5A"
      />
    </svg>
  );
}
