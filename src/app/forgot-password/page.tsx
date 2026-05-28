"use client";

/**
 * /forgot-password
 * ---------------------------------------------------------
 * Public page. Asks for an email and POSTs to
 * /api/auth/forgot-password. Always shows the same
 * "if-exists" message after submit (anti-enumeration).
 */

import { useState } from "react";
import Link from "next/link";

import { useI18n } from "@/lib/i18n/I18nProvider";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !email) return;
    setSubmitting(true);
    setRateLimited(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setRateLimited(true);
      } else {
        setDone(true);
      }
    } catch {
      // Network error — still treat as anti-enumeration success.
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)] px-4 py-12">
      <div className="w-full max-w-md bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-heading font-bold text-[var(--rowi-fg)]">
            {t("forgotPassword.title", "¿Olvidaste tu contraseña?")}
          </h1>
          <p className="text-sm text-[var(--rowi-muted)]">
            {t(
              "forgotPassword.subtitle",
              "Escribe tu email y te enviaremos un enlace para restablecerla.",
            )}
          </p>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[var(--rowi-fg)]">
              {t(
                "forgotPassword.successMessage",
                "Si la cuenta existe, recibirás un email con instrucciones en breve.",
              )}
            </p>
            <Link
              href="/signin"
              className="inline-block w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold text-sm"
            >
              {t("auth.login", "Iniciar sesión")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-sm font-medium text-[var(--rowi-fg)] mb-1.5"
              >
                {t("forgotPassword.emailLabel", "Correo electrónico")}
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder", "tu@email.com")}
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-bg)] text-[var(--rowi-fg)] placeholder-[var(--rowi-muted-weak)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/50 focus:border-[var(--rowi-g2)] transition-all text-sm"
              />
            </div>

            {rateLimited && (
              <p className="text-xs text-red-500">
                {t(
                  "forgotPassword.tooManyRequests",
                  "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
                )}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !email}
              className="w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </span>
              ) : (
                t("forgotPassword.submit", "Enviar enlace")
              )}
            </button>

            <p className="text-xs text-center text-[var(--rowi-muted-weak)]">
              <Link
                href="/signin"
                className="text-[var(--rowi-g2)] hover:underline"
              >
                {t("auth.login", "Iniciar sesión")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
