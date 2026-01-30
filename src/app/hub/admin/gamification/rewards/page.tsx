// src/app/hub/admin/gamification/rewards/page.tsx
// ============================================================
// Gestión de Rewards - Panel de administración
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  Gift,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  ArrowLeft,
  Coins,
  Award,
  Crown,
  Percent,
  Zap,
  FileText,
  Check,
  X,
  Eye,
} from "lucide-react";

interface Reward {
  id: string;
  slug: string;
  name: string;
  nameEN?: string;
  description?: string;
  descriptionEN?: string;
  icon?: string;
  image?: string;
  color: string;
  cost: number;
  type: string;
  stock?: number;
  maxPerUser: number;
  expiresAt?: string;
  isActive: boolean;
  isFeatured: boolean;
  claimsCount?: number;
}

const typeIcons: Record<string, any> = {
  BADGE: Award,
  FEATURE: Zap,
  DISCOUNT: Percent,
  PHYSICAL: Gift,
  CERTIFICATE: FileText,
  TOKENS: Coins,
};

const typeColors: Record<string, string> = {
  BADGE: "bg-purple-500/20 text-purple-400",
  FEATURE: "bg-blue-500/20 text-blue-400",
  DISCOUNT: "bg-green-500/20 text-green-400",
  PHYSICAL: "bg-orange-500/20 text-orange-400",
  CERTIFICATE: "bg-pink-500/20 text-pink-400",
  TOKENS: "bg-amber-500/20 text-amber-400",
};

const t = {
  es: {
    title: "Recompensas",
    subtitle: "Gestiona las recompensas canjeables",
    newReward: "Nueva Recompensa",
    loading: "Cargando recompensas...",
    search: "Buscar recompensas...",
    filters: {
      all: "Todos",
    },
    stats: {
      total: "Total Recompensas",
      active: "Activas",
      totalClaims: "Total Canjes",
      featured: "Destacadas",
    },
    card: {
      featured: "Destacado",
      pts: "pts",
      stock: "Stock",
      unlimited: "Ilimitado",
      active: "Activo",
      inactive: "Inactivo",
      maxPerUser: "Máx",
      perUser: "/usuario",
    },
    noResults: "No se encontraron recompensas",
  },
  en: {
    title: "Rewards",
    subtitle: "Manage redeemable rewards",
    newReward: "New Reward",
    loading: "Loading rewards...",
    search: "Search rewards...",
    filters: {
      all: "All",
    },
    stats: {
      total: "Total Rewards",
      active: "Active",
      totalClaims: "Total Claims",
      featured: "Featured",
    },
    card: {
      featured: "Featured",
      pts: "pts",
      stock: "Stock",
      unlimited: "Unlimited",
      active: "Active",
      inactive: "Inactive",
      maxPerUser: "Max",
      perUser: "/user",
    },
    noResults: "No rewards found",
  },
};

export default function RewardsPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const lang = locale === "en" ? "en" : "es";
  const labels = t[lang];
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadRewards();
  }, []);

  async function loadRewards() {
    try {
      const res = await fetch("/api/gamification/rewards");
      const data = await res.json();

      if (data.ok) {
        setRewards(data.data.rewards);
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRewards = rewards.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.slug.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || r.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const types = ["all", "BADGE", "FEATURE", "DISCOUNT", "TOKENS", "CERTIFICATE", "PHYSICAL"];

  const stats = {
    total: rewards.length,
    active: rewards.filter((r) => r.isActive).length,
    totalClaims: rewards.reduce((sum, r) => sum + (r.claimsCount || 0), 0),
    featured: rewards.filter((r) => r.isFeatured).length,
  };

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
            onClick={() => router.push("/hub/admin/gamification")}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <Gift className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{labels.title}</h1>
              <p className="text-gray-400 text-sm">
                {labels.subtitle}
              </p>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          {labels.newReward}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Gift className="w-4 h-4 text-green-500" />
            {labels.stats.total}
          </div>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Check className="w-4 h-4 text-blue-500" />
            {labels.stats.active}
          </div>
          <p className="text-2xl font-bold text-white mt-1">{stats.active}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Coins className="w-4 h-4 text-amber-500" />
            {labels.stats.totalClaims}
          </div>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalClaims}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Crown className="w-4 h-4 text-purple-500" />
            {labels.stats.featured}
          </div>
          <p className="text-2xl font-bold text-white mt-1">{stats.featured}</p>
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {types.map((type) => {
            const Icon = type === "all" ? Gift : typeIcons[type] || Gift;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  typeFilter === type
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {type === "all" ? labels.filters.all : type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRewards.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {labels.noResults}
          </div>
        ) : (
          filteredRewards.map((reward) => {
            const TypeIcon = typeIcons[reward.type] || Gift;

            return (
              <div
                key={reward.id}
                className={`group relative bg-gray-800/50 rounded-2xl p-5 border transition-all hover:scale-[1.02] ${
                  reward.isActive
                    ? "border-gray-700/50 hover:border-gray-600"
                    : "border-gray-800 opacity-60"
                }`}
              >
                {/* Featured Badge */}
                {reward.isFeatured && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                    {labels.card.featured}
                  </div>
                )}

                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${reward.color}20` }}
                >
                  <TypeIcon
                    className="w-7 h-7"
                    style={{ color: reward.color }}
                  />
                </div>

                {/* Info */}
                <h3 className="font-semibold text-white mb-1">{reward.name}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {reward.description || reward.nameEN}
                </p>

                {/* Type Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium mb-3 ${
                    typeColors[reward.type]
                  }`}
                >
                  <TypeIcon className="w-3 h-3" />
                  {reward.type}
                </div>

                {/* Cost & Stock */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">
                      {reward.cost.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">{labels.card.pts}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {reward.stock !== null && reward.stock !== undefined ? (
                      <span>{labels.card.stock}: {reward.stock}</span>
                    ) : (
                      <span>{labels.card.unlimited}</span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      reward.isActive ? "text-green-400" : "text-gray-500"
                    }`}
                  >
                    {reward.isActive ? (
                      <>
                        <Check className="w-3 h-3" />
                        {labels.card.active}
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        {labels.card.inactive}
                      </>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">
                    {labels.card.maxPerUser}: {reward.maxPerUser}{labels.card.perUser}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
