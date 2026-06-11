"use client";

/**
 * /demo/today — el LOOP DIARIO completo, jugable sin cuenta (Rowi Launch 1.0).
 *
 * El visitante VIVE el corazón del producto en 60 segundos: intención de
 * mañana → práctica → reflexión de noche → recompensa visible → el huevo
 * eclosiona. Todo es estado local (datos de ejemplo, cero APIs): la página
 * es una maqueta funcional del flujo real de /today.
 */
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Target, Moon, Check, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { RowiStageImage } from "@/domains/avatar/components/RowiStageImage";

export default function DemoTodayPage() {
  const { t } = useI18n();
  const [mood, setMood] = useState("");
  const [moodSaved, setMoodSaved] = useState(false);
  const [practiceDone, setPracticeDone] = useState(false);
  const [reflection, setReflection] = useState("");
  const [closed, setClosed] = useState(false);

  const loopComplete = moodSaved && practiceDone && closed;

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Marco honesto: es una demo */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/demo" className="text-sm text-[var(--rowi-muted)] inline-flex items-center gap-1 hover:text-[var(--rowi-fg)]">
            <ArrowLeft className="w-4 h-4" /> {t("demo.backToTour", "Volver al tour")}
          </Link>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
            {t("demo.sampleData", "Demo con datos de ejemplo")}
          </span>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t("demo.today.title", "Así se vive un día en Rowi")}
          </h1>
          <p className="text-sm text-[var(--rowi-muted)] mt-1">
            {t("demo.today.subtitle", "Completa el loop — mañana, práctica y noche — y mira qué pasa.")}
          </p>
        </div>

        {/* ─── MAÑANA ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("demo.today.morning", "¿Quién quieres ser hoy?")}
            </h2>
          </div>
          {moodSaved ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <Check className="w-4 h-4 inline text-emerald-500 mr-1" />
              <span className="font-medium">“{mood}”</span>
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder={t("demo.today.morningPlaceholder", "En una palabra: paciente, presente, valiente…")}
                aria-label={t("demo.today.morning", "¿Quién quieres ser hoy?")}
                className="flex-1 rounded-xl border border-[var(--rowi-card-border)] bg-transparent px-4 py-2.5 text-sm"
              />
              <button
                onClick={() => mood.trim() && setMoodSaved(true)}
                disabled={!mood.trim()}
                className="rowi-btn-primary px-4 py-2 text-sm disabled:opacity-40"
              >
                {t("demo.today.save", "Guardar")}
              </button>
            </div>
          )}
        </motion.section>

        {/* ─── PRÁCTICA ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-violet-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("today.practice.title", "Tu práctica de hoy")}
            </h2>
          </div>
          <p className="text-xs text-[var(--rowi-muted)] mb-2">
            {t("today.practice.one", "Una sola cosa. No cinco. Una.")}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
            {t("demo.today.practiceText", "Antes de tu próxima conversación, respira tres veces y nómbrate en silencio la emoción con la que llegas.")}
          </p>
          <button
            onClick={() => setPracticeDone(true)}
            disabled={practiceDone}
            className={practiceDone ? "px-4 py-2 text-sm rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium" : "rowi-btn-primary px-4 py-2 text-sm"}
          >
            {practiceDone
              ? t("today.practice.done", "Hecho")
              : t("today.practice.markdone", "Marcar como hecho")}
          </button>
        </motion.section>

        {/* ─── NOCHE ─── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("demo.today.evening", "Cierra tu día")}
            </h2>
          </div>
          {closed ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">“{reflection}”</p>
          ) : (
            <div className="space-y-3">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={t("demo.today.eveningPlaceholder", "Una frase sobre tu día basta…")}
                aria-label={t("demo.today.evening", "Cierra tu día")}
                rows={2}
                className="w-full rounded-xl border border-[var(--rowi-card-border)] bg-transparent px-4 py-2.5 text-sm"
              />
              <button
                onClick={() => reflection.trim() && setClosed(true)}
                disabled={!reflection.trim()}
                className="rowi-btn-primary px-4 py-2 text-sm disabled:opacity-40"
              >
                {t("demo.today.close", "Cerrar el día")}
              </button>
            </div>
          )}
        </motion.section>

        {/* ─── LA RECOMPENSA (el momento que vende el producto) ─── */}
        <AnimatePresence>
          {closed && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 text-white p-4 flex items-center gap-3"
              >
                <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">
                  {t("today.reward.points", "+{points} puntos").replace("{points}", "15")}
                  {" · "}
                  {t("today.reward.streak", "racha de {days} días").replace("{days}", "3")}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-6 text-center"
              >
                <div className="flex justify-center mb-3">
                  <RowiStageImage stage={loopComplete ? "HATCHING" : "EGG"} size="lg" float alt="Rowi" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {t("today.evolved.hatched", "¡Tu Rowi ha nacido! 🐣")}
                </p>
                <p className="text-sm text-[var(--rowi-muted)] mt-1 max-w-sm mx-auto">
                  {t("demo.today.evolvedNote", "Cada día que cierras, tu Rowi crece contigo. Tu historia completa vive en Mi evolución.")}
                </p>
                <Link
                  href="/demo/becoming"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm text-[var(--rowi-primary,#7c3aed)] font-medium hover:underline"
                >
                  {t("demo.today.seeBecoming", "Ver la memoria viva")} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center pt-2"
              >
                <Link href="/register" className="rowi-btn-primary px-8 py-3 text-base inline-block">
                  {t("demo.today.cta", "Empezar mi historia real")}
                </Link>
                <p className="text-[11px] text-[var(--rowi-muted)] mt-2">
                  🔒 {t("privacy.contextNote", "Privado: solo tú lo ves. Tu organización solo ve agregados anónimos (mínimo 5 personas).")}
                </p>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Cadena del tour: cada demo lleva al siguiente módulo */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between pt-8 border-t border-[var(--rowi-card-border)]">
          <Link
            href="/pre-sei"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-card-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("demo.today.prev", "Anterior: El Espejo")}
          </Link>
          <Link
            href="/demo/becoming"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t("demo.today.nextModule", "Siguiente: Mi evolución")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
