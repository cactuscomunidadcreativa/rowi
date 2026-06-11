"use client";

/* =========================================================
   🚀 Registro a 1 PASO (F2 · Rowi Launch 1.0)
   ---------------------------------------------------------
   Antes: wizard de 5 pasos que abría con selección de plan
   (paywall psicológico) y cuyos pasos 2-4 eran inalcanzables
   (auditoría jun-2026, P0-8/P1-23). Ahora: OAuth o
   email+nombre+password, plan free implícito, términos con
   links reales (timestamp server-side), y salida directa al
   onboarding (mini-SEI = WOW).

   Params que se preservan: ?preSeiToken= (el espejo se
   reclama en el backend), ?intent=, ?plan= (si es de pago se
   resuelve en /pricing DESPUÉS de activarse — nunca se asigna
   sin checkout), ?ref=, ?coupon=, utm_*, ?source=.
========================================================= */

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getProviders, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

function RegisterInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Usuario YA logueado que llega a /register: mandarlo a su día. PERO si la
  // sesión nace AQUÍ (auto-login post-registro), este efecto NO debe competir
  // con la navegación a /onboarding — esa carrera mandaba al usuario nuevo a
  // /today sin cookie estable → /signin?callbackUrl=/today (bug Eduardo F7).
  const registering = useRef(false);
  useEffect(() => {
    if (registering.current) return;
    if (status === "authenticated" && session?.user?.email) {
      const plan = searchParams.get("plan");
      router.replace(plan ? `/pricing?plan=${plan}` : "/today");
    }
  }, [status, session, searchParams, router]);

  const [providers, setProviders] = useState<Record<
    string,
    { id: string; name: string }
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const preSeiToken = searchParams.get("preSeiToken");

  useEffect(() => {
    getProviders()
      .then((prov) => setProviders(prov as any))
      .catch(() => setProviders(null));
  }, []);

  const oauthProviders = providers
    ? Object.values(providers).filter((p) => p.id !== "credentials")
    : [];

  function handleOAuthSignIn(providerId: string) {
    setLoading(true);
    try {
      // Los query params se pierden en el redirect de OAuth: viajan por
      // sessionStorage y los reclama /register/complete → finalize-oauth.
      sessionStorage.setItem(
        "rowi_registration",
        JSON.stringify({
          selectedPlan: { slug: searchParams.get("plan") || undefined },
          formData: {},
          source: searchParams.get("source"),
          utmSource: searchParams.get("utm_source"),
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
          preSeiToken,
          intent: searchParams.get("intent"),
          relToken: searchParams.get("relToken"),
        })
      );
      void signIn(providerId, { callbackUrl: "/register/complete" });
    } catch {
      toast.error(t("register.errors.oauth", "Error al conectar con el proveedor"));
      setLoading(false);
    }
  }

  async function handleEmailRegistration(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.name || !form.password) {
      setError(t("register.errors.requiredFields", "Por favor completa todos los campos requeridos"));
      return;
    }
    if (form.password.length < 8) {
      setError(t("register.errors.passwordTooShort", "La contraseña debe tener al menos 8 caracteres"));
      return;
    }

    setLoading(true);
    registering.current = true;
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          password: form.password,
          planSlug: searchParams.get("plan") || undefined,
          referralCode: searchParams.get("ref") || undefined,
          couponCode: searchParams.get("coupon") || undefined,
          utmSource: searchParams.get("utm_source"),
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
          source: searchParams.get("source"),
          // El diagnóstico anónimo del Pre-SEI viaja con el registro: el
          // backend lo reclama (claimPreSeiSession) y el WOW sobrevive.
          preSeiToken,
          intent: searchParams.get("intent"),
          // Invitación relacional (/r/[token]): vincula la díada al registrarse.
          relToken: searchParams.get("relToken"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "email_already_exists"
            ? t("register.errors.emailExists", "Este email ya está registrado")
            : t("register.errors.general", "Ocurrió un error. Inténtalo de nuevo.")
        );
        return;
      }

      // Auto-login y directo al onboarding (mini-SEI = momento WOW).
      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signInResult?.error) {
        toast.success(t("register.errors.accountCreated", "Cuenta creada. Por favor inicia sesión."));
        window.location.href = "/signin?callbackUrl=%2Fonboarding";
      } else {
        toast.success(t("register.errors.welcomeToRowi", "¡Bienvenido a Rowi! Completa tu perfil."));
        // Navegación COMPLETA (no client-side): garantiza que el middleware
        // vea la cookie de sesión recién emitida — el push() de cliente
        // corría antes de que la sesión se estabilizara.
        window.location.href = "/onboarding";
      }
    } catch {
      setError(t("register.errors.general", "Ocurrió un error. Inténtalo de nuevo."));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-4 py-3 text-base text-[var(--rowi-fg)] placeholder:text-[var(--rowi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary,#7c3aed)]";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--rowi-fg)] mb-2">
            {t("register.account.title", "Crea tu cuenta")}
          </h1>
          {preSeiToken ? (
            <p className="text-sm text-[var(--rowi-primary,#7c3aed)] font-medium flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {t("register.mirrorReady", "Tu espejo emocional está listo. Crea tu cuenta para guardarlo.")}
            </p>
          ) : (
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("register.oneStep.subtitle", "Gratis, en menos de un minuto. Sin tarjeta.")}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] p-6 space-y-5">
          {/* OAuth primero: el camino de menor fricción */}
          {oauthProviders.length > 0 && (
            <>
              <div className="space-y-2">
                {oauthProviders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleOAuthSignIn(p.id)}
                    disabled={loading}
                    className="w-full rounded-xl border border-[var(--rowi-card-border)] px-4 py-3 text-sm font-medium text-[var(--rowi-fg)] hover:bg-[var(--rowi-card-hover)] transition-colors"
                  >
                    {t("register.account.continueWith", "Continuar con")} {p.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--rowi-card-border)]" />
                <span className="text-xs text-[var(--rowi-muted)]">
                  {t("register.account.or", "o regístrate con email")}
                </span>
                <div className="h-px flex-1 bg-[var(--rowi-card-border)]" />
              </div>
            </>
          )}

          <form onSubmit={handleEmailRegistration} className="space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-[var(--rowi-fg)] mb-1.5">
                {t("register.account.nameLabel", "Nombre")}
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("register.account.namePlaceholder", "Tu nombre completo")}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-[var(--rowi-fg)] mb-1.5">
                {t("register.account.emailLabel", "Email")}
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t("register.account.emailPlaceholder", "tu@email.com")}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-[var(--rowi-fg)] mb-1.5">
                {t("register.account.passwordLabel", "Contraseña")}
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={t("register.errors.passwordPlaceholder", "Contraseña (mínimo 8 caracteres)")}
                className={inputClass}
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rowi-btn-primary w-full py-3 text-base font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Mail className="w-4 h-4" aria-hidden="true" />
              )}
              {t("register.account.createAccount", "Crear cuenta")}
            </button>
          </form>

          {/* Términos con LINKS REALES (antes: texto plano sin enlaces en el
              paso 4 de un wizard que nadie alcanzaba). El timestamp de
              aceptación se registra server-side al crear la cuenta. */}
          <p className="text-xs text-[var(--rowi-muted)] text-center leading-relaxed">
            {t("register.terms.prefix", "Al crear tu cuenta aceptas los")}{" "}
            <Link href="/legal/terms" className="underline hover:text-[var(--rowi-fg)]" target="_blank">
              {t("register.terms.tos", "Términos de Servicio")}
            </Link>{" "}
            {t("register.terms.and", "y la")}{" "}
            <Link href="/legal/privacy" className="underline hover:text-[var(--rowi-fg)]" target="_blank">
              {t("register.terms.privacy", "Política de Privacidad")}
            </Link>
            .
          </p>
        </div>

        <p className="text-center text-sm text-[var(--rowi-muted)] mt-6">
          {t("register.haveAccount", "¿Ya tienes cuenta?")}{" "}
          <Link href="/signin" className="text-[var(--rowi-primary,#7c3aed)] font-medium hover:underline">
            {t("register.signInLink", "Inicia sesión")}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
        </div>
      }
    >
      <RegisterInner />
    </Suspense>
  );
}
