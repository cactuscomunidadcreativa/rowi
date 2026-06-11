"use client";

/**
 * PreSeiWizard — 8 preguntas (una por competencia SEI), escala 1-5, mobile-first.
 * Reusa el patrón de rating de DailyPulseCard y framer-motion. Al terminar,
 * (opcionalmente) recoge demografía y dispara onComplete con respuestas + demo.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface QuestionView {
  sei: string;
  index: number;
  prompt: string;
}

/** Pregunta de preferencias (estilo): polos izq/der, respuesta posicional. */
export interface PreSeiPrefQuestion {
  pos: number;
  promptKey: string;
  leftKey: string;
  rightKey: string;
}

export interface PreSeiDemographics {
  ageRange?: string;
  gender?: string;
  sector?: string;
}

interface Props {
  questions: QuestionView[];
  /** Capa de preferencias opcional — MISMO cuestionario que el Rowi Test del
      onboarding (decisión Eduardo: un solo instrumento espejo↔onboarding). */
  preferenceQuestions?: PreSeiPrefQuestion[];
  submitting?: boolean;
  onComplete: (
    answers: Record<string, number>,
    demographics: PreSeiDemographics,
    preferences?: Record<string, number>,
  ) => void;
}

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"];

export default function PreSeiWizard({
  questions,
  preferenceQuestions = [],
  submitting,
  onComplete,
}: Props) {
  const { t } = useI18n();
  // 0..q-1 = preguntas; q..q+p-1 = preferencias; q+p = demografía
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [preferences, setPreferences] = useState<Record<string, number>>({});
  const [demographics, setDemographics] = useState<PreSeiDemographics>({});

  const qCount = questions.length;
  const prefCount = preferenceQuestions.length;
  const total = qCount + prefCount;
  const onDemographics = step === total;
  const current = step < qCount ? questions[step] : undefined;
  const currentPref =
    !onDemographics && step >= qCount ? preferenceQuestions[step - qCount] : undefined;
  const currentAnswer = current
    ? answers[current.sei]
    : currentPref
      ? preferences[String(currentPref.pos)]
      : undefined;

  function pick(value: number) {
    if (current) {
      setAnswers((a) => ({ ...a, [current.sei]: value }));
    } else if (currentPref) {
      setPreferences((p) => ({ ...p, [String(currentPref.pos)]: value }));
    }
  }

  function next() {
    if (step < total) setStep((s) => s + 1);
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  function finish() {
    onComplete(answers, demographics, prefCount > 0 ? preferences : undefined);
  }

  const progress = Math.round(((Math.min(step, total)) / total) * 100);

  return (
    <div className="max-w-xl mx-auto w-full">
      {/* Barra de progreso */}
      <div className="h-1.5 w-full rounded-full bg-[var(--rowi-chip)] mb-6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, var(--rowi-g2), var(--rowi-g1))" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {!onDemographics && (current || currentPref) ? (
          <motion.div
            key={current ? `q-${current.sei}` : `p-${currentPref!.pos}`}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-xs text-[var(--rowi-muted-weak)] mb-2">
              {t("preSei.progress", "Pregunta {n} de {total}")
                .replace("{n}", String(step + 1))
                .replace("{total}", String(total))}
            </p>
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--rowi-fg)] mb-8 leading-snug">
              {current ? current.prompt : t(currentPref!.promptKey, currentPref!.promptKey)}
            </h2>

            {/* Escala 1-5 (patrón DailyPulseCard) */}
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => pick(v)}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-full text-base font-semibold transition-all ${
                    currentAnswer === v
                      ? "bg-gradient-to-br from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white scale-110 shadow"
                      : "bg-[var(--rowi-card)] border border-[var(--rowi-card-border)] text-[var(--rowi-fg)] hover:scale-105"
                  }`}
                  aria-label={`${v}`}
                  aria-pressed={currentAnswer === v}
                >
                  {v}
                </button>
              ))}
            </div>
            {/* En preferencias los POLOS son las opciones (tarjetas legibles);
                en competencias, anclas de frecuencia. */}
            {currentPref ? (
              <div className="flex justify-between gap-3 mb-8">
                <div className="flex-1 max-w-[45%] rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--rowi-muted-weak)] mb-0.5">1–2</p>
                  <p className="text-sm leading-snug text-[var(--rowi-fg)]">
                    {t(currentPref.leftKey, currentPref.leftKey)}
                  </p>
                </div>
                <div className="flex-1 max-w-[45%] rounded-xl border border-[var(--rowi-card-border)] bg-[var(--rowi-card)] px-3 py-2 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--rowi-muted-weak)] mb-0.5">4–5</p>
                  <p className="text-sm leading-snug text-[var(--rowi-fg)]">
                    {t(currentPref.rightKey, currentPref.rightKey)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-between text-xs text-[var(--rowi-muted-weak)] px-1 mb-8">
                <span>{t("preSei.scale.low", "Casi nunca")}</span>
                <span>{t("preSei.scale.high", "Casi siempre")}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                className="rowi-btn disabled:opacity-30"
              >
                {t("preSei.back", "Atrás")}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={currentAnswer === undefined}
                className="rowi-btn-primary disabled:opacity-40"
              >
                {t("preSei.next", "Siguiente")}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="demographics"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--rowi-fg)] mb-1">
              {t("preSei.demographics.title", "Cuéntanos un poco de ti (opcional)")}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)] mb-6">
              {t("preSei.demographics.hint", "Nos ayuda a comparar tu perfil. Puedes saltar este paso.")}
            </p>

            <label className="block text-sm text-[var(--rowi-fg)] mb-1">
              {t("preSei.demographics.ageRange", "Rango de edad")}
            </label>
            <div className="flex flex-wrap gap-2 mb-5">
              {AGE_RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDemographics((d) => ({ ...d, ageRange: d.ageRange === r ? undefined : r }))}
                  className={`rowi-btn ${demographics.ageRange === r ? "rowi-btn-primary" : ""}`}
                  aria-pressed={demographics.ageRange === r}
                >
                  {r}
                </button>
              ))}
            </div>

            <label className="block text-sm text-[var(--rowi-fg)] mb-1">
              {t("preSei.demographics.gender", "Género")}
            </label>
            <div className="flex flex-wrap gap-2 mb-8">
              {["female", "male", "nonbinary", "preferNotToSay"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDemographics((d) => ({ ...d, gender: d.gender === g ? undefined : g }))}
                  className={`rowi-btn ${demographics.gender === g ? "rowi-btn-primary" : ""}`}
                  aria-pressed={demographics.gender === g}
                >
                  {g === "preferNotToSay"
                    ? t("preSei.demographics.preferNotToSay", "Prefiero no decir")
                    : g}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={back} className="rowi-btn">
                {t("preSei.back", "Atrás")}
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={submitting}
                className="rowi-btn-primary disabled:opacity-50"
              >
                {submitting ? "…" : t("preSei.seeResult", "Ver mi resultado")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
