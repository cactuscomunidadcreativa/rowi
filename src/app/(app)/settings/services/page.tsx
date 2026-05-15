"use client";

import { useEffect, useState } from "react";
import { Handshake, Plus, Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

type Client = {
  id: string;
  name: string | null;
  slug?: string | null;
  workspaceType?: string | null;
};

type ClientUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type Engagement = {
  id: string;
  serviceRole: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  hourlyRate: string | null;
  currency: string | null;
  scope: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  provider: ClientUser;
  clientTenant: Client | null;
  clientCommunity: Client | null;
  clientOrganization: Client | null;
  clientUser: ClientUser | null;
};

const SERVICE_ROLES = [
  "coach",
  "consultant",
  "mentor",
  "facilitator",
  "trainer",
  "advisor",
] as const;

const CLIENT_KINDS = ["user", "tenant", "community", "organization"] as const;
type ClientKind = (typeof CLIENT_KINDS)[number];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  proposed: "bg-yellow-100 text-yellow-800",
  paused: "bg-gray-100 text-gray-800",
  ended: "bg-red-100 text-red-800",
};

export default function ServicesSettingsPage() {
  const { t } = useI18n();
  const [provider, setProvider] = useState<Engagement[]>([]);
  const [client, setClient] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [serviceRole, setServiceRole] = useState<string>("coach");
  const [clientKind, setClientKind] = useState<ClientKind>("user");
  const [clientRef, setClientRef] = useState("");
  const [scope, setScope] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/services", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setProvider(json.asProvider || []);
      setClient(json.asClient || []);
    } catch (e: any) {
      setError(e?.message || "Error cargando servicios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createEngagement() {
    if (!clientRef.trim()) {
      setFormMsg(t("services.form.needClient", "Indica el ID del cliente"));
      return;
    }
    setSubmitting(true);
    setFormMsg(null);
    try {
      const payload: Record<string, unknown> = {
        serviceRole,
        scope: scope.trim() || undefined,
        currency,
      };
      if (hourlyRate.trim()) {
        const n = Number(hourlyRate);
        if (Number.isFinite(n) && n > 0) payload.hourlyRate = n;
      }
      payload[`client${clientKind[0].toUpperCase()}${clientKind.slice(1)}Id`] =
        clientRef.trim();

      const res = await fetch("/api/account/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFormMsg(json?.error || t("services.form.createError", "Error"));
        return;
      }
      setShowForm(false);
      setClientRef("");
      setScope("");
      setHourlyRate("");
      load();
    } catch (e: any) {
      setFormMsg(e?.message || t("services.form.networkError", "Error de red"));
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/account/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error || "Error");
        return;
      }
      load();
    } catch (e: any) {
      setError(e?.message || "Error de red");
    }
  }

  async function deleteEngagement(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/account/services/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error || "Error");
        return;
      }
      setConfirmDeleteId(null);
      load();
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setDeleting(false);
    }
  }

  function clientLabel(e: Engagement) {
    return (
      e.clientUser?.name ||
      e.clientUser?.email ||
      e.clientTenant?.name ||
      e.clientCommunity?.name ||
      e.clientOrganization?.name ||
      "—"
    );
  }

  function roleLabel(role: string) {
    return t(`account.context.service.${role}`, role);
  }

  function statusLabel(status: string) {
    return t(`services.status.${status}`, status);
  }

  return (
    <main className="min-h-screen py-8 px-4 max-w-5xl mx-auto space-y-6">
      <header className="rowi-card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Handshake className="w-6 h-6 text-cyan-500" />
            <div>
              <h1 className="text-2xl font-semibold">
                {t("services.title", "Mis servicios")}
              </h1>
              <p className="rowi-muted text-sm">
                {t(
                  "services.subtitle",
                  "Engagements donde prestas servicios (coach, consultor, mentor) y donde recibes 1:1.",
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rowi-btn-primary text-sm inline-flex items-center gap-1.5"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm
              ? t("services.form.close", "Cerrar")
              : t("services.form.add", "Nuevo engagement")}
          </button>
        </div>
      </header>

      {showForm && (
        <section className="rowi-card space-y-3">
          <h2 className="font-medium">
            {t("services.form.title", "Proponer engagement como provider")}
          </h2>
          <p className="text-xs rowi-muted">
            {t(
              "services.form.hint",
              "El cliente recibe el engagement como 'propuesto' y debe aceptarlo (excepto si es tu tenant primario).",
            )}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={serviceRole}
              onChange={(e) => setServiceRole(e.target.value)}
              className="rounded-md border px-3 py-2 bg-transparent"
            >
              {SERVICE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
            <select
              value={clientKind}
              onChange={(e) => setClientKind(e.target.value as ClientKind)}
              className="rounded-md border px-3 py-2 bg-transparent"
            >
              {CLIENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`services.clientKind.${k}`, k)}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2 bg-transparent text-sm"
            placeholder={t("services.form.clientIdPlaceholder", "ID del cliente")}
            value={clientRef}
            onChange={(e) => setClientRef(e.target.value)}
          />
          <textarea
            className="w-full rounded-md border px-3 py-2 bg-transparent text-sm"
            placeholder={t("services.form.scopePlaceholder", "Scope / descripción")}
            rows={2}
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              type="number"
              className="rounded-md border px-3 py-2 bg-transparent text-sm"
              placeholder={t("services.form.ratePlaceholder", "Tarifa/h")}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
            <input
              type="text"
              className="rounded-md border px-3 py-2 bg-transparent text-sm"
              placeholder="USD"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
            />
            <button
              className="rowi-btn-primary text-sm"
              onClick={createEngagement}
              disabled={submitting}
            >
              {submitting
                ? t("services.form.creating", "Creando...")
                : t("services.form.create", "Crear")}
            </button>
          </div>
          {formMsg && <p className="text-sm text-red-500">{formMsg}</p>}
        </section>
      )}

      {error && (
        <div className="rowi-card bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="rowi-card flex items-center gap-2 rowi-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.loading", "Cargando...")}
        </div>
      )}

      {!loading && (
        <>
          <section className="rowi-card space-y-3">
            <h2 className="font-medium">
              {t("services.asProvider", "Como provider")}
              <span className="rowi-muted text-sm font-normal">
                {" "}
                · {provider.length}
              </span>
            </h2>
            {provider.length === 0 ? (
              <p className="text-sm rowi-muted">
                {t(
                  "services.emptyProvider",
                  "Aún no has registrado engagements como provider.",
                )}
              </p>
            ) : (
              <div className="space-y-2">
                {provider.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {clientLabel(e)}
                        </span>
                        <span className="rowi-muted text-xs">
                          · {roleLabel(e.serviceRole)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[e.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {statusLabel(e.status)}
                        </span>
                      </div>
                      {e.scope && (
                        <p className="text-xs rowi-muted mt-1 truncate">
                          {e.scope}
                        </p>
                      )}
                      {e.hourlyRate && (
                        <p className="text-xs rowi-muted mt-1">
                          {e.currency || "USD"} {Number(e.hourlyRate).toLocaleString()} /h
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {e.status === "active" && (
                        <button
                          onClick={() => changeStatus(e.id, "paused")}
                          className="text-xs rowi-muted hover:underline"
                        >
                          {t("services.action.pause", "Pausar")}
                        </button>
                      )}
                      {e.status === "paused" && (
                        <button
                          onClick={() => changeStatus(e.id, "active")}
                          className="text-xs rowi-muted hover:underline"
                        >
                          {t("services.action.resume", "Reanudar")}
                        </button>
                      )}
                      {e.status !== "ended" && (
                        <button
                          onClick={() => changeStatus(e.id, "ended")}
                          className="text-xs rowi-muted hover:underline"
                        >
                          {t("services.action.end", "Terminar")}
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(e.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        {t("services.action.delete", "Eliminar")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rowi-card space-y-3">
            <h2 className="font-medium">
              {t("services.asClient", "Como cliente")}
              <span className="rowi-muted text-sm font-normal">
                {" "}
                · {client.length}
              </span>
            </h2>
            {client.length === 0 ? (
              <p className="text-sm rowi-muted">
                {t(
                  "services.emptyClient",
                  "Aún no recibes servicios 1:1 de ningún provider.",
                )}
              </p>
            ) : (
              <div className="space-y-2">
                {client.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {e.provider?.name || e.provider?.email}
                        </span>
                        <span className="rowi-muted text-xs">
                          · {roleLabel(e.serviceRole)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_BADGE[e.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {statusLabel(e.status)}
                        </span>
                      </div>
                      {e.scope && (
                        <p className="text-xs rowi-muted mt-1 truncate">
                          {e.scope}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {e.status === "proposed" && (
                        <>
                          <button
                            onClick={() => changeStatus(e.id, "active")}
                            className="text-xs text-green-600 hover:underline"
                          >
                            {t("services.action.accept", "Aceptar")}
                          </button>
                          <button
                            onClick={() => changeStatus(e.id, "ended")}
                            className="text-xs text-red-500 hover:underline"
                          >
                            {t("services.action.decline", "Declinar")}
                          </button>
                        </>
                      )}
                      {e.status === "active" && (
                        <button
                          onClick={() => changeStatus(e.id, "ended")}
                          className="text-xs rowi-muted hover:underline"
                        >
                          {t("services.action.end", "Terminar")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        title={t("services.confirmDeleteTitle", "Eliminar engagement")}
        message={t(
          "services.confirmDeleteMessage",
          "Esta acción borra el engagement por completo. Si solo querés terminarlo, usa 'Terminar'.",
        )}
        variant="danger"
        loading={deleting}
        onConfirm={() => confirmDeleteId && deleteEngagement(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </main>
  );
}
