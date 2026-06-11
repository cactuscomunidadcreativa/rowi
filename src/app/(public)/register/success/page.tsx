// src/app/(public)/register/success/page.tsx
// ============================================================
// Post-payment success page. Stripe redirects here after checkout
// with ?session_id={CHECKOUT_SESSION_ID}. Verifies the session via
// /api/stripe/checkout/verify and shows a rich confirmation. A paying
// user must ALWAYS land somewhere graceful — never a raw error/404.
// ============================================================

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  HeartPulse,
  Rocket,
} from "lucide-react";

interface VerifyResult {
  ok: boolean;
  planName?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  status?: string | null;
  error?: string;
}

function formatAmount(
  amountTotal: number | null | undefined,
  currency: string | null | undefined,
  locale: string
): string | null {
  if (amountTotal == null || !currency) return null;
  try {
    return new Intl.NumberFormat(locale || "es", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountTotal / 100);
  } catch {
    return `${(amountTotal / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function RegisterSuccessInner() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!sessionId) {
        if (!cancelled) {
          setResult({ ok: false, error: "missing_session_id" });
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch(
          `/api/stripe/checkout/verify?session_id=${encodeURIComponent(sessionId)}`
        );
        const json = (await res.json()) as VerifyResult;
        if (!cancelled) setResult(json);
      } catch {
        if (!cancelled) setResult({ ok: false, error: "network" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // ----- Loading -----
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>
            {t(
              "register.success.verifying",
              "Confirmando tu pago..."
            )}
          </span>
        </div>
      </div>
    );
  }

  const verified = result?.ok === true;
  const amount = formatAmount(result?.amountTotal, result?.currency, locale);
  const planName = result?.planName;

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12 flex items-start justify-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            {verified
              ? t("register.success.title", "¡Pago confirmado!")
              : t(
                  "register.success.almostTitle",
                  "Tu registro está casi listo"
                )}
          </h1>
          <p className="text-gray-400">
            {verified
              ? t(
                  "register.success.subtitle",
                  "Tu suscripción está activa. Te damos la bienvenida a Rowi."
                )
              : t(
                  "register.success.almostSubtitle",
                  "Estamos terminando de activar tu cuenta. Puedes entrar a tu panel ahora mismo."
                )}
          </p>
        </div>

        {/* Plan detail (only when verified with data) */}
        {verified && (planName || amount) && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t("register.success.planLabel", "Tu plan")}
                  </p>
                  <p className="font-semibold text-white">
                    {planName ||
                      t("register.success.planFallback", "Suscripción Rowi")}
                  </p>
                </div>
              </div>
              {amount && (
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {t("register.success.amountLabel", "Total")}
                  </p>
                  <p className="font-semibold text-white">{amount}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Próximos pasos (only when verified) */}
        {verified && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300">
              {t("register.success.nextStepsTitle", "Próximos pasos")}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                {t(
                  "register.success.step1",
                  "Completa tu perfil para personalizar tu experiencia."
                )}
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                {t(
                  "register.success.step2",
                  "Haz tu primer check-in emocional para empezar a medir tus señales vitales."
                )}
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                {t(
                  "register.success.step3",
                  "Explora tu panel y descubre tus herramientas de crecimiento emocional."
                )}
              </li>
            </ul>
          </div>
        )}

        {/* Primer check-in emocional teaser */}
        <button
          onClick={() => router.push("/hub/vital-signs")}
          className="w-full text-left bg-gradient-to-r from-rose-500/10 to-pink-500/10 hover:from-rose-500/20 hover:to-pink-500/20 rounded-2xl border border-rose-500/30 p-5 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/20 shrink-0">
              <HeartPulse className="w-6 h-6 text-rose-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">
                {t(
                  "register.success.checkInTitle",
                  "Tu primer check-in emocional"
                )}
              </h3>
              <p className="text-sm text-gray-400">
                {t(
                  "register.success.checkInDesc",
                  "Dedica 30 segundos a registrar cómo te sientes hoy. Es el primer paso de tu viaje."
                )}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        </button>

        {/* Primary CTA → hub / onboarding */}
        <button
          onClick={() => router.push("/today")}
          className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl font-medium text-white transition-colors"
        >
          <Rocket className="w-5 h-5" />
          <span>
            {verified
              ? t("register.success.cta", "Comenzar mi experiencia")
              : t("register.success.ctaFallback", "Ir a mi panel")}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <RegisterSuccessInner />
    </Suspense>
  );
}
