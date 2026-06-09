"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/**
 * 🔐 Verificación MFA del panel admin con TOTP (app autenticadora).
 *
 * Flujo:
 *  - Al cargar consulta /api/admin/mfa/enroll (GET): ¿ya está enrolado?
 *  - Si NO está enrolado → pide el QR (enroll POST) y lo muestra para
 *    escanear con Google Authenticator / Authy una vez.
 *  - Siempre muestra el input de 6 dígitos. Al verificar (verify POST)
 *    se setea la cookie y redirige a ?next.
 *  - Si el bypass de emergencia está activo, verify entra directo.
 *
 * useSearchParams() requiere Suspense en Next 16 → wrapper al final.
 */
function AdminMfaInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/hub/admin";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mfa/enroll");
      const data = await res.json().catch(() => ({}));
      if (data?.disabled) {
        // MFA desactivado (login+rol basta): no pedimos nada, entramos directo.
        router.replace(next);
        return;
      }
      if (data?.bypass) {
        // Bypass activo: la cookie se setea al verificar; entramos directo.
        await verifyCode(true);
        return;
      }
      setEnrolled(!!data?.enrolled);
      if (!data?.enrolled) {
        await requestQr();
      }
    } catch {
      setError(t("admin.mfa.loadError", "No se pudo cargar la verificación."));
    } finally {
      setLoading(false);
    }
  }

  async function requestQr() {
    try {
      const res = await fetch("/api/admin/mfa/enroll", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
      } else if (res.status !== 409) {
        setError(data.error || t("admin.mfa.qrError", "No se pudo generar el código QR."));
      }
    } catch {
      setError(t("admin.mfa.qrError", "No se pudo generar el código QR."));
    }
  }

  async function verifyCode(bypass = false) {
    if (!bypass) setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: bypass ? "000000" : code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        router.replace(next);
      } else {
        setError(data.error || t("admin.mfa.verifyError", "Código incorrecto."));
      }
    } catch {
      setError(t("admin.mfa.verifyError", "Código incorrecto."));
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--rowi-background)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--rowi-background)] px-4">
      <div className="w-full max-w-md bg-[var(--rowi-card)] rounded-2xl border border-[var(--rowi-border)] p-8 shadow-sm">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 rounded-xl bg-[var(--rowi-primary)]/10 mb-3">
            <ShieldCheck className="w-7 h-7 text-[var(--rowi-primary)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--rowi-foreground)]">
            {t("admin.mfa.title", "Verificación de seguridad")}
          </h1>
          <p className="text-sm text-[var(--rowi-muted)] mt-1">
            {enrolled
              ? t(
                  "admin.mfa.subtitleEnrolled",
                  "Ingresa el código de 6 dígitos de tu app autenticadora.",
                )
              : t(
                  "admin.mfa.subtitleEnroll",
                  "Escanea este código QR con tu app autenticadora (Google Authenticator, Authy…) y luego ingresa el código de 6 dígitos.",
                )}
          </p>
        </div>

        {/* QR de enroll (solo si aún no está enrolado) */}
        {!enrolled && qrDataUrl && (
          <div className="flex flex-col items-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR TOTP"
              className="w-44 h-44 rounded-lg border border-[var(--rowi-border)] bg-white p-2"
            />
            <div className="flex items-center gap-2 mt-3 text-xs text-[var(--rowi-muted)]">
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t("admin.mfa.scanHint", "Escanéalo una sola vez.")}</span>
            </div>
          </div>
        )}

        <label className="block text-sm text-[var(--rowi-muted)] mb-1">
          {t("admin.mfa.codeLabel", "Código de 6 dígitos")}
        </label>
        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && code.length === 6 && verifyCode()}
          placeholder="••••••"
          className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none"
        />

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <button
          onClick={() => verifyCode()}
          disabled={verifying || code.length !== 6}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--rowi-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {t("admin.mfa.verify", "Verificar y entrar")}
        </button>
      </div>
    </div>
  );
}

export default function AdminMfaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--rowi-background)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" />
        </div>
      }
    >
      <AdminMfaInner />
    </Suspense>
  );
}
