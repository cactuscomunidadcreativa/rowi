"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Star,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  Lock,
  Flame,
  Brain,
  Heart,
  Zap,
  TrendingUp,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   📚 Learning Hub — Centro de Aprendizaje Rowi
   ---------------------------------------------------------
   Módulos de desarrollo de Inteligencia Emocional
========================================================= */

interface LearningModule {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ElementType;
  color: string;
  lessons: number;
  completedLessons: number;
  duration: string;
  level: "beginner" | "intermediate" | "advanced";
  locked: boolean;
  category: string;
}

const LEARNING_MODULES: LearningModule[] = [
  {
    id: "eq-basics",
    titleKey: "learning.modules.eqBasics.title",
    descriptionKey: "learning.modules.eqBasics.description",
    icon: Brain,
    color: "#3b82f6",
    lessons: 8,
    completedLessons: 5,
    duration: "2h 30m",
    level: "beginner",
    locked: false,
    category: "foundations",
  },
  {
    id: "self-awareness",
    titleKey: "learning.modules.selfAwareness.title",
    descriptionKey: "learning.modules.selfAwareness.description",
    icon: Sparkles,
    color: "#8b5cf6",
    lessons: 6,
    completedLessons: 2,
    duration: "1h 45m",
    level: "beginner",
    locked: false,
    category: "know-yourself",
  },
  {
    id: "emotional-literacy",
    titleKey: "learning.modules.emotionalLiteracy.title",
    descriptionKey: "learning.modules.emotionalLiteracy.description",
    icon: BookOpen,
    color: "#10b981",
    lessons: 10,
    completedLessons: 0,
    duration: "3h",
    level: "intermediate",
    locked: false,
    category: "know-yourself",
  },
  {
    id: "empathy",
    titleKey: "learning.modules.empathy.title",
    descriptionKey: "learning.modules.empathy.description",
    icon: Heart,
    color: "#ec4899",
    lessons: 7,
    completedLessons: 0,
    duration: "2h",
    level: "intermediate",
    locked: true,
    category: "choose-yourself",
  },
  {
    id: "motivation",
    titleKey: "learning.modules.motivation.title",
    descriptionKey: "learning.modules.motivation.description",
    icon: Zap,
    color: "#f59e0b",
    lessons: 5,
    completedLessons: 0,
    duration: "1h 30m",
    level: "intermediate",
    locked: true,
    category: "choose-yourself",
  },
  {
    id: "leadership-eq",
    titleKey: "learning.modules.leadershipEq.title",
    descriptionKey: "learning.modules.leadershipEq.description",
    icon: Users,
    color: "#06b6d4",
    lessons: 12,
    completedLessons: 0,
    duration: "4h",
    level: "advanced",
    locked: true,
    category: "give-yourself",
  },
];

const CATEGORIES = [
  { id: "all", labelKey: "learning.categories.all" },
  { id: "foundations", labelKey: "learning.categories.foundations" },
  { id: "know-yourself", labelKey: "learning.categories.knowYourself" },
  { id: "choose-yourself", labelKey: "learning.categories.chooseYourself" },
  { id: "give-yourself", labelKey: "learning.categories.giveYourself" },
];

export default function LearningPage() {
  const { t, lang } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredModules = selectedCategory === "all"
    ? LEARNING_MODULES
    : LEARNING_MODULES.filter((m) => m.category === selectedCategory);

  // Stats
  const totalLessons = LEARNING_MODULES.reduce((acc, m) => acc + m.lessons, 0);
  const completedLessons = LEARNING_MODULES.reduce((acc, m) => acc + m.completedLessons, 0);
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  const safeLang = mounted ? lang : "es";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Header compacto estilo app */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {safeLang === "es" ? "Centro de Aprendizaje" : "Learning Hub"}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {safeLang === "es"
                  ? "Desarrolla tu Inteligencia Emocional con el modelo Six Seconds"
                  : "Develop your Emotional Intelligence with the Six Seconds model"}
              </p>
            </div>
          </div>

          {/* Progress mini card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 px-5 py-3 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {completedLessons}/{totalLessons}
              </span>
            </div>
            <div className="w-24 h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
              />
            </div>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{progressPercent}%</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: BookOpen, value: LEARNING_MODULES.length, label: safeLang === "es" ? "Módulos" : "Modules", color: "#3b82f6" },
            { icon: Play, value: totalLessons, label: safeLang === "es" ? "Lecciones" : "Lessons", color: "#10b981" },
            { icon: Clock, value: "14h", label: safeLang === "es" ? "Contenido" : "Content", color: "#f59e0b" },
            { icon: Target, value: "3", label: safeLang === "es" ? "Certificados" : "Certificates", color: "#8b5cf6" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-zinc-800/80 rounded-xl p-4 border border-gray-200 dark:border-zinc-700/50 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${stat.color}12` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Categories Filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-600"
              }`}
            >
              {t(cat.labelKey) || cat.id}
            </button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} lang={safeLang} t={t} />
          ))}
        </div>

        {/* Empty State */}
        {filteredModules.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {safeLang === "es" ? "No hay módulos en esta categoría" : "No modules in this category"}
            </h3>
            <p className="text-gray-500">
              {safeLang === "es" ? "Selecciona otra categoría para ver más contenido" : "Select another category to see more content"}
            </p>
          </div>
        )}

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-800"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {safeLang === "es" ? "Próximamente" : "Coming Soon"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {safeLang === "es" ? "Rowi Coach IA" : "Rowi AI Coach"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-lg">
                {safeLang === "es"
                  ? "Aprendizaje personalizado con inteligencia artificial. Tu coach personal de IE disponible 24/7."
                  : "Personalized learning with artificial intelligence. Your personal EI coach available 24/7."}
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/25">
              {safeLang === "es" ? "Notificarme" : "Notify Me"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* =========================================================
   📦 Module Card Component
========================================================= */
function ModuleCard({
  module,
  index,
  lang,
  t,
}: {
  module: LearningModule;
  index: number;
  lang: string;
  t: (key: string) => string;
}) {
  const Icon = module.icon;
  const progress = module.lessons > 0 ? (module.completedLessons / module.lessons) * 100 : 0;

  const levelLabels = {
    beginner: lang === "es" ? "Principiante" : "Beginner",
    intermediate: lang === "es" ? "Intermedio" : "Intermediate",
    advanced: lang === "es" ? "Avanzado" : "Advanced",
  };

  const levelColors = {
    beginner: "#10b981",
    intermediate: "#f59e0b",
    advanced: "#ef4444",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`group relative bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-zinc-600 ${
        module.locked ? "opacity-75" : ""
      }`}
    >
      {/* Lock Overlay */}
      {module.locked && (
        <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {lang === "es" ? "Completa los módulos anteriores" : "Complete previous modules"}
            </p>
          </div>
        </div>
      )}

      {/* Color top accent */}
      <div className="h-1 w-full" style={{ backgroundColor: module.color }} />

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${module.color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color: module.color }} />
          </div>
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: `${levelColors[module.level]}15`,
              color: levelColors[module.level],
            }}
          >
            {levelLabels[module.level]}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t(module.titleKey) || module.id}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
          {t(module.descriptionKey) || ""}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{module.completedLessons} / {module.lessons} {lang === "es" ? "lecciones" : "lessons"}</span>
            <span className="font-medium" style={{ color: progress > 0 ? module.color : undefined }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: module.color,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-700/50">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {module.duration}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {module.lessons} {lang === "es" ? "lecciones" : "lessons"}
            </span>
          </div>

          {!module.locked && (
            <Link
              href={`/learning/${module.id}`}
              className="flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: module.color }}
            >
              {progress > 0
                ? (lang === "es" ? "Continuar" : "Continue")
                : (lang === "es" ? "Empezar" : "Start")}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}
