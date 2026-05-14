"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

type Relation = {
  id: string;
  relationship: string;
  relatedUserId: string | null;
  relatedEmail: string | null;
  relatedName: string | null;
  consentStatus: string;
  notes: string | null;
  createdAt: string;
  relatedUser?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

type InboundRelation = {
  id: string;
  relationship: string;
  consentStatus: string;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

const RELATIONSHIPS = [
  "partner",
  "spouse",
  "child",
  "parent",
  "sibling",
  "other",
] as const;

export function FamilyRelationsSection() {
  const { t } = useI18n();
  const [owned, setOwned] = useState<Relation[]>([]);
  const [inbound, setInbound] = useState<InboundRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [relationship, setRelationship] = useState<string>("partner");
  const [relatedEmail, setRelatedEmail] = useState("");
  const [relatedName, setRelatedName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/family", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setOwned(data.owned || []);
      setInbound(data.inbound || []);
    } catch (e: any) {
      setError(e?.message || t("family.relations.loadError", "Error cargando"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createRelation() {
    if (!relatedEmail.trim() && !relatedName.trim()) {
      setFormMsg(
        t(
          "family.relations.needContact",
          "Indica al menos un email o nombre",
        ),
      );
      return;
    }
    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/account/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship,
          relatedEmail: relatedEmail.trim() || undefined,
          relatedName: relatedName.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormMsg(data?.error || t("family.relations.createError", "Error"));
        return;
      }
      setRelatedEmail("");
      setRelatedName("");
      setNotes("");
      setShowForm(false);
      load();
    } catch (e: any) {
      setFormMsg(e?.message || t("family.relations.networkError", "Error de red"));
    } finally {
      setSubmitting(false);
    }
  }

  async function respondToInbound(id: string, accept: boolean) {
    try {
      const res = await fetch(`/api/account/family/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentStatus: accept ? "accepted" : "declined" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || t("family.relations.actionError", "Error"));
        return;
      }
      load();
    } catch (e: any) {
      setError(e?.message || t("family.relations.networkError", "Error de red"));
    }
  }

  async function deleteOwned(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/account/family/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error || t("family.relations.deleteError", "Error"));
        return;
      }
      setConfirmDeleteId(null);
      load();
    } catch (e: any) {
      setError(e?.message || t("family.relations.networkError", "Error de red"));
    } finally {
      setDeleting(false);
    }
  }

  function relationshipLabel(value: string) {
    return t(`account.context.family.${value}`, value);
  }

  function consentBadgeClass(status: string) {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function consentLabel(status: string) {
    return t(`family.relations.consent.${status}`, status);
  }

  return (
    <section className="rowi-card space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">
            {t("family.relations.title", "Vínculos personales")}
          </h2>
          <p className="text-sm rowi-muted">
            {t(
              "family.relations.subtitle",
              "Declara pareja, hijos, padres y otros vínculos. La otra persona debe aceptar antes de aparecer en su lado.",
            )}
          </p>
        </div>
        <button
          className="rowi-btn-primary text-sm"
          onClick={() => setShowForm((s) => !s)}
          disabled={loading}
        >
          {showForm
            ? t("family.relations.close", "Cerrar")
            : t("family.relations.add", "Agregar vínculo")}
        </button>
      </header>

      {showForm && (
        <div className="space-y-3 rounded-md border border-dashed p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="rounded-md border px-3 py-2 bg-transparent"
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {relationshipLabel(r)}
                </option>
              ))}
            </select>
            <input
              type="email"
              className="rounded-md border px-3 py-2 bg-transparent"
              placeholder={t("family.relations.emailPlaceholder", "Email (opcional)")}
              value={relatedEmail}
              onChange={(e) => setRelatedEmail(e.target.value)}
            />
            <input
              type="text"
              className="rounded-md border px-3 py-2 bg-transparent"
              placeholder={t("family.relations.namePlaceholder", "Nombre")}
              value={relatedName}
              onChange={(e) => setRelatedName(e.target.value)}
            />
          </div>
          <textarea
            className="w-full rounded-md border px-3 py-2 bg-transparent text-sm"
            placeholder={t("family.relations.notesPlaceholder", "Notas (opcional)")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <button
              className="rowi-btn-primary text-sm"
              onClick={createRelation}
              disabled={submitting}
            >
              {submitting
                ? t("family.relations.creating", "Creando...")
                : t("family.relations.create", "Crear")}
            </button>
            {formMsg && (
              <span className="text-sm text-red-500">{formMsg}</span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {inbound.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            {t("family.relations.inboundTitle", "Pendiente de tu aprobación")}
          </h3>
          {inbound.map((rel) => (
            <div
              key={rel.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-amber-50/30 dark:bg-amber-900/10 p-3"
            >
              <div>
                <div className="font-medium">
                  {rel.owner?.name || rel.owner?.email || "—"}{" "}
                  <span className="rowi-muted text-sm">
                    · {relationshipLabel(rel.relationship)}
                  </span>
                </div>
                {rel.owner?.email && (
                  <div className="text-xs rowi-muted">{rel.owner.email}</div>
                )}
              </div>
              {rel.consentStatus === "pending" ? (
                <div className="flex gap-2">
                  <button
                    className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => respondToInbound(rel.id, false)}
                  >
                    {t("family.relations.decline", "Declinar")}
                  </button>
                  <button
                    className="rowi-btn-primary text-sm"
                    onClick={() => respondToInbound(rel.id, true)}
                  >
                    {t("family.relations.accept", "Aceptar")}
                  </button>
                </div>
              ) : (
                <span
                  className={`px-2 py-1 rounded-full text-xs ${consentBadgeClass(rel.consentStatus)}`}
                >
                  {consentLabel(rel.consentStatus)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">
          {t("family.relations.ownedTitle", "Vínculos que declaré")}
        </h3>
        {loading ? (
          <p className="text-sm rowi-muted">{t("common.loading", "Cargando...")}</p>
        ) : owned.length === 0 ? (
          <p className="text-sm rowi-muted">
            {t("family.relations.empty", "Aún no has declarado vínculos personales.")}
          </p>
        ) : (
          <div className="space-y-2">
            {owned.map((rel) => {
              const displayName =
                rel.relatedUser?.name ||
                rel.relatedName ||
                rel.relatedUser?.email ||
                rel.relatedEmail ||
                "—";
              return (
                <div
                  key={rel.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {displayName}{" "}
                      <span className="rowi-muted text-sm">
                        · {relationshipLabel(rel.relationship)}
                      </span>
                    </div>
                    {(rel.relatedUser?.email || rel.relatedEmail) && (
                      <div className="text-xs rowi-muted truncate">
                        {rel.relatedUser?.email || rel.relatedEmail}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${consentBadgeClass(rel.consentStatus)}`}
                    >
                      {consentLabel(rel.consentStatus)}
                    </span>
                    <button
                      className="text-red-500 text-sm hover:underline"
                      onClick={() => setConfirmDeleteId(rel.id)}
                    >
                      {t("family.relations.remove", "Eliminar")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title={t("family.relations.confirmDeleteTitle", "Eliminar vínculo")}
        message={t(
          "family.relations.confirmDeleteMessage",
          "Esta acción elimina el vínculo. La otra persona ya no lo verá en su lado.",
        )}
        variant="danger"
        loading={deleting}
        onConfirm={() => confirmDeleteId && deleteOwned(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </section>
  );
}
