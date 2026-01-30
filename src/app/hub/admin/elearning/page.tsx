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

const t = {
  es: {
    title: "E-Learning",
    subtitle: "Gestiona contenido educativo y desarrollo EQ",
    loading: "Cargando...",
    modules: {
      microlearning: {
        title: "MicroLearning",
        description: "Micro-acciones de Six Seconds para desarrollo EQ",
        statLabel: "Micro-acciones",
      },
      courses: {
        title: "Cursos",
        description: "Cursos completos de inteligencia emocional",
        statLabel: "Cursos activos",
      },
      quizzes: {
        title: "Quizzes",
        description: "Evaluaciones y cuestionarios",
        statLabel: "Quizzes",
      },
      certificates: {
        title: "Certificados",
        description: "Gestiona certificados y credenciales",
        statLabel: "Certificados emitidos",
      },
    },
    quickStats: {
      microactions: "Micro-acciones",
      categories: "Categorías",
      activeUsers: "Usuarios Activos",
      completedToday: "Completados Hoy",
    },
    categoryBreakdown: {
      title: "MicroLearning por Categoría",
      viewAll: "Ver todo →",
      competencies: "Competencias EQ",
      outcomes: "Outcomes",
      brainTalents: "Brain Talents",
      coreOutcomes: "Core Outcomes",
      actions: "acciones",
    },
    activity: {
      title: "Actividad Reciente",
      completed: "completó",
      started: "inició",
      rated: "calificó",
    },
  },
  en: {
    title: "E-Learning",
    subtitle: "Manage educational content and EQ development",
    loading: "Loading...",
    modules: {
      microlearning: {
        title: "MicroLearning",
        description: "Six Seconds micro-actions for EQ development",
        statLabel: "Micro-actions",
      },
      courses: {
        title: "Courses",
        description: "Complete emotional intelligence courses",
        statLabel: "Active courses",
      },
      quizzes: {
        title: "Quizzes",
        description: "Assessments and questionnaires",
        statLabel: "Quizzes",
      },
      certificates: {
        title: "Certificates",
        description: "Manage certificates and credentials",
        statLabel: "Certificates issued",
      },
    },
    quickStats: {
      microactions: "Micro-actions",
      categories: "Categories",
      activeUsers: "Active Users",
      completedToday: "Completed Today",
    },
    categoryBreakdown: {
      title: "MicroLearning by Category",
      viewAll: "View all →",
      competencies: "EQ Competencies",
      outcomes: "Outcomes",
      brainTalents: "Brain Talents",
      coreOutcomes: "Core Outcomes",
      actions: "actions",
    },
    activity: {
      title: "Recent Activity",
      completed: "completed",
      started: "started",
      rated: "rated",
    },
  },
};

export default function ElearningDashboardPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const labels = t[lang];
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
      title: labels.modules.microlearning.title,
      description: labels.modules.microlearning.description,
      icon: Lightbulb,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-500",
      href: "/hub/admin/elearning/microlearning",
      stat: 150,
      statLabel: labels.modules.microlearning.statLabel,
    },
    {
      id: "courses",
      title: labels.modules.courses.title,
      description: labels.modules.courses.description,
      icon: GraduationCap,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
      href: "/hub/admin/elearning/courses",
      stat: 5,
      statLabel: labels.modules.courses.statLabel,
    },
    {
      id: "quizzes",
      title: labels.modules.quizzes.title,
      description: labels.modules.quizzes.description,
      icon: Target,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
      href: "/hub/admin/elearning/quizzes",
      stat: 24,
      statLabel: labels.modules.quizzes.statLabel,
    },
    {
      id: "certificates",
      title: labels.modules.certificates.title,
      description: labels.modules.certificates.description,
      icon: Award,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      href: "/hub/admin/elearning/certificates",
      stat: 12,
      statLabel: labels.modules.certificates.statLabel,
    },
  ];

  const quickStats = [
    {
      label: labels.quickStats.microactions,
      value: stats?.total || 150,
      icon: Lightbulb,
      color: "text-amber-500",
    },
    {
      label: labels.quickStats.categories,
      value: stats?.categories?.length || 4,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      label: labels.quickStats.activeUsers,
      value: 847,
      icon: Users,
      color: "text-green-500",
    },
    {
      label: labels.quickStats.completedToday,
      value: 156,
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  const categoryBreakdown = [
    { key: "COMPETENCY", label: labels.categoryBreakdown.competencies, count: 40, icon: Zap, color: "bg-blue-500" },
    { key: "OUTCOME", label: labels.categoryBreakdown.outcomes, count: 40, icon: Target, color: "bg-green-500" },
    { key: "BRAIN_TALENT", label: labels.categoryBreakdown.brainTalents, count: 54, icon: BrainCircuit, color: "bg-purple-500" },
    { key: "CORE_OUTCOME", label: labels.categoryBreakdown.coreOutcomes, count: 16, icon: Star, color: "bg-amber-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{labels.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <BookOpen className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{labels.title}</h1>
          <p className="text-gray-400">
            {labels.subtitle}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50"
          >
            <div className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-gray-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => router.push(module.href)}
            className="group text-left bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${module.bgColor}`}>
                <module.icon className={`w-6 h-6 ${module.iconColor}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">
              {module.title}
            </h3>
            <p className="text-sm text-gray-400 mb-4">{module.description}</p>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-700/50">
              <span className="text-2xl font-bold text-white">{module.stat}</span>
              <span className="text-xs text-gray-500">{module.statLabel}</span>
            </div>
          </button>
        ))}
      </div>

      {/* MicroLearning Breakdown */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            {labels.categoryBreakdown.title}
          </h3>
          <button
            onClick={() => router.push("/hub/admin/elearning/microlearning")}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            {labels.categoryBreakdown.viewAll}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryBreakdown.map((cat) => (
            <div
              key={cat.key}
              className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() =>
                router.push(`/hub/admin/elearning/microlearning?category=${cat.key}`)
              }
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${cat.color}/20 flex items-center justify-center`}>
                  <cat.icon className={`w-5 h-5 ${cat.color.replace("bg-", "text-")}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{cat.label}</p>
                  <p className="text-xs text-gray-500">{cat.count} {labels.categoryBreakdown.actions}</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-600 rounded-full overflow-hidden">
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
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          {labels.activity.title}
        </h3>
        <div className="space-y-3">
          {[
            { user: "María G.", action: labels.activity.completed, item: "Navegar Emociones - Acción 1", type: "COMPETENCY", time: lang === "en" ? "5 min ago" : "Hace 5 min" },
            { user: "Carlos R.", action: labels.activity.started, item: "Brain Talent BBE - Ejercicio", type: "BRAIN_TALENT", time: lang === "en" ? "12 min ago" : "Hace 12 min" },
            { user: "Ana L.", action: labels.activity.completed, item: "Outcome: Influencia", type: "OUTCOME", time: lang === "en" ? "25 min ago" : "Hace 25 min" },
            { user: "Pedro M.", action: labels.activity.rated, item: "Ejercitar Optimismo ⭐⭐⭐⭐⭐", type: "COMPETENCY", time: lang === "en" ? "1h ago" : "Hace 1h" },
          ].map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium text-white">
                  {activity.user.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">{activity.user}</span>{" "}
                    {activity.action}{" "}
                    <span className="text-gray-400">{activity.item}</span>
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
