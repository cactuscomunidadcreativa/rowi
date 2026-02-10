"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
  Brain,
  Search,
  User,
  Globe,
  Target,
  Heart,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  BarChart3,
  ChevronDown,
  GitCompareArrows,
  Filter,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEqLevel } from "@/domains/eq/lib/eqLevels";
import {
  getBrainStyleLabel,
  getBrainStyleEmoji,
  getBrainStyleColor,
} from "@/domains/eq/lib/dictionary";

/* =========================================================
   Constants
========================================================= */
const TP_BENCHMARK_ID = "tp-all-assessments-2025";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badge: "Comparador de Personas",
    pageTitle: "Comparador Persona vs Persona",
    pageSubtitle:
      "Selecciona dos personas para comparar perfiles EQ lado a lado: competencias, resultados, estilos cerebrales y analisis complementario",
    selectPersonA: "Seleccionar Persona A",
    selectPersonB: "Seleccionar Persona B",
    searchPlaceholder: "Buscar por ID, pais, rol...",
    selectPrompt:
      "Selecciona dos personas para iniciar la comparacion",
    eqTotal: "EQ Total",
    brainStyle: "Estilo Cerebral",
    role: "Rol",
    region: "Region",
    country: "Pais",
    competencyRadar: "Radar de Competencias",
    competencyRadarDesc:
      "Superposicion de las 8 competencias SEI de ambas personas",
    competencyTable: "Comparacion por Competencia",
    competencyTableDesc: "Puntaje, delta y quien lidera en cada competencia",
    outcomesComparison: "Resultados de Vida",
    outcomesDesc: "Comparacion de outcomes entre ambas personas",
    complementaryAnalysis: "Analisis Complementario",
    complementaryDesc:
      "Fortalezas y debilidades complementarias entre las dos personas seleccionadas",
    strongerIn: "Mas fuerte en",
    sharedStrengths: "Fortalezas Compartidas",
    sharedGaps: "Brechas Compartidas",
    noSharedStrengths: "No hay fortalezas compartidas (>105)",
    noSharedGaps: "No hay brechas compartidas (<95)",
    competency: "Competencia",
    personAScore: "Persona A",
    personBScore: "Persona B",
    delta: "Delta",
    leads: "Lidera",
    tie: "Empate",
    effectiveness: "Efectividad",
    relationships: "Relaciones",
    wellbeing: "Bienestar",
    qualityOfLife: "Calidad de Vida",
    compEL: "Alfabetizacion Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivacion Intrinseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatia",
    compNG: "Metas Nobles",
    infoTitle: "Datos de Comparacion TP",
    infoDesc:
      "Este comparador utiliza datos reales anonimizados del benchmark de Teleperformance. Los IDs de personas son anonimos para proteger la privacidad. Escala SEI: 65-135.",
    navTeams: "Teams",
    navSelection: "Selection",
    vsLabel: "VS",
    eqComparison: "Comparacion EQ Total",
    loading: "Cargando datos...",
    loadingError: "Error al cargar datos. Intenta de nuevo.",
    retry: "Reintentar",
    filters: "Filtros",
    clearFilters: "Limpiar filtros",
    allRegions: "Todas las regiones",
    allCountries: "Todos los paises",
    allRoles: "Todos los roles",
    allBrainStyles: "Todos los estilos",
    totalResults: "resultados",
    noResults: "No se encontraron datos con los filtros seleccionados",
    reliability: "Confiabilidad",
  },
  en: {
    backToHub: "TP Hub",
    badge: "Person Comparator",
    pageTitle: "Person vs Person Comparator",
    pageSubtitle:
      "Select two people to compare EQ profiles side by side: competencies, outcomes, brain styles, and complementary analysis",
    selectPersonA: "Select Person A",
    selectPersonB: "Select Person B",
    searchPlaceholder: "Search by ID, country, role...",
    selectPrompt:
      "Select two people to begin the comparison",
    eqTotal: "EQ Total",
    brainStyle: "Brain Style",
    role: "Role",
    region: "Region",
    country: "Country",
    competencyRadar: "Competency Radar",
    competencyRadarDesc:
      "Overlay of 8 SEI competencies for both people",
    competencyTable: "Competency Comparison",
    competencyTableDesc: "Score, delta, and who leads per competency",
    outcomesComparison: "Life Outcomes",
    outcomesDesc: "Outcome comparison between both people",
    complementaryAnalysis: "Complementary Analysis",
    complementaryDesc:
      "Complementary strengths and weaknesses between the two selected people",
    strongerIn: "Stronger in",
    sharedStrengths: "Shared Strengths",
    sharedGaps: "Shared Gaps",
    noSharedStrengths: "No shared strengths (>105)",
    noSharedGaps: "No shared gaps (<95)",
    competency: "Competency",
    personAScore: "Person A",
    personBScore: "Person B",
    delta: "Delta",
    leads: "Leads",
    tie: "Tie",
    effectiveness: "Effectiveness",
    relationships: "Relationships",
    wellbeing: "Wellbeing",
    qualityOfLife: "Quality of Life",
    compEL: "Enhance Emotional Literacy",
    compRP: "Recognize Patterns",
    compACT: "Apply Consequential Thinking",
    compNE: "Navigate Emotions",
    compIM: "Engage Intrinsic Motivation",
    compOP: "Exercise Optimism",
    compEMP: "Increase Empathy",
    compNG: "Pursue Noble Goals",
    infoTitle: "TP Comparison Data",
    infoDesc:
      "This comparator uses real anonymized data from the Teleperformance benchmark. Person IDs are anonymous to protect privacy. SEI Scale: 65-135.",
    navTeams: "Teams",
    navSelection: "Selection",
    vsLabel: "VS",
    eqComparison: "EQ Total Comparison",
    loading: "Loading data...",
    loadingError: "Error loading data. Please try again.",
    retry: "Retry",
    filters: "Filters",
    clearFilters: "Clear filters",
    allRegions: "All regions",
    allCountries: "All countries",
    allRoles: "All roles",
    allBrainStyles: "All styles",
    totalResults: "results",
    noResults: "No data found with the selected filters",
    reliability: "Reliability",
  },
};

/* =========================================================
   Types
========================================================= */
type CompetencyKeys = "EL" | "RP" | "ACT" | "NE" | "IM" | "OP" | "EMP" | "NG";
type OutcomeKeys = "effectiveness" | "relationships" | "wellbeing" | "qualityOfLife";

interface DataPoint {
  id: string;
  sourceId: string | null;
  country: string | null;
  region: string | null;
  jobRole: string | null;
  brainStyle: string | null;
  eqTotal: number | null;
  EL: number | null;
  RP: number | null;
  ACT: number | null;
  NE: number | null;
  IM: number | null;
  OP: number | null;
  EMP: number | null;
  NG: number | null;
  effectiveness: number | null;
  relationships: number | null;
  wellbeing: number | null;
  qualityOfLife: number | null;
  reliabilityIndex: number | null;
}

interface Person {
  id: string;
  sourceId: string;
  displayName: string;
  role: string;
  region: string;
  country: string;
  brainStyle: string;
  eqTotal: number;
  competencies: Record<CompetencyKeys, number>;
  outcomes: Record<OutcomeKeys, number>;
  reliability: number;
}

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterOptions {
  regions: FilterOption[];
  countries: FilterOption[];
  jobRoles: FilterOption[];
  brainStyles?: FilterOption[];
}

/* =========================================================
   Helpers
========================================================= */
const COMP_KEYS: CompetencyKeys[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const OUTCOME_KEYS: OutcomeKeys[] = ["effectiveness", "relationships", "wellbeing", "qualityOfLife"];

const COMP_TKEYS: Record<string, string> = {
  EL: "compEL", RP: "compRP", ACT: "compACT", NE: "compNE",
  IM: "compIM", OP: "compOP", EMP: "compEMP", NG: "compNG",
};

/* Brain style colors now come from getBrainStyleColor() in dictionary.ts */

function getCountryFlag(country: string | null): string {
  if (!country) return "";
  const flags: Record<string, string> = {
    Mexico: "\uD83C\uDDF2\uD83C\uDDFD", "M\u00e9xico": "\uD83C\uDDF2\uD83C\uDDFD",
    Colombia: "\uD83C\uDDE8\uD83C\uDDF4", Argentina: "\uD83C\uDDE6\uD83C\uDDF7",
    Brazil: "\uD83C\uDDE7\uD83C\uDDF7", Chile: "\uD83C\uDDE8\uD83C\uDDF1",
    Peru: "\uD83C\uDDF5\uD83C\uDDE6", USA: "\uD83C\uDDFA\uD83C\uDDF8",
    "United States": "\uD83C\uDDFA\uD83C\uDDF8", Canada: "\uD83C\uDDE8\uD83C\uDDE6",
    UK: "\uD83C\uDDEC\uD83C\uDDE7", "United Kingdom": "\uD83C\uDDEC\uD83C\uDDE7",
    Germany: "\uD83C\uDDE9\uD83C\uDDE6", France: "\uD83C\uDDEB\uD83C\uDDF7",
    Spain: "\uD83C\uDDEA\uD83C\uDDF8", Italy: "\uD83C\uDDEE\uD83C\uDDF9",
    India: "\uD83C\uDDEE\uD83C\uDDF3", Japan: "\uD83C\uDDEF\uD83C\uDDF5",
    Singapore: "\uD83C\uDDF8\uD83C\uDDEC", Australia: "\uD83C\uDDE6\uD83C\uDDFA",
    Philippines: "\uD83C\uDDF5\uD83C\uDDED", Egypt: "\uD83C\uDDEA\uD83C\uDDEC",
    UAE: "\uD83C\uDDE6\uD83C\uDDEA", "South Africa": "\uD83C\uDDFF\uD83C\uDDE6",
    Turkey: "\uD83C\uDDF9\uD83C\uDDF7", Portugal: "\uD83C\uDDF5\uD83C\uDDF9",
    Netherlands: "\uD83C\uDDF3\uD83C\uDDF1", Greece: "\uD83C\uDDEC\uD83C\uDDF7",
    Poland: "\uD83C\uDDF5\uD83C\uDDF1", Romania: "\uD83C\uDDF7\uD83C\uDDF4",
    "Costa Rica": "\uD83C\uDDE8\uD83C\uDDF7", "Dominican Republic": "\uD83C\uDDE9\uD83C\uDDF4",
    Ecuador: "\uD83C\uDDEA\uD83C\uDDE8", Guatemala: "\uD83C\uDDEC\uD83C\uDDF9",
    Honduras: "\uD83C\uDDED\uD83C\uDDF3", "El Salvador": "\uD83C\uDDF8\uD83C\uDDFB",
    China: "\uD83C\uDDE8\uD83C\uDDF3", "South Korea": "\uD83C\uDDF0\uD83C\uDDF7",
    Thailand: "\uD83C\uDDF9\uD83C\uDDED", Malaysia: "\uD83C\uDDF2\uD83C\uDDFE",
    Indonesia: "\uD83C\uDDEE\uD83C\uDDE9", Vietnam: "\uD83C\uDDFB\uD83C\uDDF3",
  };
  return flags[country] || "\uD83C\uDF10";
}

/** Generate a human-friendly anonymous name from sourceId */
function generateDisplayName(sourceId: string, country: string): string {
  const countryFlag = getCountryFlag(country);
  // Use first 6 chars of sourceId in a friendlier format
  const code = sourceId.slice(0, 6).toUpperCase();
  return `${countryFlag} ${country || "?"}-${code}`;
}

/** Convert a raw API data point to a Person for the UI */
function dataPointToPerson(dp: DataPoint): Person {
  const sid = dp.sourceId || dp.id.slice(0, 8);
  const country = dp.country || "---";
  const displayName = generateDisplayName(sid, country);
  return {
    id: dp.id,
    sourceId: sid,
    displayName,
    role: dp.jobRole || "---",
    region: dp.region || "---",
    country,
    brainStyle: dp.brainStyle || "---",
    eqTotal: dp.eqTotal ?? 100,
    competencies: {
      EL: dp.EL ?? 100,
      RP: dp.RP ?? 100,
      ACT: dp.ACT ?? 100,
      NE: dp.NE ?? 100,
      IM: dp.IM ?? 100,
      OP: dp.OP ?? 100,
      EMP: dp.EMP ?? 100,
      NG: dp.NG ?? 100,
    },
    outcomes: {
      effectiveness: dp.effectiveness ?? 100,
      relationships: dp.relationships ?? 100,
      wellbeing: dp.wellbeing ?? 100,
      qualityOfLife: dp.qualityOfLife ?? 100,
    },
    reliability: dp.reliabilityIndex ?? 0,
  };
}

/* =========================================================
   Components
========================================================= */

function FilterBar({
  filters,
  setFilters,
  filterOptions,
  t,
  total,
  lang,
}: {
  filters: { region: string; country: string; jobRole: string; brainStyle: string };
  setFilters: (f: typeof filters) => void;
  filterOptions: FilterOptions | null;
  t: Record<string, string>;
  total: number;
  lang: string;
}) {
  const hasFilters = filters.region || filters.country || filters.jobRole || filters.brainStyle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-500" /> {t.filters}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--rowi-muted)]">
            {total.toLocaleString()} {t.totalResults}
          </span>
          {hasFilters && (
            <button
              onClick={() => setFilters({ region: "", country: "", jobRole: "", brainStyle: "" })}
              className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> {t.clearFilters}
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Region */}
        <select
          value={filters.region}
          onChange={(e) => setFilters({ ...filters, region: e.target.value, country: "" })}
          className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">{t.allRegions}</option>
          {filterOptions?.regions?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value} ({opt.count})
            </option>
          ))}
        </select>
        {/* Country */}
        <select
          value={filters.country}
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">{t.allCountries}</option>
          {filterOptions?.countries?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {getCountryFlag(opt.value)} {opt.value} ({opt.count})
            </option>
          ))}
        </select>
        {/* Job Role */}
        <select
          value={filters.jobRole}
          onChange={(e) => setFilters({ ...filters, jobRole: e.target.value })}
          className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">{t.allRoles}</option>
          {filterOptions?.jobRoles?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value} ({opt.count})
            </option>
          ))}
        </select>
        {/* Brain Style */}
        <select
          value={filters.brainStyle}
          onChange={(e) => setFilters({ ...filters, brainStyle: e.target.value })}
          className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">{t.allBrainStyles}</option>
          {filterOptions?.brainStyles?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {getBrainStyleEmoji(opt.value)} {getBrainStyleLabel(opt.value, lang)} ({opt.count})
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );
}

function PersonSelector({
  label, selected, onSelect, excludeId, people,
}: {
  label: string; selected: Person | null; onSelect: (p: Person) => void;
  excludeId: string | null; people: Person[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return people
      .filter((p) => p.id !== excludeId)
      .filter((p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.brainStyle.toLowerCase().includes(q) ||
        getBrainStyleLabel(p.brainStyle, lang).toLowerCase().includes(q) ||
        p.sourceId.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q) ||
        p.eqTotal.toFixed(1).includes(q)
      );
  }, [people, excludeId, search, lang]);

  return (
    <div className="relative flex-1">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
          selected
            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
            : "border-gray-200 dark:border-zinc-700 hover:border-purple-300"
        }`}
      >
        {selected ? (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: getBrainStyleColor(selected.brainStyle) }}
            >
              {selected.displayName.slice(3, 5)}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {getCountryFlag(selected.country)} {selected.displayName}
              </div>
              <div className="text-xs text-[var(--rowi-muted)]">
                {selected.country} · {selected.role} · {getBrainStyleEmoji(selected.brainStyle)} {getBrainStyleLabel(selected.brainStyle, lang)}
              </div>
            </div>
            <span className="text-lg font-bold text-purple-600">{selected.eqTotal.toFixed(1)}</span>
          </>
        ) : (
          <>
            <User className="w-5 h-5 text-[var(--rowi-muted)]" />
            <span className="text-sm text-[var(--rowi-muted)]">{label}</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-[var(--rowi-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl max-h-80 overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-64">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: getBrainStyleColor(p.brainStyle) }}
                  >
                    {p.displayName.slice(3, 5)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate">
                      {getCountryFlag(p.country)} {p.displayName}
                    </div>
                    <div className="text-[10px] text-[var(--rowi-muted)]">
                      {p.country} · {p.role} · {getBrainStyleEmoji(p.brainStyle)} {getBrainStyleLabel(p.brainStyle, lang)}
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-purple-600">{p.eqTotal.toFixed(1)}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-sm text-[var(--rowi-muted)] text-center">No results</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RadarChart({ personA, personB, t }: { personA: Person; personB: Person; t: Record<string, string> }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const minScore = 85;
  const maxScore = 125;

  function getPoint(index: number, value: number) {
    const angle = (Math.PI * 2 * index) / COMP_KEYS.length - Math.PI / 2;
    const normalized = (value - minScore) / (maxScore - minScore);
    const r = Math.max(0, normalized) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function getPolygonPoints(person: Person) {
    return COMP_KEYS.map((key, i) => {
      const pt = getPoint(i, person.competencies[key]);
      return `${pt.x},${pt.y}`;
    }).join(" ");
  }

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-sm mx-auto">
      {/* Grid rings */}
      {rings.map((r) => (
        <polygon
          key={r}
          points={COMP_KEYS.map((_, i) => {
            const angle = (Math.PI * 2 * i) / COMP_KEYS.length - Math.PI / 2;
            return `${cx + maxR * r * Math.cos(angle)},${cy + maxR * r * Math.sin(angle)}`;
          }).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gray-200 dark:text-zinc-700"
        />
      ))}
      {/* Spokes */}
      {COMP_KEYS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / COMP_KEYS.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(angle)}
            y2={cy + maxR * Math.sin(angle)}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-200 dark:text-zinc-700"
          />
        );
      })}
      {/* Person A polygon */}
      <motion.polygon
        points={getPolygonPoints(personA)}
        fill="rgba(139, 92, 246, 0.15)"
        stroke="#8b5cf6"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      {/* Person B polygon */}
      <motion.polygon
        points={getPolygonPoints(personB)}
        fill="rgba(236, 72, 153, 0.15)"
        stroke="#ec4899"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      {/* Labels */}
      {COMP_KEYS.map((key, i) => {
        const angle = (Math.PI * 2 * i) / COMP_KEYS.length - Math.PI / 2;
        const labelR = maxR + 22;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text
            key={key}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-current text-[var(--rowi-muted)]"
            fontSize="9"
            fontWeight="600"
          >
            {key}
          </text>
        );
      })}
      {/* Dots */}
      {COMP_KEYS.map((key, i) => {
        const ptA = getPoint(i, personA.competencies[key]);
        const ptB = getPoint(i, personB.competencies[key]);
        return (
          <g key={key}>
            <circle cx={ptA.x} cy={ptA.y} r="3" fill="#8b5cf6" />
            <circle cx={ptB.x} cy={ptB.y} r="3" fill="#ec4899" />
          </g>
        );
      })}
    </svg>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function TPPeopleComparator() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  // API state
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ region: "", country: "", jobRole: "", brainStyle: "" });

  // Person selection state
  const [personA, setPersonA] = useState<Person | null>(null);
  const [personB, setPersonB] = useState<Person | null>(null);

  // Convert data points to Person objects
  const people: Person[] = useMemo(() => {
    return dataPoints.map(dataPointToPerson);
  }, [dataPoints]);

  // Fetch filter options once on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const res = await fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}`);
        const json = await res.json();
        if (json.ok && json.benchmark) {
          const bm = json.benchmark;
          // Extract brain style filter options from data if available
          // The API groups by various fields; brainStyles might not be in the standard list
          // We'll build them from the data points or use jobRoles
          setFilterOptions({
            regions: bm.regions || [],
            countries: bm.countries || [],
            jobRoles: bm.jobRoles || [],
            brainStyles: [], // Will be populated from data points
          });
        }
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    }
    loadFilterOptions();
  }, []);

  // Build brainStyle filter options from data points (since the benchmark API might not group by brainStyle)
  useEffect(() => {
    if (dataPoints.length > 0 && filterOptions && (!filterOptions.brainStyles || filterOptions.brainStyles.length === 0)) {
      const brainStyleCounts: Record<string, number> = {};
      for (const dp of dataPoints) {
        if (dp.brainStyle) {
          brainStyleCounts[dp.brainStyle] = (brainStyleCounts[dp.brainStyle] || 0) + 1;
        }
      }
      const brainStyleOpts: FilterOption[] = Object.entries(brainStyleCounts)
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count);
      if (brainStyleOpts.length > 0) {
        setFilterOptions((prev) => prev ? { ...prev, brainStyles: brainStyleOpts } : prev);
      }
    }
  }, [dataPoints, filterOptions]);

  // Fetch data points whenever filters change
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (filters.region) params.set("region", filters.region);
      if (filters.country) params.set("country", filters.country);
      if (filters.jobRole) params.set("jobRole", filters.jobRole);
      if (filters.brainStyle) params.set("brainStyle", filters.brainStyle);
      const res = await fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/data-points?${params}`);
      const json = await res.json();
      if (json.ok) {
        setDataPoints(json.dataPoints || []);
        setTotal(json.total || 0);
      } else {
        setError(json.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error loading data points:", err);
      setError(t.loadingError);
    } finally {
      setLoading(false);
    }
  }, [filters, t.loadingError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset person selection when filters change (since the people list changes)
  useEffect(() => {
    setPersonA(null);
    setPersonB(null);
  }, [filters]);

  const bothSelected = personA && personB;

  const comparisonData = useMemo(() => {
    if (!personA || !personB) return null;
    return COMP_KEYS.map((key) => ({
      key,
      label: t[COMP_TKEYS[key] as keyof typeof t] as string,
      scoreA: personA.competencies[key],
      scoreB: personB.competencies[key],
      delta: personA.competencies[key] - personB.competencies[key],
    }));
  }, [personA, personB, t]);

  const complementary = useMemo(() => {
    if (!personA || !personB) return null;
    const aStronger: { key: string; delta: number }[] = [];
    const bStronger: { key: string; delta: number }[] = [];
    const sharedStrengths: string[] = [];
    const sharedGaps: string[] = [];

    COMP_KEYS.forEach((key) => {
      const valA = personA.competencies[key];
      const valB = personB.competencies[key];
      const diff = valA - valB;
      if (diff > 2) aStronger.push({ key, delta: diff });
      else if (diff < -2) bStronger.push({ key, delta: Math.abs(diff) });
      if (valA > 105 && valB > 105) sharedStrengths.push(key);
      if (valA < 95 && valB < 95) sharedGaps.push(key);
    });

    aStronger.sort((a, b) => b.delta - a.delta);
    bStronger.sort((a, b) => b.delta - a.delta);
    return { aStronger, bStronger, sharedStrengths, sharedGaps };
  }, [personA, personB]);

  function getDeltaColor(d: number) {
    if (Math.abs(d) < 1) return "text-gray-400";
    return d > 0 ? "text-emerald-500" : "text-rose-500";
  }

  /** Short display name for table headers, legends, etc. */
  function shortName(person: Person) {
    return person.displayName;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/hub/admin/tp"
          className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500 mb-3">
              <Sparkles className="w-3 h-3" /> {t.badge}
            </span>
            <h1 className="text-3xl font-bold mb-2">{t.pageTitle}</h1>
            <p className="text-[var(--rowi-muted)]">{t.pageSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        t={t}
        total={total}
        lang={lang}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
          <p className="mt-4 text-sm text-[var(--rowi-muted)]">{t.loading}</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
          <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.loadingError}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
          >
            {t.retry}
          </button>
        </motion.div>
      )}

      {/* No Results */}
      {!loading && !error && people.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Globe className="w-16 h-16 text-purple-200 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-lg text-[var(--rowi-muted)]">{t.noResults}</p>
        </motion.div>
      )}

      {/* Person Selectors — only show when we have data */}
      {!loading && !error && people.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-stretch gap-4"
          >
            <PersonSelector
              label={t.selectPersonA}
              selected={personA}
              onSelect={setPersonA}
              excludeId={personB?.id ?? null}
              people={people}
            />
            <div className="flex items-center justify-center">
              <span className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {t.vsLabel}
              </span>
            </div>
            <PersonSelector
              label={t.selectPersonB}
              selected={personB}
              onSelect={setPersonB}
              excludeId={personA?.id ?? null}
              people={people}
            />
          </motion.div>

          {/* Prompt if not both selected */}
          {!bothSelected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <GitCompareArrows className="w-16 h-16 text-purple-200 dark:text-zinc-700 mx-auto mb-4" />
              <p className="text-lg text-[var(--rowi-muted)]">{t.selectPrompt}</p>
            </motion.div>
          )}

          {/* Comparison Content */}
          <AnimatePresence mode="wait">
            {bothSelected && personA && personB && comparisonData && (
              <motion.div
                key={`${personA.id}-${personB.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* EQ Total Comparison */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" /> {t.eqComparison}
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    {/* Person A */}
                    <div className="text-center">
                      <div
                        className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white text-lg font-bold mb-2"
                        style={{ backgroundColor: getBrainStyleColor(personA.brainStyle) }}
                      >
                        {getBrainStyleEmoji(personA.brainStyle)}
                      </div>
                      <div className="font-semibold text-sm">{shortName(personA)}</div>
                      <div className="text-xs text-[var(--rowi-muted)] mb-1">
                        {personA.country} · {personA.role}
                      </div>
                      <div className="text-xs mb-2">
                        <span style={{ color: getBrainStyleColor(personA.brainStyle) }}>
                          {getBrainStyleEmoji(personA.brainStyle)} {getBrainStyleLabel(personA.brainStyle, lang)}
                        </span>
                      </div>
                      <motion.div
                        className="text-4xl font-bold text-purple-600"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {personA.eqTotal.toFixed(1)}
                      </motion.div>
                      <div className="text-xs text-[var(--rowi-muted)]">{t.eqTotal}</div>
                      {/* EQ Level badge */}
                      {(() => {
                        const lvl = getEqLevel(personA.eqTotal);
                        return (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${lvl.color}20`, color: lvl.color }}>
                            {lvl.emoji} {lang === "en" ? lvl.labelEN : lvl.label}
                          </span>
                        );
                      })()}
                    </div>
                    {/* Person B */}
                    <div className="text-center">
                      <div
                        className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white text-lg font-bold mb-2"
                        style={{ backgroundColor: getBrainStyleColor(personB.brainStyle) }}
                      >
                        {getBrainStyleEmoji(personB.brainStyle)}
                      </div>
                      <div className="font-semibold text-sm">{shortName(personB)}</div>
                      <div className="text-xs text-[var(--rowi-muted)] mb-1">
                        {personB.country} · {personB.role}
                      </div>
                      <div className="text-xs mb-2">
                        <span style={{ color: getBrainStyleColor(personB.brainStyle) }}>
                          {getBrainStyleEmoji(personB.brainStyle)} {getBrainStyleLabel(personB.brainStyle, lang)}
                        </span>
                      </div>
                      <motion.div
                        className="text-4xl font-bold text-pink-600"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      >
                        {personB.eqTotal.toFixed(1)}
                      </motion.div>
                      <div className="text-xs text-[var(--rowi-muted)]">{t.eqTotal}</div>
                      {/* EQ Level badge */}
                      {(() => {
                        const lvl = getEqLevel(personB.eqTotal);
                        return (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${lvl.color}20`, color: lvl.color }}>
                            {lvl.emoji} {lang === "en" ? lvl.labelEN : lvl.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  {/* Delta bar */}
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <span className="text-sm text-[var(--rowi-muted)]">{t.delta}:</span>
                    <span className={`text-lg font-bold font-mono ${getDeltaColor(personA.eqTotal - personB.eqTotal)}`}>
                      {personA.eqTotal - personB.eqTotal > 0 ? "+" : ""}
                      {(personA.eqTotal - personB.eqTotal).toFixed(1)}
                    </span>
                  </div>
                </motion.div>

                {/* Radar Chart + Competency Table */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Radar */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800"
                  >
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-500" /> {t.competencyRadar}
                    </h3>
                    <p className="text-xs text-[var(--rowi-muted)] mb-4">{t.competencyRadarDesc}</p>
                    <RadarChart personA={personA} personB={personB} t={t} />
                    <div className="flex justify-center gap-6 mt-3 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-purple-500" />
                        {shortName(personA)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-pink-500" />
                        {shortName(personB)}
                      </span>
                    </div>
                  </motion.div>

                  {/* Table */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800"
                  >
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-500" /> {t.competencyTable}
                    </h3>
                    <p className="text-xs text-[var(--rowi-muted)] mb-4">{t.competencyTableDesc}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-zinc-800">
                            <th className="text-left py-2 text-xs text-[var(--rowi-muted)] font-medium">{t.competency}</th>
                            <th className="text-right py-2 text-xs text-purple-500 font-medium">{shortName(personA)}</th>
                            <th className="text-right py-2 text-xs text-pink-500 font-medium">{shortName(personB)}</th>
                            <th className="text-right py-2 text-xs text-[var(--rowi-muted)] font-medium">{t.delta}</th>
                            <th className="text-center py-2 text-xs text-[var(--rowi-muted)] font-medium">{t.leads}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonData.map((row, i) => (
                            <motion.tr
                              key={row.key}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + i * 0.04 }}
                              className="border-b border-gray-50 dark:border-zinc-800/50"
                            >
                              <td className="py-2 font-medium text-xs">{row.label}</td>
                              <td className="py-2 text-right font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                                {row.scoreA.toFixed(1)}
                              </td>
                              <td className="py-2 text-right font-mono text-xs font-bold text-pink-600 dark:text-pink-400">
                                {row.scoreB.toFixed(1)}
                              </td>
                              <td className={`py-2 text-right font-mono text-xs font-bold ${getDeltaColor(row.delta)}`}>
                                {row.delta > 0 ? "+" : ""}{row.delta.toFixed(1)}
                              </td>
                              <td className="py-2 text-center">
                                {Math.abs(row.delta) < 1 ? (
                                  <span className="text-[10px] text-[var(--rowi-muted)]">{t.tie}</span>
                                ) : row.delta > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                    <TrendingUp className="w-3 h-3" />
                                    {shortName(personA)}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                    <TrendingUp className="w-3 h-3" />
                                    {shortName(personB)}
                                  </span>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                </div>

                {/* Outcomes Comparison */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800"
                >
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-500" /> {t.outcomesComparison}
                  </h3>
                  <p className="text-xs text-[var(--rowi-muted)] mb-6">{t.outcomesDesc}</p>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {OUTCOME_KEYS.map((key, i) => {
                      const valA = personA.outcomes[key];
                      const valB = personB.outcomes[key];
                      const maxVal = Math.max(valA, valB, 120);
                      const minVal = 85;
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.06 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{t[key as keyof typeof t]}</span>
                            <span className={`text-xs font-mono ${getDeltaColor(valA - valB)}`}>
                              {valA - valB > 0 ? "+" : ""}{(valA - valB).toFixed(1)}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] w-16 truncate text-[var(--rowi-muted)]">{shortName(personA)}</span>
                              <div className="flex-1 h-3.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((valA - minVal) / (maxVal - minVal)) * 100}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.06 }}
                                />
                              </div>
                              <span className="text-xs font-mono w-12 text-right font-bold">{valA.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] w-16 truncate text-[var(--rowi-muted)]">{shortName(personB)}</span>
                              <div className="flex-1 h-3.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-600"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((valB - minVal) / (maxVal - minVal)) * 100}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.06 + 0.1 }}
                                />
                              </div>
                              <span className="text-xs font-mono w-12 text-right font-bold">{valB.toFixed(1)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Complementary Analysis */}
                {complementary && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-zinc-800"
                  >
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" /> {t.complementaryAnalysis}
                    </h3>
                    <p className="text-xs text-[var(--rowi-muted)] mb-6">{t.complementaryDesc}</p>

                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      {/* Person A strengths */}
                      <div className="bg-purple-50 dark:bg-purple-900/15 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: getBrainStyleColor(personA.brainStyle) }}
                          >
                            {personA.displayName.slice(3, 5)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-purple-900 dark:text-purple-100">{shortName(personA)}</div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400">{t.strongerIn}</div>
                          </div>
                        </div>
                        {complementary.aStronger.length > 0 ? (
                          <ul className="space-y-1.5">
                            {complementary.aStronger.map((item) => (
                              <li key={item.key} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                <span className="text-purple-800 dark:text-purple-200 font-medium">
                                  {t[COMP_TKEYS[item.key] as keyof typeof t]}
                                </span>
                                <span className="font-mono text-xs text-purple-500 ml-auto">+{item.delta.toFixed(1)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-purple-400">---</p>
                        )}
                      </div>

                      {/* Person B strengths */}
                      <div className="bg-pink-50 dark:bg-pink-900/15 rounded-xl p-4 border border-pink-200 dark:border-pink-800">
                        <div className="flex items-center gap-2 mb-3">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: getBrainStyleColor(personB.brainStyle) }}
                          >
                            {personB.displayName.slice(3, 5)}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-pink-900 dark:text-pink-100">{shortName(personB)}</div>
                            <div className="text-[10px] text-pink-600 dark:text-pink-400">{t.strongerIn}</div>
                          </div>
                        </div>
                        {complementary.bStronger.length > 0 ? (
                          <ul className="space-y-1.5">
                            {complementary.bStronger.map((item) => (
                              <li key={item.key} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
                                <span className="text-pink-800 dark:text-pink-200 font-medium">
                                  {t[COMP_TKEYS[item.key] as keyof typeof t]}
                                </span>
                                <span className="font-mono text-xs text-pink-500 ml-auto">+{item.delta.toFixed(1)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-pink-400">---</p>
                        )}
                      </div>
                    </div>

                    {/* Shared Strengths & Gaps */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/15 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                        <h4 className="font-semibold text-sm text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" /> {t.sharedStrengths}
                        </h4>
                        {complementary.sharedStrengths.length > 0 ? (
                          <ul className="space-y-1">
                            {complementary.sharedStrengths.map((key) => (
                              <li key={key} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                                {t[COMP_TKEYS[key] as keyof typeof t]}
                                <span className="ml-auto font-mono text-xs">
                                  {personA.competencies[key as CompetencyKeys].toFixed(1)} / {personB.competencies[key as CompetencyKeys].toFixed(1)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-emerald-500 opacity-60">{t.noSharedStrengths}</p>
                        )}
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-900/15 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                        <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-amber-500" /> {t.sharedGaps}
                        </h4>
                        {complementary.sharedGaps.length > 0 ? (
                          <ul className="space-y-1">
                            {complementary.sharedGaps.map((key) => (
                              <li key={key} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                                <TrendingDown className="w-3 h-3 flex-shrink-0" />
                                {t[COMP_TKEYS[key] as keyof typeof t]}
                                <span className="ml-auto font-mono text-xs">
                                  {personA.competencies[key as CompetencyKeys].toFixed(1)} / {personB.competencies[key as CompetencyKeys].toFixed(1)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-amber-500 opacity-60">{t.noSharedGaps}</p>
                        )}
                      </div>
                    </div>

                    {/* Brain Style Compatibility */}
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                            style={{ backgroundColor: `${getBrainStyleColor(personA.brainStyle)}20` }}
                          >
                            {getBrainStyleEmoji(personA.brainStyle)}
                          </span>
                          <div className="text-sm">
                            <div className="font-medium">{shortName(personA)}</div>
                            <div className="text-xs" style={{ color: getBrainStyleColor(personA.brainStyle) }}>
                              {getBrainStyleLabel(personA.brainStyle, lang)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[var(--rowi-muted)]">
                          <span className="w-8 h-px bg-gray-300 dark:bg-zinc-600" />
                          <Brain className="w-5 h-5 text-purple-500" />
                          <span className="w-8 h-px bg-gray-300 dark:bg-zinc-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-right">
                            <div className="font-medium">{shortName(personB)}</div>
                            <div className="text-xs" style={{ color: getBrainStyleColor(personB.brainStyle) }}>
                              {getBrainStyleLabel(personB.brainStyle, lang)}
                            </div>
                          </div>
                          <span
                            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                            style={{ backgroundColor: `${getBrainStyleColor(personB.brainStyle)}20` }}
                          >
                            {getBrainStyleEmoji(personB.brainStyle)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Per-Competency Visual Bars */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800"
                >
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" /> {t.competencyTable}
                  </h3>
                  <div className="space-y-4">
                    {COMP_KEYS.map((key, i) => {
                      const valA = personA.competencies[key];
                      const valB = personB.competencies[key];
                      const maxBar = Math.max(valA, valB, 125);
                      const minBar = 85;
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.45 + i * 0.04 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">{t[COMP_TKEYS[key] as keyof typeof t]}</span>
                            <span className="text-[10px] text-[var(--rowi-muted)]">{key}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-purple-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((valA - minBar) / (maxBar - minBar)) * 100}%` }}
                                  transition={{ duration: 0.6, delay: 0.5 + i * 0.04 }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-bold w-10 text-right text-purple-600 dark:text-purple-400">
                                {valA.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex-1 h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-pink-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((valB - minBar) / (maxBar - minBar)) * 100}%` }}
                                  transition={{ duration: 0.6, delay: 0.55 + i * 0.04 }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-bold w-10 text-right text-pink-600 dark:text-pink-400">
                                {valB.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-6 mt-5 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-500" /> {getCountryFlag(personA.country)} {shortName(personA)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-pink-500" /> {getCountryFlag(personB.country)} {shortName(personB)}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Info Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6 flex gap-4"
      >
        <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">{t.infoDesc}</p>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link
          href="/hub/admin/tp/teams"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-purple-500 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" /> {t.navTeams}
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
