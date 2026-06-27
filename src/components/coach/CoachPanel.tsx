"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Send,
  Sparkles,
  Brain,
  Heart,
  Target,
  Compass,
  BookOpen,
  Lightbulb,
  ArrowRight,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type TFn = (key: string, fallback?: string) => string;

/* =========================================================
   🎯 Función para generar insights basados en el perfil
   Umbrales SEI:
   - Experto: >= 125
   - Diestro: 115-124
   - Funcional: 100-114
   - Emergente: 85-99
   - Desafío: < 85
   Las competencias EL, RP, ACT, NE, IM, OP, EMP, NG resuelven su
   texto vía el sistema central t() bajo la familia "coachPanel.insight*".
========================================================= */
const INSIGHT_FALLBACKS = {
  strengths: {
    EL: "Tu alfabetización emocional es excepcional. Usas un vocabulario rico para describir tus emociones.",
    RP: "Reconoces patrones emocionales con claridad. Esto te ayuda a anticipar tus reacciones.",
    ACT: "Tu pensamiento consecuente es sólido. Evalúas bien las consecuencias de tus decisiones.",
    NE: "Navegas tus emociones con habilidad. Sabes regularlas sin reprimirlas.",
    IM: "Tu motivación intrínseca es fuerte. Te mueves por valores, no solo por recompensas externas.",
    OP: "Ejerces el optimismo de forma realista. Ves posibilidades donde otros ven obstáculos.",
    EMP: "Tu empatía es notable. Conectas genuinamente con las emociones de los demás.",
    NG: "Persigues metas nobles que trascienden lo personal. Esto da propósito a tus acciones.",
  },
  opportunities: {
    EL: "Amplía tu vocabulario emocional. Intenta nombrar 3 emociones diferentes cada día.",
    RP: "Observa qué situaciones disparan tus reacciones automáticas. Lleva un diario breve.",
    ACT: "Antes de decidir, pregúntate: ¿Cómo me sentiré mañana con esta decisión?",
    NE: "Practica la técnica 6-segundos: respira antes de reaccionar emocionalmente.",
    IM: "Conecta tus tareas diarias con tus valores. ¿Por qué importa lo que haces?",
    OP: "Busca 3 cosas positivas al final de cada día, por pequeñas que sean.",
    EMP: "Practica la escucha activa: repite lo que el otro dice antes de responder.",
    NG: "Define un propósito que beneficie a otros, no solo a ti. ¿Qué legado quieres dejar?",
  },
  practices: {
    EL: "Nombra 3 emociones que sientas hoy con precisión.",
    RP: "Identifica un patrón emocional que se repitió esta semana.",
    ACT: "Antes de tu próxima decisión, visualiza 3 posibles consecuencias.",
    NE: "Cuando sientas tensión, haz 6 respiraciones lentas.",
    IM: "Conecta una tarea de hoy con un valor importante para ti.",
    OP: "Escribe 3 cosas por las que estás agradecido hoy.",
    EMP: "En tu próxima conversación, enfócate solo en escuchar sin juzgar.",
    NG: "Haz algo pequeño hoy que beneficie a alguien más.",
  },
} as const;

type InsightCategory = keyof typeof INSIGHT_FALLBACKS;
type CompetencyKey = keyof (typeof INSIGHT_FALLBACKS)["strengths"];

function insightText(t: TFn, category: InsightCategory, key: string): string | undefined {
  const fallbacks = INSIGHT_FALLBACKS[category] as Record<string, string>;
  const fallback = fallbacks[key];
  if (!fallback) return undefined;
  return t(`coachPanel.insight.${category}.${key}`, fallback);
}

function generateInsights(profile: any, t: TFn) {
  const competencias = profile?.eq?.competencias || {};

  const strengths: { key: string; text: string; score: number }[] = [];
  const opportunities: { key: string; text: string; score: number }[] = [];
  const practices: string[] = [];

  // Analizar cada competencia
  Object.entries(competencias).forEach(([key, value]) => {
    const score = value as number;
    if (typeof score !== "number" || score === 0) return;

    // Fortalezas: Diestro o Experto (>= 115)
    if (score >= 115) {
      const text = insightText(t, "strengths", key);
      if (text) strengths.push({ key, text, score });
    }

    // Oportunidades: Emergente o Desafío (< 100)
    if (score < 100) {
      const text = insightText(t, "opportunities", key);
      if (text) opportunities.push({ key, text, score });
    }

    // Agregar práctica para todas las competencias (siempre hay algo que practicar)
    const practice = insightText(t, "practices", key);
    if (practice) practices.push(practice);
  });

  // Ordenar por score
  strengths.sort((a, b) => b.score - a.score);
  opportunities.sort((a, b) => a.score - b.score);

  // Si no hay fortalezas con >= 115, tomar las mejores competencias
  if (strengths.length === 0) {
    const sorted = Object.entries(competencias)
      .filter(([_, v]) => typeof v === "number" && v > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number));

    sorted.slice(0, 2).forEach(([key, value]) => {
      const text = insightText(t, "strengths", key);
      if (text) {
        strengths.push({ key, text, score: value as number });
      }
    });
  }

  return {
    strengths: strengths.slice(0, 3),
    opportunities: opportunities.slice(0, 3),
    practices: practices.slice(0, 3),
  };
}

const PURSUIT_COLORS = {
  know: { bg: "from-blue-500 to-cyan-500", icon: Brain, color: "#1E88E5" },
  choose: { bg: "from-red-500 to-orange-500", icon: Heart, color: "#E53935" },
  give: { bg: "from-green-500 to-emerald-500", icon: Target, color: "#43A047" },
};

const PURSUITS = {
  know: {
    titleKey: "coachPanel.know.title",
    titleFallback: "Conocerte",
    descKey: "coachPanel.know.desc",
    descFallback: "Aumenta tu autoconciencia emocional",
    skills: [
      { key: "coachPanel.know.skill1", fallback: "Alfabetización Emocional" },
      { key: "coachPanel.know.skill2", fallback: "Reconocer Patrones" },
    ],
  },
  choose: {
    titleKey: "coachPanel.choose.title",
    titleFallback: "Elegirte",
    descKey: "coachPanel.choose.desc",
    descFallback: "Toma decisiones intencionales",
    skills: [
      { key: "coachPanel.choose.skill1", fallback: "Pensamiento Consecuente" },
      { key: "coachPanel.choose.skill2", fallback: "Navegar Emociones" },
      { key: "coachPanel.choose.skill3", fallback: "Motivación Intrínseca" },
    ],
  },
  give: {
    titleKey: "coachPanel.give.title",
    titleFallback: "Entregarte",
    descKey: "coachPanel.give.desc",
    descFallback: "Conecta con un propósito mayor",
    skills: [
      { key: "coachPanel.give.skill1", fallback: "Ejercer Optimismo" },
      { key: "coachPanel.give.skill2", fallback: "Aumentar Empatía" },
      { key: "coachPanel.give.skill3", fallback: "Metas Nobles" },
    ],
  },
} as const;

type Props = {
  profile?: any;
  compact?: boolean;
  insights?: any; // Allow passing insights directly
};

export default function CoachPanel({ profile, compact = false, insights: passedInsights }: Props) {
  const { lang, t } = useI18n();

  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  // Generar insights basados en el perfil (sin IA)
  const insights = useMemo(() => {
    if (!profile?.eq?.competencias) return null;
    return generateInsights(profile, t);
  }, [profile, t]);

  const hasSeiData = profile?.eq?.total && profile.eq.total > 0;

  async function ask(prompt: string) {
    if (!prompt.trim()) return;

    setThinking(true);
    setResponse(null);

    try {
      const r = await fetch("/api/rowi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "eq",
          ask: prompt,
          locale: lang,
        }),
      });

      const data = await r.json();
      setResponse(
        data.text ||
          t("coachPanel.noResponse", "No pude obtener una respuesta.")
      );
    } catch {
      setResponse(t("coachPanel.queryError", "Error al procesar la consulta."));
    }

    setThinking(false);
    setQuestion("");
  }

  if (compact) {
    return (
      <CompactView
        t={t}
        insights={insights}
        hasSeiData={hasSeiData}
        question={question}
        setQuestion={setQuestion}
        thinking={thinking}
        response={response}
        ask={ask}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Six Seconds Model */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("coachPanel.modelTitle", "El Modelo Six Seconds")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t(
                "coachPanel.modelDesc",
                "La inteligencia emocional se desarrolla a través de 3 propósitos fundamentales"
              )}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {(["know", "choose", "give"] as const).map((key, index) => {
            const pursuit = PURSUITS[key];
            const { bg, icon: Icon, color } = PURSUIT_COLORS[key];

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${bg} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {t(pursuit.titleKey, pursuit.titleFallback)}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {t(pursuit.descKey, pursuit.descFallback)}
                </p>
                <ul className="space-y-1">
                  {pursuit.skills.map((skill, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {t(skill.key, skill.fallback)}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Personal Insights (Pre-programados basados en SEI) */}
      {hasSeiData && insights ? (
        <div className="space-y-4">
          {/* Fortalezas */}
          {insights.strengths.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  {t("coachPanel.strengths", "Tus fortalezas")}
                </h3>
              </div>
              <ul className="space-y-3">
                {insights.strengths.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-green-700 dark:text-green-300"
                  >
                    <Award className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Oportunidades */}
          {insights.opportunities.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                  {t("coachPanel.opportunities", "Áreas de oportunidad")}
                </h3>
              </div>
              <ul className="space-y-3">
                {insights.opportunities.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-amber-700 dark:text-amber-300"
                  >
                    <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Práctica del día */}
          {insights.practices.length > 0 && (
            <div className="bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 rounded-2xl border border-[var(--rowi-g2)]/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[var(--rowi-g2)]" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t("coachPanel.dailyPractice", "Práctica del día")}
                </h3>
              </div>
              <ul className="space-y-3">
                {insights.practices.map((practice, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Target className="w-4 h-4 text-[var(--rowi-g2)] mt-0.5 shrink-0" />
                    <span>{practice}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* No tiene SEI */
        <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t(
              "coachPanel.noSei",
              "Completa tu evaluación SEI para recibir insights personalizados"
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              // Lleva a /sei: el usuario elige idioma y desde ahí abre el SEI
              // real (la página maneja el caso de plan sin SEI → upgrade).
              window.location.href = "/sei";
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            {t("coachPanel.takeSeiNow", "Tomar evaluación SEI")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-3">
        <Link
          href="/learning"
          className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors group"
        >
          <BookOpen className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[var(--rowi-g2)]">
            {t("coachPanel.learnMore", "Aprender más")}
          </span>
          <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[var(--rowi-g2)]" />
        </Link>

        <Link
          href="/sei"
          className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors group text-left w-full"
        >
          <Target className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[var(--rowi-g2)]">
            {t("coachPanel.takeAssessment", "Tomar SEI")}
          </span>
          <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[var(--rowi-g2)]" />
        </Link>

        <Link
          href="/dashboard#competencies"
          className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors group"
        >
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[var(--rowi-g2)]">
            {t("coachPanel.exploreCompetencies", "Ver competencias")}
          </span>
          <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[var(--rowi-g2)]" />
        </Link>
      </div>

      {/* Ask Rowi (solo para preguntas específicas) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Image
            src="/rowivectors/Rowi-06.webp"
            alt="Rowi"
            width={40}
            height={40}
            className="object-contain"
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t("coachPanel.askRowi", "Pregunta a Rowi")}
            </h3>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t(
              "coachPanel.askPlaceholder",
              "Pregunta sobre inteligencia emocional..."
            )}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(question)}
            disabled={thinking}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 border-0 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none disabled:opacity-50"
          />
          <button
            onClick={() => ask(question)}
            disabled={thinking || !question.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t("coachPanel.askButton", "Preguntar")}
          </button>
        </div>

        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line"
            >
              {response}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* =========================================================
   🔹 Vista Compacta (para el dashboard)
========================================================= */
function CompactView({
  t,
  insights,
  hasSeiData,
  question,
  setQuestion,
  thinking,
  response,
  ask,
}: {
  t: TFn;
  insights: ReturnType<typeof generateInsights> | null;
  hasSeiData: boolean;
  question: string;
  setQuestion: (q: string) => void;
  thinking: boolean;
  response: string | null;
  ask: (q: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Insights pre-programados */}
      {hasSeiData && insights ? (
        <div className="space-y-3">
          {/* Fortaleza principal */}
          {insights.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-sm"
            >
              <Award className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-green-700 dark:text-green-300 block mb-1">
                  {t("coachPanel.strengths", "Tus fortalezas")}
                </span>
                <span className="text-green-800 dark:text-green-200">{insights.strengths[0].text}</span>
              </div>
            </motion.div>
          )}

          {/* Oportunidad principal */}
          {insights.opportunities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm"
            >
              <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 block mb-1">
                  {t("coachPanel.opportunities", "Áreas de oportunidad")}
                </span>
                <span className="text-amber-800 dark:text-amber-200">{insights.opportunities[0].text}</span>
              </div>
            </motion.div>
          )}

          {/* Práctica del día */}
          {insights.practices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 text-sm"
            >
              <Sparkles className="w-4 h-4 text-[var(--rowi-g2)] mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  {t("coachPanel.dailyPractice", "Práctica del día")}
                </span>
                <span className="text-gray-800 dark:text-gray-200">{insights.practices[0]}</span>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 text-sm text-gray-500 dark:text-gray-400 text-center">
          {t(
            "coachPanel.noSei",
            "Completa tu evaluación SEI para recibir insights personalizados"
          )}
        </div>
      )}

      {/* Input para preguntas */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t(
            "coachPanel.askPlaceholder",
            "Pregunta sobre inteligencia emocional..."
          )}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(question)}
          disabled={thinking}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)] outline-none disabled:opacity-50"
        />
        <button
          onClick={() => ask(question)}
          disabled={thinking || !question.trim()}
          className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:border-[var(--rowi-g2)] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white dark:bg-zinc-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line"
          >
            {response}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
