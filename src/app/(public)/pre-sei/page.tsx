"use client";

/**
 * Pre-SEI público — gancho del Día de la Inteligencia Emocional (EQ Day).
 *
 * Flujo: landing → wizard (8 preguntas + demografía) → submit → insight inmediato
 * (las 3 vistas VS inferidas + arquetipo) → CTAs a SEI/VS real + crear cuenta.
 * El insight se ve ANTES de pedir cuenta (máxima conversión). Sin auth.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import PreSeiWizard, { type PreSeiDemographics } from "@/components/pre-sei/PreSeiWizard";
import PreSeiInsight from "@/components/pre-sei/PreSeiInsight";
import PreSeiMirror from "@/components/pre-sei/PreSeiMirror";
import PreSeiCTA from "@/components/pre-sei/PreSeiCTA";
import type { PreSeiInsightData } from "@/components/pre-sei/types";

type Phase = "landing" | "wizard" | "result";
interface QuestionView {
  sei: string;
  index: number;
  prompt: string;
}

export default function PreSeiPage() {
  const { t, lang } = useI18n();
  const [phase, setPhase] = useState<Phase>("landing");
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [insight, setInsight] = useState<PreSeiInsightData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefetch en el mount (pesan <1KB): el clic en "Empezar" no debe esperar
  // a la red. retrySeq permite reintentar tras un error.
  const [retrySeq, setRetrySeq] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/public/pre-sei/questions?lang=${lang}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.ok) setQuestions(json.questions);
        else setError(t("preSei.errors.generic", "Algo salió mal."));
      })
      .catch(() => {
        if (!cancelled) setError(t("preSei.errors.generic", "Algo salió mal."));
      });
    return () => {
      cancelled = true;
    };
  }, [lang, retrySeq, t]);

  async function handleComplete(answers: Record<string, number>, demographics: PreSeiDemographics) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/pre-sei/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, lang, ...demographics }),
      });
      const json = await res.json();
      if (res.status === 429) {
        setError(t("preSei.errors.rateLimited", "Demasiados intentos."));
        return;
      }
      if (!res.ok || !json.ok) {
        setError(t("preSei.errors.invalidAnswers", "Revisa tus respuestas."));
        return;
      }
      setInsight(json.insight);
      setToken(json.token);
      setPhase("result");
    } catch {
      setError(t("preSei.errors.generic", "Algo salió mal."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-[var(--rowi-bg)]">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div role="alert" className="mb-4 text-center space-y-2">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => setRetrySeq((s) => s + 1)}
              className="rowi-btn-primary px-4 py-2 text-sm"
            >
              {t("common.retry", "Reintentar")}
            </button>
          </div>
        )}

        {phase === "landing" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-[var(--rowi-chip)] text-[var(--rowi-muted)] mb-6">
              {t("preSei.eqday.badge", "Día de la Inteligencia Emocional")}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-[var(--rowi-fg)]">
              {t("preSei.eqday.title", "Conoce tu inteligencia emocional en 2 minutos")}
            </h1>
            <p className="text-base md:text-lg text-[var(--rowi-muted)] mb-8">
              {t("preSei.eqday.subtitle", "Un diagnóstico rápido basado en el modelo Six Seconds.")}
            </p>
            <button onClick={() => setPhase("wizard")} className="rowi-btn-primary py-3 px-8 text-base">
              {t("preSei.landing.start", "Empezar mi diagnóstico")}
            </button>
            <p className="mt-3 text-xs text-[var(--rowi-muted-weak)]">
              {t("preSei.landing.timeHint", "Menos de 2 minutos · gratis · sin cuenta")}
            </p>
          </motion.div>
        )}

        {phase === "wizard" && questions.length > 0 && (
          <PreSeiWizard questions={questions} submitting={submitting} onComplete={handleComplete} />
        )}
        {/* Nunca pantalla en blanco: si el prefetch aún no llegó, spinner. */}
        {phase === "wizard" && questions.length === 0 && !error && (
          <div className="flex items-center justify-center py-16" aria-busy="true">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
          </div>
        )}

        {phase === "result" && insight && (
          <div className="space-y-8">
            {/* EL ESPEJO primero (el WOW del blueprint), el detalle después. */}
            <PreSeiMirror insight={insight} token={token} />
            <PreSeiInsight insight={insight} />
            <PreSeiCTA token={token} />
          </div>
        )}
      </div>
    </div>
  );
}
