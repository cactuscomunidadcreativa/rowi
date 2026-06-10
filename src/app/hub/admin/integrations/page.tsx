"use client";

import { Suspense, useState } from "react";
import useSWR, { mutate } from "swr";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  Slack,
  MessageCircle,
  Video,
  Mail,
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

  // WhatsApp: "conectado" = credenciales Twilio configuradas (no OAuth).
  const { data: waData } = useSWR("/api/integrations/whatsapp/status", fx);
  const whatsappConnected = waData?.connected === true;

  // Teams: conectado si hay una IntegrationConnection activa de plataforma TEAMS.
  const { data: teamsData } = useSWR("/api/integrations/teams/status", fx);
  const teamsConnected = teamsData?.connected === true;

  // Gmail: OAuth Google por usuario (para que ECO envíe desde su cuenta).
  const gmailJustConnected = params.get("gmail") === "connected";
  const { data: gmailData } = useSWR("/api/integrations/gmail/status", fx);
  const gmailConnected = gmailJustConnected || gmailData?.connected === true;

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
            <StatusBadge status={whatsappConnected ? "connected" : "available"} />
          </div>
          <p className="text-sm text-gray-500 flex-1">
            {t(
              "admin.integrations.whatsappDesc",
              "Coach bidireccional por WhatsApp (vía Twilio): los usuarios escriben y Rowi responde con IA.",
            )}
          </p>
          {whatsappConnected && waData?.number && (
            <p className="text-xs text-gray-500">· {waData.number}</p>
          )}
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

        {/* Teams — real (Incoming Webhook) */}
        <TeamsCard connected={teamsConnected} channelName={teamsData?.channelName ?? null} />

        {/* Gmail — real (OAuth Google) */}
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-red-500" />
              <span className="font-semibold">Gmail</span>
            </div>
            <StatusBadge status={gmailConnected ? "connected" : "available"} />
          </div>
          <p className="text-sm text-gray-500 flex-1">
            {t(
              "admin.integrations.gmailDesc",
              "Envía los mensajes de ECO directamente desde tu Gmail, sin copiar y pegar.",
            )}
          </p>
          {gmailConnected && gmailData?.email && (
            <p className="text-xs text-gray-500">· {gmailData.email}</p>
          )}
          <a
            href="/api/integrations/gmail/install"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "#ea4335" }}
          >
            {gmailConnected
              ? t("admin.integrations.gmailReconnect", "Reconectar Gmail")
              : t("admin.integrations.gmailConnect", "Conectar Gmail")}
            <ExternalLink className="w-4 h-4" />
          </a>
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

function TeamsCard({ connected, channelName }: { connected: boolean; channelName: string | null }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function connect() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/integrations/teams/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: url.trim(), channelName: name.trim() || undefined }),
      }).then((r) => r.json());
      if (res?.ok) {
        setMsg(t("admin.integrations.teamsSaved", "Teams conectado."));
        setOpen(false);
        mutate("/api/integrations/teams/status");
      } else {
        setMsg(t("admin.integrations.teamsInvalid", "URL de webhook inválida."));
      }
    } catch {
      setMsg(t("admin.integrations.teamsError", "No se pudo conectar."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-indigo-500" />
          <span className="font-semibold">Microsoft Teams</span>
        </div>
        <StatusBadge status={connected ? "connected" : "available"} />
      </div>
      <p className="text-sm text-gray-500 flex-1">
        {t("admin.integrations.teamsDesc", "Notificaciones del equipo en un canal de Teams.")}
      </p>
      {connected && channelName && <p className="text-xs text-gray-500">· {channelName}</p>}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "#4b53bc" }}
        >
          {connected
            ? t("admin.integrations.teamsReconnect", "Cambiar canal")
            : t("admin.integrations.teamsConnect", "Conectar Teams")}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("admin.integrations.teamsUrlPlaceholder", "URL del Incoming Webhook del canal")}
            className="rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("admin.integrations.teamsNamePlaceholder", "Nombre del canal (opcional)")}
            className="rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={connect} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "#4b53bc" }}>
              {saving ? "…" : t("admin.integrations.teamsSave", "Guardar")}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-500">
              {t("common.cancel", "Cancelar")}
            </button>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400">
        {t("admin.integrations.teamsHint", "En Teams: canal → ··· → Conectores/Workflows → Incoming Webhook → copia la URL.")}
      </p>
      {msg && <p className="text-xs text-gray-500">{msg}</p>}
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
