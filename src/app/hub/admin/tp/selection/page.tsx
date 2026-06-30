"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
  UserCheck,
  ChevronDown,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Target,
  Award,
  Globe,
  Zap,
  Bot,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEqLevel } from "@/domains/eq/lib/eqLevels";
import {
  getBrainStyleLabel,
  getBrainStyleEmoji,
  getBrainStyleColor,
} from "@/domains/eq/lib/dictionary";

/* =========================================================
   Constants & Types
========================================================= */
const TP_BENCHMARK_ID = "tp-all-assessments-2025";
const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
type CompKey = (typeof COMP_KEYS)[number];

/* =========================================================
   Demo Candidate Data
   (Real candidate data not available in DB)
========================================================= */
interface Candidate {
  id: string;
  name: string;
  country: string;
  brainStyle: string;
  eqTotal: number;
  EL: number; RP: number; ACT: number; NE: number; IM: number; OP: number; EMP: number; NG: number;
  appliedRole: string; // will be matched against real role names
}

// Bilingual display names for coded job roles
const ROLE_DISPLAY_NAMES: Record<string, { es: string; en: string }> = {
  EMPLOYEE: { es: "Empleado", en: "Employee" },
  MANAGEMENT: { es: "Gerencia", en: "Management" },
  SENIOREXECUTIVE: { es: "Alta Dirección", en: "Senior Executive" },
  EDUCATOR: { es: "Educador", en: "Educator" },
  SALESMARKETING: { es: "Ventas y Marketing", en: "Sales & Marketing" },
  CONSULTANT: { es: "Consultor", en: "Consultant" },
  STUDENT: { es: "Estudiante", en: "Student" },
  FREELANCE: { es: "Freelance", en: "Freelance" },
  ENTREPRENUER: { es: "Emprendedor", en: "Entrepreneur" },
  RESEARCH: { es: "Investigación", en: "Research" },
  OTHER: { es: "Otro", en: "Other" },
  NONE: { es: "Sin especificar", en: "Not Specified" },
};

function displayRoleName(role: string, lang: string): string {
  const entry = ROLE_DISPLAY_NAMES[role];
  if (!entry) return role;
  return entry[lang as keyof typeof entry] || entry.es;
}

// Demo candidates — TP-style names from countries where TP operates
const DEMO_CANDIDATES: Candidate[] = [
  // EMPLOYEE role — 2 candidates
  { id: "C-001", name: "Ana Reyes Morales", country: "MX", brainStyle: "Strategist", eqTotal: 108.4, EL: 106.2, RP: 109.4, ACT: 110.8, NE: 105.6, IM: 110.2, OP: 108.4, EMP: 109.8, NG: 107.2, appliedRole: "EMPLOYEE" },
  { id: "C-002", name: "James Mitchell", country: "US", brainStyle: "Deliverer", eqTotal: 96.2, EL: 94.8, RP: 98.4, ACT: 99.2, NE: 93.4, IM: 96.8, OP: 95.4, EMP: 94.2, NG: 97.4, appliedRole: "EMPLOYEE" },
  // MANAGEMENT role — 2 candidates
  { id: "C-003", name: "Carlos Mendoza", country: "CO", brainStyle: "Sage", eqTotal: 112.8, EL: 114.2, RP: 113.6, ACT: 112.4, NE: 111.8, IM: 113.2, OP: 112.6, EMP: 114.8, NG: 110.8, appliedRole: "MANAGEMENT" },
  { id: "C-004", name: "Maria Santos Cruz", country: "PH", brainStyle: "Guardian", eqTotal: 99.6, EL: 98.2, RP: 101.4, ACT: 102.8, NE: 97.4, IM: 100.2, OP: 98.8, EMP: 100.4, NG: 97.6, appliedRole: "MANAGEMENT" },
  // SENIOREXECUTIVE role — 2 candidates
  { id: "C-005", name: "Elena Papadopoulos", country: "GR", brainStyle: "Visionary", eqTotal: 104.2, EL: 102.8, RP: 104.6, ACT: 103.4, NE: 106.2, IM: 104.8, OP: 105.4, EMP: 103.6, NG: 103.0, appliedRole: "SENIOREXECUTIVE" },
  { id: "C-006", name: "David Thompson", country: "GB", brainStyle: "Inventor", eqTotal: 101.4, EL: 100.2, RP: 103.8, ACT: 104.2, NE: 98.6, IM: 102.4, OP: 100.8, EMP: 99.4, NG: 102.0, appliedRole: "SENIOREXECUTIVE" },
  // SALESMARKETING role — 2 candidates
  { id: "C-007", name: "Valentina Torres", country: "PE", brainStyle: "Strategist", eqTotal: 110.6, EL: 108.4, RP: 111.2, ACT: 112.4, NE: 109.2, IM: 112.8, OP: 110.6, EMP: 111.4, NG: 108.8, appliedRole: "SALESMARKETING" },
  { id: "C-008", name: "Kowalski Pawel", country: "PL", brainStyle: "Scientist", eqTotal: 95.8, EL: 97.2, RP: 98.4, ACT: 96.8, NE: 93.2, IM: 95.4, OP: 94.6, EMP: 96.2, NG: 94.6, appliedRole: "SALESMARKETING" },
];

/* =========================================================
   Role Benchmark Interface (built from real API data)
========================================================= */
interface RoleBenchmark {
  id: string;
  name: string;
  displayName: string;
  count: number;
  idealEQ: number;
  minEQ: number;
  competencies: Record<CompKey, number>;
  topPerformer: Record<CompKey, number>;
  weight: Record<CompKey, number>;
}

/* =========================================================
   Helpers
========================================================= */
const COMP_TKEYS: Record<CompKey, string> = {
  EL: "compEL", RP: "compRP", ACT: "compACT", NE: "compNE",
  IM: "compIM", OP: "compOP", EMP: "compEMP", NG: "compNG",
};

// Spanish fallbacks for competency labels (used as the t() fallback).
const COMP_FALLBACKS_ES: Record<CompKey, string> = {
  EL: "Alfabetización Emocional",
  RP: "Reconocer Patrones",
  ACT: "Pensamiento Consecuente",
  NE: "Navegar Emociones",
  IM: "Motivación Intrínseca",
  OP: "Ejercer Optimismo",
  EMP: "Aumentar Empatía",
  NG: "Metas Nobles",
};

// Default even weights when we don't have role-specific weighting
const DEFAULT_WEIGHTS: Record<CompKey, number> = {
  EL: 0.125, RP: 0.125, ACT: 0.125, NE: 0.125,
  IM: 0.125, OP: 0.125, EMP: 0.125, NG: 0.125,
};

function calcFitScore(cand: Candidate, role: RoleBenchmark): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of COMP_KEYS) {
    const capped = Math.min(cand[key] / role.competencies[key], 1.0);
    weightedSum += capped * role.weight[key];
    totalWeight += role.weight[key];
  }
  return (weightedSum / totalWeight) * 100;
}

function fitColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function fitBg(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function fitBgLight(score: number): string {
  if (score >= 80) return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
  if (score >= 60) return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
  return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
}

/**
 * Try to match a demo candidate's appliedRole to a real role name.
 * Uses case-insensitive substring matching.
 */
function candidateMatchesRole(candidateRole: string, realRoleName: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return norm(realRoleName).includes(norm(candidateRole)) || norm(candidateRole).includes(norm(realRoleName));
}

/* =========================================================
   Radar Chart Component
========================================================= */
function RadarChart({
  candidateData,
  benchmarkData,
  topData,
  labels,
  legendCandidate,
  legendBenchmark,
  legendTop,
}: {
  candidateData: Record<CompKey, number>;
  benchmarkData: Record<CompKey, number>;
  topData: Record<CompKey, number>;
  labels: string[];
  legendCandidate: string;
  legendBenchmark: string;
  legendTop: string;
}) {
  const cx = 150, cy = 150, maxR = 110;
  const minVal = 80, maxVal = 130;

  function toRadius(val: number) {
    return ((Math.min(Math.max(val, minVal), maxVal) - minVal) / (maxVal - minVal)) * maxR;
  }

  function getPoints(data: Record<CompKey, number>) {
    return COMP_KEYS.map((key, i) => {
      const angle = (Math.PI * 2 * i) / COMP_KEYS.length - Math.PI / 2;
      const r = toRadius(data[key]);
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
  }

  function toPath(points: { x: number; y: number }[]) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";
  }

  const gridLevels = [85, 95, 105, 115, 125];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-sm">
        {gridLevels.map((level) => {
          const pts = COMP_KEYS.map((_, i) => {
            const angle = (Math.PI * 2 * i) / COMP_KEYS.length - Math.PI / 2;
            const r = toRadius(level);
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          });
          return <polygon key={level} points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-zinc-700" />;
        })}
        {COMP_KEYS.map((_, i) => {
          const angle = (Math.PI * 2 * i) / COMP_KEYS.length - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-zinc-700" />;
        })}
        <motion.path d={toPath(getPoints(topData))} fill="rgba(234, 179, 8, 0.1)" stroke="#eab308" strokeWidth="1.5" strokeDasharray="6 3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} />
        <motion.path d={toPath(getPoints(benchmarkData))} fill="rgba(59, 130, 246, 0.12)" stroke="#3b82f6" strokeWidth="2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }} />
        <motion.path d={toPath(getPoints(candidateData))} fill="rgba(147, 51, 234, 0.15)" stroke="#9333ea" strokeWidth="2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }} />
        {getPoints(candidateData).map((p, i) => (
          <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill="#9333ea" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }} />
        ))}
        {COMP_KEYS.map((key, i) => {
          const angle = (Math.PI * 2 * i) / COMP_KEYS.length - Math.PI / 2;
          const lx = cx + (maxR + 20) * Math.cos(angle);
          const ly = cy + (maxR + 20) * Math.sin(angle);
          return <text key={key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-current text-[var(--rowi-muted)]" fontSize="9" fontWeight="600">{labels[i]}</text>;
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" /><span>{legendCandidate}</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /><span>{legendBenchmark}</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" /><span>{legendTop}</span></div>
      </div>
    </div>
  );
}

/* =========================================================
   Fit Score Gauge
========================================================= */
function FitGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="7" fill="none" className="text-gray-200 dark:text-zinc-800" />
        <motion.circle cx="50" cy="50" r="36" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round" initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: "easeOut" }} style={{ strokeDasharray: circumference }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{score.toFixed(0)}%</span>
      </div>
    </div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPSelectionPage() {
  const { lang, t } = useI18n();

  /* ---- API state ---- */
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [roleStats, setRoleStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* ---- UI state ---- */
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");

  /* ---- Fetch real data ---- */
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [topRes, roleRes] = await Promise.all([
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/top-performers`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=jobRole`),
        ]);
        const topData = await topRes.json();
        const roleData = await roleRes.json();
        if (topData.ok) setTopPerformers(topData.topPerformers || []);
        if (roleData.ok) setRoleStats(roleData.groups || []);
      } catch (e) {
        console.error("Error loading TP selection data:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---- Build role benchmarks from REAL data ---- */
  const roleBenchmarks: RoleBenchmark[] = useMemo(() => {
    return roleStats.map((role) => {
      // Find top performer data for this role (if available)
      const roleTopPerformer = topPerformers.find(
        (tp) => tp.jobRole === role.name
      );

      // Build competencies from real role stats means
      const competencies: Record<CompKey, number> = {
        EL: role.metrics?.EL?.mean || 100,
        RP: role.metrics?.RP?.mean || 100,
        ACT: role.metrics?.ACT?.mean || 100,
        NE: role.metrics?.NE?.mean || 100,
        IM: role.metrics?.IM?.mean || 100,
        OP: role.metrics?.OP?.mean || 100,
        EMP: role.metrics?.EMP?.mean || 100,
        NG: role.metrics?.NG?.mean || 100,
      };

      // Build top performer competencies
      // Use the top performer's avg values if available, otherwise use competencies + 10% offset
      const topPerformerComps: Record<CompKey, number> = { ...competencies };
      if (roleTopPerformer) {
        for (const key of COMP_KEYS) {
          const avgKey = `avg${key}` as string;
          if (roleTopPerformer[avgKey] != null) {
            topPerformerComps[key] = roleTopPerformer[avgKey];
          } else {
            // Fallback: check topCompetencies array
            const found = roleTopPerformer.topCompetencies?.find(
              (c: any) => c.key === key
            );
            if (found?.avgScore != null) {
              topPerformerComps[key] = found.avgScore;
            } else {
              // Default: 10% above role mean
              topPerformerComps[key] = competencies[key] * 1.1;
            }
          }
        }
      } else {
        // No top performer data — estimate as 10% above role mean
        for (const key of COMP_KEYS) {
          topPerformerComps[key] = Math.round(competencies[key] * 1.1 * 100) / 100;
        }
      }

      // Determine weighting from stdDev — higher variance = more discriminating = higher weight
      const weights: Record<CompKey, number> = { ...DEFAULT_WEIGHTS };
      const stdDevs = COMP_KEYS.map((key) => role.metrics?.[key]?.stdDev || 0);
      const totalStdDev = stdDevs.reduce((a, b) => a + b, 0);
      if (totalStdDev > 0) {
        COMP_KEYS.forEach((key, i) => {
          weights[key] = stdDevs[i] / totalStdDev;
        });
      }

      const idealEQ = role.metrics?.eqTotal?.mean || 100;
      const stdDevEQ = role.metrics?.eqTotal?.stdDev || 10;
      const minEQ = Math.round((idealEQ - stdDevEQ) * 100) / 100;

      return {
        id: role.name,
        name: role.name,
        displayName: displayRoleName(role.name, lang),
        count: role.count,
        idealEQ: Math.round(idealEQ * 100) / 100,
        minEQ: Math.round(minEQ * 100) / 100,
        competencies,
        topPerformer: topPerformerComps,
        weight: weights,
      };
    });
  }, [roleStats, topPerformers, lang]);

  /* ---- Selected role ---- */
  const selectedRole = roleBenchmarks.find((r) => r.id === selectedRoleId);

  /* ---- Map demo candidates to real roles and calculate fit scores ---- */
  const roleCandidates = useMemo(() => {
    if (!selectedRole) return [];
    return DEMO_CANDIDATES
      .filter((c) => candidateMatchesRole(c.appliedRole, selectedRole.name))
      .map((c) => ({ ...c, fitScore: calcFitScore(c, selectedRole) }))
      .sort((a, b) => b.fitScore - a.fitScore);
  }, [selectedRole]);

  const selectedCandidate = roleCandidates.find((c) => c.id === selectedCandidateId);
  const compLabelsShort = COMP_KEYS.map((key) => key);

  // Translate a competency key (EL, RP, ...) to its localized label.
  const compLabel = (key: CompKey): string =>
    t(`tpSelection.${COMP_TKEYS[key]}`, COMP_FALLBACKS_ES[key]);

  // Translate a gap status (exceeds / meets / below) to its localized label.
  const statusLabel = (status: "exceeds" | "meets" | "below"): string => {
    const fallback = status === "exceeds" ? "Supera" : status === "meets" ? "Cumple" : "Debajo";
    return t(`tpSelection.${status}`, fallback);
  };

  const gapData = useMemo(() => {
    if (!selectedCandidate || !selectedRole) return [];
    return COMP_KEYS.map((key) => {
      const candidateVal = selectedCandidate[key];
      const benchVal = selectedRole.competencies[key];
      const gap = candidateVal - benchVal;
      const status: "exceeds" | "meets" | "below" = gap > 2 ? "exceeds" : gap >= -2 ? "meets" : "below";
      return { key, candidateVal, benchVal, topVal: selectedRole.topPerformer[key], gap, status };
    });
  }, [selectedCandidate, selectedRole]);

  const strengths = gapData.filter((g) => g.status === "exceeds");
  const devAreas = gapData.filter((g) => g.status === "below");

  function getRecommendation(cand: typeof roleCandidates[0] | undefined) {
    if (!cand || !selectedRole) return { text: "", action: "" };
    const fit = cand.fitScore;
    const exceedsList = strengths.map((s) => s.key).join(", ");
    const devList = devAreas.map((d) => d.key).join(", ");
    const role = selectedRole.displayName;
    if (fit >= 90) {
      const exceeds = exceedsList || t("tpSelection.recAllCompetencies", "todas las competencias");
      const devClause = devList
        ? t("tpSelection.recExcellentDev", "Desarrollo menor en {dev}.").replace("{dev}", devList)
        : t("tpSelection.recExcellentNoDev", "Sin brechas significativas.");
      return {
        text: t(
          "tpSelection.recExcellent",
          "Excelente ajuste para {role}. Supera el benchmark en {exceeds} que son críticas para el rol. {devClause} EQ total ({eqTotal}) supera el ideal del rol ({idealEQ}).",
        )
          .replace("{role}", role)
          .replace("{exceeds}", exceeds)
          .replace("{devClause}", devClause)
          .replace("{eqTotal}", String(cand.eqTotal))
          .replace("{idealEQ}", String(selectedRole.idealEQ)),
        action: t("tpSelection.hire", "CONTRATAR"),
      };
    }
    if (fit >= 75) {
      const exceedsClause = exceedsList
        ? t("tpSelection.recGoodStrengths", "Fortalezas en {exceeds}.").replace("{exceeds}", exceedsList)
        : "";
      const devClause = devList
        ? t("tpSelection.recGoodDev", "Desarrollo necesario en {dev}.").replace("{dev}", devList)
        : "";
      const meetsClause =
        cand.eqTotal >= selectedRole.minEQ
          ? t("tpSelection.recMeetsMin", "cumple")
          : t("tpSelection.recBelowMin", "no alcanza");
      return {
        text: t(
          "tpSelection.recGood",
          "Buen ajuste para {role}. {exceedsClause} {devClause} EQ total ({eqTotal}) {meetsClause} el mínimo del rol ({minEQ}).",
        )
          .replace("{role}", role)
          .replace("{exceedsClause}", exceedsClause)
          .replace("{devClause}", devClause)
          .replace("{eqTotal}", String(cand.eqTotal))
          .replace("{meetsClause}", meetsClause)
          .replace("{minEQ}", String(selectedRole.minEQ)),
        action: t("tpSelection.hireWithCoaching", "CONTRATAR con plan de coaching"),
      };
    }
    if (fit >= 60) {
      const dev = devList || t("tpSelection.recSeveralCompetencies", "varias competencias");
      const potentialClause = exceedsList
        ? t("tpSelection.recModeratePotential", "Potencial en {exceeds}.").replace("{exceeds}", exceedsList)
        : "";
      return {
        text: t(
          "tpSelection.recModerate",
          "Ajuste moderado para {role}. Brechas notables en {dev}. {potentialClause} Requiere evaluación adicional y plan de desarrollo intensivo.",
        )
          .replace("{role}", role)
          .replace("{dev}", dev)
          .replace("{potentialClause}", potentialClause),
        action: t("tpSelection.consider", "CONSIDERAR — revisar áreas de desarrollo"),
      };
    }
    const dev = devList || t("tpSelection.recMultipleCompetencies", "múltiples competencias");
    return {
      text: t(
        "tpSelection.recWeak",
        "Ajuste débil para {role}. Brechas significativas en {dev}. EQ total ({eqTotal}) debajo del mínimo del rol ({minEQ}). No se recomienda para esta posición.",
      )
        .replace("{role}", role)
        .replace("{dev}", dev)
        .replace("{eqTotal}", String(cand.eqTotal))
        .replace("{minEQ}", String(selectedRole.minEQ)),
      action: t("tpSelection.notRecommended", "NO RECOMENDADO — perfil no cumple mínimos"),
    };
  }

  const recommendation = getRecommendation(selectedCandidate);

  /* ---- Loading State ---- */
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> {t("tpSelection.backToHub", "TP Hub")}
          </Link>
          <div className="flex flex-col gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 w-fit">
              <Sparkles className="w-3 h-3" /> {t("tpSelection.badge", "Proceso de Selección")}
            </span>
            <h1 className="text-3xl font-bold">{t("tpSelection.pageTitle", "Selección y Contratación EQ")}</h1>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-[var(--rowi-muted)]">{t("tpSelection.loading", "Cargando datos de benchmarks...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("tpSelection.backToHub", "TP Hub")}
        </Link>
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 w-fit">
            <Sparkles className="w-3 h-3" /> {t("tpSelection.badge", "Proceso de Selección")}
          </span>
          <h1 className="text-3xl font-bold">{t("tpSelection.pageTitle", "Selección y Contratación EQ")}</h1>
          <p className="text-[var(--rowi-muted)] max-w-2xl">{t("tpSelection.pageSubtitle", "Evalúa candidatos contra benchmarks de rol y top performers. Calcula fit scores y recomienda decisiones de contratación.")}</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{t("tpSelection.errorLoading", "Error al cargar datos. Intenta de nuevo.")}</span>
        </div>
      )}

      {/* Role Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" /> {t("tpSelection.roleSelector", "Seleccionar Rol")}
          {roleBenchmarks.length > 0 && (
            <span className="text-xs font-normal text-[var(--rowi-muted)] ml-2">
              ({roleBenchmarks.length} {t("tpSelection.nRoles", "roles encontrados")})
            </span>
          )}
        </h2>
        <div className="relative">
          <select
            value={selectedRoleId}
            onChange={(e) => { setSelectedRoleId(e.target.value); setSelectedCandidateId(""); }}
            className="w-full appearance-none bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="">{t("tpSelection.roleSelectorPlaceholder", "Elige un rol para evaluar candidatos...")}</option>
            {roleBenchmarks.map((role) => (
              <option key={role.id} value={role.id}>
                {role.displayName} — {role.count} {t("tpSelection.participants", "participantes")}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)] pointer-events-none" />
        </div>
        {selectedRole && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
              <div className="text-xs text-[var(--rowi-muted)] mb-1">{t("tpSelection.participants", "participantes")}</div>
              <div className="font-bold text-purple-600">{selectedRole.count}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <div className="text-xs text-[var(--rowi-muted)] mb-1">{t("tpSelection.idealEQ", "EQ Ideal")}</div>
              <div className="font-bold text-blue-600">{selectedRole.idealEQ}</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
              <div className="text-xs text-[var(--rowi-muted)] mb-1">{t("tpSelection.minEQ", "EQ Mínimo")}</div>
              <div className="font-bold text-amber-600">{selectedRole.minEQ}</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* No Role Selected */}
      {!selectedRole && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
          <UserCheck className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-4 opacity-40" />
          <p className="text-[var(--rowi-muted)]">{t("tpSelection.noRoleSelected", "Selecciona un rol para comenzar la evaluación de candidatos")}</p>
        </motion.div>
      )}

      {/* Candidates for Role */}
      {selectedRole && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-purple-500" /> {t("tpSelection.candidatesFor", "Candidatos para")} {selectedRole.displayName}</h2>

          {/* Demo Data Banner */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{t("tpSelection.demoDataBanner", "Los candidatos mostrados son datos de demostración. Los benchmarks de rol están basados en datos reales de TP.")}</span>
          </div>

          {roleCandidates.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-100 dark:border-zinc-800"><p className="text-[var(--rowi-muted)]">{t("tpSelection.noCandidates", "No hay candidatos para este rol")}</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleCandidates.map((cand, i) => (
                <motion.button key={cand.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} onClick={() => setSelectedCandidateId(cand.id)} className={`text-left bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border-2 transition-all hover:shadow-md ${selectedCandidateId === cand.id ? "border-purple-500 ring-2 ring-purple-500/20" : "border-gray-100 dark:border-zinc-800 hover:border-purple-300"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-base">{cand.name}</div>
                      <div className="flex items-center gap-2 text-xs text-[var(--rowi-muted)] mt-1"><Globe className="w-3 h-3" /> {cand.country}</div>
                    </div>
                    <FitGauge score={cand.fitScore} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${getBrainStyleColor(cand.brainStyle)}15`, color: getBrainStyleColor(cand.brainStyle) }}><Brain className="w-3 h-3" /> {getBrainStyleEmoji(cand.brainStyle)} {getBrainStyleLabel(cand.brainStyle, lang)}</span>
                    <span className={`text-xs font-semibold ${fitColor(cand.fitScore)}`}>{t("tpSelection.fitScore", "Fit Score")}: {cand.fitScore.toFixed(1)}%</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Candidate Detail */}
      <AnimatePresence mode="wait">
        {selectedCandidate && selectedRole && (
          <motion.div key={selectedCandidate.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" /> {t("tpSelection.candidateDetail", "Detalle del Candidato")}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                <div className="flex-1">
                  <div className="text-2xl font-bold">{selectedCandidate.name}</div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--rowi-muted)]">
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {selectedCandidate.country}</span>
                    <span className="flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> {getBrainStyleEmoji(selectedCandidate.brainStyle)} {getBrainStyleLabel(selectedCandidate.brainStyle, lang)}</span>
                    <span className="font-mono">EQ: {selectedCandidate.eqTotal}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FitGauge score={selectedCandidate.fitScore} />
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${fitColor(selectedCandidate.fitScore)}`}>{selectedCandidate.fitScore.toFixed(1)}%</div>
                    <div className="text-xs text-[var(--rowi-muted)]">{t("tpSelection.fitScore", "Fit Score")}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" /> {t("tpSelection.competencyComparison", "Comparación de Competencias")}</h3>
                <RadarChart candidateData={Object.fromEntries(COMP_KEYS.map((k) => [k, selectedCandidate[k]])) as Record<CompKey, number>} benchmarkData={selectedRole.competencies} topData={selectedRole.topPerformer} labels={compLabelsShort} legendCandidate={t("tpSelection.radarCandidate", "Candidato")} legendBenchmark={t("tpSelection.radarBenchmark", "Benchmark Rol")} legendTop={t("tpSelection.radarTop", "Top Performer")} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-500" /> {t("tpSelection.gapAnalysis", "Análisis de Brechas")}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-zinc-800">
                        <th className="text-left py-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.competency", "Competencia")}</th>
                        <th className="text-center py-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.candidate", "Candidato")}</th>
                        <th className="text-center py-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.benchmark", "Benchmark")}</th>
                        <th className="text-center py-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.gap", "Brecha")}</th>
                        <th className="text-center py-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.status", "Estado")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gapData.map((row, i) => (
                        <motion.tr key={row.key} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="border-b border-gray-50 dark:border-zinc-800/50">
                          <td className="py-2.5 font-medium">{compLabel(row.key)}</td>
                          <td className="py-2.5 text-center font-mono">{row.candidateVal.toFixed(1)}</td>
                          <td className="py-2.5 text-center font-mono text-blue-500">{row.benchVal.toFixed(1)}</td>
                          <td className="py-2.5 text-center font-mono">
                            <span className={row.gap > 0 ? "text-emerald-500" : row.gap < -2 ? "text-red-500" : "text-amber-500"}>{row.gap > 0 ? "+" : ""}{row.gap.toFixed(1)}</span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${row.status === "exceeds" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : row.status === "meets" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                              {row.status === "exceeds" && <TrendingUp className="w-3 h-3" />}
                              {row.status === "meets" && <Minus className="w-3 h-3" />}
                              {row.status === "below" && <TrendingDown className="w-3 h-3" />}
                              {statusLabel(row.status)}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> {t("tpSelection.strengths", "Fortalezas")}</h4>
                {strengths.length > 0 ? (
                  <ul className="space-y-1.5">{strengths.map((s) => (
                    <li key={s.key} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 flex-shrink-0" /><span className="font-medium">{compLabel(s.key)}</span><span className="font-mono text-xs ml-auto">+{s.gap.toFixed(1)}</span></li>
                  ))}</ul>
                ) : (<p className="text-sm text-emerald-600 dark:text-emerald-400 opacity-60">--</p>)}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
                <h4 className="font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2"><TrendingDown className="w-4 h-4" /> {t("tpSelection.developmentAreas", "Áreas de Desarrollo")}</h4>
                {devAreas.length > 0 ? (
                  <ul className="space-y-1.5">{devAreas.map((d) => (
                    <li key={d.key} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><TrendingDown className="w-3.5 h-3.5 flex-shrink-0" /><span className="font-medium">{compLabel(d.key)}</span><span className="font-mono text-xs ml-auto">{d.gap.toFixed(1)}</span></li>
                  ))}</ul>
                ) : (<p className="text-sm text-red-600 dark:text-red-400 opacity-60">--</p>)}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-6 border ${fitBgLight(selectedCandidate.fitScore)}`}>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Bot className="w-5 h-5 text-purple-500" /> {t("tpSelection.aiRecommendation", "Recomendación IA")}</h3>
              <p className="text-sm leading-relaxed mb-4">{recommendation.text}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--rowi-muted)]">{t("tpSelection.recommendedAction", "Acción Recomendada")}:</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${selectedCandidate.fitScore >= 90 ? "bg-emerald-500 text-white" : selectedCandidate.fitScore >= 75 ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" : selectedCandidate.fitScore >= 60 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"}`}>
                  {selectedCandidate.fitScore >= 90 && <UserCheck className="w-3.5 h-3.5" />}
                  {recommendation.action}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select candidate prompt */}
      {selectedRole && roleCandidates.length > 0 && !selectedCandidate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
          <Award className="w-10 h-10 text-[var(--rowi-muted)] mx-auto mb-3 opacity-40" />
          <p className="text-[var(--rowi-muted)]">{t("tpSelection.selectCandidate", "Selecciona un candidato para ver el análisis detallado")}</p>
        </motion.div>
      )}

      {/* Ranking Table */}
      {selectedRole && roleCandidates.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-purple-500" /> {t("tpSelection.rankingTitle", "Ranking de Candidatos")}</h2>

          {/* Demo Data Banner */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{t("tpSelection.demoDataBanner", "Los candidatos mostrados son datos de demostración. Los benchmarks de rol están basados en datos reales de TP.")}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  <th className="text-left py-3 px-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.rank", "Pos")}</th>
                  <th className="text-left py-3 px-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.name", "Nombre")}</th>
                  <th className="text-center py-3 px-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.fitScore", "Fit Score")}</th>
                  <th className="text-center py-3 px-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.brainStyle", "Estilo Cerebral")}</th>
                  <th className="text-left py-3 px-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.topStrength", "Mayor Fortaleza")}</th>
                  <th className="text-left py-3 px-2 text-[var(--rowi-muted)] font-medium">{t("tpSelection.biggestGap", "Mayor Brecha")}</th>
                </tr>
              </thead>
              <tbody>
                {roleCandidates.map((cand, i) => {
                  const gaps = COMP_KEYS.map((key) => ({ key, gap: cand[key] - selectedRole.competencies[key] }));
                  const bestGap = gaps.reduce((a, b) => (a.gap > b.gap ? a : b));
                  const worstGap = gaps.reduce((a, b) => (a.gap < b.gap ? a : b));
                  return (
                    <motion.tr key={cand.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} onClick={() => setSelectedCandidateId(cand.id)} className={`border-b border-gray-50 dark:border-zinc-800/50 cursor-pointer transition-colors hover:bg-purple-50/50 dark:hover:bg-purple-900/10 ${selectedCandidateId === cand.id ? "bg-purple-50 dark:bg-purple-900/20" : ""}`}>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${i === 0 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600" : i === 1 ? "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300" : i === 2 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600" : "bg-gray-50 dark:bg-zinc-800 text-[var(--rowi-muted)]"}`}>{i + 1}</span>
                      </td>
                      <td className="py-3 px-2 font-medium">{cand.name}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div className={`h-full rounded-full ${fitBg(cand.fitScore)}`} initial={{ width: 0 }} animate={{ width: `${cand.fitScore}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                          </div>
                          <span className={`font-mono font-bold text-xs ${fitColor(cand.fitScore)}`}>{cand.fitScore.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${getBrainStyleColor(cand.brainStyle)}15`, color: getBrainStyleColor(cand.brainStyle) }}>{getBrainStyleEmoji(cand.brainStyle)} {getBrainStyleLabel(cand.brainStyle, lang)}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-emerald-500 text-xs font-medium">{compLabel(bestGap.key as CompKey)} (+{bestGap.gap.toFixed(1)})</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-xs font-medium ${worstGap.gap < -2 ? "text-red-500" : "text-amber-500"}`}>{compLabel(worstGap.key as CompKey)} ({worstGap.gap.toFixed(1)})</span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Info Box */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t("tpSelection.infoTitle", "Datos de Selección TP")}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">{t("tpSelection.infoDesc", "Esta herramienta utiliza benchmarks EQ por rol basados en datos reales de top performers de Teleperformance. Los fit scores son calculados con ponderación por competencia según la criticidad del rol. Todos los datos están anonimizados.")}</p>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/teams" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t("tpSelection.navTeams", "Teams")}
        </Link>
        <Link href="/hub/admin/tp/evolution" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity">
          {t("tpSelection.navEvolution", "Evolución")} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
