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

/* ---- i18n: diccionario inline (es / en / zh) ----
   "Rowi", "Six Seconds", "SEI", "ECO" son marcas y no se traducen. */
const TR: Record<string, Record<string, string>> = {
  es: {
    backToTour: "Volver al tour",
    sampleData: "Demo con datos de ejemplo",
    title: "Así se vive un día en Rowi",
    subtitle: "Completa el loop — mañana, práctica y noche — y mira qué pasa.",
    morning: "¿Quién quieres ser hoy?",
    morningPlaceholder: "En una palabra: paciente, presente, valiente…",
    save: "Guardar",
    practiceTitle: "Tu práctica de hoy",
    practiceOne: "Una sola cosa. No cinco. Una.",
    practiceText:
      "Antes de tu próxima conversación, respira tres veces y nómbrate en silencio la emoción con la que llegas.",
    practiceDoneLabel: "Hecho",
    practiceMarkDone: "Marcar como hecho",
    evening: "Cierra tu día",
    eveningPlaceholder: "Una frase sobre tu día basta…",
    close: "Cerrar el día",
    rewardPoints: "+15 puntos",
    rewardStreak: "racha de 3 días",
    hatched: "¡Tu Rowi ha nacido! 🐣",
    evolvedNote:
      "Cada día que cierras, tu Rowi crece contigo. Tu historia completa vive en Mi evolución.",
    seeBecoming: "Ver la memoria viva",
    cta: "Empezar mi historia real",
    privacyNote:
      "Privado: solo tú lo ves. Tu organización solo ve agregados anónimos (mínimo 5 personas).",
    prev: "Anterior: El Espejo",
    nextModule: "Siguiente: Mi evolución",
  },
  en: {
    backToTour: "Back to the tour",
    sampleData: "Demo with sample data",
    title: "This is what a day in Rowi feels like",
    subtitle: "Complete the loop — morning, practice and night — and see what happens.",
    morning: "Who do you want to be today?",
    morningPlaceholder: "In one word: patient, present, brave…",
    save: "Save",
    practiceTitle: "Your practice for today",
    practiceOne: "Just one thing. Not five. One.",
    practiceText:
      "Before your next conversation, take three breaths and silently name the emotion you arrive with.",
    practiceDoneLabel: "Done",
    practiceMarkDone: "Mark as done",
    evening: "Close your day",
    eveningPlaceholder: "One sentence about your day is enough…",
    close: "Close the day",
    rewardPoints: "+15 points",
    rewardStreak: "3-day streak",
    hatched: "Your Rowi has been born! 🐣",
    evolvedNote:
      "Every day you close, your Rowi grows with you. Your full story lives in My evolution.",
    seeBecoming: "See the living memory",
    cta: "Start my real story",
    privacyNote:
      "Private: only you can see it. Your organization only sees anonymous aggregates (minimum 5 people).",
    prev: "Previous: The Mirror",
    nextModule: "Next: My evolution",
  },
  zh: {
    backToTour: "返回导览",
    sampleData: "示例数据演示",
    title: "在 Rowi 度过的一天是这样的",
    subtitle: "完成这个循环——早晨、练习和夜晚——看看会发生什么。",
    morning: "今天你想成为谁？",
    morningPlaceholder: "用一个词：耐心、专注、勇敢……",
    save: "保存",
    practiceTitle: "你今天的练习",
    practiceOne: "只做一件事。不是五件。一件。",
    practiceText:
      "在你的下一次对话之前，深呼吸三次，并在心中默默说出你此刻带来的情绪。",
    practiceDoneLabel: "已完成",
    practiceMarkDone: "标记为已完成",
    evening: "结束你的一天",
    eveningPlaceholder: "一句话总结你的一天就够了……",
    close: "结束这一天",
    rewardPoints: "+15 积分",
    rewardStreak: "连续 3 天",
    hatched: "你的 Rowi 已经诞生啦！🐣",
    evolvedNote:
      "你每结束一天，你的 Rowi 都会与你一起成长。你的完整故事都在“我的进化”中。",
    seeBecoming: "查看活的记忆",
    cta: "开始我真实的故事",
    privacyNote:
      "私密：只有你能看到。你的组织只能看到匿名汇总数据（至少 5 人）。",
    prev: "上一步：镜子",
    nextModule: "下一步：我的进化",
  },
};

export default function DemoTodayPage() {
  const { lang } = useI18n();
  const tr = TR[lang] || TR.es;
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
            <ArrowLeft className="w-4 h-4" /> {tr.backToTour}
          </Link>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
            {tr.sampleData}
          </span>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {tr.title}
          </h1>
          <p className="text-sm text-[var(--rowi-muted)] mt-1">
            {tr.subtitle}
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
              {tr.morning}
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
                placeholder={tr.morningPlaceholder}
                aria-label={tr.morning}
                className="flex-1 rounded-xl border border-[var(--rowi-card-border)] bg-transparent px-4 py-2.5 text-sm"
              />
              <button
                onClick={() => mood.trim() && setMoodSaved(true)}
                disabled={!mood.trim()}
                className="rowi-btn-primary px-4 py-2 text-sm disabled:opacity-40"
              >
                {tr.save}
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
              {tr.practiceTitle}
            </h2>
          </div>
          <p className="text-xs text-[var(--rowi-muted)] mb-2">
            {tr.practiceOne}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-200 mb-4">
            {tr.practiceText}
          </p>
          <button
            onClick={() => setPracticeDone(true)}
            disabled={practiceDone}
            className={practiceDone ? "px-4 py-2 text-sm rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium" : "rowi-btn-primary px-4 py-2 text-sm"}
          >
            {practiceDone ? tr.practiceDoneLabel : tr.practiceMarkDone}
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
              {tr.evening}
            </h2>
          </div>
          {closed ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">“{reflection}”</p>
          ) : (
            <div className="space-y-3">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={tr.eveningPlaceholder}
                aria-label={tr.evening}
                rows={2}
                className="w-full rounded-xl border border-[var(--rowi-card-border)] bg-transparent px-4 py-2.5 text-sm"
              />
              <button
                onClick={() => reflection.trim() && setClosed(true)}
                disabled={!reflection.trim()}
                className="rowi-btn-primary px-4 py-2 text-sm disabled:opacity-40"
              >
                {tr.close}
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
                  {tr.rewardPoints}
                  {" · "}
                  {tr.rewardStreak}
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
                  {tr.hatched}
                </p>
                <p className="text-sm text-[var(--rowi-muted)] mt-1 max-w-sm mx-auto">
                  {tr.evolvedNote}
                </p>
                <Link
                  href="/demo/becoming"
                  className="inline-flex items-center gap-1.5 mt-4 text-sm text-[var(--rowi-primary,#7c3aed)] font-medium hover:underline"
                >
                  {tr.seeBecoming} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center pt-2"
              >
                <Link href="/register" className="rowi-btn-primary px-8 py-3 text-base inline-block">
                  {tr.cta}
                </Link>
                <p className="text-[11px] text-[var(--rowi-muted)] mt-2">
                  🔒 {tr.privacyNote}
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
            {tr.prev}
          </Link>
          <Link
            href="/demo/becoming"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {tr.nextModule}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
