"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  BarChart3,
  Globe,
  Brain,
  Target,
  Activity,
  User,
  TrendingUp,
  Heart,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badge: "Equipos / Teams",
    pageTitle: "Team Deep Analytics",
    pageSubtitle:
      "Análisis profundo de equipos: filtra por región y departamento, compara equipos y monitorea indicadores de salud",
    filterRegion: "Región",
    filterDepartment: "Departamento",
    filterAll: "Todos",
    teamOverview: "Vista General de Equipos",
    teamOverviewDesc:
      "Tarjetas de resumen para cada equipo con métricas clave de EQ y salud",
    leader: "Líder",
    members: "miembros",
    avgEQ: "EQ Prom.",
    healthScore: "Salud",
    teamComparison: "Comparación de Equipos",
    teamComparisonDesc:
      "Selecciona 2 equipos para comparar competencias, resultados y estilos cerebrales",
    selectTeamA: "Seleccionar Equipo A",
    selectTeamB: "Seleccionar Equipo B",
    competencyRadar: "Radar de Competencias",
    outcomesComparison: "Comparación de Resultados",
    brainStyleComparison: "Distribución de Estilos Cerebrales",
    healthComparison: "Comparación de Salud",
    effectiveness: "Efectividad",
    relationships: "Relaciones",
    wellbeing: "Bienestar",
    qualityOfLife: "Calidad de Vida",
    teamHealthDashboard: "Dashboard de Salud de Equipos",
    teamHealthDesc:
      "Indicadores de salud para todos los equipos con fortalezas y áreas de mejora",
    strength: "Fortaleza",
    gap: "Brecha",
    brainStyleDist: "Distribución de Estilos Cerebrales",
    brainStyleDistDesc:
      "Haz clic en un equipo para ver su distribución de estilos cerebrales en detalle",
    selectTeamToView: "Selecciona un equipo para ver su distribución",
    membersLabel: "miembros",
    regionalSummary: "Resumen Regional",
    regionalSummaryDesc: "Métricas agregadas por región geográfica",
    avgEQLabel: "EQ Promedio",
    totalTeams: "Equipos",
    totalMembers: "Miembros",
    topTeam: "Mejor Equipo",
    infoTitle: "Datos de Equipos TP",
    infoDesc:
      "Este análisis muestra datos agregados de equipos de Teleperformance. Todos los datos individuales están anonimizados. Los indicadores de salud se calculan combinando EQ promedio, distribución de competencias y resultados de vida.",
    navPeople: "People",
    navSelection: "Selection",
    compEL: "Alfabetización Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivación Intrínseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatía",
    compNG: "Metas Nobles",
    noTeamsFound: "No se encontraron equipos con los filtros seleccionados",
    regionNA: "Norteamérica",
    regionLATAM: "Latinoamérica",
    regionAPAC: "Asia Pacífico",
    regionEMEA: "EMEA",
  },
  en: {
    backToHub: "TP Hub",
    badge: "Equipos / Teams",
    pageTitle: "Team Deep Analytics",
    pageSubtitle:
      "Deep team analysis: filter by region and department, compare teams, and monitor health indicators",
    filterRegion: "Region",
    filterDepartment: "Department",
    filterAll: "All",
    teamOverview: "Team Overview",
    teamOverviewDesc:
      "Summary cards for each team with key EQ and health metrics",
    leader: "Leader",
    members: "members",
    avgEQ: "Avg EQ",
    healthScore: "Health",
    teamComparison: "Team Comparison",
    teamComparisonDesc:
      "Select 2 teams to compare competencies, outcomes, and brain styles",
    selectTeamA: "Select Team A",
    selectTeamB: "Select Team B",
    competencyRadar: "Competency Radar",
    outcomesComparison: "Outcomes Comparison",
    brainStyleComparison: "Brain Style Distribution",
    healthComparison: "Health Comparison",
    effectiveness: "Effectiveness",
    relationships: "Relationships",
    wellbeing: "Wellbeing",
    qualityOfLife: "Quality of Life",
    teamHealthDashboard: "Team Health Dashboard",
    teamHealthDesc:
      "Health indicators for all teams with strengths and improvement areas",
    strength: "Strength",
    gap: "Gap",
    brainStyleDist: "Brain Style Distribution",
    brainStyleDistDesc:
      "Click on a team to view its detailed brain style distribution",
    selectTeamToView: "Select a team to view its distribution",
    membersLabel: "members",
    regionalSummary: "Regional Summary",
    regionalSummaryDesc: "Aggregated metrics by geographic region",
    avgEQLabel: "Average EQ",
    totalTeams: "Teams",
    totalMembers: "Members",
    topTeam: "Top Team",
    infoTitle: "TP Team Data",
    infoDesc:
      "This analysis shows aggregated Teleperformance team data. All individual data is anonymized. Health indicators are calculated combining average EQ, competency distribution, and life outcomes.",
    navPeople: "People",
    navSelection: "Selection",
    compEL: "Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Noble Goals",
    noTeamsFound: "No teams found with the selected filters",
    regionNA: "North America",
    regionLATAM: "Latin America",
    regionAPAC: "Asia Pacific",
    regionEMEA: "EMEA",
  },
};

/* =========================================================
   Mock Data — 8 Teams
========================================================= */
const TP_TEAMS = [
  {
    id: "team-na-cs-1",
    name: "Phoenix Support",
    region: "NA",
    country: "USA",
    department: "Customer Service",
    leader: "Mike Johnson",
    memberCount: 24,
    avgEQ: 103.8,
    healthScore: 82,
    brainStyles: {
      Scientist: 5,
      Deliverer: 6,
      Strategist: 4,
      Inventor: 3,
      Guardian: 3,
      Visionary: 2,
      Superhero: 1,
    },
    competencies: {
      EL: 102.4,
      RP: 104.8,
      ACT: 103.6,
      NE: 101.2,
      IM: 104.1,
      OP: 103.8,
      EMP: 103.2,
      NG: 103.5,
    },
    outcomes: {
      effectiveness: 105.2,
      relationships: 102.8,
      wellbeing: 101.4,
      qualityOfLife: 103.6,
    },
  },
  {
    id: "team-latam-sales-1",
    name: "Jaguar Sales",
    region: "LATAM",
    country: "México",
    department: "Sales",
    leader: "Carlos Méndez",
    memberCount: 18,
    avgEQ: 107.2,
    healthScore: 91,
    brainStyles: {
      Scientist: 3,
      Deliverer: 4,
      Strategist: 4,
      Inventor: 2,
      Guardian: 2,
      Visionary: 2,
      Superhero: 1,
    },
    competencies: {
      EL: 105.8,
      RP: 107.2,
      ACT: 106.4,
      NE: 108.1,
      IM: 107.8,
      OP: 107.4,
      EMP: 108.2,
      NG: 106.7,
    },
    outcomes: {
      effectiveness: 108.4,
      relationships: 109.2,
      wellbeing: 105.8,
      qualityOfLife: 106.4,
    },
  },
  {
    id: "team-apac-hr-1",
    name: "Sakura People",
    region: "APAC",
    country: "Japan",
    department: "HR",
    leader: "Aiko Tanaka",
    memberCount: 12,
    avgEQ: 112.4,
    healthScore: 95,
    brainStyles: {
      Scientist: 2,
      Deliverer: 2,
      Strategist: 2,
      Inventor: 1,
      Guardian: 3,
      Visionary: 1,
      Superhero: 1,
    },
    competencies: {
      EL: 110.2,
      RP: 112.8,
      ACT: 111.4,
      NE: 113.8,
      IM: 112.6,
      OP: 113.2,
      EMP: 114.8,
      NG: 110.4,
    },
    outcomes: {
      effectiveness: 111.2,
      relationships: 114.6,
      wellbeing: 112.8,
      qualityOfLife: 111.4,
    },
  },
  {
    id: "team-emea-ops-1",
    name: "Berlin Ops",
    region: "EMEA",
    country: "Germany",
    department: "Operations",
    leader: "Marcus Weber",
    memberCount: 20,
    avgEQ: 100.4,
    healthScore: 74,
    brainStyles: {
      Scientist: 4,
      Deliverer: 6,
      Strategist: 3,
      Inventor: 2,
      Guardian: 3,
      Visionary: 1,
      Superhero: 1,
    },
    competencies: {
      EL: 99.8,
      RP: 101.6,
      ACT: 101.2,
      NE: 98.4,
      IM: 100.2,
      OP: 100.8,
      EMP: 99.2,
      NG: 101.8,
    },
    outcomes: {
      effectiveness: 103.4,
      relationships: 98.2,
      wellbeing: 99.6,
      qualityOfLife: 101.2,
    },
  },
  {
    id: "team-apac-qa-1",
    name: "Mumbai Quality",
    region: "APAC",
    country: "India",
    department: "Quality",
    leader: "Priya Sharma",
    memberCount: 16,
    avgEQ: 108.6,
    healthScore: 88,
    brainStyles: {
      Scientist: 4,
      Deliverer: 3,
      Strategist: 3,
      Inventor: 2,
      Guardian: 2,
      Visionary: 1,
      Superhero: 1,
    },
    competencies: {
      EL: 108.2,
      RP: 109.4,
      ACT: 108.8,
      NE: 107.4,
      IM: 108.6,
      OP: 108.2,
      EMP: 109.2,
      NG: 108.8,
    },
    outcomes: {
      effectiveness: 110.4,
      relationships: 107.8,
      wellbeing: 108.2,
      qualityOfLife: 108.6,
    },
  },
  {
    id: "team-na-it-1",
    name: "Tech Shield",
    region: "NA",
    country: "Canada",
    department: "IT",
    leader: "David Kim",
    memberCount: 14,
    avgEQ: 105.2,
    healthScore: 85,
    brainStyles: {
      Scientist: 4,
      Deliverer: 3,
      Strategist: 2,
      Inventor: 3,
      Guardian: 1,
      Visionary: 1,
      Superhero: 0,
    },
    competencies: {
      EL: 104.6,
      RP: 106.2,
      ACT: 105.8,
      NE: 103.8,
      IM: 105.4,
      OP: 105.2,
      EMP: 104.2,
      NG: 106.4,
    },
    outcomes: {
      effectiveness: 107.8,
      relationships: 103.2,
      wellbeing: 104.6,
      qualityOfLife: 106.2,
    },
  },
  {
    id: "team-emea-training-1",
    name: "UK Academy",
    region: "EMEA",
    country: "UK",
    department: "Training",
    leader: "Emma Thompson",
    memberCount: 10,
    avgEQ: 109.8,
    healthScore: 92,
    brainStyles: {
      Scientist: 2,
      Deliverer: 1,
      Strategist: 2,
      Inventor: 1,
      Guardian: 2,
      Visionary: 1,
      Superhero: 1,
    },
    competencies: {
      EL: 108.4,
      RP: 110.2,
      ACT: 109.6,
      NE: 110.8,
      IM: 110.2,
      OP: 109.8,
      EMP: 111.4,
      NG: 108.0,
    },
    outcomes: {
      effectiveness: 108.6,
      relationships: 112.4,
      wellbeing: 110.2,
      qualityOfLife: 109.4,
    },
  },
  {
    id: "team-latam-cx-1",
    name: "Cóndor CX",
    region: "LATAM",
    country: "Colombia",
    department: "Customer Experience",
    leader: "Luis Rodríguez",
    memberCount: 22,
    avgEQ: 101.8,
    healthScore: 78,
    brainStyles: {
      Scientist: 4,
      Deliverer: 5,
      Strategist: 4,
      Inventor: 3,
      Guardian: 3,
      Visionary: 2,
      Superhero: 1,
    },
    competencies: {
      EL: 100.4,
      RP: 102.2,
      ACT: 101.6,
      NE: 102.4,
      IM: 101.8,
      OP: 101.4,
      EMP: 102.8,
      NG: 101.8,
    },
    outcomes: {
      effectiveness: 102.4,
      relationships: 103.8,
      wellbeing: 100.6,
      qualityOfLife: 101.2,
    },
  },
];

const REGIONS = ["NA", "LATAM", "APAC", "EMEA"];
const DEPARTMENTS = [
  "Customer Service",
  "Sales",
  "HR",
  "Operations",
  "Quality",
  "IT",
  "Training",
  "Customer Experience",
];

const REGION_FLAGS: Record<string, string> = {
  NA: "\u{1F1FA}\u{1F1F8}",
  LATAM: "\u{1F1F2}\u{1F1FD}",
  APAC: "\u{1F1EF}\u{1F1F5}",
  EMEA: "\u{1F1EA}\u{1F1FA}",
};
const REGION_TKEYS: Record<string, string> = {
  NA: "regionNA",
  LATAM: "regionLATAM",
  APAC: "regionAPAC",
  EMEA: "regionEMEA",
};

const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"] as const;
const COMP_TKEYS: Record<string, string> = {
  EL: "compEL",
  RP: "compRP",
  ACT: "compACT",
  NE: "compNE",
  IM: "compIM",
  OP: "compOP",
  EMP: "compEMP",
  NG: "compNG",
};

const BRAIN_STYLE_COLORS: Record<string, string> = {
  Scientist: "#3b82f6",
  Deliverer: "#10b981",
  Strategist: "#f59e0b",
  Inventor: "#8b5cf6",
  Guardian: "#ef4444",
  Visionary: "#ec4899",
  Superhero: "#06b6d4",
};

/* =========================================================
   Helper functions
========================================================= */
function getHealthColor(score: number) {
  if (score > 85) return "text-green-500";
  if (score >= 75) return "text-yellow-500";
  return "text-red-500";
}

function getHealthBg(score: number) {
  if (score > 85) return "bg-green-500/10";
  if (score >= 75) return "bg-yellow-500/10";
  return "bg-red-500/10";
}

function getHealthIcon(score: number) {
  if (score > 85) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (score >= 75)
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  return <AlertCircle className="w-5 h-5 text-red-500" />;
}

function getBestCompetency(competencies: Record<string, number>) {
  let best = { key: "", value: 0 };
  for (const [k, v] of Object.entries(competencies)) {
    if (v > best.value) best = { key: k, value: v };
  }
  return best;
}

function getWorstCompetency(competencies: Record<string, number>) {
  let worst = { key: "", value: 999 };
  for (const [k, v] of Object.entries(competencies)) {
    if (v < worst.value) worst = { key: k, value: v };
  }
  return worst;
}

/* =========================================================
   SVG Radar Chart Component (8-axis)
========================================================= */
function CompetencyRadar({
  teamA,
  teamB,
}: {
  teamA: (typeof TP_TEAMS)[0];
  teamB: (typeof TP_TEAMS)[0];
}) {
  const cx = 150;
  const cy = 150;
  const maxR = 110;
  const minVal = 95;
  const maxVal = 120;

  function getPoint(index: number, value: number) {
    const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
    const r = ((value - minVal) / (maxVal - minVal)) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function getPolygon(
    competencies: Record<string, number>,
    color: string,
    opacity: number,
  ) {
    const points = COMP_KEYS.map((key, i) => {
      const pt = getPoint(i, competencies[key]);
      return `${pt.x},${pt.y}`;
    }).join(" ");
    return (
      <polygon
        points={points}
        fill={color}
        fillOpacity={opacity}
        stroke={color}
        strokeWidth="2"
      />
    );
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[320px] mx-auto">
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <circle
          key={scale}
          cx={cx}
          cy={cy}
          r={maxR * scale}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
        />
      ))}
      {/* Axis lines + labels */}
      {COMP_KEYS.map((key, i) => {
        const pt = getPoint(i, maxVal);
        const labelPt = getPoint(i, maxVal + 4);
        return (
          <g key={key}>
            <line
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="1"
            />
            <text
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current text-[10px] opacity-60"
            >
              {key}
            </text>
          </g>
        );
      })}
      {/* Data polygons */}
      {getPolygon(teamA.competencies, "#7B2D8E", 0.2)}
      {getPolygon(teamB.competencies, "#E31937", 0.2)}
    </svg>
  );
}

/* =========================================================
   SVG Donut Chart Component
========================================================= */
function BrainStyleDonut({
  brainStyles,
  teamName,
}: {
  brainStyles: Record<string, number>;
  teamName: string;
}) {
  const total = Object.values(brainStyles).reduce((a, b) => a + b, 0);
  const entries = Object.entries(brainStyles).filter(([, v]) => v > 0);
  let cumulative = 0;
  const cxD = 100;
  const cyD = 100;
  const r = 70;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {entries.map(([style, count]) => {
          const pct = count / total;
          const offset = circumference * (1 - cumulative / total);
          const dash = circumference * pct;
          cumulative += count;
          return (
            <circle
              key={style}
              cx={cxD}
              cy={cyD}
              r={r}
              fill="none"
              stroke={BRAIN_STYLE_COLORS[style]}
              strokeWidth="24"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cxD} ${cyD})`}
            />
          );
        })}
        <text
          x={cxD}
          y={cyD - 6}
          textAnchor="middle"
          className="fill-current text-lg font-bold"
        >
          {total}
        </text>
        <text
          x={cxD}
          y={cyD + 12}
          textAnchor="middle"
          className="fill-current text-[10px] opacity-60"
        >
          {teamName}
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {entries.map(([style, count]) => (
          <div key={style} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: BRAIN_STYLE_COLORS[style] }}
            />
            <span className="text-[var(--rowi-muted)]">{style}</span>
            <span className="font-mono font-medium">{count}</span>
            <span className="text-[var(--rowi-muted)] text-xs">
              ({((count / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPTeamsPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [deptFilter, setDeptFilter] = useState<string>("All");
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [selectedBrainTeam, setSelectedBrainTeam] = useState<string>("");

  const filteredTeams = TP_TEAMS.filter((team) => {
    if (regionFilter !== "All" && team.region !== regionFilter) return false;
    if (deptFilter !== "All" && team.department !== deptFilter) return false;
    return true;
  });

  const teamA = TP_TEAMS.find((tm) => tm.id === compareA);
  const teamB = TP_TEAMS.find((tm) => tm.id === compareB);
  const brainTeam = TP_TEAMS.find((tm) => tm.id === selectedBrainTeam);

  /* Regional summary data */
  const regionSummary = REGIONS.map((region) => {
    const teams = TP_TEAMS.filter((tm) => tm.region === region);
    const totalMembers = teams.reduce((s, tm) => s + tm.memberCount, 0);
    const avgEQ =
      teams.length > 0
        ? teams.reduce((s, tm) => s + tm.avgEQ, 0) / teams.length
        : 0;
    const topTeam = teams.reduce(
      (best, tm) => (tm.avgEQ > best.avgEQ ? tm : best),
      teams[0],
    );
    return { region, teams: teams.length, totalMembers, avgEQ, topTeam };
  });

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Sparkles className="w-3 h-3" /> {t.badge}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
            <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl px-5 py-3 shadow-lg border border-gray-100 dark:border-zinc-800 flex items-center gap-3"
          >
            <Users className="w-6 h-6 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {TP_TEAMS.length}
              </div>
              <div className="text-xs text-[var(--rowi-muted)]">
                {t.totalTeams}
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700 mx-2" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {TP_TEAMS.reduce((s, tm) => s + tm.memberCount, 0)}
              </div>
              <div className="text-xs text-[var(--rowi-muted)]">
                {t.totalMembers}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Filter Bar ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4"
      >
        {/* Region filter */}
        <div className="flex-1">
          <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1 block">
            {t.filterRegion}
          </label>
          <div className="relative">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">{t.filterAll}</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {REGION_FLAGS[r]}{" "}
                  {t[REGION_TKEYS[r] as keyof typeof t]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--rowi-muted)]" />
          </div>
        </div>

        {/* Department filter */}
        <div className="flex-1">
          <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1 block">
            {t.filterDepartment}
          </label>
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">{t.filterAll}</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--rowi-muted)]" />
          </div>
        </div>
      </motion.div>

      {/* ── Section 3: Team Overview Grid ───────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" /> {t.teamOverview}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.teamOverviewDesc}</p>
        </div>

        {filteredTeams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-[var(--rowi-muted)]"
          >
            {t.noTeamsFound}
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTeams.map((team, i) => {
              const eqPct = ((team.avgEQ - 65) / 70) * 100;
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedBrainTeam(team.id)}
                >
                  {/* Team name + region flag */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {REGION_FLAGS[team.region]}
                      </span>
                      <div>
                        <div className="font-semibold text-sm">{team.name}</div>
                        <div className="text-[10px] text-[var(--rowi-muted)]">
                          {team.department}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-xs font-bold px-2 py-1 rounded-full ${getHealthBg(team.healthScore)} ${getHealthColor(team.healthScore)}`}
                    >
                      {team.healthScore}
                    </div>
                  </div>

                  {/* Leader + members */}
                  <div className="flex items-center gap-1 text-xs text-[var(--rowi-muted)] mb-3">
                    <User className="w-3 h-3" />
                    <span>{team.leader}</span>
                    <span className="mx-1">|</span>
                    <span>
                      {team.memberCount} {t.members}
                    </span>
                  </div>

                  {/* EQ gauge */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--rowi-muted)]">
                        {t.avgEQ}
                      </span>
                      <span className="font-mono font-bold text-purple-600">
                        {team.avgEQ.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${eqPct}%` }}
                        transition={{
                          duration: 0.8,
                          ease: "easeOut",
                          delay: i * 0.05,
                        }}
                      />
                    </div>
                  </div>

                  {/* Health traffic light */}
                  <div className="flex items-center gap-2 text-xs">
                    {getHealthIcon(team.healthScore)}
                    <span
                      className={`font-medium ${getHealthColor(team.healthScore)}`}
                    >
                      {t.healthScore}: {team.healthScore}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 4: Team Comparison ──────────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-500" />{" "}
            {t.teamComparison}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.teamComparisonDesc}</p>
        </div>

        {/* Team selectors */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1 block">
              {t.selectTeamA}
            </label>
            <div className="relative">
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t.selectTeamA}</option>
                {filteredTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {REGION_FLAGS[team.region]} {team.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--rowi-muted)]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--rowi-muted)] mb-1 block">
              {t.selectTeamB}
            </label>
            <div className="relative">
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">{t.selectTeamB}</option>
                {filteredTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {REGION_FLAGS[team.region]} {team.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--rowi-muted)]" />
            </div>
          </div>
        </div>

        {/* Comparison panels */}
        <AnimatePresence>
          {teamA && teamB && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Competency Radar */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />{" "}
                  {t.competencyRadar}
                </h3>
                <CompetencyRadar teamA={teamA} teamB={teamB} />
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#7B2D8E]" />{" "}
                    {teamA.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#E31937]" />{" "}
                    {teamB.name}
                  </span>
                </div>
              </div>

              {/* Outcomes Comparison */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />{" "}
                  {t.outcomesComparison}
                </h3>
                <div className="space-y-4">
                  {(
                    [
                      "effectiveness",
                      "relationships",
                      "wellbeing",
                      "qualityOfLife",
                    ] as const
                  ).map((key) => {
                    const tKey = key as keyof typeof t;
                    const valA = teamA.outcomes[key];
                    const valB = teamB.outcomes[key];
                    const maxOutcome = Math.max(valA, valB, 115);
                    return (
                      <div key={key}>
                        <div className="text-xs font-medium text-[var(--rowi-muted)] mb-1">
                          {t[tKey]}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] w-20 truncate text-[var(--rowi-muted)]">
                              {teamA.name}
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-[#7B2D8E]"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${((valA - 95) / (maxOutcome - 95)) * 100}%`,
                                }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                            <span className="text-xs font-mono w-12 text-right">
                              {valA.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] w-20 truncate text-[var(--rowi-muted)]">
                              {teamB.name}
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-[#E31937]"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${((valB - 95) / (maxOutcome - 95)) * 100}%`,
                                }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                            <span className="text-xs font-mono w-12 text-right">
                              {valB.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brain Style Comparison */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />{" "}
                  {t.brainStyleComparison}
                </h3>
                <div className="space-y-3">
                  {Object.keys(BRAIN_STYLE_COLORS).map((style) => {
                    const vA =
                      teamA.brainStyles[
                        style as keyof typeof teamA.brainStyles
                      ] || 0;
                    const vB =
                      teamB.brainStyles[
                        style as keyof typeof teamB.brainStyles
                      ] || 0;
                    const maxBrain = Math.max(vA, vB, 1);
                    return (
                      <div key={style}>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: BRAIN_STYLE_COLORS[style],
                            }}
                          />
                          <span className="text-xs font-medium flex-1">
                            {style}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: "#7B2D8E" }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(vA / maxBrain) * 100}%`,
                                }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                            <span className="text-[10px] font-mono w-4">
                              {vA}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: "#E31937" }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${(vB / maxBrain) * 100}%`,
                                }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                            <span className="text-[10px] font-mono w-4">
                              {vB}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#7B2D8E]" />{" "}
                    {teamA.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-[#E31937]" />{" "}
                    {teamB.name}
                  </span>
                </div>
              </div>

              {/* Health Comparison */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-500" />{" "}
                  {t.healthComparison}
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {[teamA, teamB].map((team, idx) => {
                    const circumference = 2 * Math.PI * 45;
                    const offset =
                      circumference -
                      (team.healthScore / 100) * circumference;
                    return (
                      <div
                        key={team.id}
                        className="flex flex-col items-center"
                      >
                        <svg viewBox="0 0 120 120" className="w-28 h-28">
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200 dark:text-zinc-800"
                          />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="45"
                            stroke={idx === 0 ? "#7B2D8E" : "#E31937"}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            style={{ strokeDasharray: circumference }}
                            transform="rotate(-90 60 60)"
                          />
                          <text
                            x="60"
                            y="56"
                            textAnchor="middle"
                            className="fill-current text-2xl font-bold"
                          >
                            {team.healthScore}
                          </text>
                          <text
                            x="60"
                            y="72"
                            textAnchor="middle"
                            className="fill-current text-[9px] opacity-50"
                          >
                            {t.healthScore}
                          </text>
                        </svg>
                        <div className="text-sm font-medium mt-2 text-center">
                          {team.name}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {getHealthIcon(team.healthScore)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Section 5: Team Health Dashboard ────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-500" />{" "}
            {t.teamHealthDashboard}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.teamHealthDesc}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TP_TEAMS.map((team, i) => {
            const best = getBestCompetency(team.competencies);
            const worst = getWorstCompetency(team.competencies);
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm">{team.name}</span>
                  {getHealthIcon(team.healthScore)}
                </div>
                <div
                  className={`text-3xl font-bold mb-3 ${getHealthColor(team.healthScore)}`}
                >
                  {team.healthScore}
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[var(--rowi-muted)]">
                      {t.strength}:
                    </span>
                    <span className="font-medium">
                      {t[COMP_TKEYS[best.key] as keyof typeof t]}
                    </span>
                    <span className="font-mono text-green-600 ml-auto">
                      {best.value.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-[var(--rowi-muted)]">
                      {t.gap}:
                    </span>
                    <span className="font-medium">
                      {t[COMP_TKEYS[worst.key] as keyof typeof t]}
                    </span>
                    <span className="font-mono text-yellow-600 ml-auto">
                      {worst.value.toFixed(1)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Section 6: Brain Style Distribution ─────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" /> {t.brainStyleDist}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.brainStyleDistDesc}</p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-zinc-800"
        >
          {/* Team selector chips */}
          <div className="flex flex-wrap gap-2 mb-8">
            {TP_TEAMS.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedBrainTeam(team.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedBrainTeam === team.id
                    ? "bg-purple-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)] hover:bg-purple-100 dark:hover:bg-purple-900/30"
                }`}
              >
                {REGION_FLAGS[team.region]} {team.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {brainTeam ? (
              <motion.div
                key={brainTeam.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <BrainStyleDonut
                  brainStyles={brainTeam.brainStyles}
                  teamName={brainTeam.name}
                />
                <div className="text-center mt-4 text-sm text-[var(--rowi-muted)]">
                  {brainTeam.memberCount} {t.membersLabel} |{" "}
                  {brainTeam.department} | {brainTeam.country}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-[var(--rowi-muted)]"
              >
                {t.selectTeamToView}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Section 7: Regional Summary ─────────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-500" /> {t.regionalSummary}
          </h2>
          <p className="text-[var(--rowi-muted)]">{t.regionalSummaryDesc}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {regionSummary.map((rs, i) => (
            <motion.div
              key={rs.region}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{REGION_FLAGS[rs.region]}</span>
                <span className="font-semibold">
                  {t[REGION_TKEYS[rs.region] as keyof typeof t]}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--rowi-muted)]">
                    {t.avgEQLabel}
                  </span>
                  <span className="font-bold text-purple-600">
                    {rs.avgEQ.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--rowi-muted)]">
                    {t.totalTeams}
                  </span>
                  <span className="font-bold">{rs.teams}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--rowi-muted)]">
                    {t.totalMembers}
                  </span>
                  <span className="font-bold">{rs.totalMembers}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <div className="text-xs text-[var(--rowi-muted)] mb-1">
                    {t.topTeam}
                  </div>
                  <div className="text-sm font-semibold">
                    {rs.topTeam?.name}
                  </div>
                  <div className="text-xs text-purple-500 font-mono">
                    {rs.topTeam?.avgEQ.toFixed(1)} EQ
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Info Tip ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4"
      >
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
            {t.infoTitle}
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {t.infoDesc}
          </p>
        </div>
      </motion.div>

      {/* ── Navigation Footer ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link
          href="/hub/admin/tp/people"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> {t.navPeople}
        </Link>
        <Link
          href="/hub/admin/tp/selection"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          {t.navSelection} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
