"use client";

import { Suspense, useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
  error_default: {
    es: "Error de autenticación. Intenta de nuevo.",
    en: "Authentication error. Please try again.",
  },
};

function HubLoginContent() {
  const [providers, setProviders] = useState<Record<string, any>>({});
  const [lang, setLang] = useState<"es" | "en">("es");
  const searchParams = useSearchParams();
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#31a2e3] via-[#7a59c9] to-[#d797cf] text-white p-6">
      <div className="max-w-sm w-full bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-6 text-center">
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

        {/* Six Seconds SSO Button - Primary */}
        <button
          onClick={handleSixSecondsLogin}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#f7941d] to-[#f15a29] hover:from-[#f9a53d] hover:to-[#f36f42] text-white rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-1 shadow-lg"
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

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-sm opacity-60">{T.or[lang]}</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Other providers (Google, etc.) */}
        <div className="space-y-3">
          {Object.values(providers)
            .filter((p: any) => p.id !== "credentials")
            .map((provider: any) => (
              <button
                key={provider.id}
                onClick={() => signIn(provider.id, { callbackUrl })}
                className="w-full py-3 px-4 bg-white/90 hover:bg-white text-gray-900 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {provider.name === "Google" && (
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
                {T.loginWith[lang]} {provider.name}
              </button>
            ))}
        </div>

        {/* Language toggle */}
        <div className="pt-4 flex justify-center gap-2">
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
