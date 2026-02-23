"use client";

import { getProviders, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getSSOLoginUrl } from "@/lib/six-seconds/sso";

/* =========================================================
   Error code → i18n key mapping
========================================================= */
const ERROR_KEYS: Record<string, string> = {
  CredentialsSignin: "auth.errorCredentials",
  sso_no_token: "auth.errorSsoNoToken",
  sso_invalid_token: "auth.errorSsoInvalidToken",
  sso_no_access: "auth.errorSsoNoAccess",
  sso_extract_failed: "auth.errorSsoExtractFailed",
  sso_processing_failed: "auth.errorSsoProcessingFailed",
  OAuthAccountNotLinked: "auth.errorAccountLinked",
};

/* =========================================================
   Animated floating blobs (background decoration)
========================================================= */
function FloatingBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#31a2e3]/30 to-[#7a59c9]/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#d797cf]/30 to-[#f378a5]/20 blur-3xl animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[#7a59c9]/15 to-[#31a2e3]/10 blur-3xl animate-pulse [animation-delay:4s]" />
    </div>
  );
}

/* =========================================================
   Google SVG icon
========================================================= */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/* =========================================================
   Main SignIn content
========================================================= */
function SignInContent() {
  const { t, lang, setLang } = useI18n();
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // ── Load providers ──────────────────────────────────────
  useEffect(() => {
    getProviders().then((prov) => setProviders(prov || {}));
    // Trigger mount animation
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // ── Error message ───────────────────────────────────────
  const errorKey = error ? ERROR_KEYS[error] || "auth.errorDefault" : null;
  const errorMessage = errorKey ? t(errorKey) : null;

  // ── Six Seconds SSO ─────────────────────────────────────
  const handleSixSecondsLogin = () => {
    const ssoUrl = getSSOLoginUrl(callbackUrl);
    window.location.href = ssoUrl;
  };

  // ── Email/Password login ────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        router.push(
          `/signin?error=CredentialsSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out the credentials provider from OAuth buttons
  const oauthProviders = Object.values(providers).filter(
    (p: any) => p.id !== "credentials"
  );

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[var(--rowi-bg)] overflow-hidden px-4 py-12">
      <FloatingBlobs />

      {/* ── Card ─────────────────────────────────────────── */}
      <div
        className={`relative z-10 w-full max-w-[420px] transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-[var(--rowi-card)] rounded-3xl shadow-2xl border border-[var(--rowi-card-border)] p-8 space-y-6">
          {/* ── Logo + Title ─────────────────────────────── */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <Image
                src="/rowi-logo.png"
                alt="Rowi"
                width={52}
                height={52}
                className="rounded-2xl shadow-lg group-hover:scale-105 transition-transform"
              />
              <span className="font-heading font-bold text-3xl rowi-gradient-text">
                Rowi
              </span>
            </Link>
            <h1 className="text-2xl font-heading font-bold text-[var(--rowi-fg)] mb-1">
              {t("auth.loginTitle")}
            </h1>
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("auth.loginSubtitle")}
            </p>
          </div>

          {/* ── Error message ────────────────────────────── */}
          {errorMessage && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
              <span className="text-lg leading-none mt-0.5">&#9888;</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── OAuth Providers (Google, etc.) ────────────── */}
          <div className="space-y-3">
            {oauthProviders.map((provider: any) => (
              <button
                key={provider.id}
                onClick={() => signIn(provider.id, { callbackUrl })}
                className="w-full py-3 px-4 bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] hover:border-[var(--rowi-g2)] rounded-xl font-semibold transition-all flex items-center justify-center gap-3 hover:shadow-lg text-[var(--rowi-fg)]"
              >
                {provider.id === "google" && <GoogleIcon />}
                {t("auth.loginWith")} {provider.name}
              </button>
            ))}
          </div>

          {/* ── Divider ──────────────────────────────────── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--rowi-card-border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-[var(--rowi-card)] text-[var(--rowi-muted-weak)]">
                {t("auth.loginWithEmail")}
              </span>
            </div>
          </div>

          {/* ── Email/Password Form ──────────────────────── */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted-weak)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-bg)] text-[var(--rowi-fg)] placeholder-[var(--rowi-muted-weak)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/50 focus:border-[var(--rowi-g2)] transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted-weak)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-bg)] text-[var(--rowi-fg)] placeholder-[var(--rowi-muted-weak)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-g2)]/50 focus:border-[var(--rowi-g2)] transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 px-4 rowi-btn-primary rounded-xl font-semibold flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t("auth.login")}
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* ── Divider ──────────────────────────────────── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--rowi-card-border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-[var(--rowi-card)] text-[var(--rowi-muted-weak)]">
                {t("auth.or")}
              </span>
            </div>
          </div>

          {/* ── Six Seconds SSO ──────────────────────────── */}
          <button
            onClick={handleSixSecondsLogin}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#f7941d] to-[#f15a29] hover:from-[#f9a53d] hover:to-[#f36f42] text-white rounded-xl font-medium transition-all flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg"
          >
            <span className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {t("auth.sixSecondsLogin")}
            </span>
            <span className="text-[11px] opacity-80">{t("auth.sixSecondsDesc")}</span>
          </button>

          {/* ── Register Link ────────────────────────────── */}
          <div className="text-center pt-1">
            <p className="text-sm text-[var(--rowi-muted)]">
              {t("auth.noAccount")}{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--rowi-g2)] hover:underline transition-colors"
              >
                {t("auth.registerFree")}
              </Link>
            </p>
          </div>
        </div>

        {/* ── Language switcher ───────────────────────────── */}
        <div className="mt-5 flex justify-center gap-1.5">
          {(["es", "en", "pt", "it"] as const).map((code) => {
            const flags: Record<string, string> = { es: "ES", en: "EN", pt: "PT", it: "IT" };
            return (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  lang === code
                    ? "bg-[var(--rowi-g2)]/15 text-[var(--rowi-g2)] border border-[var(--rowi-g2)]/30"
                    : "text-[var(--rowi-muted-weak)] hover:text-[var(--rowi-muted)] hover:bg-[var(--rowi-chip)]"
                }`}
              >
                {flags[code]}
              </button>
            );
          })}
        </div>

        {/* ── Trust badge ────────────────────────────────── */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[var(--rowi-muted-weak)] flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {lang === "en"
              ? "Your data is protected and never shared"
              : lang === "pt"
              ? "Seus dados estão protegidos e nunca são compartilhados"
              : lang === "it"
              ? "I tuoi dati sono protetti e mai condivisi"
              : "Tus datos están protegidos y nunca se comparten"}
          </p>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   Page wrapper with Suspense
========================================================= */
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[var(--rowi-bg)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-[var(--rowi-g2)] border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
