"use client";

/**
 * MiniSeiWizard — el Rowi Test NORMADO (12 ítems short-form SEI 5.0 + 8
 * lecturas de competencia). El cliente responde por POSICIÓN OPACA (el orden
 * que devuelve /api/mini-sei/questions); el mapeo posición→ítem/competencia
 * vive solo en el servidor (el moat). Mismo patrón visual que PreSeiWizard
 * (escala 1-5, framer-motion, barra de progreso) pero con el contrato del
 * mini-SEI: sin demografía, key por `pos`.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/I18nProvider";

export interface MiniSeiQuestion {
  pos: number;
  stem: string;
}

interface Props {
  questions: MiniSeiQuestion[];
  submitting?: boolean;
  /** answers indexado por posición opaca: { "0": 4, "1": 3, ... } */
  onComplete: (answers: Record<string, number>) => void;
}

export default function MiniSeiWizard({ questions, submitting, onComplete }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const total = questions.length;
  const current = questions[step];
  const currentAnswer = current ? answers[String(current.pos)] : undefined;

  function pick(value: number) {
    if (!current) return;
    setAnswers((a) => ({ ...a, [String(current.pos)]: value }));
  }

  function next() {
    if (step < total - 1) setStep((s) => s + 1);
    else onComplete(answers);
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  const progress = Math.round(((step + (currentAnswer !== undefined ? 1 : 0)) / total) * 100);
  const isLast = step === total - 1;

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
        {current && (
          <motion.div
            key={`q-${current.pos}`}
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
              {current.stem}
            </h2>

            {/* Escala 1-5 (patrón DailyPulseCard / PreSeiWizard) */}
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
            <div className="flex justify-between text-xs text-[var(--rowi-muted-weak)] px-1 mb-8">
              <span>{t("preSei.scale.low", "Casi nunca")}</span>
              <span>{t("preSei.scale.high", "Casi siempre")}</span>
            </div>

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
                disabled={currentAnswer === undefined || submitting}
                className="rowi-btn-primary disabled:opacity-40"
              >
                {isLast
                  ? submitting
                    ? "…"
                    : t("preSei.seeResult", "Ver mi resultado")
                  : t("preSei.next", "Siguiente")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
