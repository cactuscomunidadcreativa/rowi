"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { AuthShell } from "@/components/shared/AuthShell";

export default function LoginPage() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProviders().then((prov) => setProviders((prov as never) || {}));
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl: "/today" });
    setLoading(false);
  };

  const oauthProviders = Object.values(providers).filter((p) => p.id !== "credentials");

  return (
    <AuthShell
      title={t("login.welcome", "Hola de nuevo")}
      subtitle={t("login.subtitle", "Entra para seguir convirtiéndote en quien quieres ser")}
      footer={
        <p className="text-sm text-[var(--rowi-muted)]">
          {t("login.noAccount", "¿No tienes cuenta?")}{" "}
          <Link href="/register" className="text-[var(--rowi-g2)] font-semibold hover:underline">
            {t("login.signUpFree", "Regístrate gratis")}
          </Link>
        </p>
      }
    >
      {/* OAuth */}
      {oauthProviders.length > 0 && (
        <div className="space-y-3">
          {oauthProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => signIn(provider.id, { callbackUrl: "/today" })}
              className="w-full py-3 px-4 bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] hover:border-[var(--rowi-g2)] rounded-xl font-medium transition-all flex items-center justify-center gap-3 hover:shadow-lg text-[var(--rowi-fg)]"
            >
              {provider.name === "Google" && (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {t("login.continueWith", "Continuar con")} {provider.name}
            </button>
          ))}

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--rowi-card-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--rowi-card)] text-[var(--rowi-muted)]">
                {t("login.orContinueWithEmail", "o entra con tu email")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Email/password */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--rowi-muted)]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.emailPlaceholder", "tu@email.com")}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] text-[var(--rowi-fg)] focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent transition-all"
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--rowi-muted)]" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] text-[var(--rowi-fg)] focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="flex items-center justify-end text-sm">
          <Link href="/forgot-password" className="text-[var(--rowi-g2)] hover:underline">
            {t("login.forgotPassword", "¿Olvidaste tu contraseña?")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold flex items-center justify-center gap-2 group disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {t("login.signin", "Entrar")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <p className="flex items-center justify-center gap-2 text-xs text-[var(--rowi-muted)]">
        <span>🔒</span>
        {t("login.dataProtected", "Tus datos están protegidos y nunca se comparten")}
      </p>
    </AuthShell>
  );
}
