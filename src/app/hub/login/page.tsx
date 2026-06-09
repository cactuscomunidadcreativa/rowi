"use client";

import { Suspense, useEffect, useState } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSSOLoginUrl } from "@/lib/six-seconds/sso";
import { AuthShell } from "@/components/shared/AuthShell";

// Error code mapping to i18n keys
const ERROR_KEYS: Record<string, string> = {
  CredentialsSignin: "auth.errorCredentials",
  sso_no_token: "auth.errorSsoNoToken",
  sso_invalid_token: "auth.errorSsoInvalidToken",
  sso_no_access: "auth.errorSsoNoAccess",
  sso_extract_failed: "auth.errorSsoExtractFailed",
  sso_processing_failed: "auth.errorSsoProcessingFailed",
};

function HubLoginContent() {
  const { t, lang, setLang } = useI18n();
  const [providers, setProviders] = useState<Record<string, { id: string; name: string }>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const { data: session, status: sessionStatus } = useSession();
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      router.replace(callbackUrl || "/dashboard");
    }
  }, [sessionStatus, session, callbackUrl, router]);

  useEffect(() => {
    getProviders().then((prov) => setProviders((prov as never) || {}));
  }, []);

  const errorKey = error ? ERROR_KEYS[error] || "auth.errorDefault" : null;
  const errorMessage = errorKey ? t(errorKey) : null;

  const handleSixSecondsLogin = () => {
    window.location.href = getSSOLoginUrl(callbackUrl);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (result?.error) {
        router.push(`/hub/login?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const oauthProviders = Object.values(providers).filter((p) => p.id !== "credentials");

  const inputCls =
    "w-full py-3 px-4 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] text-[var(--rowi-fg)] placeholder-[var(--rowi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent transition-all";

  return (
    <AuthShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <div className="space-y-3">
          <p className="text-sm text-[var(--rowi-muted)]">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="font-semibold text-[var(--rowi-g2)] hover:underline">
              {t("auth.registerFree")}
            </Link>
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {(["es", "en", "pt", "it"] as const).map((l) => {
              const active = l === "es" ? lang === "es" : l === "en" ? lang === "en" : lang === l;
              return (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded text-sm ${
                    active ? "bg-[var(--rowi-g2)]/15 text-[var(--rowi-g2)]" : "text-[var(--rowi-muted)] hover:text-[var(--rowi-fg)]"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      }
    >
      {errorMessage && (
        <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          <span className="text-lg leading-none mt-0.5">&#9888;</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* OAuth */}
      {oauthProviders.length > 0 && (
        <div className="space-y-3">
          {oauthProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => signIn(provider.id, { callbackUrl })}
              className="w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-3 bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] hover:border-[var(--rowi-g2)] hover:shadow-lg text-[var(--rowi-fg)]"
            >
              {provider.id === "google" && (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {t("auth.loginWith")} {provider.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--rowi-card-border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--rowi-card)] text-[var(--rowi-muted)]">{t("auth.loginWithEmail")}</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.emailPlaceholder")}
          aria-label={t("auth.email", "Correo electrónico")}
          autoComplete="email"
          className={inputCls}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.password")}
          aria-label={t("auth.password", "Contraseña")}
          autoComplete="current-password"
          className={inputCls}
          required
        />
        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            t("auth.login")
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--rowi-card-border)]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[var(--rowi-card)] text-[var(--rowi-muted)]">{t("auth.or")}</span>
        </div>
      </div>

      {/* Six Seconds SSO — mantiene su naranja de marca (es Six Seconds, no Rowi) */}
      <button
        onClick={handleSixSecondsLogin}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#f7941d] to-[#f15a29] hover:from-[#f9a53d] hover:to-[#f36f42] text-white rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-1"
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {t("auth.sixSecondsLogin")}
        </span>
        <span className="text-xs opacity-80">{t("auth.sixSecondsDesc")}</span>
      </button>
    </AuthShell>
  );
}

export default function HubLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)]">
          <div className="text-[var(--rowi-muted)] text-lg">Loading…</div>
        </main>
      }
    >
      <HubLoginContent />
    </Suspense>
  );
}
