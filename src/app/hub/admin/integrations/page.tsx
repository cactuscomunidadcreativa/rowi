"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  Slack,
  MessageCircle,
  Video,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

const fx = (u: string) => fetch(u).then((r) => r.json());

type IntegrationStatus = "connected" | "available" | "soon";

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const { t } = useI18n();
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-4 h-4" /> {t("admin.integrations.connected", "Conectado")}
      </span>
    );
  }
  if (status === "soon") {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-gray-400">
        <AlertCircle className="w-4 h-4" /> {t("admin.integrations.soon", "Próximamente")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-500">
      {t("admin.integrations.notConnected", "Sin conectar")}
    </span>
  );
}

function IntegrationsInner() {
  const { t } = useI18n();
  const params = useSearchParams();
  const slackJustConnected = params.get("slack") === "connected";
  const slackError = ["denied", "error", "misconfigured"].includes(
    params.get("slack") || "",
  );

  const { data } = useSWR("/api/integrations/slack/status", fx);
  const slackConnected = slackJustConnected || data?.connected === true;
  const installations = data?.installations ?? [];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold rowi-gradient-text">
          {t("admin.integrations.title", "Integraciones")}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t(
            "admin.integrations.subtitle",
            "Conecta Rowi con las herramientas de tu equipo.",
          )}
        </p>
      </div>

      {slackJustConnected && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700 p-3 text-sm text-emerald-800 dark:text-emerald-200">
          {t("admin.integrations.slackConnectedToast", "Slack se conectó correctamente.")}
        </div>
      )}
      {slackError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 text-sm text-amber-800 dark:text-amber-200">
          {t(
            "admin.integrations.slackError",
            "No se pudo conectar Slack. Verifica la configuración e inténtalo de nuevo.",
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Slack — real */}
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Slack className="w-6 h-6" />
              <span className="font-semibold">Slack</span>
            </div>
            <StatusBadge status={slackConnected ? "connected" : "available"} />
          </div>
          <p className="text-sm text-gray-500 flex-1">
            {t(
              "admin.integrations.slackDesc",
              "Rowi Coach en Slack, check-ins y notificaciones del equipo.",
            )}
          </p>
          {slackConnected && installations.length > 0 && (
            <div className="text-xs text-gray-500">
              {installations.map((i: any) => (
                <div key={i.teamId}>· {i.teamName || i.teamId}</div>
              ))}
            </div>
          )}
          <a
            href="/api/integrations/slack/install"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "#4A154B" }}
          >
            {slackConnected
              ? t("admin.integrations.slackReconnect", "Reconectar Slack")
              : t("admin.integrations.slackConnect", "Conectar Slack")}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* WhatsApp */}
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <span className="font-semibold">WhatsApp</span>
            </div>
            <StatusBadge status="available" />
          </div>
          <p className="text-sm text-gray-500 flex-1">
            {t(
              "admin.integrations.whatsappDesc",
              "Coach bidireccional por WhatsApp (vía Twilio): los usuarios escriben y Rowi responde con IA.",
            )}
          </p>
          <p className="text-xs text-gray-400">
            {t(
              "admin.integrations.whatsappHint",
              "Configura las credenciales de Twilio en Ajustes → Integraciones y el webhook entrante en la consola de Twilio.",
            )}
          </p>
          <a
            href="/api/admin/whatsapp/debug?test=1"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400 hover:underline"
          >
            {t("admin.integrations.whatsappDiagnose", "Probar conexión")}
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Teams */}
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-indigo-500" />
              <span className="font-semibold">Microsoft Teams</span>
            </div>
            <StatusBadge status="available" />
          </div>
          <p className="text-sm text-gray-500 flex-1">
            {t(
              "admin.integrations.teamsDesc",
              "Notificaciones del equipo en un canal de Teams.",
            )}
          </p>
          <p className="text-xs text-gray-400">
            {t(
              "admin.integrations.teamsHint",
              "Configura el webhook del canal en la sección de canal de organización.",
            )}
          </p>
        </div>

        {/* Zoom */}
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3 opacity-80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-500" />
              <span className="font-semibold">Zoom</span>
            </div>
            <StatusBadge status="soon" />
          </div>
          <p className="text-sm text-gray-500 flex-1">
            {t("admin.integrations.zoomDesc", "Sesiones y debriefs por Zoom.")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">…</div>}>
      <IntegrationsInner />
    </Suspense>
  );
}
