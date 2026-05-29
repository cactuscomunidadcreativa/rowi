"use client";

/**
 * 🧭 /sei — Selección de idioma para tomar el SEI.
 * El SEI se realiza en la plataforma de Six Seconds; aquí el usuario elige el
 * idioma y abrimos el link correspondiente (SeiLink configurado en admin).
 * Estados: cargando · sin plan SEI (upgrade) · sin idiomas configurados · lista.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import { Sparkles, ArrowRight, ArrowUpRight, Loader2, AlertCircle } from "lucide-react";

interface SeiLanguage {
  code: string;
  name: string;
  url: string;
  linkCode: string;
}

const FLAG: Record<string, string> = {
  es: "🇪🇸", en: "🇬🇧", pt: "🇧🇷", fr: "🇫🇷", de: "🇩🇪", it: "🇮🇹",
};

export default function SeiLanguagePage() {
  const { locale } = useI18n();
  const isEN = locale === "en";
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<SeiLanguage[]>([]);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  useEffect(() => {
    fetch("/api/sei/languages")
      .then((r) => r.json())
      .then((d) => {
        if (d?.upgrade) setNeedsUpgrade(true);
        else if (d?.ok) setLanguages(d.languages || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openSei(lang: SeiLanguage) {
    // Resolvemos la URL final por el endpoint (respeta plan + fallbacks);
    // si falla, usamos la url que ya trae la lista.
    fetch(`/api/sei/link?language=${lang.code}`)
      .then((r) => r.json())
      .then((d) => {
        const url = d?.link?.url || lang.url;
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      })
      .catch(() => window.open(lang.url, "_blank", "noopener,noreferrer"));
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pt-24">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold">
          {isEN ? "Take your SEI" : "Toma tu SEI"}
        </h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        {isEN
          ? "Choose the language to take your Six Seconds emotional intelligence assessment."
          : "Elige el idioma para realizar tu evaluación de inteligencia emocional Six Seconds."}
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          {isEN ? "Loading…" : "Cargando…"}
        </div>
      )}

      {!loading && needsUpgrade && (
        <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isEN
              ? "Your current plan doesn't include the SEI assessment."
              : "Tu plan actual no incluye la evaluación SEI."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/settings/subscription")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium hover:opacity-90"
          >
            {isEN ? "Upgrade your plan" : "Mejora tu plan"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!loading && !needsUpgrade && languages.length === 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {isEN
              ? "No SEI languages are configured yet. An admin can add them in Admin → SEI Links."
              : "Todavía no hay idiomas del SEI configurados. Un administrador puede añadirlos en Admin → SEI Links."}
          </p>
        </div>
      )}

      {!loading && languages.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => openSei(lang)}
              className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors text-left group"
            >
              <span className="text-2xl">{FLAG[lang.code] || "🌐"}</span>
              <span className="flex-1 font-medium text-gray-800 dark:text-gray-200 group-hover:text-[var(--rowi-g2)]">
                {lang.name}
              </span>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[var(--rowi-g2)]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
