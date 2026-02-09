"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badge: "Proceso de Selección",
    pageTitle: "Selección y Contratación EQ",
    pageSubtitle: "Evalúa candidatos contra benchmarks de rol y top performers. Calcula fit scores y recomienda decisiones de contratación.",
    roleSelector: "Seleccionar Rol",
    roleSelectorPlaceholder: "Elige un rol para evaluar candidatos...",
    department: "Departamento",
    idealEQ: "EQ Ideal",
    minEQ: "EQ Mínimo",
    candidatesFor: "Candidatos para",
    noCandidates: "No hay candidatos para este rol",
    fitScore: "Fit Score",
    country: "País",
    brainStyle: "Estilo Cerebral",
    candidateDetail: "Detalle del Candidato",
    competencyComparison: "Comparación de Competencias",
    candidate: "Candidato",
    benchmark: "Benchmark",
    topPerformer: "Top Performer",
    gapAnalysis: "Análisis de Brechas",
    competency: "Competencia",
    score: "Puntaje",
    gap: "Brecha",
    status: "Estado",
    exceeds: "Supera",
    meets: "Cumple",
    below: "Debajo",
    overallAssessment: "Evaluación General",
    strengths: "Fortalezas",
    developmentAreas: "Áreas de Desarrollo",
    rankingTitle: "Ranking de Candidatos",
    rank: "Pos",
    name: "Nombre",
    topStrength: "Mayor Fortaleza",
    biggestGap: "Mayor Brecha",
    aiRecommendation: "Recomendación IA",
    hire: "CONTRATAR",
    hireWithCoaching: "CONTRATAR con plan de coaching",
    consider: "CONSIDERAR — revisar áreas de desarrollo",
    notRecommended: "NO RECOMENDADO — perfil no cumple mínimos",
    selectCandidate: "Selecciona un candidato para ver el análisis detallado",
    infoTitle: "Datos de Selección TP",
    infoDesc: "Esta herramienta utiliza benchmarks EQ por rol basados en datos reales de top performers de Teleperformance. Los fit scores son calculados con ponderación por competencia según la criticidad del rol. Todos los datos están anonimizados.",
    navTeams: "Teams",
    navEvolution: "Evolución",
    compEL: "Alfabetización Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivación Intrínseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatía",
    compNG: "Metas Nobles",
    radarCandidate: "Candidato",
    radarBenchmark: "Benchmark Rol",
    radarTop: "Top Performer",
    recommendedAction: "Acción Recomendada",
    noRoleSelected: "Selecciona un rol para comenzar la evaluación de candidatos",
  },
  en: {
    backToHub: "TP Hub",
    badge: "Selection Process",
    pageTitle: "EQ Hiring & Selection",
    pageSubtitle: "Evaluate candidates against role benchmarks and top performers. Calculate fit scores and recommend hiring decisions.",
    roleSelector: "Select Role",
    roleSelectorPlaceholder: "Choose a role to evaluate candidates...",
    department: "Department",
    idealEQ: "Ideal EQ",
    minEQ: "Min EQ",
    candidatesFor: "Candidates for",
    noCandidates: "No candidates for this role",
    fitScore: "Fit Score",
    country: "Country",
    brainStyle: "Brain Style",
    candidateDetail: "Candidate Detail",
    competencyComparison: "Competency Comparison",
    candidate: "Candidate",
    benchmark: "Benchmark",
    topPerformer: "Top Performer",
    gapAnalysis: "Gap Analysis",
    competency: "Competency",
    score: "Score",
    gap: "Gap",
    status: "Status",
    exceeds: "Exceeds",
    meets: "Meets",
    below: "Below",
    overallAssessment: "Overall Assessment",
    strengths: "Strengths",
    developmentAreas: "Development Areas",
    rankingTitle: "Candidate Ranking",
    rank: "Rank",
    name: "Name",
    topStrength: "Top Strength",
    biggestGap: "Biggest Gap",
    aiRecommendation: "AI Recommendation",
    hire: "HIRE",
    hireWithCoaching: "HIRE with coaching plan",
    consider: "CONSIDER — review development areas",
    notRecommended: "NOT RECOMMENDED — profile below minimums",
    selectCandidate: "Select a candidate to view detailed analysis",
    infoTitle: "TP Selection Data",
    infoDesc: "This tool uses role-based EQ benchmarks from real Teleperformance top performer data. Fit scores are calculated with per-competency weighting based on role criticality. All data is anonymized.",
    navTeams: "Teams",
    navEvolution: "Evolution",
    compEL: "Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Noble Goals",
    radarCandidate: "Candidate",
    radarBenchmark: "Role Benchmark",
    radarTop: "Top Performer",
    recommendedAction: "Recommended Action",
    noRoleSelected: "Select a role to start evaluating candidates",
  },
};

/* =========================================================
   Mock Data
========================================================= */
const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
type CompKey = (typeof COMP_KEYS)[number];

const ROLE_BENCHMARKS = [
  { id: "role-cs", name: { es: "Servicio al Cliente", en: "Customer Service" }, department: { es: "Soporte", en: "Support" }, idealEQ: 102, minEQ: 92, competencies: { EL: 100, RP: 102, ACT: 104, NE: 98, IM: 103, OP: 101, EMP: 106, NG: 100 } as Record<CompKey, number>, topPerformer: { EL: 112, RP: 114, ACT: 116, NE: 110, IM: 115, OP: 113, EMP: 118, NG: 112 } as Record<CompKey, number>, weight: { EL: 0.1, RP: 0.1, ACT: 0.15, NE: 0.1, IM: 0.1, OP: 0.1, EMP: 0.25, NG: 0.1 } as Record<CompKey, number> },
  { id: "role-sales", name: { es: "Ventas", en: "Sales" }, department: { es: "Comercial", en: "Commercial" }, idealEQ: 106, minEQ: 95, competencies: { EL: 104, RP: 106, ACT: 108, NE: 102, IM: 110, OP: 108, EMP: 104, NG: 106 } as Record<CompKey, number>, topPerformer: { EL: 114, RP: 116, ACT: 118, NE: 112, IM: 120, OP: 118, EMP: 114, NG: 116 } as Record<CompKey, number>, weight: { EL: 0.08, RP: 0.12, ACT: 0.15, NE: 0.08, IM: 0.2, OP: 0.15, EMP: 0.1, NG: 0.12 } as Record<CompKey, number> },
  { id: "role-hr", name: { es: "Recursos Humanos", en: "Human Resources" }, department: { es: "People", en: "People" }, idealEQ: 110, minEQ: 98, competencies: { EL: 110, RP: 108, ACT: 106, NE: 112, IM: 108, OP: 110, EMP: 116, NG: 110 } as Record<CompKey, number>, topPerformer: { EL: 118, RP: 116, ACT: 114, NE: 120, IM: 116, OP: 118, EMP: 124, NG: 118 } as Record<CompKey, number>, weight: { EL: 0.12, RP: 0.1, ACT: 0.08, NE: 0.15, IM: 0.08, OP: 0.12, EMP: 0.25, NG: 0.1 } as Record<CompKey, number> },
  { id: "role-it", name: { es: "Soporte IT", en: "IT Support" }, department: { es: "Tecnología", en: "Technology" }, idealEQ: 98, minEQ: 88, competencies: { EL: 96, RP: 102, ACT: 106, NE: 94, IM: 100, OP: 96, EMP: 94, NG: 98 } as Record<CompKey, number>, topPerformer: { EL: 108, RP: 114, ACT: 118, NE: 106, IM: 112, OP: 108, EMP: 106, NG: 110 } as Record<CompKey, number>, weight: { EL: 0.08, RP: 0.15, ACT: 0.25, NE: 0.08, IM: 0.12, OP: 0.1, EMP: 0.08, NG: 0.14 } as Record<CompKey, number> },
  { id: "role-ops", name: { es: "Operaciones", en: "Operations" }, department: { es: "Operaciones", en: "Operations" }, idealEQ: 100, minEQ: 90, competencies: { EL: 98, RP: 104, ACT: 106, NE: 96, IM: 102, OP: 100, EMP: 98, NG: 102 } as Record<CompKey, number>, topPerformer: { EL: 110, RP: 116, ACT: 118, NE: 108, IM: 114, OP: 112, EMP: 110, NG: 114 } as Record<CompKey, number>, weight: { EL: 0.1, RP: 0.15, ACT: 0.2, NE: 0.08, IM: 0.12, OP: 0.1, EMP: 0.1, NG: 0.15 } as Record<CompKey, number> },
];

interface Candidate {
  id: string;
  name: string;
  country: string;
  brainStyle: string;
  eqTotal: number;
  EL: number; RP: number; ACT: number; NE: number; IM: number; OP: number; EMP: number; NG: number;
  appliedRole: string;
}

const CANDIDATES: Candidate[] = [
  { id: "C-001", name: "María López", country: "México", brainStyle: "Strategist", eqTotal: 108.4, EL: 106.2, RP: 109.4, ACT: 110.8, NE: 105.6, IM: 110.2, OP: 108.4, EMP: 109.8, NG: 107.2, appliedRole: "role-sales" },
  { id: "C-002", name: "John Smith", country: "USA", brainStyle: "Deliverer", eqTotal: 96.2, EL: 94.8, RP: 98.4, ACT: 99.2, NE: 93.4, IM: 96.8, OP: 95.4, EMP: 94.2, NG: 97.4, appliedRole: "role-cs" },
  { id: "C-003", name: "Yuki Sato", country: "Japan", brainStyle: "Scientist", eqTotal: 112.8, EL: 114.2, RP: 113.6, ACT: 112.4, NE: 111.8, IM: 113.2, OP: 112.6, EMP: 114.8, NG: 110.8, appliedRole: "role-hr" },
  { id: "C-004", name: "Ahmed Hassan", country: "Egypt", brainStyle: "Guardian", eqTotal: 99.6, EL: 98.2, RP: 101.4, ACT: 102.8, NE: 97.4, IM: 100.2, OP: 98.8, EMP: 100.4, NG: 97.6, appliedRole: "role-ops" },
  { id: "C-005", name: "Sophie Martin", country: "France", brainStyle: "Visionary", eqTotal: 104.2, EL: 102.8, RP: 104.6, ACT: 103.4, NE: 106.2, IM: 104.8, OP: 105.4, EMP: 103.6, NG: 103.0, appliedRole: "role-cs" },
  { id: "C-006", name: "Raj Patel", country: "India", brainStyle: "Inventor", eqTotal: 101.4, EL: 100.2, RP: 103.8, ACT: 104.2, NE: 98.6, IM: 102.4, OP: 100.8, EMP: 99.4, NG: 102.0, appliedRole: "role-it" },
  { id: "C-007", name: "Laura García", country: "Colombia", brainStyle: "Strategist", eqTotal: 110.6, EL: 108.4, RP: 111.2, ACT: 112.4, NE: 109.2, IM: 112.8, OP: 110.6, EMP: 111.4, NG: 108.8, appliedRole: "role-sales" },
  { id: "C-008", name: "Chen Wei", country: "China", brainStyle: "Scientist", eqTotal: 95.8, EL: 97.2, RP: 98.4, ACT: 96.8, NE: 93.2, IM: 95.4, OP: 94.6, EMP: 96.2, NG: 94.6, appliedRole: "role-it" },
];

/* =========================================================
   Helpers
========================================================= */
const COMP_TKEYS: Record<CompKey, string> = {
  EL: "compEL", RP: "compRP", ACT: "compACT", NE: "compNE",
  IM: "compIM", OP: "compOP", EMP: "compEMP", NG: "compNG",
};

function calcFitScore(cand: Candidate, role: (typeof ROLE_BENCHMARKS)[0]): number {
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
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");

  const selectedRole = ROLE_BENCHMARKS.find((r) => r.id === selectedRoleId);

  const roleCandidates = useMemo(() => {
    if (!selectedRole) return [];
    return CANDIDATES.filter((c) => c.appliedRole === selectedRole.id)
      .map((c) => ({ ...c, fitScore: calcFitScore(c, selectedRole) }))
      .sort((a, b) => b.fitScore - a.fitScore);
  }, [selectedRole]);

  const selectedCandidate = roleCandidates.find((c) => c.id === selectedCandidateId);
  const compLabelsShort = COMP_KEYS.map((key) => key);

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
    if (fit >= 90) {
      return {
        text: lang === "es"
          ? `Excelente ajuste para ${selectedRole.name.es}. Supera el benchmark en ${exceedsList || "todas las competencias"} que son críticas para el rol. ${devList ? `Desarrollo menor en ${devList}.` : "Sin brechas significativas."} EQ total (${cand.eqTotal}) supera el ideal del rol (${selectedRole.idealEQ}).`
          : `Excellent fit for ${selectedRole.name.en}. Exceeds benchmark in ${exceedsList || "all competencies"} which are critical for the role. ${devList ? `Minor development in ${devList}.` : "No significant gaps."} Total EQ (${cand.eqTotal}) exceeds role ideal (${selectedRole.idealEQ}).`,
        action: t.hire,
      };
    }
    if (fit >= 75) {
      return {
        text: lang === "es"
          ? `Buen ajuste para ${selectedRole.name.es}. ${exceedsList ? `Fortalezas en ${exceedsList}.` : ""} ${devList ? `Desarrollo necesario en ${devList}.` : ""} EQ total (${cand.eqTotal}) ${cand.eqTotal >= selectedRole.minEQ ? "cumple" : "no alcanza"} el mínimo del rol (${selectedRole.minEQ}).`
          : `Good fit for ${selectedRole.name.en}. ${exceedsList ? `Strengths in ${exceedsList}.` : ""} ${devList ? `Development needed in ${devList}.` : ""} Total EQ (${cand.eqTotal}) ${cand.eqTotal >= selectedRole.minEQ ? "meets" : "falls below"} role minimum (${selectedRole.minEQ}).`,
        action: t.hireWithCoaching,
      };
    }
    if (fit >= 60) {
      return {
        text: lang === "es"
          ? `Ajuste moderado para ${selectedRole.name.es}. Brechas notables en ${devList || "varias competencias"}. ${exceedsList ? `Potencial en ${exceedsList}.` : ""} Requiere evaluación adicional y plan de desarrollo intensivo.`
          : `Moderate fit for ${selectedRole.name.en}. Notable gaps in ${devList || "several competencies"}. ${exceedsList ? `Potential in ${exceedsList}.` : ""} Requires additional evaluation and intensive development plan.`,
        action: t.consider,
      };
    }
    return {
      text: lang === "es"
        ? `Ajuste débil para ${selectedRole.name.es}. Brechas significativas en ${devList || "múltiples competencias"}. EQ total (${cand.eqTotal}) debajo del mínimo del rol (${selectedRole.minEQ}). No se recomienda para esta posición.`
        : `Weak fit for ${selectedRole.name.en}. Significant gaps in ${devList || "multiple competencies"}. Total EQ (${cand.eqTotal}) below role minimum (${selectedRole.minEQ}). Not recommended for this position.`,
      action: t.notRecommended,
    };
  }

  const recommendation = getRecommendation(selectedCandidate);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 w-fit">
            <Sparkles className="w-3 h-3" /> {t.badge}
          </span>
          <h1 className="text-3xl font-bold">{t.pageTitle}</h1>
          <p className="text-[var(--rowi-muted)] max-w-2xl">{t.pageSubtitle}</p>
        </div>
      </div>

      {/* Role Selector */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-purple-500" /> {t.roleSelector}</h2>
        <div className="relative">
          <select value={selectedRoleId} onChange={(e) => { setSelectedRoleId(e.target.value); setSelectedCandidateId(""); }} className="w-full appearance-none bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
            <option value="">{t.roleSelectorPlaceholder}</option>
            {ROLE_BENCHMARKS.map((role) => (<option key={role.id} value={role.id}>{role.name[lang as "es" | "en"] || role.name.es} — {role.department[lang as "es" | "en"] || role.department.es}</option>))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)] pointer-events-none" />
        </div>
        {selectedRole && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
              <div className="text-xs text-[var(--rowi-muted)] mb-1">{t.department}</div>
              <div className="font-bold text-purple-600">{selectedRole.department[lang as "es" | "en"] || selectedRole.department.es}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
              <div className="text-xs text-[var(--rowi-muted)] mb-1">{t.idealEQ}</div>
              <div className="font-bold text-blue-600">{selectedRole.idealEQ}</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
              <div className="text-xs text-[var(--rowi-muted)] mb-1">{t.minEQ}</div>
              <div className="font-bold text-amber-600">{selectedRole.minEQ}</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* No Role Selected */}
      {!selectedRole && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-12 shadow-sm border border-gray-100 dark:border-zinc-800 text-center">
          <UserCheck className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-4 opacity-40" />
          <p className="text-[var(--rowi-muted)]">{t.noRoleSelected}</p>
        </motion.div>
      )}

      {/* Candidates for Role */}
      {selectedRole && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><UserCheck className="w-5 h-5 text-purple-500" /> {t.candidatesFor} {selectedRole.name[lang as "es" | "en"] || selectedRole.name.es}</h2>
          {roleCandidates.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 text-center border border-gray-100 dark:border-zinc-800"><p className="text-[var(--rowi-muted)]">{t.noCandidates}</p></div>
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"><Brain className="w-3 h-3" /> {cand.brainStyle}</span>
                    <span className={`text-xs font-semibold ${fitColor(cand.fitScore)}`}>{t.fitScore}: {cand.fitScore.toFixed(1)}%</span>
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
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" /> {t.candidateDetail}</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                <div className="flex-1">
                  <div className="text-2xl font-bold">{selectedCandidate.name}</div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--rowi-muted)]">
                    <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {selectedCandidate.country}</span>
                    <span className="flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> {selectedCandidate.brainStyle}</span>
                    <span className="font-mono">EQ: {selectedCandidate.eqTotal}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FitGauge score={selectedCandidate.fitScore} />
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${fitColor(selectedCandidate.fitScore)}`}>{selectedCandidate.fitScore.toFixed(1)}%</div>
                    <div className="text-xs text-[var(--rowi-muted)]">{t.fitScore}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-500" /> {t.competencyComparison}</h3>
                <RadarChart candidateData={Object.fromEntries(COMP_KEYS.map((k) => [k, selectedCandidate[k]])) as Record<CompKey, number>} benchmarkData={selectedRole.competencies} topData={selectedRole.topPerformer} labels={compLabelsShort} legendCandidate={t.radarCandidate} legendBenchmark={t.radarBenchmark} legendTop={t.radarTop} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-500" /> {t.gapAnalysis}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-zinc-800">
                        <th className="text-left py-2 text-[var(--rowi-muted)] font-medium">{t.competency}</th>
                        <th className="text-center py-2 text-[var(--rowi-muted)] font-medium">{t.candidate}</th>
                        <th className="text-center py-2 text-[var(--rowi-muted)] font-medium">{t.benchmark}</th>
                        <th className="text-center py-2 text-[var(--rowi-muted)] font-medium">{t.gap}</th>
                        <th className="text-center py-2 text-[var(--rowi-muted)] font-medium">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gapData.map((row, i) => (
                        <motion.tr key={row.key} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="border-b border-gray-50 dark:border-zinc-800/50">
                          <td className="py-2.5 font-medium">{t[COMP_TKEYS[row.key] as keyof typeof t]}</td>
                          <td className="py-2.5 text-center font-mono">{row.candidateVal.toFixed(1)}</td>
                          <td className="py-2.5 text-center font-mono text-blue-500">{row.benchVal}</td>
                          <td className="py-2.5 text-center font-mono">
                            <span className={row.gap > 0 ? "text-emerald-500" : row.gap < -2 ? "text-red-500" : "text-amber-500"}>{row.gap > 0 ? "+" : ""}{row.gap.toFixed(1)}</span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${row.status === "exceeds" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : row.status === "meets" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"}`}>
                              {row.status === "exceeds" && <TrendingUp className="w-3 h-3" />}
                              {row.status === "meets" && <Minus className="w-3 h-3" />}
                              {row.status === "below" && <TrendingDown className="w-3 h-3" />}
                              {t[row.status]}
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
                <h4 className="font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> {t.strengths}</h4>
                {strengths.length > 0 ? (
                  <ul className="space-y-1.5">{strengths.map((s) => (
                    <li key={s.key} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 flex-shrink-0" /><span className="font-medium">{t[COMP_TKEYS[s.key] as keyof typeof t]}</span><span className="font-mono text-xs ml-auto">+{s.gap.toFixed(1)}</span></li>
                  ))}</ul>
                ) : (<p className="text-sm text-emerald-600 dark:text-emerald-400 opacity-60">--</p>)}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
                <h4 className="font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2"><TrendingDown className="w-4 h-4" /> {t.developmentAreas}</h4>
                {devAreas.length > 0 ? (
                  <ul className="space-y-1.5">{devAreas.map((d) => (
                    <li key={d.key} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2"><TrendingDown className="w-3.5 h-3.5 flex-shrink-0" /><span className="font-medium">{t[COMP_TKEYS[d.key] as keyof typeof t]}</span><span className="font-mono text-xs ml-auto">{d.gap.toFixed(1)}</span></li>
                  ))}</ul>
                ) : (<p className="text-sm text-red-600 dark:text-red-400 opacity-60">--</p>)}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-6 border ${fitBgLight(selectedCandidate.fitScore)}`}>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2"><Bot className="w-5 h-5 text-purple-500" /> {t.aiRecommendation}</h3>
              <p className="text-sm leading-relaxed mb-4">{recommendation.text}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--rowi-muted)]">{t.recommendedAction}:</span>
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
          <p className="text-[var(--rowi-muted)]">{t.selectCandidate}</p>
        </motion.div>
      )}

      {/* Ranking Table */}
      {selectedRole && roleCandidates.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-purple-500" /> {t.rankingTitle}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  <th className="text-left py-3 px-2 text-[var(--rowi-muted)] font-medium">{t.rank}</th>
                  <th className="text-left py-3 px-2 text-[var(--rowi-muted)] font-medium">{t.name}</th>
                  <th className="text-center py-3 px-2 text-[var(--rowi-muted)] font-medium">{t.fitScore}</th>
                  <th className="text-center py-3 px-2 text-[var(--rowi-muted)] font-medium">{t.brainStyle}</th>
                  <th className="text-left py-3 px-2 text-[var(--rowi-muted)] font-medium">{t.topStrength}</th>
                  <th className="text-left py-3 px-2 text-[var(--rowi-muted)] font-medium">{t.biggestGap}</th>
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">{cand.brainStyle}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-emerald-500 text-xs font-medium">{t[COMP_TKEYS[bestGap.key as CompKey] as keyof typeof t]} (+{bestGap.gap.toFixed(1)})</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-xs font-medium ${worstGap.gap < -2 ? "text-red-500" : "text-amber-500"}`}>{t[COMP_TKEYS[worstGap.key as CompKey] as keyof typeof t]} ({worstGap.gap.toFixed(1)})</span>
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
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">{t.infoDesc}</p>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/teams" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navTeams}
        </Link>
        <Link href="/hub/admin/tp/evolution" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navEvolution} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
