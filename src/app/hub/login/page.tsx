"use client";

import { Suspense, useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSSOLoginUrl } from "@/lib/six-seconds/sso";

// =========================================================
// Traducciones inline
// =========================================================
const T: Record<string, Record<string, string>> = {
  title: {
    es: "Iniciar sesión en Rowi",
    en: "Sign in to Rowi",
  },
  subtitle: {
    es: "Accede con tu cuenta para continuar.",
    en: "Access with your account to continue.",
  },
  loginWith: {
    es: "Ingresar con",
    en: "Sign in with",
  },
  sixSecondsLogin: {
    es: "Ingresar con Six Seconds",
    en: "Sign in with Six Seconds",
  },
  sixSecondsDesc: {
    es: "Para graduados SEI y partners",
    en: "For SEI graduates and partners",
  },
  or: {
    es: "o",
    en: "or",
  },
  noAccount: {
    es: "¿No tienes cuenta?",
    en: "Don't have an account?",
  },
  register: {
    es: "Regístrate gratis",
    en: "Sign up for free",
  },
  emailPlaceholder: {
    es: "tu@email.com",
    en: "you@email.com",
  },
  passwordPlaceholder: {
    es: "Contraseña",
    en: "Password",
  },
  loginButton: {
    es: "Iniciar sesión",
    en: "Sign in",
  },
  forgotPassword: {
    es: "¿Olvidaste tu contraseña?",
    en: "Forgot password?",
  },
  loginWithEmail: {
    es: "o inicia sesión con email",
    en: "or sign in with email",
  },
  // Error messages
  error_sso_no_token: {
    es: "No se recibió el token de autenticación",
    en: "Authentication token not received",
  },
  error_sso_invalid_token: {
    es: "El token de autenticación es inválido",
    en: "Authentication token is invalid",
  },
  error_sso_no_access: {
    es: "No tienes acceso a Rowi. Contacta a tu administrador.",
    en: "You don't have access to Rowi. Contact your administrator.",
  },
  error_sso_extract_failed: {
    es: "Error procesando la autenticación",
    en: "Error processing authentication",
  },
  error_sso_processing_failed: {
    es: "Error en el proceso de login. Intenta de nuevo.",
    en: "Login process error. Please try again.",
  },
  error_CredentialsSignin: {
    es: "Email o contraseña incorrectos",
    en: "Invalid email or password",
  },
  error_default: {
    es: "Error de autenticación. Intenta de nuevo.",
    en: "Authentication error. Please try again.",
  },
};

function HubLoginContent() {
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [lang, setLang] = useState<"es" | "en">("es");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // ─────────────────────────────────────────────────────────
  // Load providers and language
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    getProviders().then((prov) => setProviders(prov || {}));

    // Detect language
    const stored = localStorage.getItem("rowi.lang") as "es" | "en";
    if (stored && ["es", "en"].includes(stored)) {
      setLang(stored);
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // Get error message
  // ─────────────────────────────────────────────────────────
  const errorMessage = error
    ? T[`error_${error}`]?.[lang] || T.error_default[lang]
    : null;

  // ─────────────────────────────────────────────────────────
  // Handle Six Seconds SSO login
  // ─────────────────────────────────────────────────────────
  const handleSixSecondsLogin = () => {
    const ssoUrl = getSSOLoginUrl(callbackUrl);
    window.location.href = ssoUrl;
  };

  // ─────────────────────────────────────────────────────────
  // Handle Email/Password login
  // ─────────────────────────────────────────────────────────
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

  // Filter OAuth providers (exclude credentials)
  const oauthProviders = Object.values(providers).filter(
    (p: any) => p.id !== "credentials"
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#31a2e3] via-[#7a59c9] to-[#d797cf] text-white p-6">
      <div className="max-w-sm w-full bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-5 text-center">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">🔐 {T.title[lang]}</h1>
          <p className="text-sm opacity-80">{T.subtitle[lang]}</p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-sm text-red-100">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* OAuth Providers (Google, Apple) */}
        <div className="space-y-3">
          {oauthProviders.map((provider: any) => (
            <button
              key={provider.id}
              onClick={() => signIn(provider.id, { callbackUrl })}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-3 shadow-lg ${
                provider.id === "apple"
                  ? "bg-black hover:bg-gray-900 text-white"
                  : "bg-white hover:bg-gray-50 text-gray-900"
              }`}
            >
              {provider.id === "google" && (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {provider.id === "apple" && (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              {T.loginWith[lang]} {provider.name}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-sm opacity-60">{T.loginWithEmail[lang]}</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={T.emailPlaceholder[lang]}
            className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={T.passwordPlaceholder[lang]}
            className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3 px-4 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              T.loginButton[lang]
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-sm opacity-60">{T.or[lang]}</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Six Seconds SSO Button - For SEI practitioners */}
        <button
          onClick={handleSixSecondsLogin}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#f7941d] to-[#f15a29] hover:from-[#f9a53d] hover:to-[#f36f42] text-white rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-1"
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {T.sixSecondsLogin[lang]}
          </span>
          <span className="text-xs opacity-80">{T.sixSecondsDesc[lang]}</span>
        </button>

        {/* Register Link */}
        <div className="pt-2 text-center">
          <p className="text-sm opacity-80">
            {T.noAccount[lang]}{" "}
            <Link
              href="/register"
              className="font-semibold underline hover:text-white/90 transition-colors"
            >
              {T.register[lang]}
            </Link>
          </p>
        </div>

        {/* Language toggle */}
        <div className="pt-2 flex justify-center gap-2">
          <button
            onClick={() => {
              setLang("es");
              localStorage.setItem("rowi.lang", "es");
            }}
            className={`px-3 py-1 rounded text-sm ${
              lang === "es" ? "bg-white/20" : "opacity-60 hover:opacity-80"
            }`}
          >
            🇪🇸 ES
          </button>
          <button
            onClick={() => {
              setLang("en");
              localStorage.setItem("rowi.lang", "en");
            }}
            className={`px-3 py-1 rounded text-sm ${
              lang === "en" ? "bg-white/20" : "opacity-60 hover:opacity-80"
            }`}
          >
            🇺🇸 EN
          </button>
        </div>
      </div>
    </main>
  );
}

export default function HubLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#31a2e3] via-[#7a59c9] to-[#d797cf]">
          <div className="text-white text-lg">Loading...</div>
        </main>
      }
    >
      <HubLoginContent />
    </Suspense>
  );
}
