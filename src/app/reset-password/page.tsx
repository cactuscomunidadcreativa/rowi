"use client";

/**
 * /reset-password?token=...
 * ---------------------------------------------------------
 * Public page. Accepts a new password + confirmation and
 * POSTs to /api/auth/reset-password. Shows success with a
 * CTA to /signin on success.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/lib/i18n/I18nProvider";

type ErrorCode =
  | "missing_fields"
  | "password_too_short"
  | "invalid_token"
  | "already_used"
  | "expired"
  | "user_not_found"
  | "internal_error"
  | "mismatch"
  | null;

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 8) {
      setErrorCode("password_too_short");
      return;
    }
    if (password !== confirm) {
      setErrorCode("mismatch");
      return;
    }

    setErrorCode(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone(true);
      } else {
        setErrorCode((data?.error as ErrorCode) || "internal_error");
      }
    } catch {
      setErrorCode("internal_error");
    } finally {
      setSubmitting(false);
    }
  };

  const errorMessage = (() => {
    switch (errorCode) {
      case "password_too_short":
        return t(
          "resetPassword.errorTooShort",
          "La contraseña debe tener al menos 8 caracteres.",
        );
      case "mismatch":
        return t(
          "resetPassword.errorMismatch",
          "Las contraseñas no coinciden.",
        );
      case "expired":
        return t(
          "resetPassword.errorExpired",
          "El enlace ya expiró. Solicita uno nuevo.",
        );
      case "already_used":
      case "invalid_token":
      case "user_not_found":
        return t(
          "resetPassword.errorInvalid",
          "El enlace no es válido. Solicita uno nuevo.",
        );
      case "missing_fields":
      case "internal_error":
      default:
        return errorCode
          ? t("resetPassword.errorInvalid", "El enlace no es válido. Solicita uno nuevo.")
          : null;
    }
  })();

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)] px-4 py-12">
        <div className="w-full max-w-md bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] rounded-3xl shadow-xl p-8 space-y-4 text-center">
          <h1 className="text-2xl font-heading font-bold text-[var(--rowi-fg)]">
            {t("resetPassword.title", "Nueva contraseña")}
          </h1>
          <p className="text-sm text-red-600 dark:text-red-400">
            {t(
              "resetPassword.errorInvalid",
              "El enlace no es válido. Solicita uno nuevo.",
            )}
          </p>
          <Link
            href="/forgot-password"
            className="inline-block w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold text-sm"
          >
            {t("forgotPassword.submit", "Enviar enlace")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)] px-4 py-12">
      <div className="w-full max-w-md bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-[var(--rowi-fg)]">
            {t("resetPassword.title", "Nueva contraseña")}
          </h1>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[var(--rowi-fg)]">
              {t(
                "resetPassword.success",
                "Listo. Tu contraseña fue actualizada.",
              )}
            </p>
            <button
              type="button"
              onClick={() => router.push("/signin")}
              className="w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold text-sm"
            >
              {t("auth.login", "Iniciar sesión")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reset-password"
                className="block text-sm font-medium text-[var(--rowi-fg)] mb-1.5"
              >
                {t("resetPassword.newPasswordLabel", "Nueva contraseña")}
              </label>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-bg)] text-[var(--rowi-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/50 focus:border-[var(--rowi-g2)] transition-all text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="reset-confirm"
                className="block text-sm font-medium text-[var(--rowi-fg)] mb-1.5"
              >
                {t("resetPassword.confirmLabel", "Confirmar contraseña")}
              </label>
              <input
                id="reset-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-bg)] text-[var(--rowi-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/50 focus:border-[var(--rowi-g2)] transition-all text-sm"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500">{errorMessage}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !password || !confirm}
              className="w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </span>
              ) : (
                t("resetPassword.submit", "Guardar contraseña")
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)]">
          <div className="w-10 h-10 border-2 border-[var(--rowi-g2)] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
