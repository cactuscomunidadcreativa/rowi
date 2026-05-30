"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/**
 * 🔐 Verificación MFA del panel admin.
 * Pide un código por email y lo verifica. Al validar, el endpoint setea
 * la cookie rowi_admin_mfa y redirige al destino original (?next=).
 *
 * useSearchParams() requiere un Suspense boundary en Next 16 para poder
 * prerenderar, de ahí el wrapper de export por defecto al final.
 */
function AdminMfaInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/hub/admin";

  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Pide el código automáticamente al cargar.
  useEffect(() => {
    void requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestCode() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mfa/send", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        if (data.bypass) {
          // Bypass activo: verificar de inmediato.
          await verifyCode(true);
          return;
        }
        setSent(true);
        setInfo(
          t(
            "admin.mfa.codeSent",
            "Te enviamos un código a tu correo. Revísalo e ingrésalo aquí.",
          ),
        );
      } else {
        setError(data.error || t("admin.mfa.sendError", "No se pudo enviar el código."));
      }
    } catch {
      setError(t("admin.mfa.sendError", "No se pudo enviar el código."));
    } finally {
      setSending(false);
    }
  }

  async function verifyCode(bypass = false) {
    setVerifying(true);
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
            {t(
              "admin.mfa.subtitle",
              "Para entrar al panel de administración, confirma tu identidad con el código que enviamos a tu correo.",
            )}
          </p>
        </div>

        {info && (
          <div className="flex items-start gap-2 text-sm text-[var(--rowi-muted)] bg-[var(--rowi-primary)]/5 rounded-lg p-3 mb-4">
            <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{info}</span>
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

        <button
          onClick={() => requestCode()}
          disabled={sending}
          className="w-full mt-3 text-sm text-[var(--rowi-primary)] hover:underline disabled:opacity-50"
        >
          {sending
            ? t("admin.mfa.sending", "Enviando…")
            : sent
              ? t("admin.mfa.resend", "Reenviar código")
              : t("admin.mfa.send", "Enviar código")}
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
