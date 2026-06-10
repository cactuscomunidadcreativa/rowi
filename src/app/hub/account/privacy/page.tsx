"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useI18n } from "@/lib/i18n/react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Shield,
  Loader2,
  Download,
  Eye,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ConsentItem {
  key: string;
  required: boolean;
  version: number;
  currentVersion: number;
  esTitle: string;
  enTitle: string;
  ptTitle: string;
  itTitle: string;
  esBody: string;
  enBody: string;
  ptBody: string;
  itBody: string;
  granted: boolean;
  needsRefresh: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}

interface AuditEntry {
  id: string;
  at: string;
  action: string;
  contextPath: string;
  reason: string | null;
  viewer: { name: string; accessLevel: string };
}

export default function PrivacyPage() {
  const { t, locale } = useI18n();
  const lang: "es" | "en" | "pt" | "it" =
    locale === "en" || locale === "pt" || locale === "it" ? locale : "es";
  const titleFor = (c: ConsentItem) =>
    lang === "en" ? c.enTitle : lang === "pt" ? c.ptTitle : lang === "it" ? c.itTitle : c.esTitle;
  const bodyFor = (c: ConsentItem) =>
    lang === "en" ? c.enBody : lang === "pt" ? c.ptBody : lang === "it" ? c.itBody : c.esBody;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [consents, setConsents] = useState<ConsentItem[]>([]);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // GDPR Art. 17 — borrado de cuenta self-service. Confirma reescribiendo el
  // email (el endpoint exige confirmEmail === email del token) y cierra sesión.
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const sessionRes = await fetch("/api/auth/session").then((r) => r.json());
      const email = sessionRes?.user?.email;
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: email }),
      }).then((r) => r.json());
      if (res?.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        alert(
          t("privacy.rights.deleteError", "No se pudo eliminar la cuenta. Intenta de nuevo o escribe a privacy@rowiia.com"),
        );
      }
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function loadConsents() {
    try {
      const r = await fetch("/api/account/consent");
      const j = await r.json();
      if (j.ok) setConsents(j.consents ?? []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAudits() {
    setAuditsLoading(true);
    try {
      const r = await fetch("/api/account/privacy/audit-log");
      const j = await r.json();
      if (j.ok) setAudits(j.audits ?? []);
    } finally {
      setAuditsLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([loadConsents(), loadAudits()]).finally(() => setLoading(false));
  }, []);

  async function toggleConsent(key: string, nextGranted: boolean) {
    setSaving(key);
    try {
      await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentKey: key, granted: nextGranted, locale }),
      });
      await loadConsents();
    } finally {
      setSaving(null);
    }
  }

  function downloadExport() {
    window.location.href = "/api/account/privacy/export";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center shadow-md">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--rowi-foreground)] tracking-tight">
            {t("privacy.title", "Privacidad y datos")}
          </h1>
          <p className="text-xs text-[var(--rowi-muted)]">
            {t("privacy.subtitle", "Tus consentimientos, tus derechos GDPR, y quién accede a tus datos.")}
          </p>
        </div>
      </div>

      {/* Consents */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-2">
          {t("privacy.consents.title", "Consentimientos")}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">
          {t("privacy.consents.intro", "Estos son tus consentimientos activos. Puedes revocar cualquiera que no sea obligatorio en cualquier momento.")}
        </p>
        <div className="space-y-3">
          {consents.map((c) => (
            <div
              key={c.key}
              className={`rowi-card ${
                c.granted
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-[var(--rowi-foreground)] font-medium">
                      {titleFor(c)}
                    </h3>
                    {c.required && (
                      <span className="rowi-chip">{t("privacy.required", "Obligatorio")}</span>
                    )}
                    {c.needsRefresh && (
                      <span className="rowi-chip bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                        {t("privacy.consents.needsRefresh", "Versión actualizada")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--rowi-muted)]">
                    {bodyFor(c)}
                  </p>
                  {c.grantedAt && (
                    <p className="text-xs text-[var(--rowi-muted-weak)] mt-2">
                      {t("privacy.consents.grantedAt", "Otorgado")}:{" "}
                      {new Date(c.grantedAt).toLocaleString(locale)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleConsent(c.key, !c.granted)}
                  disabled={c.required || saving === c.key}
                  className={
                    c.granted
                      ? "rowi-btn flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      : "rowi-btn-primary flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  }
                >
                  {saving === c.key ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : c.granted ? (
                    t("privacy.consents.revoke", "Revocar")
                  ) : (
                    t("privacy.consents.grant", "Otorgar")
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DSR actions */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--rowi-foreground)] mb-3">
          {t("privacy.rights.title", "Tus derechos GDPR")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button onClick={downloadExport} className="rowi-card text-left">
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-5 h-5 text-[var(--rowi-primary)]" />
              <span className="text-[var(--rowi-foreground)] font-medium">
                {t("privacy.rights.access", "Descargar mis datos (Art. 15)")}
              </span>
            </div>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("privacy.rights.accessDesc", "JSON completo con todo lo que Rowi tiene sobre ti.")}
            </p>
          </button>

          <button
            onClick={() => setDeleteOpen(true)}
            className="rowi-card text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <span className="text-[var(--rowi-foreground)] font-medium">
                {t("privacy.rights.erasure", "Eliminar mi cuenta (Art. 17)")}
              </span>
            </div>
            <p className="text-xs text-[var(--rowi-muted)]">
              {t("privacy.rights.erasureDesc", "Borra tu cuenta y datos. Lo agregado en benchmarks anonimizados no es recuperable individualmente.")}
            </p>
          </button>
        </div>
      </section>

      {/* Audit log */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[var(--rowi-foreground)]">
            {t("privacy.audit.title", "Quién accedió a tus datos")}
          </h2>
          {auditsLoading && <Loader2 className="w-4 h-4 animate-spin text-[var(--rowi-muted)]" />}
        </div>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">
          {t("privacy.audit.intro", "Cada acceso al research lens (Eduardo, Joshua, sus equipos) queda registrado aquí. Es tu derecho de transparencia.")}
        </p>
        {audits.length === 0 ? (
          <div className="rowi-card text-center py-8">
            <Eye className="w-8 h-8 text-[var(--rowi-muted-weak)] mx-auto mb-2" />
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("privacy.audit.empty", "Nadie ha accedido a tus datos identificables a través del research lens.")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {audits.map((a) => (
              <div key={a.id} className="rowi-card flex items-center gap-3">
                <Clock className="w-4 h-4 text-[var(--rowi-muted)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--rowi-foreground)] truncate">
                    <span className="font-medium">{a.viewer.name}</span>{" "}
                    <span className="text-[var(--rowi-muted-weak)]">·</span> {a.action}
                  </div>
                  <div className="text-xs text-[var(--rowi-muted-weak)]">
                    {new Date(a.at).toLocaleString(locale)} · {a.contextPath}
                  </div>
                </div>
                <span className="rowi-chip">{a.viewer.accessLevel}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteOpen}
        variant="danger"
        title={t("privacy.rights.deleteTitle", "¿Eliminar tu cuenta?")}
        message={t(
          "privacy.rights.deleteBody",
          "Esto borra tu cuenta y tus datos personales de forma permanente. Lo ya agregado de forma anónima en benchmarks no es recuperable individualmente. Esta acción no se puede deshacer.",
        )}
        confirmLabel={t("privacy.rights.deleteConfirmBtn", "Eliminar definitivamente")}
        cancelLabel={t("common.cancel", "Cancelar")}
        loading={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
