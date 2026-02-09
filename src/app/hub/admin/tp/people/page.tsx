"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    backToHub: "TP Hub",
    badge: "Comparador de Personas",
    pageTitle: "Comparador Persona vs Persona",
    pageSubtitle:
      "Selecciona dos personas para comparar perfiles EQ lado a lado: competencias, resultados, estilos cerebrales y análisis complementario",
    selectPersonA: "Seleccionar Persona A",
    selectPersonB: "Seleccionar Persona B",
    searchPlaceholder: "Buscar por nombre...",
    selectPrompt:
      "Selecciona dos personas para iniciar la comparación",
    eqTotal: "EQ Total",
    brainStyle: "Estilo Cerebral",
    role: "Rol",
    region: "Región",
    country: "País",
    competencyRadar: "Radar de Competencias",
    competencyRadarDesc:
      "Superposición de las 8 competencias SEI de ambas personas",
    competencyTable: "Comparación por Competencia",
    competencyTableDesc: "Puntaje, delta y quién lidera en cada competencia",
    outcomesComparison: "Resultados de Vida",
    outcomesDesc: "Comparación de outcomes entre ambas personas",
    complementaryAnalysis: "Análisis Complementario",
    complementaryDesc:
      "Fortalezas y debilidades complementarias entre las dos personas seleccionadas",
    strongerIn: "Más fuerte en",
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
    compEL: "Alfabetización Emocional",
    compRP: "Reconocer Patrones",
    compACT: "Pensamiento Consecuente",
    compNE: "Navegar Emociones",
    compIM: "Motivación Intrínseca",
    compOP: "Ejercer Optimismo",
    compEMP: "Aumentar Empatía",
    compNG: "Metas Nobles",
    infoTitle: "Datos de Comparación TP",
    infoDesc:
      "Este comparador utiliza perfiles EQ ficticios basados en patrones reales de Teleperformance. Los datos individuales son simulados para demostración. Escala SEI: 65–135.",
    navTeams: "Teams",
    navSelection: "Selection",
    vsLabel: "VS",
    eqComparison: "Comparación EQ Total",
  },
  en: {
    backToHub: "TP Hub",
    badge: "Person Comparator",
    pageTitle: "Person vs Person Comparator",
    pageSubtitle:
      "Select two people to compare EQ profiles side by side: competencies, outcomes, brain styles, and complementary analysis",
    selectPersonA: "Select Person A",
    selectPersonB: "Select Person B",
    searchPlaceholder: "Search by name...",
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
      "This comparator uses fictional EQ profiles based on real Teleperformance patterns. Individual data is simulated for demonstration purposes. SEI Scale: 65–135.",
    navTeams: "Teams",
    navSelection: "Selection",
    vsLabel: "VS",
    eqComparison: "EQ Total Comparison",
  },
};

/* =========================================================
   Mock Data — 12 People
========================================================= */
type CompetencyKeys = "EL" | "RP" | "ACT" | "NE" | "IM" | "OP" | "EMP" | "NG";
type OutcomeKeys = "effectiveness" | "relationships" | "wellbeing" | "qualityOfLife";

interface Person {
  id: string;
  name: string;
  role: string;
  region: string;
  country: string;
  brainStyle: string;
  eqTotal: number;
  competencies: Record<CompetencyKeys, number>;
  outcomes: Record<OutcomeKeys, number>;
}

const MOCK_PEOPLE: Person[] = [
  {
    id: "p1", name: "María García", role: "Customer Service", region: "LATAM", country: "México",
    brainStyle: "Diplomat", eqTotal: 108.4,
    competencies: { EL: 112.3, RP: 105.1, ACT: 109.7, NE: 103.8, IM: 110.2, OP: 108.9, EMP: 115.1, NG: 102.1 },
    outcomes: { effectiveness: 110.2, relationships: 113.5, wellbeing: 105.8, qualityOfLife: 107.1 },
  },
  {
    id: "p2", name: "James Chen", role: "Sales", region: "APAC", country: "Singapore",
    brainStyle: "Strategist", eqTotal: 104.7,
    competencies: { EL: 101.2, RP: 110.8, ACT: 112.4, NE: 98.3, IM: 106.5, OP: 103.1, EMP: 99.7, NG: 105.6 },
    outcomes: { effectiveness: 112.8, relationships: 99.4, wellbeing: 101.2, qualityOfLife: 103.5 },
  },
  {
    id: "p3", name: "Sarah Williams", role: "Team Lead", region: "NA", country: "USA",
    brainStyle: "Guardian", eqTotal: 112.1,
    competencies: { EL: 114.5, RP: 108.2, ACT: 115.3, NE: 110.7, IM: 113.9, OP: 112.6, EMP: 109.4, NG: 111.8 },
    outcomes: { effectiveness: 115.3, relationships: 111.2, wellbeing: 110.8, qualityOfLife: 112.4 },
  },
  {
    id: "p4", name: "Ahmed Hassan", role: "Operations", region: "EMEA", country: "Egypt",
    brainStyle: "Architect", eqTotal: 96.3,
    competencies: { EL: 93.1, RP: 99.8, ACT: 101.2, NE: 91.5, IM: 97.3, OP: 94.7, EMP: 92.8, NG: 100.4 },
    outcomes: { effectiveness: 99.5, relationships: 93.2, wellbeing: 95.1, qualityOfLife: 96.8 },
  },
  {
    id: "p5", name: "Ana Rodríguez", role: "HR", region: "LATAM", country: "Colombia",
    brainStyle: "Connector", eqTotal: 110.8,
    competencies: { EL: 113.7, RP: 104.3, ACT: 106.1, NE: 112.5, IM: 108.9, OP: 114.2, EMP: 118.3, NG: 108.6 },
    outcomes: { effectiveness: 107.1, relationships: 116.8, wellbeing: 112.3, qualityOfLife: 110.5 },
  },
  {
    id: "p6", name: "Kenji Tanaka", role: "IT Support", region: "APAC", country: "Japan",
    brainStyle: "Innovator", eqTotal: 99.2,
    competencies: { EL: 96.4, RP: 105.7, ACT: 103.8, NE: 94.2, IM: 101.3, OP: 97.5, EMP: 95.9, NG: 98.8 },
    outcomes: { effectiveness: 104.2, relationships: 96.1, wellbeing: 98.7, qualityOfLife: 99.3 },
  },
  {
    id: "p7", name: "Emma Thompson", role: "Customer Service", region: "EMEA", country: "UK",
    brainStyle: "Diplomat", eqTotal: 105.6,
    competencies: { EL: 108.9, RP: 102.3, ACT: 104.7, NE: 106.1, IM: 103.8, OP: 107.5, EMP: 110.2, NG: 101.4 },
    outcomes: { effectiveness: 106.3, relationships: 109.8, wellbeing: 103.5, qualityOfLife: 105.2 },
  },
  {
    id: "p8", name: "Carlos Mendoza", role: "Sales", region: "LATAM", country: "Argentina",
    brainStyle: "Explorer", eqTotal: 101.9,
    competencies: { EL: 99.1, RP: 103.5, ACT: 105.2, NE: 97.8, IM: 106.7, OP: 100.3, EMP: 98.4, NG: 104.1 },
    outcomes: { effectiveness: 107.5, relationships: 99.8, wellbeing: 98.2, qualityOfLife: 101.6 },
  },
  {
    id: "p9", name: "Priya Sharma", role: "Team Lead", region: "APAC", country: "India",
    brainStyle: "Guardian", eqTotal: 107.3,
    competencies: { EL: 109.2, RP: 106.8, ACT: 110.5, NE: 104.1, IM: 108.7, OP: 105.9, EMP: 107.3, NG: 105.9 },
    outcomes: { effectiveness: 110.1, relationships: 107.5, wellbeing: 104.8, qualityOfLife: 106.2 },
  },
  {
    id: "p10", name: "Michael O'Brien", role: "Operations", region: "NA", country: "Canada",
    brainStyle: "Strategist", eqTotal: 103.1,
    competencies: { EL: 100.5, RP: 107.2, ACT: 108.9, NE: 99.3, IM: 104.1, OP: 101.8, EMP: 100.7, NG: 102.3 },
    outcomes: { effectiveness: 108.3, relationships: 101.4, wellbeing: 100.5, qualityOfLife: 102.7 },
  },
  {
    id: "p11", name: "Fatima Al-Rashidi", role: "HR", region: "EMEA", country: "UAE",
    brainStyle: "Connector", eqTotal: 106.5,
    competencies: { EL: 109.8, RP: 103.1, ACT: 104.6, NE: 107.9, IM: 105.2, OP: 108.3, EMP: 111.7, NG: 101.8 },
    outcomes: { effectiveness: 105.1, relationships: 111.3, wellbeing: 106.9, qualityOfLife: 104.8 },
  },
  {
    id: "p12", name: "David Park", role: "IT Support", region: "NA", country: "USA",
    brainStyle: "Innovator", eqTotal: 98.4,
    competencies: { EL: 95.7, RP: 104.3, ACT: 102.1, NE: 93.8, IM: 100.9, OP: 96.2, EMP: 94.5, NG: 99.7 },
    outcomes: { effectiveness: 103.8, relationships: 95.2, wellbeing: 97.1, qualityOfLife: 98.6 },
  },
];

const COMP_KEYS: CompetencyKeys[] = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
const OUTCOME_KEYS: OutcomeKeys[] = ["effectiveness", "relationships", "wellbeing", "qualityOfLife"];

const COMP_TKEYS: Record<string, string> = {
  EL: "compEL", RP: "compRP", ACT: "compACT", NE: "compNE",
  IM: "compIM", OP: "compOP", EMP: "compEMP", NG: "compNG",
};

const BRAIN_STYLE_COLORS: Record<string, string> = {
  Innovator: "#8b5cf6", Strategist: "#3b82f6", Guardian: "#10b981",
  Diplomat: "#f59e0b", Architect: "#ef4444", Explorer: "#ec4899",
  Connector: "#06b6d4",
};

/* =========================================================
   Components
========================================================= */

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
    return people
      .filter((p) => p.id !== excludeId)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [people, excludeId, search]);

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
              style={{ backgroundColor: BRAIN_STYLE_COLORS[selected.brainStyle] }}
            >
              {selected.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{selected.name}</div>
              <div className="text-xs text-[var(--rowi-muted)]">
                {selected.role} · {selected.region}
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
            className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl max-h-72 overflow-hidden"
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
            <div className="overflow-y-auto max-h-56">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p); setOpen(false); setSearch(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: BRAIN_STYLE_COLORS[p.brainStyle] }}
                  >
                    {p.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-[var(--rowi-muted)]">
                      {p.role} · {p.region} · {p.brainStyle}
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

  const labels = COMP_KEYS.map((k) => t[COMP_TKEYS[k]]);

  function getPoint(index: number, value: number) {
    const angle = (Math.PI * 2 * index) / COMP_KEYS.length - Math.PI / 2;
    const normalized = (value - minScore) / (maxScore - minScore);
    const r = normalized * maxR;
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

  const [personA, setPersonA] = useState<Person | null>(null);
  const [personB, setPersonB] = useState<Person | null>(null);

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

      {/* Person Selectors */}
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
          people={MOCK_PEOPLE}
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
          people={MOCK_PEOPLE}
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
                    style={{ backgroundColor: BRAIN_STYLE_COLORS[personA.brainStyle] }}
                  >
                    {personA.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="font-semibold text-sm">{personA.name}</div>
                  <div className="text-xs text-[var(--rowi-muted)] mb-3">
                    {personA.role} · {personA.brainStyle}
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
                </div>
                {/* Person B */}
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-full mx-auto flex items-center justify-center text-white text-lg font-bold mb-2"
                    style={{ backgroundColor: BRAIN_STYLE_COLORS[personB.brainStyle] }}
                  >
                    {personB.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="font-semibold text-sm">{personB.name}</div>
                  <div className="text-xs text-[var(--rowi-muted)] mb-3">
                    {personB.role} · {personB.brainStyle}
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
                    {personA.name.split(" ")[0]}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-pink-500" />
                    {personB.name.split(" ")[0]}
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
                        <th className="text-right py-2 text-xs text-purple-500 font-medium">{personA.name.split(" ")[0]}</th>
                        <th className="text-right py-2 text-xs text-pink-500 font-medium">{personB.name.split(" ")[0]}</th>
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
                                {personA.name.split(" ")[0]}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                                <TrendingUp className="w-3 h-3" />
                                {personB.name.split(" ")[0]}
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
                          <span className="text-[10px] w-16 truncate text-[var(--rowi-muted)]">{personA.name.split(" ")[0]}</span>
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
                          <span className="text-[10px] w-16 truncate text-[var(--rowi-muted)]">{personB.name.split(" ")[0]}</span>
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
                        style={{ backgroundColor: BRAIN_STYLE_COLORS[personA.brainStyle] }}
                      >
                        {personA.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-purple-900 dark:text-purple-100">{personA.name}</div>
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
                        style={{ backgroundColor: BRAIN_STYLE_COLORS[personB.brainStyle] }}
                      >
                        {personB.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-pink-900 dark:text-pink-100">{personB.name}</div>
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
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: BRAIN_STYLE_COLORS[personA.brainStyle] }}
                      >
                        {personA.brainStyle[0]}
                      </span>
                      <div className="text-sm">
                        <div className="font-medium">{personA.name.split(" ")[0]}</div>
                        <div className="text-xs text-[var(--rowi-muted)]">{personA.brainStyle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--rowi-muted)]">
                      <span className="w-8 h-px bg-gray-300 dark:bg-zinc-600" />
                      <Brain className="w-5 h-5 text-purple-500" />
                      <span className="w-8 h-px bg-gray-300 dark:bg-zinc-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-right">
                        <div className="font-medium">{personB.name.split(" ")[0]}</div>
                        <div className="text-xs text-[var(--rowi-muted)]">{personB.brainStyle}</div>
                      </div>
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: BRAIN_STYLE_COLORS[personB.brainStyle] }}
                      >
                        {personB.brainStyle[0]}
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
                  <span className="w-3 h-3 rounded-full bg-purple-500" /> {personA.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-pink-500" /> {personB.name}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
