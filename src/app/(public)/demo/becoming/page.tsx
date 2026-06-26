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

/* ---- i18n inline (ES / EN / zh) ---- */
const TR: Record<string, Record<string, string>> = {
  es: {
    backToTour: "Volver al tour",
    sampleData: "Demo con datos de ejemplo",
    evolutionLabel: "Mi evolución",
    heroQuestion: "¿En quién te estás convirtiendo?",
    stageName: "Joven",
    progressLabel: "Hacia tu siguiente etapa",
    signalsDays: "días contigo",
    signalsActive: "días con registro",
    signalsXp: "experiencia",
    timelineTitle: "Tu memoria viva",
    timelineMood: "Llegaste sintiendo",
    contrastSection: "Tu contraste honesto",
    contrastHint: "Tú de hace 30 días vs. tú de hoy. Niveles, no puntajes.",
    up: "Subiendo",
    flat: "Estable",
    cta: "Empezar a escribir mi historia",
    privacyNote:
      "Privado: solo tú lo ves. Tu organización solo ve agregados anónimos (mínimo 5 personas).",
    prev: "Anterior: TODAY",
    nextModule: "Siguiente: Mírate",
    t1Day: "Hoy",
    t1Mood: "presente",
    t1Quote:
      "Hoy escuché de verdad en la reunión, sin preparar mi respuesta mientras el otro hablaba.",
    t2Day: "Ayer",
    t2Mood: "paciente",
    t2Quote:
      "Casi contesto el mensaje en caliente. Respiré, esperé una hora, y la conversación salió distinta.",
    t2Milestone: "🐣 Tu Rowi nació",
    t3Day: "Hace 3 días",
    t3Mood: "valiente",
    t3Quote:
      "Dije lo que pensaba en la cena familiar. Tembló la voz, pero lo dije con cariño.",
  },
  en: {
    backToTour: "Back to the tour",
    sampleData: "Demo with sample data",
    evolutionLabel: "My evolution",
    heroQuestion: "Who are you becoming?",
    stageName: "Young",
    progressLabel: "Toward your next stage",
    signalsDays: "days with you",
    signalsActive: "days with an entry",
    signalsXp: "experience",
    timelineTitle: "Your living memory",
    timelineMood: "You arrived feeling",
    contrastSection: "Your honest contrast",
    contrastHint: "You 30 days ago vs. you today. Levels, not scores.",
    up: "Rising",
    flat: "Steady",
    cta: "Start writing my story",
    privacyNote:
      "Private: only you can see it. Your organization only sees anonymous aggregates (minimum 5 people).",
    prev: "Previous: TODAY",
    nextModule: "Next: See yourself",
    t1Day: "Today",
    t1Mood: "present",
    t1Quote:
      "Today I truly listened in the meeting, without preparing my reply while the other person was talking.",
    t2Day: "Yesterday",
    t2Mood: "patient",
    t2Quote:
      "I almost fired back a message in the heat of the moment. I breathed, waited an hour, and the conversation turned out differently.",
    t2Milestone: "🐣 Your Rowi was born",
    t3Day: "3 days ago",
    t3Mood: "brave",
    t3Quote:
      "I said what I thought at the family dinner. My voice shook, but I said it with care.",
  },
  zh: {
    backToTour: "返回导览",
    sampleData: "示例数据演示",
    evolutionLabel: "我的成长",
    heroQuestion: "你正在成为怎样的人？",
    stageName: "少年",
    progressLabel: "迈向下一个阶段",
    signalsDays: "与你相伴的天数",
    signalsActive: "有记录的天数",
    signalsXp: "经验值",
    timelineTitle: "你鲜活的记忆",
    timelineMood: "你到来时的感受",
    contrastSection: "你诚实的对照",
    contrastHint: "30 天前的你 vs. 今天的你。看的是层级，而非分数。",
    up: "上升中",
    flat: "稳定",
    cta: "开始书写我的故事",
    privacyNote:
      "私密：只有你能看到。你的组织只能看到匿名的汇总数据（至少 5 人）。",
    prev: "上一个：TODAY",
    nextModule: "下一个：看见自己",
    t1Day: "今天",
    t1Mood: "专注当下",
    t1Quote:
      "今天在会议上我真正地倾听了，没有在对方说话时就急着准备自己的回答。",
    t2Day: "昨天",
    t2Mood: "耐心",
    t2Quote:
      "我差点就冲动地回了那条消息。我深吸一口气，等了一个小时，结果这场对话变得不一样了。",
    t2Milestone: "🐣 你的 Rowi 诞生了",
    t3Day: "3 天前",
    t3Mood: "勇敢",
    t3Quote:
      "在家庭晚餐上我说出了自己的想法。声音在颤抖，但我满怀爱意地说了出来。",
  },
};

export default function DemoBecomingPage() {
  const { lang } = useI18n();
  const tr = TR[lang] || TR.es;

  const timeline = [
    {
      day: tr.t1Day,
      mood: tr.t1Mood,
      quote: tr.t1Quote,
    },
    {
      day: tr.t2Day,
      mood: tr.t2Mood,
      quote: tr.t2Quote,
      milestone: tr.t2Milestone,
    },
    {
      day: tr.t3Day,
      mood: tr.t3Mood,
      quote: tr.t3Quote,
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
            <ArrowLeft className="w-4 h-4" /> {tr.backToTour}
          </Link>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
            {tr.sampleData}
          </span>
        </div>

        {/* 70% MEMORIA: el avatar como cara del viaje */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-xs uppercase tracking-wide text-violet-500 font-semibold mb-1">
            {tr.evolutionLabel}
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {tr.heroQuestion}
          </h1>
          <div className="flex justify-center mb-3">
            <RowiStageImage stage="YOUNG" size="xl" float alt="Rowi" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            🦉 {tr.stageName}
          </p>
          <div className="max-w-xs mx-auto mt-4">
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span>{tr.progressLabel}</span>
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
            { icon: CalendarDays, n: 23, label: tr.signalsDays },
            { icon: Flame, n: 17, label: tr.signalsActive },
            { icon: Award, n: 480, label: tr.signalsXp },
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
            {tr.timelineTitle}
          </h2>
          <div className="space-y-4">
            {timeline.map((e, i) => (
              <div key={i} className="border-l-2 border-violet-200 dark:border-violet-800 pl-4">
                <p className="text-[11px] text-gray-400 mb-0.5">{e.day}</p>
                {e.milestone && (
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-300 mb-1">{e.milestone}</p>
                )}
                <p className="text-xs text-[var(--rowi-muted)] mb-1">
                  {tr.timelineMood}{" "}
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
            {tr.contrastSection}
          </h2>
          <p className="text-xs text-[var(--rowi-muted)] mb-4">
            {tr.contrastHint}
          </p>
          <div className="space-y-3">
            {contrast.map((row) => (
              <div key={row.sei} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 truncate">
                  {row.sei}
                </span>
                {row.trendUp ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" /> {tr.up}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                    <Minus className="w-4 h-4" /> {tr.flat}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        <div className="text-center pt-2">
          <Link href="/register" className="rowi-btn-primary px-8 py-3 text-base inline-block">
            {tr.cta}
          </Link>
          <p className="text-[11px] text-[var(--rowi-muted)] mt-2">
            🔒 {tr.privacyNote}
          </p>
        </div>

        {/* Cadena del tour: cada demo lleva al siguiente módulo */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between pt-8 border-t border-[var(--rowi-card-border)]">
          <Link
            href="/demo/today"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-card-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {tr.prev}
          </Link>
          <Link
            href="/demo/dashboard"
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
