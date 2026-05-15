"use client";

import { useEffect, useRef, useState } from "react";
import { Handshake, Plus, Loader2, X, Search, Check } from "lucide-react";
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
  const [selectedClientLabel, setClientLabel] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [candidates, setCandidates] = useState<
    Array<{ id: string; label: string; hint?: string }>
  >([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
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

  // Debounced lookup: when the user types in the client search box, fire
  // a request after a short pause and populate the suggestions list.
  useEffect(() => {
    if (!showForm) return;
    if (clientQuery.trim().length < 2) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/account/services/lookup?kind=${encodeURIComponent(clientKind)}&q=${encodeURIComponent(clientQuery.trim())}`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!cancelled && json.ok) {
          setCandidates(json.candidates || []);
          setShowSuggestions(true);
        }
      } catch {
        if (!cancelled) setCandidates([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [clientQuery, clientKind, showForm]);

  // Close suggestions on click outside.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pickCandidate(c: { id: string; label: string; hint?: string }) {
    setClientRef(c.id);
    setClientLabel(c.label);
    setClientQuery(c.label);
    setShowSuggestions(false);
  }

  function resetClientPicker() {
    setClientRef("");
    setClientLabel("");
    setClientQuery("");
    setCandidates([]);
  }

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
      resetClientPicker();
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

  function engagementClientLabel(e: Engagement) {
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
              onChange={(e) => {
                setClientKind(e.target.value as ClientKind);
                resetClientPicker();
              }}
              className="rounded-md border px-3 py-2 bg-transparent"
            >
              {CLIENT_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`services.clientKind.${k}`, k)}
                </option>
              ))}
            </select>
          </div>

          {/* Client picker */}
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full rounded-md border pl-9 pr-9 py-2 bg-transparent text-sm"
                placeholder={t(
                  "services.form.clientSearchPlaceholder",
                  "Busca por nombre o email...",
                )}
                value={clientQuery}
                onChange={(e) => {
                  setClientQuery(e.target.value);
                  if (clientRef) {
                    // Typing again clears the previous selection.
                    setClientRef("");
                    setClientLabel("");
                  }
                }}
                onFocus={() => candidates.length > 0 && setShowSuggestions(true)}
              />
              {clientRef && (
                <button
                  type="button"
                  onClick={resetClientPicker}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title={t("services.form.clearPick", "Limpiar selección")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {clientRef && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {t("services.form.selected", "Seleccionado:")} {selectedClientLabel}
              </p>
            )}
            {showSuggestions && candidates.length > 0 && !clientRef && (
              <div className="absolute z-10 mt-1 left-0 right-0 max-h-60 overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-lg">
                {candidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickCandidate(c)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-800 last:border-0"
                  >
                    <div className="font-medium truncate">{c.label}</div>
                    {c.hint && (
                      <div className="text-xs rowi-muted truncate">
                        {c.hint}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <p className="mt-1 text-xs rowi-muted flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("services.form.searching", "Buscando...")}
              </p>
            )}
            {!searching && clientQuery.length >= 2 && candidates.length === 0 && !clientRef && (
              <p className="mt-1 text-xs rowi-muted">
                {t("services.form.noResults", "Sin resultados — verifica permisos sobre el cliente")}
              </p>
            )}
          </div>
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
                          {engagementClientLabel(e)}
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
