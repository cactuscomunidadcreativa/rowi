// src/app/hub/admin/elearning/microlearning/page.tsx
// ============================================================
// Gestión de MicroLearning - Panel de administración
// ============================================================

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  Lightbulb,
  Search,
  Filter,
  ArrowLeft,
  Loader2,
  Zap,
  Target,
  BrainCircuit,
  TrendingUp,
  Star,
  Clock,
  Users,
  Eye,
  Edit,
  BarChart3,
} from "lucide-react";

interface MicroLearning {
  id: string;
  slug: string;
  category: string;
  parentKey: string;
  title: string;
  description?: string;
  duration: number;
  difficulty: string;
  points: number;
  isFeatured: boolean;
  content: any;
}


const difficultyColors: Record<string, string> = {
  BEGINNER: "bg-green-500/20 text-green-400",
  INTERMEDIATE: "bg-amber-500/20 text-amber-400",
  ADVANCED: "bg-red-500/20 text-red-400",
};

const t = {
  es: {
    title: "MicroLearning",
    subtitle: "Micro-acciones de Six Seconds para desarrollo EQ",
    loading: "Cargando micro-acciones...",
    loadingSuspense: "Cargando micro-learnings...",
    search: "Buscar micro-acciones...",
    stats: {
      totalActions: "Total Acciones",
      categories: "Categorías",
      featured: "Destacadas",
      avgDuration: "Duración Promedio",
      min: "min",
    },
    filters: {
      all: "Todos",
      competencies: "Competencias",
      outcomes: "Outcomes",
      brainTalents: "Brain Talents",
      coreOutcomes: "Core Outcomes",
    },
    category: {
      competency: "Competencias EQ",
      outcome: "Outcomes",
      brainTalent: "Brain Talents",
      coreOutcome: "Core Outcomes",
      actions: "acciones",
    },
    noResults: "No se encontraron micro-acciones",
  },
  en: {
    title: "MicroLearning",
    subtitle: "Six Seconds micro-actions for EQ development",
    loading: "Loading micro-actions...",
    loadingSuspense: "Loading micro-learnings...",
    search: "Search micro-actions...",
    stats: {
      totalActions: "Total Actions",
      categories: "Categories",
      featured: "Featured",
      avgDuration: "Avg Duration",
      min: "min",
    },
    filters: {
      all: "All",
      competencies: "Competencies",
      outcomes: "Outcomes",
      brainTalents: "Brain Talents",
      coreOutcomes: "Core Outcomes",
    },
    category: {
      competency: "EQ Competencies",
      outcome: "Outcomes",
      brainTalent: "Brain Talents",
      coreOutcome: "Core Outcomes",
      actions: "actions",
    },
    noResults: "No micro-actions found",
  },
};

function MicroLearningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const labels = t[lang];
  const initialCategory = searchParams.get("category") || "all";

  const [loading, setLoading] = useState(true);
  const [microLearnings, setMicroLearnings] = useState<MicroLearning[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [stats, setStats] = useState<any>(null);

  const categoryConfig: Record<string, { icon: any; color: string; label: string }> = {
    COMPETENCY: { icon: Zap, color: "text-blue-500 bg-blue-500/20", label: labels.category.competency },
    OUTCOME: { icon: Target, color: "text-green-500 bg-green-500/20", label: labels.category.outcome },
    BRAIN_TALENT: { icon: BrainCircuit, color: "text-purple-500 bg-purple-500/20", label: labels.category.brainTalent },
    CORE_OUTCOME: { icon: TrendingUp, color: "text-amber-500 bg-amber-500/20", label: labels.category.coreOutcome },
  };

  const categories = [
    { key: "all", label: labels.filters.all },
    { key: "COMPETENCY", label: labels.filters.competencies },
    { key: "OUTCOME", label: labels.filters.outcomes },
    { key: "BRAIN_TALENT", label: labels.filters.brainTalents },
    { key: "CORE_OUTCOME", label: labels.filters.coreOutcomes },
  ];

  useEffect(() => {
    loadMicroLearnings();
  }, []);

  async function loadMicroLearnings() {
    try {
      const res = await fetch("/api/microlearning");
      const data = await res.json();

      if (data.ok) {
        // Flatten all microlearnings from byCategory
        const all = Object.values(data.data.byCategory || {}).flat() as MicroLearning[];
        setMicroLearnings(all);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error loading microlearnings:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = microLearnings.filter((ml) => {
    const matchesSearch =
      ml.title.toLowerCase().includes(search.toLowerCase()) ||
      ml.parentKey.toLowerCase().includes(search.toLowerCase()) ||
      ml.slug.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || ml.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Agrupar por parentKey
  const groupedByParent = filteredItems.reduce((acc, ml) => {
    const key = `${ml.category}_${ml.parentKey}`;
    if (!acc[key]) {
      acc[key] = {
        category: ml.category,
        parentKey: ml.parentKey,
        items: [],
      };
    }
    acc[key].items.push(ml);
    return acc;
  }, {} as Record<string, { category: string; parentKey: string; items: MicroLearning[] }>);

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/hub/admin/elearning")}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Lightbulb className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{labels.title}</h1>
              <p className="text-gray-400 text-sm">
                {labels.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            {labels.stats.totalActions}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {microLearnings.length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            {labels.stats.categories}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.categories?.length || 4}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Star className="w-4 h-4 text-amber-500" />
            {labels.stats.featured}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {microLearnings.filter((ml) => ml.isFeatured).length}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4 text-green-500" />
            {labels.stats.avgDuration}
          </div>
          <p className="text-2xl font-bold text-white mt-1">
            {Math.round(microLearnings.reduce((sum, ml) => sum + ml.duration, 0) / microLearnings.length || 2)} {labels.stats.min}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder={labels.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const config = categoryConfig[cat.key];
            const Icon = config?.icon || Lightbulb;

            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat.key
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{labels.noResults}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(groupedByParent).map((group) => {
            const config = categoryConfig[group.category];
            const Icon = config?.icon || Lightbulb;

            return (
              <div
                key={`${group.category}_${group.parentKey}`}
                className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden"
              >
                {/* Group Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-700/50 bg-gray-800/30">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config?.color || 'bg-gray-700'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{group.parentKey}</h3>
                    <p className="text-xs text-gray-500">
                      {config?.label} · {group.items.length} {labels.category.actions}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-700/30">
                  {group.items.map((ml) => (
                    <div
                      key={ml.id}
                      className="flex items-center gap-4 p-4 hover:bg-gray-700/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {ml.title}
                          </p>
                          {ml.isFeatured && (
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          )}
                        </div>
                        {ml.description && (
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {ml.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            difficultyColors[ml.difficulty] || "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {ml.difficulty}
                        </span>

                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Clock className="w-4 h-4" />
                          {ml.duration}m
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 text-sm">
                          <Lightbulb className="w-4 h-4" />
                          {ml.points}pts
                        </div>

                        <div className="flex gap-1">
                          <button className="p-2 rounded-lg hover:bg-gray-700">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-700">
                            <Edit className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MicroLearningPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando micro-learnings...</span>
        </div>
      </div>
    }>
      <MicroLearningContent />
    </Suspense>
  );
}
