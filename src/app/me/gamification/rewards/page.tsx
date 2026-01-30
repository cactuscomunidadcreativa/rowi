// src/app/me/gamification/rewards/page.tsx
// ============================================================
// Tienda de Rewards - Canjear puntos por recompensas (traducible)
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/react";
import {
  ArrowLeft,
  Gift,
  Loader2,
  Star,
  Check,
  Lock,
  ShoppingCart,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface Reward {
  id: string;
  slug: string;
  name: string;
  nameEN: string;
  description: string;
  descriptionEN: string;
  icon: string;
  image: string | null;
  color: string;
  cost: number;
  type: string;
  stock: number | null;
  maxPerUser: number;
  expiresAt: string | null;
  isFeatured: boolean;
  canClaim: boolean;
  claimCount: number;
  status: string | null;
  affordability: string;
}

export default function RewardsStorePage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string } | null>(null);

  // Traducciones
  const txt = {
    loading: t("rewards.loading", locale === "en" ? "Loading store..." : "Cargando tienda..."),
    rewardsStore: t("rewards.rewardsStore", locale === "en" ? "Rewards Store" : "Tienda de Rewards"),
    redeemPoints: t("rewards.redeemPoints", locale === "en" ? "Redeem your points for rewards" : "Canjea tus puntos por recompensas"),
    yourPoints: t("rewards.yourPoints", locale === "en" ? "Your points" : "Tus puntos"),
    claimSuccess: t("rewards.claimSuccess", locale === "en" ? "Reward claimed successfully!" : "¡Reward canjeado exitosamente!"),
    close: t("rewards.close", locale === "en" ? "Close" : "Cerrar"),
    all: t("rewards.all", locale === "en" ? "All" : "Todos"),
    featured: t("rewards.featured", locale === "en" ? "Featured" : "Destacados"),
    allRewards: t("rewards.allRewards", locale === "en" ? "All Rewards" : "Todos los Rewards"),
    noRewards: t("rewards.noRewards", locale === "en" ? "No rewards available" : "No hay rewards disponibles"),
    alreadyClaimed: t("rewards.alreadyClaimed", locale === "en" ? "Already claimed" : "Ya canjeado"),
    outOfStock: t("rewards.outOfStock", locale === "en" ? "Out of stock" : "Agotado"),
    missingPts: t("rewards.missingPts", locale === "en" ? "Missing" : "Faltan"),
    pts: t("rewards.pts", locale === "en" ? "pts" : "pts"),
    available: t("rewards.available", locale === "en" ? "available" : "disponibles"),
    claim: t("rewards.claim", locale === "en" ? "Claim" : "Canjear"),
    claimed: t("rewards.claimed", locale === "en" ? "Claimed" : "Canjeado"),
    insufficientPoints: t("rewards.insufficientPoints", locale === "en" ? "Insufficient points" : "Puntos insuficientes"),
    // Tipos
    typeBadge: t("rewards.type.badge", locale === "en" ? "Badge" : "Insignia"),
    typeDiscount: t("rewards.type.discount", locale === "en" ? "Discount" : "Descuento"),
    typeFeature: t("rewards.type.feature", locale === "en" ? "Feature" : "Función"),
    typePhysical: t("rewards.type.physical", locale === "en" ? "Physical" : "Físico"),
    typeVirtual: t("rewards.type.virtual", locale === "en" ? "Virtual" : "Virtual"),
    typeToken: t("rewards.type.token", locale === "en" ? "Token" : "Token"),
    typeCertificate: t("rewards.type.certificate", locale === "en" ? "Certificate" : "Certificado"),
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    BADGE: { label: txt.typeBadge, color: "text-purple-400" },
    DISCOUNT: { label: txt.typeDiscount, color: "text-green-400" },
    FEATURE: { label: txt.typeFeature, color: "text-blue-400" },
    PHYSICAL: { label: txt.typePhysical, color: "text-orange-400" },
    VIRTUAL: { label: txt.typeVirtual, color: "text-pink-400" },
    TOKEN: { label: txt.typeToken, color: "text-amber-400" },
    CERTIFICATE: { label: txt.typeCertificate, color: "text-cyan-400" },
  };

  useEffect(() => {
    loadRewards();
  }, []);

  async function loadRewards() {
    try {
      const res = await fetch("/api/gamification/rewards");
      const json = await res.json();
      if (json.ok) {
        setRewards(json.data.rewards);
        setCurrentPoints(json.data.currentPoints);
      }
    } catch (error) {
      console.error("Error loading rewards:", error);
    } finally {
      setLoading(false);
    }
  }

  async function claimReward(rewardId: string) {
    setClaiming(rewardId);
    setClaimResult(null);

    try {
      const res = await fetch("/api/gamification/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });

      const json = await res.json();

      if (json.ok) {
        setClaimResult({ success: true, message: txt.claimSuccess });
        await loadRewards();
      } else {
        setClaimResult({ success: false, message: json.error || "Error" });
      }
    } catch (error) {
      setClaimResult({ success: false, message: "Error" });
    } finally {
      setClaiming(null);
    }
  }

  const getName = (r: Reward) => locale === "en" && r.nameEN ? r.nameEN : r.name;
  const getDesc = (r: Reward) => locale === "en" && r.descriptionEN ? r.descriptionEN : r.description;

  const filteredRewards = rewards.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  const featuredRewards = filteredRewards.filter((r) => r.isFeatured);
  const regularRewards = filteredRewards.filter((r) => !r.isFeatured);
  const types = ["all", ...new Set(rewards.map((r) => r.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{txt.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/me/gamification")}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
              <Gift className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{txt.rewardsStore}</h1>
              <p className="text-gray-400 text-sm">{txt.redeemPoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 rounded-xl px-4 py-2 border border-gray-700">
          <div className="text-sm text-gray-400">{txt.yourPoints}</div>
          <div className="text-2xl font-bold text-amber-400 flex items-center gap-1">
            <Star className="w-5 h-5" />
            {currentPoints.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Claim Result Toast */}
      {claimResult && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            claimResult.success
              ? "bg-green-500/20 border border-green-500/30 text-green-400"
              : "bg-red-500/20 border border-red-500/30 text-red-400"
          }`}
        >
          {claimResult.success ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{claimResult.message}</span>
          <button
            onClick={() => setClaimResult(null)}
            className="ml-auto text-sm opacity-70 hover:opacity-100"
          >
            {txt.close}
          </button>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              typeFilter === type
                ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
            }`}
          >
            {type === "all" ? txt.all : typeLabels[type]?.label || type}
          </button>
        ))}
      </div>

      {/* Featured Rewards */}
      {featuredRewards.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-white">{txt.featured}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                currentPoints={currentPoints}
                claiming={claiming}
                onClaim={claimReward}
                locale={locale}
                txt={txt}
                typeLabels={typeLabels}
                getName={getName}
                getDesc={getDesc}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Rewards */}
      {regularRewards.length > 0 && (
        <div>
          {featuredRewards.length > 0 && (
            <h2 className="font-semibold text-white mb-4">{txt.allRewards}</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                currentPoints={currentPoints}
                claiming={claiming}
                onClaim={claimReward}
                locale={locale}
                txt={txt}
                typeLabels={typeLabels}
                getName={getName}
                getDesc={getDesc}
              />
            ))}
          </div>
        </div>
      )}

      {filteredRewards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{txt.noRewards}</p>
        </div>
      )}
    </div>
  );
}

function RewardCard({
  reward,
  currentPoints,
  claiming,
  onClaim,
  locale,
  txt,
  typeLabels,
  getName,
  getDesc,
}: {
  reward: Reward;
  currentPoints: number;
  claiming: string | null;
  onClaim: (id: string) => void;
  locale: string;
  txt: any;
  typeLabels: Record<string, { label: string; color: string }>;
  getName: (r: Reward) => string;
  getDesc: (r: Reward) => string;
}) {
  const typeConfig = typeLabels[reward.type] || { label: reward.type, color: "text-gray-400" };
  const canAfford = currentPoints >= reward.cost;
  const alreadyClaimed = reward.claimCount >= reward.maxPerUser;
  const outOfStock = reward.stock !== null && reward.stock <= 0;
  const isClaiming = claiming === reward.id;

  let statusText = "";
  let statusColor = "";

  if (alreadyClaimed) {
    statusText = txt.alreadyClaimed;
    statusColor = "text-green-400";
  } else if (outOfStock) {
    statusText = txt.outOfStock;
    statusColor = "text-red-400";
  } else if (!canAfford) {
    statusText = `${txt.missingPts} ${(reward.cost - currentPoints).toLocaleString()} ${txt.pts}`;
    statusColor = "text-amber-400";
  }

  return (
    <div
      className={`relative p-4 rounded-xl bg-gray-800/50 border transition-colors ${
        reward.canClaim
          ? "border-gray-700/50 hover:border-pink-500/30"
          : "border-gray-700/50 opacity-60"
      }`}
    >
      {reward.isFeatured && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-black text-xs font-bold rounded-full">
          ⭐ {txt.featured}
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: (reward.color || "#8B5CF6") + "30" }}
        >
          {reward.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">{getName(reward)}</h3>
            <span className={`text-xs ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {getDesc(reward)}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-4 h-4" />
              {reward.cost.toLocaleString()}
            </div>

            {statusText ? (
              <span className={`text-xs ${statusColor}`}>{statusText}</span>
            ) : reward.stock !== null ? (
              <span className="text-xs text-gray-500">
                {reward.stock} {txt.available}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <button
        onClick={() => onClaim(reward.id)}
        disabled={!reward.canClaim || isClaiming}
        className={`w-full mt-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
          reward.canClaim
            ? "bg-pink-500 hover:bg-pink-600 text-white"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isClaiming ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : alreadyClaimed ? (
          <>
            <Check className="w-4 h-4" />
            {txt.claimed}
          </>
        ) : outOfStock ? (
          <>
            <Lock className="w-4 h-4" />
            {txt.outOfStock}
          </>
        ) : !canAfford ? (
          <>
            <Lock className="w-4 h-4" />
            {txt.insufficientPoints}
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            {txt.claim}
          </>
        )}
      </button>
    </div>
  );
}
