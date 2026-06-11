"use client";

/**
 * /demo/becoming — la MEMORIA VIVA con datos de ejemplo (Rowi Launch 1.0).
 * Maqueta del /becoming real (70% memoria · 30% acción): avatar + señales +
 * timeline de reflexiones e hitos + contraste honesto. Sin APIs.
 */
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Flame,
  Award,
  Quote,
  Sparkles,
  TrendingUp,
  Minus,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { RowiStageImage } from "@/domains/avatar/components/RowiStageImage";

export default function DemoBecomingPage() {
  const { t } = useI18n();

  const timeline = [
    {
      day: t("demo.becoming.t1.day", "Hoy"),
      mood: t("demo.becoming.t1.mood", "presente"),
      quote: t("demo.becoming.t1.quote", "Hoy escuché de verdad en la reunión, sin preparar mi respuesta mientras el otro hablaba."),
    },
    {
      day: t("demo.becoming.t2.day", "Ayer"),
      mood: t("demo.becoming.t2.mood", "paciente"),
      quote: t("demo.becoming.t2.quote", "Casi contesto el mensaje en caliente. Respiré, esperé una hora, y la conversación salió distinta."),
      milestone: t("demo.becoming.t2.milestone", "🐣 Tu Rowi nació"),
    },
    {
      day: t("demo.becoming.t3.day", "Hace 3 días"),
      mood: t("demo.becoming.t3.mood", "valiente"),
      quote: t("demo.becoming.t3.quote", "Dije lo que pensaba en la cena familiar. Tembló la voz, pero lo dije con cariño."),
    },
  ];

  const contrast = [
    { sei: "NE", trendUp: true },
    { sei: "EMP", trendUp: true },
    { sei: "OP", trendUp: false },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-gradient-to-br from-violet-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/demo" className="text-sm text-[var(--rowi-muted)] inline-flex items-center gap-1 hover:text-[var(--rowi-fg)]">
            <ArrowLeft className="w-4 h-4" /> {t("demo.backToTour", "Volver al tour")}
          </Link>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
            {t("demo.sampleData", "Demo con datos de ejemplo")}
          </span>
        </div>

        {/* 70% MEMORIA: el avatar como cara del viaje */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-xs uppercase tracking-wide text-violet-500 font-semibold mb-1">
            {t("becoming.title", "Mi evolución")}
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t("becoming.heroQuestion", "¿En quién te estás convirtiendo?")}
          </h1>
          <div className="flex justify-center mb-3">
            <RowiStageImage stage="YOUNG" size="xl" float alt="Rowi" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            🦉 {t("demo.becoming.stageName", "Joven")}
          </p>
          <div className="max-w-xs mx-auto mt-4">
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span>{t("becoming.progress.label", "Hacia tu siguiente etapa")}</span>
              <span>62%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: "62%" }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </motion.section>

        {/* Señales de la historia */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: CalendarDays, n: 23, label: t("becoming.signals.days", "días contigo") },
            { icon: Flame, n: 17, label: t("becoming.signals.active", "días con registro") },
            { icon: Award, n: 480, label: t("becoming.signals.xp", "experiencia") },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm py-4 text-center">
                <Icon className="w-5 h-5 text-violet-500 mx-auto mb-1.5" />
                <div className="text-xl font-bold text-gray-900 dark:text-white">{m.n}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{m.label}</div>
              </div>
            );
          })}
        </motion.section>

        {/* La memoria viva */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
            {t("becoming.timeline.title", "Tu memoria viva")}
          </h2>
          <div className="space-y-4">
            {timeline.map((e, i) => (
              <div key={i} className="border-l-2 border-violet-200 dark:border-violet-800 pl-4">
                <p className="text-[11px] text-gray-400 mb-0.5">{e.day}</p>
                {e.milestone && (
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-300 mb-1">{e.milestone}</p>
                )}
                <p className="text-xs text-[var(--rowi-muted)] mb-1">
                  {t("becoming.timeline.mood", "Llegaste sintiendo")}{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">{e.mood}</span>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 flex gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-violet-400 mt-1 shrink-0" />
                  <span className="italic">{e.quote}</span>
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* 30% ACCIÓN: contraste honesto */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-5"
        >
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            {t("becoming.contrastSection", "Tu contraste honesto")}
          </h2>
          <p className="text-xs text-[var(--rowi-muted)] mb-4">
            {t("demo.becoming.contrastHint", "Tú de hace 30 días vs. tú de hoy. Niveles, no puntajes.")}
          </p>
          <div className="space-y-3">
            {contrast.map((row) => (
              <div key={row.sei} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">
                  {t(`competencies.${row.sei}`, row.sei)}
                </span>
                {row.trendUp ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" /> {t("demo.becoming.up", "Subiendo")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                    <Minus className="w-4 h-4" /> {t("demo.becoming.flat", "Estable")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        <div className="text-center pt-2">
          <Link href="/register" className="rowi-btn-primary px-8 py-3 text-base inline-block">
            {t("demo.becoming.cta", "Empezar a escribir mi historia")}
          </Link>
          <p className="text-[11px] text-[var(--rowi-muted)] mt-2">
            🔒 {t("privacy.contextNote", "Privado: solo tú lo ves. Tu organización solo ve agregados anónimos (mínimo 5 personas).")}
          </p>
        </div>

        {/* Cadena del tour: cada demo lleva al siguiente módulo */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between pt-8 border-t border-[var(--rowi-card-border)]">
          <Link
            href="/demo/today"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-card-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("demo.becoming.prev", "Anterior: TODAY")}
          </Link>
          <Link
            href="/demo/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t("demo.becoming.nextModule", "Siguiente: Mírate")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
