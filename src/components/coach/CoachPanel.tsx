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

/* =========================================================
   🌍 Traducciones principales
========================================================= */
const translations = {
  es: {
    title: "EQ Coach",
    subtitle: "Tu guía en inteligencia emocional",
    modelTitle: "El Modelo Six Seconds",
    modelDesc: "La inteligencia emocional se desarrolla a través de 3 propósitos fundamentales",

    know: {
      title: "Conocerte",
      desc: "Aumenta tu autoconciencia emocional",
      skills: ["Alfabetización Emocional", "Reconocer Patrones"],
    },
    choose: {
      title: "Elegirte",
      desc: "Toma decisiones intencionales",
      skills: ["Pensamiento Consecuente", "Navegar Emociones", "Motivación Intrínseca"],
    },
    give: {
      title: "Entregarte",
      desc: "Conecta con un propósito mayor",
      skills: ["Ejercer Optimismo", "Aumentar Empatía", "Metas Nobles"],
    },

    // Secciones
    personalInsights: "Insights personalizados",
    basedOnProfile: "Basado en tu perfil SEI",
    strengths: "Tus fortalezas",
    opportunities: "Áreas de oportunidad",
    dailyPractice: "Práctica del día",

    // Actions
    learnMore: "Aprender más",
    takeAssessment: "Tomar SEI",
    exploreCompetencies: "Ver competencias",
    askRowi: "Pregunta a Rowi",

    // Chat
    askPlaceholder: "Pregunta sobre inteligencia emocional...",
    askButton: "Preguntar",
    analyzing: "Analizando...",

    // Estados
    noSei: "Completa tu evaluación SEI para recibir insights personalizados",
    takeSeiNow: "Tomar evaluación SEI",
  },
  en: {
    title: "EQ Coach",
    subtitle: "Your emotional intelligence guide",
    modelTitle: "The Six Seconds Model",
    modelDesc: "Emotional intelligence is developed through 3 fundamental pursuits",

    know: {
      title: "Know Yourself",
      desc: "Increase your emotional self-awareness",
      skills: ["Emotional Literacy", "Recognize Patterns"],
    },
    choose: {
      title: "Choose Yourself",
      desc: "Make intentional decisions",
      skills: ["Consequential Thinking", "Navigate Emotions", "Intrinsic Motivation"],
    },
    give: {
      title: "Give Yourself",
      desc: "Connect with a greater purpose",
      skills: ["Exercise Optimism", "Increase Empathy", "Noble Goals"],
    },

    // Sections
    personalInsights: "Personal insights",
    basedOnProfile: "Based on your SEI profile",
    strengths: "Your strengths",
    opportunities: "Growth areas",
    dailyPractice: "Daily practice",

    // Actions
    learnMore: "Learn more",
    takeAssessment: "Take SEI",
    exploreCompetencies: "View competencies",
    askRowi: "Ask Rowi",

    // Chat
    askPlaceholder: "Ask about emotional intelligence...",
    askButton: "Ask",
    analyzing: "Analyzing...",

    // States
    noSei: "Complete your SEI assessment to receive personalized insights",
    takeSeiNow: "Take SEI assessment",
  },
};

/* =========================================================
   📊 Insights pre-programados por competencia
   Keys: EL, RP, ACT, NE, IM, OP, EMP, NG
========================================================= */
const COMPETENCY_INSIGHTS = {
  es: {
    // Fortalezas (score >= 115 = Diestro)
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
    // Oportunidades (score < 100 = Emergente o Desafío)
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
    // Prácticas diarias
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
  },
  en: {
    strengths: {
      EL: "Your emotional literacy is exceptional. You use a rich vocabulary to describe your emotions.",
      RP: "You recognize emotional patterns clearly. This helps you anticipate your reactions.",
      ACT: "Your consequential thinking is solid. You evaluate the consequences of your decisions well.",
      NE: "You navigate your emotions skillfully. You know how to regulate them without suppressing.",
      IM: "Your intrinsic motivation is strong. You're driven by values, not just external rewards.",
      OP: "You exercise optimism realistically. You see possibilities where others see obstacles.",
      EMP: "Your empathy is remarkable. You genuinely connect with others' emotions.",
      NG: "You pursue noble goals that transcend the personal. This gives purpose to your actions.",
    },
    opportunities: {
      EL: "Expand your emotional vocabulary. Try naming 3 different emotions each day.",
      RP: "Notice what situations trigger your automatic reactions. Keep a brief journal.",
      ACT: "Before deciding, ask yourself: How will I feel tomorrow about this decision?",
      NE: "Practice the 6-seconds technique: breathe before reacting emotionally.",
      IM: "Connect your daily tasks with your values. Why does what you do matter?",
      OP: "Look for 3 positive things at the end of each day, no matter how small.",
      EMP: "Practice active listening: repeat what the other person says before responding.",
      NG: "Define a purpose that benefits others, not just yourself. What legacy do you want to leave?",
    },
    practices: {
      EL: "Name 3 emotions you feel today with precision.",
      RP: "Identify one emotional pattern that repeated this week.",
      ACT: "Before your next decision, visualize 3 possible consequences.",
      NE: "When you feel tension, take 6 slow breaths.",
      IM: "Connect a task today with an important value to you.",
      OP: "Write 3 things you're grateful for today.",
      EMP: "In your next conversation, focus only on listening without judging.",
      NG: "Do something small today that benefits someone else.",
    },
  },
};

/* =========================================================
   🎯 Función para generar insights basados en el perfil
   Umbrales SEI:
   - Experto: >= 125
   - Diestro: 115-124
   - Funcional: 100-114
   - Emergente: 85-99
   - Desafío: < 85
========================================================= */
function generateInsights(profile: any, lang: "es" | "en") {
  const insights = COMPETENCY_INSIGHTS[lang];
  const competencias = profile?.eq?.competencias || {};

  const strengths: { key: string; text: string; score: number }[] = [];
  const opportunities: { key: string; text: string; score: number }[] = [];
  const practices: string[] = [];

  // Analizar cada competencia
  Object.entries(competencias).forEach(([key, value]) => {
    const score = value as number;
    if (typeof score !== "number" || score === 0) return;

    // Fortalezas: Diestro o Experto (>= 115)
    if (score >= 115 && insights.strengths[key as keyof typeof insights.strengths]) {
      strengths.push({
        key,
        text: insights.strengths[key as keyof typeof insights.strengths],
        score,
      });
    }

    // Oportunidades: Emergente o Desafío (< 100)
    if (score < 100 && insights.opportunities[key as keyof typeof insights.opportunities]) {
      opportunities.push({
        key,
        text: insights.opportunities[key as keyof typeof insights.opportunities],
        score,
      });
    }

    // Agregar práctica para todas las competencias (siempre hay algo que practicar)
    if (insights.practices[key as keyof typeof insights.practices]) {
      practices.push(insights.practices[key as keyof typeof insights.practices]);
    }
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
      if (insights.strengths[key as keyof typeof insights.strengths]) {
        strengths.push({
          key,
          text: insights.strengths[key as keyof typeof insights.strengths],
          score: value as number,
        });
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

type Props = {
  profile?: any;
  compact?: boolean;
  insights?: any; // Allow passing insights directly
};

export default function CoachPanel({ profile, compact = false, insights: passedInsights }: Props) {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const langKey = (lang === "en" ? "en" : "es") as "es" | "en";

  const [question, setQuestion] = useState("");
  const [thinking, setThinking] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  // Generar insights basados en el perfil (sin IA)
  const insights = useMemo(() => {
    if (!profile?.eq?.competencias) return null;
    return generateInsights(profile, langKey);
  }, [profile, langKey]);

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
      setResponse(data.text || (lang === "en" ? "Could not get a response." : "No pude obtener una respuesta."));
    } catch {
      setResponse(lang === "en" ? "Error processing query." : "Error al procesar la consulta.");
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
            <h3 className="font-semibold text-gray-900 dark:text-white">{t.modelTitle}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.modelDesc}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {(["know", "choose", "give"] as const).map((key, index) => {
            const pursuit = t[key];
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
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{pursuit.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{pursuit.desc}</p>
                <ul className="space-y-1">
                  {pursuit.skills.map((skill, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {skill}
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
                <h3 className="font-semibold text-green-800 dark:text-green-300">{t.strengths}</h3>
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
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">{t.opportunities}</h3>
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
                <h3 className="font-semibold text-gray-900 dark:text-white">{t.dailyPractice}</h3>
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
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t.noSei}</p>
          <Link
            href="/sei"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            {t.takeSeiNow}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-3">
        <Link
          href="/sei/learn"
          className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors group"
        >
          <BookOpen className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[var(--rowi-g2)]">
            {t.learnMore}
          </span>
          <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[var(--rowi-g2)]" />
        </Link>

        <Link
          href="/sei"
          className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors group"
        >
          <Target className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[var(--rowi-g2)]">
            {t.takeAssessment}
          </span>
          <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[var(--rowi-g2)]" />
        </Link>

        <Link
          href="/dashboard#competencies"
          className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-[var(--rowi-g2)] transition-colors group"
        >
          <Brain className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-[var(--rowi-g2)]">
            {t.exploreCompetencies}
          </span>
          <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-[var(--rowi-g2)]" />
        </Link>
      </div>

      {/* Ask Rowi (solo para preguntas específicas) */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Image
            src="/rowivectors/Rowi-06.png"
            alt="Rowi"
            width={40}
            height={40}
            className="object-contain"
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t.askRowi}</h3>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t.askPlaceholder}
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
            {t.askButton}
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
  t: typeof translations.es;
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
                  {t.strengths}
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
                  {t.opportunities}
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
                  {t.dailyPractice}
                </span>
                <span className="text-gray-800 dark:text-gray-200">{insights.practices[0]}</span>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 text-sm text-gray-500 dark:text-gray-400 text-center">
          {t.noSei}
        </div>
      )}

      {/* Input para preguntas */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t.askPlaceholder}
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
