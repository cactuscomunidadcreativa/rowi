// src/app/me/gamification/leaderboard/page.tsx
// ============================================================
// Leaderboard - Rankings de usuarios (traducible)
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  ArrowLeft,
  Trophy,
  Loader2,
  Star,
  Flame,
  Award,
  Crown,
  Medal,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  value: number;
  level?: number;
  title?: string;
}

type RankingType = "points" | "streak" | "achievements";

export default function LeaderboardPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [rankingType, setRankingType] = useState<RankingType>("points");
  const [myRank, setMyRank] = useState<number | null>(null);

  // Traducciones
  const txt = {
    leaderboard: t("leaderboard.title", "Leaderboard"),
    communityRankings: t("leaderboard.subtitle", locale === "en" ? "Community rankings" : "Rankings de la comunidad"),
    yourPosition: t("leaderboard.yourPosition", locale === "en" ? "Your position in" : "Tu posición en"),
    noData: t("leaderboard.noData", locale === "en" ? "No leaderboard data yet" : "No hay datos en el leaderboard aún"),
    user: t("leaderboard.user", locale === "en" ? "User" : "Usuario"),
    // Rankings
    points: t("leaderboard.points", locale === "en" ? "Points" : "Puntos"),
    streak: t("leaderboard.streak", locale === "en" ? "Streak" : "Racha"),
    achievements: t("leaderboard.achievements", locale === "en" ? "Achievements" : "Logros"),
    // Value labels
    pts: t("leaderboard.pts", "pts"),
    days: t("leaderboard.days", locale === "en" ? "days" : "días"),
    achievementsLabel: t("leaderboard.achievementsLabel", locale === "en" ? "achievements" : "logros"),
  };

  const rankingConfig: Record<RankingType, { label: string; icon: any; color: string; valueLabel: string }> = {
    points: { label: txt.points, icon: Star, color: "text-amber-400", valueLabel: txt.pts },
    streak: { label: txt.streak, icon: Flame, color: "text-orange-400", valueLabel: txt.days },
    achievements: { label: txt.achievements, icon: Trophy, color: "text-purple-400", valueLabel: txt.achievementsLabel },
  };

  useEffect(() => {
    loadLeaderboard();
  }, [rankingType]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/leaderboard?type=${rankingType}&limit=50`);
      const json = await res.json();
      if (json.ok) {
        setEntries(json.data.rankings);
        setMyRank(json.data.myRank || null);
      }
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const config = rankingConfig[rankingType];
  const Icon = config.icon;

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/me/gamification")}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{txt.leaderboard}</h1>
            <p className="text-gray-400 text-sm">
              {txt.communityRankings}
            </p>
          </div>
        </div>
      </div>

      {/* My Rank Card */}
      {myRank && (
        <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl border border-violet-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/30 flex items-center justify-center font-bold text-white">
                #{myRank}
              </div>
              <span className="text-white">{txt.yourPosition} {config.label}</span>
            </div>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
        </div>
      )}

      {/* Ranking Type Tabs */}
      <div className="flex gap-2">
        {(Object.keys(rankingConfig) as RankingType[]).map((type) => {
          const cfg = rankingConfig[type];
          const TypeIcon = cfg.icon;
          return (
            <button
              key={type}
              onClick={() => setRankingType(type)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                rankingType === type
                  ? "bg-gray-700 text-white border border-gray-600"
                  : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600"
              }`}
            >
              <TypeIcon className={`w-5 h-5 ${rankingType === type ? cfg.color : ""}`} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{txt.noData}</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
          {/* Top 3 Podium */}
          {entries.length >= 3 && (
            <div className="p-6 border-b border-gray-700/50 bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="flex items-end justify-center gap-4">
                {/* 2nd place */}
                <div className="flex flex-col items-center w-24">
                  <div className="relative">
                    {entries[1].user.image ? (
                      <img
                        src={entries[1].user.image}
                        alt={entries[1].user.name || ""}
                        className="w-14 h-14 rounded-full border-2 border-gray-500"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-400">
                        {entries[1].user.name?.[0] || "?"}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
                      2
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 truncate w-full text-center">
                    {entries[1].user.name || txt.user}
                  </p>
                  <p className={`text-sm font-bold ${config.color}`}>
                    {entries[1].value.toLocaleString()} {config.valueLabel}
                  </p>
                  <div className="w-full h-16 bg-gray-600/50 rounded-t-lg mt-2" />
                </div>

                {/* 1st place */}
                <div className="flex flex-col items-center w-28">
                  <Crown className="w-8 h-8 text-amber-400 mb-1" />
                  <div className="relative">
                    {entries[0].user.image ? (
                      <img
                        src={entries[0].user.image}
                        alt={entries[0].user.name || ""}
                        className="w-16 h-16 rounded-full border-2 border-amber-400"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-2xl font-bold text-amber-400">
                        {entries[0].user.name?.[0] || "?"}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-black">
                      1
                    </div>
                  </div>
                  <p className="text-sm text-white font-medium mt-2 truncate w-full text-center">
                    {entries[0].user.name || txt.user}
                  </p>
                  <p className={`text-sm font-bold ${config.color}`}>
                    {entries[0].value.toLocaleString()} {config.valueLabel}
                  </p>
                  <div className="w-full h-24 bg-amber-500/20 rounded-t-lg mt-2" />
                </div>

                {/* 3rd place */}
                <div className="flex flex-col items-center w-24">
                  <div className="relative">
                    {entries[2].user.image ? (
                      <img
                        src={entries[2].user.image}
                        alt={entries[2].user.name || ""}
                        className="w-14 h-14 rounded-full border-2 border-amber-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-400">
                        {entries[2].user.name?.[0] || "?"}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center text-xs font-bold text-white">
                      3
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 truncate w-full text-center">
                    {entries[2].user.name || txt.user}
                  </p>
                  <p className={`text-sm font-bold ${config.color}`}>
                    {entries[2].value.toLocaleString()} {config.valueLabel}
                  </p>
                  <div className="w-full h-12 bg-amber-700/30 rounded-t-lg mt-2" />
                </div>
              </div>
            </div>
          )}

          {/* Rest of the list */}
          <div className="divide-y divide-gray-700/30">
            {entries.slice(3).map((entry, idx) => (
              <div
                key={entry.user.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-700/20 transition-colors"
              >
                <div className="w-8 text-center font-bold text-gray-500">
                  {idx + 4}
                </div>

                {entry.user.image ? (
                  <img
                    src={entry.user.image}
                    alt={entry.user.name || ""}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-400">
                    {entry.user.name?.[0] || "?"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {entry.user.name || txt.user}
                  </p>
                  {entry.title && (
                    <p className="text-xs text-gray-500">{entry.title}</p>
                  )}
                </div>

                <div className={`font-bold ${config.color} flex items-center gap-1`}>
                  <Icon className="w-4 h-4" />
                  {entry.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
