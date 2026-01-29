"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Chrome } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function LoginPage() {
  const { lang } = useI18n();
  const [providers, setProviders] = useState<any>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProviders().then((prov) => setProviders(prov || {}));
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement email/password login
    await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--rowi-g1)]/20 to-transparent blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--rowi-g2)]/20 to-transparent blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-zinc-800">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <Image src="/rowi-logo.png" alt="Rowi" width={48} height={48} className="rounded-xl" />
              <span className="font-bold text-2xl rowi-gradient-text">Rowi</span>
            </Link>
            <h1 className="text-2xl font-bold mb-2">
              {lang === "en" ? "Welcome back" : "Bienvenido de nuevo"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {lang === "en"
                ? "Sign in to continue your emotional intelligence journey"
                : "Inicia sesión para continuar tu viaje de inteligencia emocional"}
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {Object.values(providers).map((provider: any) => (
              <button
                key={provider.id}
                onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
                className="w-full py-3 px-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-[var(--rowi-g2)] rounded-xl font-medium transition-all flex items-center justify-center gap-3 hover:shadow-lg"
              >
                {provider.name === "Google" && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {lang === "en" ? `Continue with ${provider.name}` : `Continuar con ${provider.name}`}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-zinc-900 text-gray-500">
                {lang === "en" ? "or continue with email" : "o continúa con email"}
              </span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {lang === "en" ? "Email" : "Correo electrónico"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === "en" ? "your@email.com" : "tu@correo.com"}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {lang === "en" ? "Password" : "Contraseña"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[var(--rowi-g2)] focus:ring-[var(--rowi-g2)]" />
                <span className="text-gray-600 dark:text-gray-400">
                  {lang === "en" ? "Remember me" : "Recordarme"}
                </span>
              </label>
              <Link href="/forgot-password" className="text-[var(--rowi-g2)] hover:underline">
                {lang === "en" ? "Forgot password?" : "¿Olvidaste tu contraseña?"}
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
                  {lang === "en" ? "Sign in" : "Iniciar sesión"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            {lang === "en" ? "Don't have an account?" : "¿No tienes cuenta?"}{" "}
            <Link href="/register" className="text-[var(--rowi-g2)] font-semibold hover:underline">
              {lang === "en" ? "Sign up free" : "Regístrate gratis"}
            </Link>
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center gap-2">
            <span>🔒</span>
            {lang === "en"
              ? "Your data is protected and never shared"
              : "Tus datos están protegidos y nunca se comparten"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
