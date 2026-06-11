"use client";

/**
 * /verify-email?token=...
 * ---------------------------------------------------------
 * Public page (no session required). Calls GET
 * /api/auth/verify-email?token=... on mount and shows
 * loading → success → error states with i18n copy.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/lib/i18n/I18nProvider";

type Status = "checking" | "success" | "error";
type ErrorCode =
  | "missing_token"
  | "invalid_token"
  | "already_used"
  | "expired"
  | "email_mismatch"
  | "user_not_found"
  | "internal_error"
  | "unknown";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const ran = useRef(false);

  const [status, setStatus] = useState<Status>("checking");
  const [errorCode, setErrorCode] = useState<ErrorCode>("unknown");
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState<"ok" | "error" | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorCode("missing_token");
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          { method: "GET" },
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorCode((data?.error as ErrorCode) || "unknown");
        }
      } catch {
        setStatus("error");
        setErrorCode("internal_error");
      }
    })();
  }, [searchParams]);

  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setResendDone(null);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
      });
      if (res.ok) {
        setResendDone("ok");
      } else {
        setResendDone("error");
      }
    } catch {
      setResendDone("error");
    } finally {
      setResending(false);
    }
  };

  const errorMessage = (() => {
    switch (errorCode) {
      case "expired":
        return t("verifyEmail.errorExpired", "Este enlace ya expiró.");
      case "already_used":
        return t("verifyEmail.errorUsed", "Este enlace ya fue utilizado.");
      case "missing_token":
      case "invalid_token":
      case "email_mismatch":
      case "user_not_found":
      default:
        return t(
          "verifyEmail.errorInvalid",
          "El enlace no es válido. Pide uno nuevo.",
        );
    }
  })();

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)] px-4 py-12">
      <div className="w-full max-w-md bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] rounded-3xl shadow-xl p-8 space-y-6 text-center">
        <h1 className="text-2xl font-heading font-bold text-[var(--rowi-fg)]">
          {t("verifyEmail.title", "Confirmar email")}
        </h1>

        {status === "checking" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[var(--rowi-g2)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("verifyEmail.checking", "Confirmando tu email...")}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--rowi-fg)]">
              {t("verifyEmail.successTitle", "¡Email confirmado!")}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t(
                "verifyEmail.successBody",
                "Tu correo quedó verificado. Ya puedes entrar a tu panel.",
              )}
            </p>
            <button
              type="button"
              onClick={() => router.push("/today")}
              className="w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold text-sm"
            >
              {t("verifyEmail.goToHubCta", "Ir a mi panel")}
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {resending
                ? t("verifyEmail.checking", "Confirmando tu email...")
                : t("verifyEmail.resendCta", "Reenviar email de confirmación")}
            </button>
            {resendDone === "ok" && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {t(
                  "verifyEmail.resendSuccess",
                  "Si tu sesión está activa, te enviamos un nuevo enlace.",
                )}
              </p>
            )}
            {resendDone === "error" && (
              <p className="text-xs text-red-500">
                {t(
                  "verifyEmail.resendError",
                  "No pudimos reenviar el email. Intenta más tarde.",
                )}
              </p>
            )}
            <p className="text-xs text-[var(--rowi-muted-weak)]">
              <Link
                href="/signin"
                className="text-[var(--rowi-g2)] hover:underline"
              >
                {t("auth.login", "Iniciar sesión")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)]">
          <div className="w-10 h-10 border-2 border-[var(--rowi-g2)] border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
