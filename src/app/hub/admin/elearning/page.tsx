// src/app/hub/admin/elearning/page.tsx
// ============================================================
// Dashboard de E-Learning - Panel de administración
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  BookOpen,
  Lightbulb,
  GraduationCap,
  Users,
  TrendingUp,
  Clock,
  Star,
  Award,
  ArrowRight,
  Loader2,
  Zap,
  Target,
  BrainCircuit,
  BarChart3,
} from "lucide-react";

export default function ElearningDashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Cargar estadísticas de MicroLearning
      const res = await fetch("/api/microlearning");
      const data = await res.json();
      setStats(data.data?.stats || {});
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const modules = [
    {
      id: "microlearning",
      title: t("elearningPg.modules.microlearning.title", "MicroLearning"),
      description: t(
        "elearningPg.modules.microlearning.description",
        "Micro-acciones de Six Seconds para desarrollo EQ",
      ),
      icon: Lightbulb,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-500",
      href: "/hub/admin/elearning/microlearning",
      stat: 150,
      statLabel: t("elearningPg.modules.microlearning.statLabel", "Micro-acciones"),
    },
    {
      id: "courses",
      title: t("elearningPg.modules.courses.title", "Cursos"),
      description: t(
        "elearningPg.modules.courses.description",
        "Cursos completos de inteligencia emocional",
      ),
      icon: GraduationCap,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10",
      iconColor: "text-violet-500",
      href: "/hub/admin/elearning/courses",
      stat: 5,
      statLabel: t("elearningPg.modules.courses.statLabel", "Cursos activos"),
    },
    {
      id: "quizzes",
      title: t("elearningPg.modules.quizzes.title", "Quizzes"),
      description: t("elearningPg.modules.quizzes.description", "Evaluaciones y cuestionarios"),
      icon: Target,
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
      href: "/hub/admin/elearning/quizzes",
      stat: 24,
      statLabel: t("elearningPg.modules.quizzes.statLabel", "Quizzes"),
    },
    {
      id: "certificates",
      title: t("elearningPg.modules.certificates.title", "Certificados"),
      description: t(
        "elearningPg.modules.certificates.description",
        "Gestiona certificados y credenciales",
      ),
      icon: Award,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      href: "/hub/admin/elearning/certificates",
      stat: 12,
      statLabel: t("elearningPg.modules.certificates.statLabel", "Certificados emitidos"),
    },
  ];

  const quickStats = [
    {
      label: t("elearningPg.quickStats.microactions", "Micro-acciones"),
      value: stats?.total || 150,
      icon: Lightbulb,
      color: "text-amber-500",
    },
    {
      label: t("elearningPg.quickStats.categories", "Categorías"),
      value: stats?.categories?.length || 4,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      label: t("elearningPg.quickStats.activeUsers", "Usuarios Activos"),
      value: 847,
      icon: Users,
      color: "text-green-500",
    },
    {
      label: t("elearningPg.quickStats.completedToday", "Completados Hoy"),
      value: 156,
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  const categoryBreakdown = [
    { key: "COMPETENCY", label: t("elearningPg.categoryBreakdown.competencies", "Competencias EQ"), count: 40, icon: Zap, color: "bg-blue-500" },
    { key: "OUTCOME", label: t("elearningPg.categoryBreakdown.outcomes", "Outcomes"), count: 40, icon: Target, color: "bg-green-500" },
    { key: "BRAIN_TALENT", label: t("elearningPg.categoryBreakdown.brainTalents", "Brain Talents"), count: 54, icon: BrainCircuit, color: "bg-purple-500" },
    { key: "CORE_OUTCOME", label: t("elearningPg.categoryBreakdown.coreOutcomes", "Core Outcomes"), count: 16, icon: Star, color: "bg-amber-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t("elearningPg.loading", "Cargando...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
          <BookOpen className="w-8 h-8 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("elearningPg.title", "E-Learning")}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t("elearningPg.subtitle", "Gestiona contenido educativo y desarrollo EQ")}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => router.push(module.href)}
            className="group text-left bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${module.bgColor}`}>
                <module.icon className={`w-6 h-6 ${module.iconColor}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {module.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{module.description}</p>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{module.stat}</span>
              <span className="text-xs text-gray-500">{module.statLabel}</span>
            </div>
          </button>
        ))}
      </div>

      {/* MicroLearning Breakdown */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            {t("elearningPg.categoryBreakdown.title", "MicroLearning por Categoría")}
          </h3>
          <button
            onClick={() => router.push("/hub/admin/elearning/microlearning")}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            {t("elearningPg.categoryBreakdown.viewAll", "Ver todo →")}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryBreakdown.map((cat) => (
            <div
              key={cat.key}
              className="bg-gray-100 dark:bg-gray-700/30 rounded-xl p-4 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() =>
                router.push(`/hub/admin/elearning/microlearning?category=${cat.key}`)
              }
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${cat.color}/20 flex items-center justify-center`}>
                  <cat.icon className={`w-5 h-5 ${cat.color.replace("bg-", "text-")}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.label}</p>
                  <p className="text-xs text-gray-500">{cat.count} {t("elearningPg.categoryBreakdown.actions", "acciones")}</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.color}`}
                  style={{ width: `${(cat.count / 150) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          {t("elearningPg.activity.title", "Actividad Reciente")}
        </h3>
        <div className="space-y-3">
          {[
            { user: "María G.", action: t("elearningPg.activity.completed", "completó"), item: "Navegar Emociones - Acción 1", type: "COMPETENCY", time: t("elearningPg.activity.time5min", "Hace 5 min") },
            { user: "Carlos R.", action: t("elearningPg.activity.started", "inició"), item: "Brain Talent BBE - Ejercicio", type: "BRAIN_TALENT", time: t("elearningPg.activity.time12min", "Hace 12 min") },
            { user: "Ana L.", action: t("elearningPg.activity.completed", "completó"), item: "Outcome: Influencia", type: "OUTCOME", time: t("elearningPg.activity.time25min", "Hace 25 min") },
            { user: "Pedro M.", action: t("elearningPg.activity.rated", "calificó"), item: "Ejercitar Optimismo ⭐⭐⭐⭐⭐", type: "COMPETENCY", time: t("elearningPg.activity.time1h", "Hace 1h") },
          ].map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-gray-700/30 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-900 dark:text-white">
                  {activity.user.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    <span className="text-gray-500 dark:text-gray-400">{activity.item}</span>
                  </p>
                  <span className="text-xs text-gray-500">{activity.type}</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
