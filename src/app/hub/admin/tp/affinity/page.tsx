"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Heart, Users, Sparkles, Brain, Zap, Target,
  Building2, Globe, Shield, TrendingUp, Award, Loader2, AlertCircle,
  Search, RefreshCw, BarChart3, UserCheck, MessageCircle, Send, Bot, X,
  ArrowLeftRight, Settings, Table2, Save, ChevronDown,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getEqLevel } from "@/domains/eq/lib/eqLevels";
import {
  getBrainStyleLabel,
  getBrainStyleEmoji,
  getBrainStyleColor,
  BRAIN_STYLES as BRAIN_STYLE_DATA,
  type BrainStyleKey,
} from "@/domains/eq/lib/dictionary";
import AffinityMonitor from "@/components/affinity/AffinityMonitor";

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
    badge: "Afinidad de Equipo",
    title: "Afinidad de Equipo TP",
    subtitle: "Analisis de compatibilidad emocional en los equipos globales de Teleperformance — basado en estilos cerebrales SEI y datos reales de 14,886 evaluaciones",

    // Brain styles section
    brainDistTitle: "Distribucion Real de Estilos Cerebrales",
    brainDistDesc: "Distribucion de estilos cerebrales del benchmark TP basada en datos reales",
    employees: "evaluaciones",

    // Affinity matrix
    affinityMatrixTitle: "Matriz de Afinidad entre Estilos",
    affinityMatrixDesc: "Compatibilidad emocional calculada por similitud de perfiles de competencia entre estilos cerebrales",
    highAffinity: "Alta afinidad",
    mediumAffinity: "Media afinidad",
    lowAffinity: "Baja afinidad",

    // Complementary pairs
    complementaryTitle: "Parejas Complementarias",
    complementaryDesc: "Combinaciones de estilos cerebrales que generan mayor complementariedad de competencias",
    complementaryReason: "Razon",

    // Regional brain style distribution
    regionalTitle: "Estilos Cerebrales por Region",
    regionalDesc: "Como se distribuyen los estilos cerebrales en cada region de TP",

    // Brain style profiles
    profilesTitle: "Perfiles de Estilo Cerebral",
    profilesDesc: "Caracteristicas, fortalezas y riesgos de cada estilo cerebral encontrado en TP",
    traits: "Rasgos",
    strengths: "Fortalezas",
    risks: "Riesgos",
    facilitation: "Facilitacion",

    // Cross-region insights
    crossRegionTitle: "Perspectivas Interregionales",
    crossRegionDesc: "Patrones de afinidad en las operaciones globales de TP",

    // EQ by brain style
    eqByStyleTitle: "EQ Promedio por Estilo Cerebral",
    eqByStyleDesc: "Puntaje EQ Total promedio para cada estilo cerebral en el benchmark TP",
    avgEQ: "EQ Prom.",
    count: "Evaluaciones",

    // Info box
    infoTitle: "Datos de Afinidad TP",
    infoDesc: "Datos basados en el benchmark real de Teleperformance con 14,886 evaluaciones SEI. Estilos cerebrales y metricas de afinidad calculados desde perfiles reales.",

    // Navigation
    navBenchmark: "Benchmark",
    navEco: "ECO",

    // Community Affinity section
    communityTitle: "Afinidad de Comunidad",
    communityDesc: "Analisis de afinidad emocional entre miembros de tu comunidad",
    searchPlaceholder: "Buscar por nombre, grupo o pais...",
    recalculate: "Recalcular",
    calculating: "Calculando afinidad...",
    noMembers: "No se encontraron miembros",
    overallAffinity: "Afinidad General",
    members: "Miembros",
    selected: "Seleccionados",
    context: "Contexto",
    relationships: "Relaciones",
    leadership: "Liderazgo",
    execution: "Ejecucion",
    innovation: "Innovacion",
    decision: "Decisiones",
    conversation: "Comunicacion",
    analyzeSelected: "Analizar Seleccionados",
    selectedMembers: "seleccionados",
    clearSelection: "Limpiar",
    monitor: "Monitor",
    monitorTitle: "Affinity Monitor",
    forAnalysis: "para analizar",
    inCommunity: "en tu comunidad",
    coachSubtitle: "Tu coach de relaciones",
    askRowi: "Pregunta sobre relaciones...",
    avgAffinity: "Afinidad Promedio",
    analyzed: "analizados",
    notCalculated: "Sin calcular",
    growth: "Crecimiento",
    collaboration: "Colaboracion",
    understanding: "Entendimiento",
    groupAnalysis: "Analisis de Grupo",
    viewBenchmark: "Ver Benchmark",
    viewCommunity: "Ver Comunidad",
    tabBenchmark: "Benchmark TP",
    tabCommunity: "Mi Comunidad",
    tabCompare: "Comparar",
    tabMultiContext: "Multi-Contexto",
    tabConfig: "Configuracion",

    // Compare tab
    compareTitle: "Comparador de Afinidad",
    compareDesc: "Selecciona dos personas para comparar su afinidad en detalle",
    compareMemberA: "Persona A",
    compareMemberB: "Persona B",
    compareSelect: "Seleccionar...",
    compareRun: "Comparar",
    compareVs: "vs",
    compareParts: "Desglose",
    compareBrainStyles: "Estilos Cerebrales",
    compareTalents: "Talentos Compartidos",
    compareCompetencies: "Competencias Fuertes",
    compareNoData: "Selecciona dos personas y haz clic en Comparar",

    // Multi-context tab
    multiTitle: "Analisis Multi-Contexto",
    multiDesc: "Visualiza la afinidad en los 6 contextos simultaneamente para los miembros seleccionados",
    multiSelectMembers: "Selecciona miembros en la tab Comunidad primero",
    multiRunAll: "Calcular Todos",
    multiCalculating: "Calculando todos los contextos...",
    multiAvg: "Promedio",
    multiMember: "Miembro",

    // Config tab
    configTitle: "Configuracion de Afinidad",
    configDesc: "Ajusta los pesos y parametros del calculo de afinidad",
    configWeights: "Pesos por Contexto",
    configWeightsDesc: "Cada contexto tiene 3 dimensiones (Crecimiento, Colaboracion, Entendimiento) que deben sumar 100%",
    configBands: "Bandas Termicas",
    configBandsDesc: "Umbrales para clasificar la temperatura de afinidad",
    configHot: "Caliente",
    configWarm: "Tibio",
    configCold: "Frio",
    configCloseness: "Multiplicadores de Cercania",
    configClose: "Cercano",
    configNeutral: "Neutral",
    configFar: "Lejano",
    configSave: "Guardar Configuracion",
    configSaving: "Guardando...",
    configSaved: "Guardado",
    configRecalculate: "Recalcular Todo",
    configRecalculating: "Recalculando...",
    configLoadError: "Error al cargar configuracion",
    configSaveError: "Error al guardar",
    configSaveSuccess: "Configuracion guardada correctamente",

    // Detail panel
    brainStylesLabel: "Estilos de Pensamiento",
    sharedTalentsLabel: "Talentos en Comun",
    strongCompLabel: "Competencias Fuertes",
    insightLabel: "Insight",
    affinityNote: "La afinidad total considera ponderaciones por contexto, cercania y calibracion.",
    askCoachTip: "Pregunta al Affinity Coach para obtener consejos personalizados.",
    groupTip: "Pregunta al Affinity Coach para recomendaciones sobre este grupo.",

    loading: "Cargando datos de afinidad...",
    errorTitle: "Error al cargar datos",
    errorDesc: "No se pudieron cargar los datos del benchmark. Intenta de nuevo.",
    retry: "Reintentar",
  },
  en: {
    backToHub: "TP Hub",
    badge: "Team Affinity",
    title: "TP Team Affinity",
    subtitle: "Emotional compatibility analysis across Teleperformance global teams — powered by SEI brain style matching and real data from 14,886 assessments",

    // Brain styles section
    brainDistTitle: "Real Brain Style Distribution",
    brainDistDesc: "Brain style distribution from the TP benchmark based on real data",
    employees: "assessments",

    // Affinity matrix
    affinityMatrixTitle: "Style Affinity Matrix",
    affinityMatrixDesc: "Emotional compatibility calculated from competency profile similarity between brain styles",
    highAffinity: "High affinity",
    mediumAffinity: "Medium affinity",
    lowAffinity: "Low affinity",

    // Complementary pairs
    complementaryTitle: "Complementary Pairs",
    complementaryDesc: "Brain style combinations that generate the most competency complementarity",
    complementaryReason: "Reason",

    // Regional brain style distribution
    regionalTitle: "Brain Styles by Region",
    regionalDesc: "How brain styles are distributed across each TP region",

    // Brain style profiles
    profilesTitle: "Brain Style Profiles",
    profilesDesc: "Characteristics, strengths, and risks of each brain style found in TP",
    traits: "Traits",
    strengths: "Strengths",
    risks: "Risks",
    facilitation: "Facilitation",

    // Cross-region insights
    crossRegionTitle: "Cross-Region Insights",
    crossRegionDesc: "Affinity patterns across TP global operations",

    // EQ by brain style
    eqByStyleTitle: "Average EQ by Brain Style",
    eqByStyleDesc: "Average EQ Total score for each brain style in the TP benchmark",
    avgEQ: "Avg EQ",
    count: "Assessments",

    // Info box
    infoTitle: "TP Affinity Data",
    infoDesc: "Data based on the real Teleperformance benchmark with 14,886 SEI assessments. Brain styles and affinity metrics calculated from real profiles.",

    // Navigation
    navBenchmark: "Benchmark",
    navEco: "ECO",

    // Community Affinity section
    communityTitle: "Community Affinity",
    communityDesc: "Emotional affinity analysis between your community members",
    searchPlaceholder: "Search by name, group or country...",
    recalculate: "Recalculate",
    calculating: "Calculating affinity...",
    noMembers: "No members found",
    overallAffinity: "Overall Affinity",
    members: "Members",
    selected: "Selected",
    context: "Context",
    relationships: "Relationships",
    leadership: "Leadership",
    execution: "Execution",
    innovation: "Innovation",
    decision: "Decisions",
    conversation: "Communication",
    analyzeSelected: "Analyze Selected",
    selectedMembers: "selected",
    clearSelection: "Clear",
    monitor: "Monitor",
    monitorTitle: "Affinity Monitor",
    forAnalysis: "for analysis",
    inCommunity: "in your community",
    coachSubtitle: "Your relationship coach",
    askRowi: "Ask about relationships...",
    avgAffinity: "Average Affinity",
    analyzed: "analyzed",
    notCalculated: "Not calculated",
    growth: "Growth",
    collaboration: "Collaboration",
    understanding: "Understanding",
    groupAnalysis: "Group Analysis",
    viewBenchmark: "View Benchmark",
    viewCommunity: "View Community",
    tabBenchmark: "TP Benchmark",
    tabCommunity: "My Community",
    tabCompare: "Compare",
    tabMultiContext: "Multi-Context",
    tabConfig: "Configuration",

    // Compare tab
    compareTitle: "Affinity Comparator",
    compareDesc: "Select two people to compare their affinity in detail",
    compareMemberA: "Person A",
    compareMemberB: "Person B",
    compareSelect: "Select...",
    compareRun: "Compare",
    compareVs: "vs",
    compareParts: "Breakdown",
    compareBrainStyles: "Brain Styles",
    compareTalents: "Shared Talents",
    compareCompetencies: "Strong Competencies",
    compareNoData: "Select two people and click Compare",

    // Multi-context tab
    multiTitle: "Multi-Context Analysis",
    multiDesc: "View affinity across all 6 contexts simultaneously for selected members",
    multiSelectMembers: "Select members in the Community tab first",
    multiRunAll: "Calculate All",
    multiCalculating: "Calculating all contexts...",
    multiAvg: "Average",
    multiMember: "Member",

    // Config tab
    configTitle: "Affinity Configuration",
    configDesc: "Adjust weights and parameters for affinity calculation",
    configWeights: "Context Weights",
    configWeightsDesc: "Each context has 3 dimensions (Growth, Collaboration, Understanding) that must sum to 100%",
    configBands: "Thermal Bands",
    configBandsDesc: "Thresholds for classifying affinity temperature",
    configHot: "Hot",
    configWarm: "Warm",
    configCold: "Cold",
    configCloseness: "Closeness Multipliers",
    configClose: "Close",
    configNeutral: "Neutral",
    configFar: "Far",
    configSave: "Save Configuration",
    configSaving: "Saving...",
    configSaved: "Saved",
    configRecalculate: "Recalculate All",
    configRecalculating: "Recalculating...",
    configLoadError: "Error loading configuration",
    configSaveError: "Error saving",
    configSaveSuccess: "Configuration saved successfully",

    // Detail panel
    brainStylesLabel: "Brain Styles",
    sharedTalentsLabel: "Shared Talents",
    strongCompLabel: "Strong Competencies",
    insightLabel: "Insight",
    affinityNote: "Total affinity considers context weighting, closeness, and calibration.",
    askCoachTip: "Ask the Affinity Coach for personalized advice.",
    groupTip: "Ask the Affinity Coach for recommendations about this group.",

    loading: "Loading affinity data...",
    errorTitle: "Error loading data",
    errorDesc: "Could not load benchmark data. Please try again.",
    retry: "Retry",
  },
};

/* =========================================================
   Types
========================================================= */
interface GroupMetric {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
}

interface BrainStyleGroup {
  name: string;
  count: number;
  metrics: Record<string, GroupMetric>;
  brainStyleDist?: Record<string, number>;
}

interface RegionGroup {
  name: string;
  count: number;
  metrics: Record<string, GroupMetric>;
  brainStyleDist?: Record<string, number>;
}

/* =========================================================
   Community member types
========================================================= */
type CommunityMember = {
  id: string;
  name: string;
  email?: string;
  country?: string;
  brainStyle?: string;
  group?: string;
  closeness?: string;
  affinityPercent?: number | null;
};

type AffPiece = {
  heat135?: number;
  heat?: number;
  heat100?: number;
  affinityLevel?: string;
  interpretation?: string;
  parts?: { growth?: number; collaboration?: number; understanding?: number };
  brainStyles?: { yours?: string; theirs?: string; compatibility?: number };
  sharedTalents?: string[];
  complementaryTalents?: { yours: string; theirs: string }[];
  strongCompetencies?: string[];
  closeness?: string;
  ai_summary?: string;
};

type TabType = "community" | "compare" | "multicontext" | "config" | "benchmark";

type ProjectType = "relationship" | "leadership" | "execution" | "innovation" | "decision" | "conversation";

const PROJECT_COLORS: Record<ProjectType, string> = {
  relationship: "#E53935",
  leadership: "#7B1FA2",
  execution: "#43A047",
  innovation: "#FF9800",
  decision: "#1E88E5",
  conversation: "#00ACC1",
};

function levelFromHeat135(h: number) {
  if (h >= 118) return { level: "Experto", color: "#22c55e" };
  if (h >= 108) return { level: "Diestro", color: "#84cc16" };
  if (h >= 92) return { level: "Funcional", color: "#eab308" };
  if (h >= 82) return { level: "Emergente", color: "#f97316" };
  return { level: "Desafio", color: "#ef4444" };
}

/* =========================================================
   Complementary pairs logic
========================================================= */
const COMPLEMENTARY_PAIRS: { a: string; b: string; reasonEs: string; reasonEn: string; score: number }[] = [
  { a: "Scientist", b: "Visionary", reasonEs: "El analisis riguroso del Cientifico complementa la vision futurista del Visionario", reasonEn: "The Scientist's rigorous analysis complements the Visionary's forward-looking perspective", score: 92 },
  { a: "Strategist", b: "Energizer", reasonEs: "La planificacion estrategica del Estratega se potencia con la energia y accion del Energizador", reasonEn: "The Strategist's planning is enhanced by the Energizer's drive and action", score: 89 },
  { a: "Guardian", b: "Inventor", reasonEs: "La estabilidad del Guardian balancea la creatividad del Inventor", reasonEn: "The Guardian's stability balances the Inventor's creativity", score: 87 },
  { a: "Doer", b: "Sage", reasonEs: "La ejecucion practica del Hacedor se enriquece con la reflexion profunda del Sabio", reasonEn: "The Doer's practical execution is enriched by the Sage's deep reflection", score: 85 },
  { a: "Scientist", b: "Energizer", reasonEs: "El enfoque analitico se complementa con la motivacion contagiosa", reasonEn: "The analytical focus complements the contagious motivation", score: 84 },
  { a: "Strategist", b: "Guardian", reasonEs: "La vision a largo plazo se protege con lealtad y cuidado", reasonEn: "Long-term vision is protected with loyalty and care", score: 83 },
];

/* =========================================================
   Main Page
========================================================= */
export default function TPAffinityPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  const [activeTab, setActiveTab] = useState<TabType>("community");
  const [brainStyleGroups, setBrainStyleGroups] = useState<BrainStyleGroup[]>([]);
  const [regionGroups, setRegionGroups] = useState<RegionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Community affinity state
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<CommunityMember[]>([]);
  const [affByMember, setAffByMember] = useState<Record<string, any>>({});
  const [loadingByMember, setLoadingByMember] = useState<Record<string, boolean>>({});
  const [project, setProject] = useState<ProjectType>("relationship");
  const [q, setQ] = useState("");
  const [loadingAll, setLoadingAll] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const [chat, setChat] = useState<{ role: "assistant" | "user"; content: string }[]>([
    { role: "assistant", content: lang === "en" ? "Hi, I'm Rowi. Who would you like to connect with better today?" : "Hola, soy Rowi. ¿Con quién te gustaría conectar mejor hoy?" },
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [rowiTyping, setRowiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Compare tab state
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [compareResult, setCompareResult] = useState<AffPiece | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Multi-context tab state
  const [multiContextData, setMultiContextData] = useState<Record<string, Record<ProjectType, AffPiece | null>>>({});
  const [multiLoading, setMultiLoading] = useState(false);

  // Config tab state
  const [affinityConfig, setAffinityConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Group filter
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // Load community members
  useEffect(() => {
    async function loadMembers() {
      try {
        const r = await fetch("/api/community/members", { cache: "no-store" });
        const j = await r.json();
        setCommunityMembers(Array.isArray(j?.members) ? j.members : []);
      } catch (err) {
        console.error("Error loading members:", err);
      }
    }
    loadMembers();
  }, []);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Load affinity for all members
  async function loadAffinityAll(force = false) {
    if (communityMembers.length === 0) return;
    setLoadingAll(true);
    const nextAff: Record<string, any> = {};
    const batchSize = 10;
    for (let i = 0; i < communityMembers.length; i += batchSize) {
      const batch = communityMembers.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (member) => {
          try {
            const r = await fetch(`/api/affinity?project=${project}&memberId=${member.id}`, { cache: "no-store" });
            const j = await r.json();
            const aff = j?.items?.[0] ?? (j?.ok && (j?.heat || j?.heat135) ? j : null);
            if (aff) {
              const heat135 = aff?.heat135 ?? (aff?.heat ? Math.round((aff.heat * 135) / 100) : 0);
              const heat100 = aff?.heat100 ?? aff?.heat ?? Math.round((heat135 / 135) * 100);
              const { level } = levelFromHeat135(heat135);
              nextAff[member.id] = { ...aff, heat135, heat100, affinityLevel: level };
            }
          } catch (e) { /* skip */ }
        })
      );
      await new Promise((res) => setTimeout(res, 350));
    }
    setAffByMember(nextAff);
    setLoadingAll(false);
  }

  // Load affinity when project changes
  useEffect(() => {
    if (communityMembers.length > 0 && activeTab === "community") {
      setAffByMember({});
      loadAffinityAll(false);
    }
  }, [project, communityMembers.length, activeTab]);

  // Filter members
  const filteredMembers = useMemo(() => {
    const term = q.toLowerCase().trim();
    const seen = new Set<string>();
    return communityMembers.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      if (groupFilter !== "all" && m.group !== groupFilter) return false;
      return !term || [m.name, m.email, m.group, m.country, m.brainStyle].filter(Boolean).some((v) => (v || "").toLowerCase().includes(term));
    });
  }, [q, communityMembers, groupFilter]);

  // Overall community affinity
  const overallAffinity = useMemo(() => {
    const vals: number[] = [];
    communityMembers.forEach((m) => {
      const v = affByMember[m.id]?.heat100;
      if (typeof v === "number" && v > 0) vals.push(v);
      else if (typeof m.affinityPercent === "number" && m.affinityPercent > 0) vals.push(m.affinityPercent);
    });
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [affByMember, communityMembers]);

  const overallLevel = useMemo(() => levelFromHeat135(Math.round((overallAffinity * 135) / 100)), [overallAffinity]);

  // Chat with Rowi
  async function askRowi() {
    const seed = coachInput.trim();
    if (!seed) return;
    setChat((c) => [...c, { role: "user", content: seed }]);
    setCoachInput("");
    setRowiTyping(true);
    try {
      const memberContext = selectedMembers.map((m) => {
        const aff = affByMember[m.id];
        return `- ${m.name}: ${m.brainStyle || "?"}, afinidad ${aff?.heat100 ?? "?"}%, cercanía: ${m.closeness || "neutral"}`;
      }).join("\n");
      const res = await fetch("/api/rowi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intent: "affinity", locale: lang, ask: memberContext ? `Contexto (proyecto: ${project}):\n${memberContext}\n\n${seed}` : seed }) });
      const j = await res.json();
      setChat((c) => [...c, { role: "assistant", content: j?.text || "No pude generar respuesta." }]);
    } catch { setChat((c) => [...c, { role: "assistant", content: "Error de conexión." }]); }
    finally { setRowiTyping(false); }
  }

  // Available groups for filtering
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    communityMembers.forEach((m) => { if (m.group) groups.add(m.group); });
    return Array.from(groups).sort();
  }, [communityMembers]);

  // Compare two members
  async function runCompare() {
    if (!compareA || !compareB || compareA === compareB) return;
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const r = await fetch(`/api/affinity?project=${project}&memberId=${compareB}`, { cache: "no-store" });
      const j = await r.json();
      const aff = j?.items?.[0] ?? (j?.ok && (j?.heat || j?.heat135) ? j : null);
      if (aff) {
        const heat135 = aff?.heat135 ?? (aff?.heat ? Math.round((aff.heat * 135) / 100) : 0);
        const heat100 = aff?.heat100 ?? aff?.heat ?? Math.round((heat135 / 135) * 100);
        const { level } = levelFromHeat135(heat135);
        setCompareResult({ ...aff, heat135, heat100, affinityLevel: level });
      }
    } catch (e) { console.error("Compare error:", e); }
    finally { setCompareLoading(false); }
  }

  // Multi-context: calculate all 6 contexts for selected members
  const ALL_CONTEXTS: ProjectType[] = ["relationship", "leadership", "execution", "innovation", "decision", "conversation"];
  async function runMultiContext() {
    if (selectedMembers.length === 0) return;
    setMultiLoading(true);
    const result: Record<string, Record<ProjectType, AffPiece | null>> = {};
    for (const ctx of ALL_CONTEXTS) {
      for (const member of selectedMembers) {
        if (!result[member.id]) result[member.id] = {} as Record<ProjectType, AffPiece | null>;
        try {
          const r = await fetch(`/api/affinity?project=${ctx}&memberId=${member.id}`, { cache: "no-store" });
          const j = await r.json();
          const aff = j?.items?.[0] ?? (j?.ok && (j?.heat || j?.heat135) ? j : null);
          if (aff) {
            const heat135 = aff?.heat135 ?? (aff?.heat ? Math.round((aff.heat * 135) / 100) : 0);
            const heat100 = aff?.heat100 ?? aff?.heat ?? Math.round((heat135 / 135) * 100);
            const { level } = levelFromHeat135(heat135);
            result[member.id][ctx] = { ...aff, heat135, heat100, affinityLevel: level };
          } else {
            result[member.id][ctx] = null;
          }
        } catch { result[member.id][ctx] = null; }
      }
      await new Promise((res) => setTimeout(res, 300));
    }
    setMultiContextData(result);
    setMultiLoading(false);
  }

  // Load affinity config
  async function loadConfig() {
    setConfigLoading(true);
    try {
      const r = await fetch("/api/affinity/config");
      const j = await r.json();
      if (j?.ok && j?.config) setAffinityConfig(j.config);
    } catch (e) { console.error("Config load error:", e); }
    finally { setConfigLoading(false); }
  }

  // Save affinity config
  async function saveConfig() {
    if (!affinityConfig) return;
    setConfigSaving(true);
    setConfigSaved(false);
    try {
      const r = await fetch("/api/affinity/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(affinityConfig),
      });
      const j = await r.json();
      if (j?.ok) setConfigSaved(true);
    } catch (e) { console.error("Config save error:", e); }
    finally { setConfigSaving(false); setTimeout(() => setConfigSaved(false), 3000); }
  }

  // Recalculate all affinities
  async function recalculateAll() {
    try {
      await fetch("/api/affinity/recalculate", { method: "POST" });
    } catch (e) { console.error("Recalculate error:", e); }
  }

  // Load config when config tab opens
  useEffect(() => {
    if (activeTab === "config" && !affinityConfig) loadConfig();
  }, [activeTab]);

  // Fetch brain style grouped stats + region grouped stats
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [brainRes, regionRes] = await Promise.all([
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=brainStyle`),
          fetch(`/api/admin/benchmarks/${TP_BENCHMARK_ID}/stats/grouped?groupBy=region`),
        ]);
        const brainJson = await brainRes.json();
        const regionJson = await regionRes.json();

        if (brainJson.ok) {
          setBrainStyleGroups(brainJson.groups ?? []);
        }
        if (regionJson.ok) {
          setRegionGroups(regionJson.groups ?? []);
        }
        if (!brainJson.ok && !regionJson.ok) {
          setError(brainJson.error || "Unknown error");
        }
      } catch (e) {
        console.error("Error loading affinity data:", e);
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute total assessments
  const totalAssessments = useMemo(
    () => brainStyleGroups.reduce((s, g) => s + g.count, 0),
    [brainStyleGroups]
  );

  // Sort brain styles by count
  const sortedBrainStyles = useMemo(
    () => [...brainStyleGroups].sort((a, b) => b.count - a.count),
    [brainStyleGroups]
  );

  // Compute affinity matrix (similarity of competency profiles)
  const affinityMatrix = useMemo(() => {
    if (brainStyleGroups.length < 2) return [];
    const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];

    function getCompVector(group: BrainStyleGroup): number[] {
      return COMP_KEYS.map(k => group.metrics[k]?.mean ?? 100);
    }

    function cosineSimilarity(a: number[], b: number[]): number {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return magA && magB ? (dotProduct / (magA * magB)) * 100 : 0;
    }

    const matrix: { styleA: string; styleB: string; similarity: number }[] = [];
    for (let i = 0; i < brainStyleGroups.length; i++) {
      for (let j = i + 1; j < brainStyleGroups.length; j++) {
        const vecA = getCompVector(brainStyleGroups[i]);
        const vecB = getCompVector(brainStyleGroups[j]);
        matrix.push({
          styleA: brainStyleGroups[i].name,
          styleB: brainStyleGroups[j].name,
          similarity: Math.round(cosineSimilarity(vecA, vecB) * 10) / 10,
        });
      }
    }
    return matrix.sort((a, b) => b.similarity - a.similarity);
  }, [brainStyleGroups]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-500 mb-3">
            <Sparkles className="w-3 h-3" /> {t.badge}
          </span>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" /> {t.title}
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
            <span className="text-sm text-[var(--rowi-muted)]">{t.loading}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> {t.backToHub}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-600">{t.errorTitle}</h3>
          <p className="text-sm text-[var(--rowi-muted)] mt-2">{t.errorDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t.backToHub}
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-500 mb-3">
          <Sparkles className="w-3 h-3" /> {t.badge}
        </span>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Heart className="w-8 h-8 text-pink-500" /> {t.title}
        </h1>
        <p className="text-[var(--rowi-muted)]">{t.subtitle}</p>
      </div>

      {/* ── Tab Selector ── */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        {([
          { key: "community" as TabType, icon: Users, label: t.tabCommunity },
          { key: "compare" as TabType, icon: ArrowLeftRight, label: t.tabCompare },
          { key: "multicontext" as TabType, icon: Table2, label: t.tabMultiContext },
          { key: "config" as TabType, icon: Settings, label: t.tabConfig },
          { key: "benchmark" as TabType, icon: BarChart3, label: t.tabBenchmark },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-sm ${
              activeTab === key ? "bg-pink-500 text-white" : "text-[var(--rowi-muted)] hover:bg-pink-500/10"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowMonitor(!showMonitor)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--rowi-muted)] hover:bg-pink-500/10 transition-colors ml-auto"
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">{t.monitor}</span>
        </button>
      </div>

      {/* ── Affinity Monitor ── */}
      <AnimatePresence>
        {showMonitor && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{t.monitorTitle}</h2>
                <button onClick={() => setShowMonitor(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800">
                  <X className="w-5 h-5 text-[var(--rowi-muted)]" />
                </button>
              </div>
              <AffinityMonitor />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════
         ── Community Tab ──
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "community" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-[var(--rowi-muted)]" />
                <span className="text-xs text-[var(--rowi-muted)]">{t.overallAffinity}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: overallLevel.color }}>{overallAffinity}%</span>
                <span className="text-xs text-[var(--rowi-muted)]">{overallLevel.level}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[var(--rowi-muted)]" />
                <span className="text-xs text-[var(--rowi-muted)]">{t.members}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{communityMembers.length}</span>
                <span className="text-xs text-[var(--rowi-muted)]">{t.inCommunity}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-[var(--rowi-muted)]" />
                <span className="text-xs text-[var(--rowi-muted)]">{t.selected}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-pink-500">{selectedMembers.length}</span>
                <span className="text-xs text-[var(--rowi-muted)]">{t.forAnalysis}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4" style={{ color: PROJECT_COLORS[project] }} />
                <span className="text-xs text-[var(--rowi-muted)]">{t.context}</span>
              </div>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value as ProjectType)}
                className="w-full bg-transparent text-lg font-semibold cursor-pointer focus:outline-none"
                style={{ color: PROJECT_COLORS[project] }}
              >
                <option value="relationship">{t.relationships}</option>
                <option value="leadership">{t.leadership}</option>
                <option value="execution">{t.execution}</option>
                <option value="innovation">{t.innovation}</option>
                <option value="decision">{t.decision}</option>
                <option value="conversation">{t.conversation}</option>
              </select>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
            {/* Members List */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col shadow-sm">
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="font-semibold">{t.communityTitle}</h2>
                  <div className="flex items-center gap-2">
                    {availableGroups.length > 0 && (
                      <select
                        value={groupFilter}
                        onChange={(e) => setGroupFilter(e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[var(--rowi-muted)] focus:outline-none"
                      >
                        <option value="all">{lang === "en" ? "All Groups" : "Todos los Grupos"}</option>
                        {availableGroups.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button
                    onClick={() => loadAffinityAll(true)}
                    disabled={loadingAll}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[var(--rowi-muted)] hover:text-pink-500 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingAll ? "animate-spin" : ""}`} />
                    {t.recalculate}
                  </button>
                </div>
                <div className="mt-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm placeholder:text-[var(--rowi-muted)] focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                  />
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto min-h-[400px] max-h-[600px]">
                {loadingAll ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500 mb-3" />
                    <p className="text-sm text-[var(--rowi-muted)]">{t.calculating}</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-3" />
                    <p className="text-[var(--rowi-muted)]">{t.noMembers}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredMembers.map((m) => {
                      const selected = selectedMembers.some((x) => x.id === m.id);
                      const aff = affByMember[m.id];
                      const affinityPct = aff?.heat100 ?? m.affinityPercent ?? null;
                      const levelInfo = affinityPct !== null ? levelFromHeat135((affinityPct * 135) / 100) : null;

                      return (
                        <motion.div
                          key={m.id}
                          layout
                          onClick={() => setSelectedMembers((prev) => selected ? prev.filter((x) => x.id !== m.id) : [...prev, m])}
                          className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                            selected
                              ? "border-pink-500 bg-pink-500/5 shadow-lg shadow-pink-500/10"
                              : "border-gray-200 dark:border-zinc-700 hover:border-pink-500/50 bg-gray-50 dark:bg-zinc-800/50"
                          }`}
                        >
                          {selected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                              <UserCheck className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0"
                              style={{ background: levelInfo ? `linear-gradient(135deg, ${levelInfo.color}, ${levelInfo.color}99)` : "linear-gradient(135deg, #E53935, #E5393599)" }}
                            >
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-sm truncate">{m.name}</div>
                                {m.brainStyle && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-500 font-medium">{m.brainStyle}</span>
                                )}
                              </div>
                              <div className="text-xs text-[var(--rowi-muted)] truncate">{m.group || m.country || "—"}</div>
                              <div className="flex items-center gap-2 mt-2">
                                {affinityPct !== null ? (
                                  <>
                                    <div className="h-1.5 rounded-full flex-1 bg-gray-200 dark:bg-zinc-700" style={{ maxWidth: "80px" }}>
                                      <div className="h-full rounded-full transition-all" style={{ width: `${affinityPct}%`, background: levelInfo?.color }} />
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: levelInfo?.color }}>{affinityPct}%</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-[var(--rowi-muted)]">{t.notCalculated}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected members footer */}
              {selectedMembers.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--rowi-muted)]">{selectedMembers.length} {t.selectedMembers}</span>
                      <button onClick={() => setSelectedMembers([])} className="text-xs text-pink-500 hover:underline">{t.clearSelection}</button>
                    </div>
                    <button
                      onClick={() => {
                        selectedMembers.forEach((m) => {
                          if (!affByMember[m.id]) {
                            setLoadingByMember((s) => ({ ...s, [m.id]: true }));
                            fetch(`/api/affinity?project=${project}&memberId=${m.id}`, { cache: "no-store" })
                              .then((r) => r.json())
                              .then((j) => {
                                const aff = j?.items?.[0] ?? (j?.ok && (j?.heat || j?.heat135) ? j : null);
                                if (aff) {
                                  const heat135 = aff?.heat135 ?? (aff?.heat ? Math.round((aff.heat * 135) / 100) : 0);
                                  const heat100 = aff?.heat100 ?? aff?.heat ?? Math.round((heat135 / 135) * 100);
                                  const { level } = levelFromHeat135(heat135);
                                  setAffByMember((prev) => ({ ...prev, [m.id]: { ...aff, heat135, heat100, affinityLevel: level } }));
                                }
                              })
                              .finally(() => setLoadingByMember((s) => ({ ...s, [m.id]: false })));
                          }
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:opacity-90"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t.analyzeSelected}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Detail + Chat */}
            <div className="flex flex-col gap-4">
              {/* Detail panel - Single member or group */}
              {selectedMembers.length > 0 && selectedMembers.some((m) => affByMember[m.id]) && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-4 shadow-sm max-h-[500px] overflow-y-auto">
                  {selectedMembers.length === 1 ? (() => {
                    const member = selectedMembers[0];
                    const aff = affByMember[member.id];
                    if (!aff) return null;
                    const heat = aff.heat100 ?? 0;
                    const lvl = levelFromHeat135((heat * 135) / 100);
                    return (<>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${lvl.color}, ${lvl.color}99)` }}>{member.name.charAt(0)}</div>
                          <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            <p className="text-xs text-[var(--rowi-muted)]">{member.brainStyle || aff?.brainStyles?.theirs || "—"} · {member.group || "—"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold" style={{ color: lvl.color }}>{heat}%</div>
                          <div className="text-xs text-[var(--rowi-muted)]">{aff?.affinityLevel || "—"}</div>
                        </div>
                      </div>
                      {/* Parts breakdown */}
                      {aff?.parts && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                            <div className="text-lg font-semibold text-green-500">{Math.round((aff.parts.growth || 0) / 135 * 100)}%</div>
                            <div className="text-[10px] text-[var(--rowi-muted)]">{t.growth}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                            <div className="text-lg font-semibold text-blue-500">{Math.round((aff.parts.collaboration || 0) / 135 * 100)}%</div>
                            <div className="text-[10px] text-[var(--rowi-muted)]">{t.collaboration}</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                            <div className="text-lg font-semibold text-purple-500">{Math.round((aff.parts.understanding || 0) / 135 * 100)}%</div>
                            <div className="text-[10px] text-[var(--rowi-muted)]">{t.understanding}</div>
                          </div>
                        </div>
                      )}
                      {aff?.parts && <div className="text-[10px] text-[var(--rowi-muted)] text-center mb-3 italic">{t.affinityNote}</div>}
                      {/* Brain Styles */}
                      {aff?.brainStyles && (
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-pink-500" />
                            <span className="text-xs font-medium">{t.brainStylesLabel}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="px-2 py-1 rounded-lg bg-pink-500/10 text-pink-500 text-xs">{aff.brainStyles.yours || "—"}</span>
                            <span className="text-[var(--rowi-muted)]">↔</span>
                            <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-500 text-xs">{aff.brainStyles.theirs || member.brainStyle || "—"}</span>
                            <span className="text-xs text-[var(--rowi-muted)]">{aff.brainStyles.compatibility}%</span>
                          </div>
                        </div>
                      )}
                      {/* Shared Talents */}
                      {aff?.sharedTalents && aff.sharedTalents.length > 0 && (
                        <div className="bg-green-500/10 rounded-xl p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">{t.sharedTalentsLabel} ({aff.sharedTalents.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {aff.sharedTalents.slice(0, 6).map((tal: string) => (
                              <span key={tal} className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-300">{tal}</span>
                            ))}
                            {aff.sharedTalents.length > 6 && <span className="text-xs text-green-600">+{aff.sharedTalents.length - 6}</span>}
                          </div>
                        </div>
                      )}
                      {/* Strong Competencies */}
                      {aff?.strongCompetencies && aff.strongCompetencies.length > 0 && (
                        <div className="bg-blue-500/10 rounded-xl p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{t.strongCompLabel}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {aff.strongCompetencies.map((c: string) => (
                              <span key={c} className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* AI Summary */}
                      {(() => {
                        const summary = aff?.ai_summary || aff?.interpretation;
                        if (summary && !summary.includes("modo ahorro")) {
                          return (
                            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 border border-gray-200 dark:border-zinc-700">
                              <div className="flex items-center gap-2 mb-1"><MessageCircle className="w-3 h-3 text-[var(--rowi-muted)]" /><span className="text-[10px] text-[var(--rowi-muted)]">{t.insightLabel}</span></div>
                              <p className="text-xs italic">{summary}</p>
                            </div>
                          );
                        }
                        return <div className="bg-pink-500/5 rounded-xl p-3 border border-pink-500/10"><p className="text-xs text-[var(--rowi-muted)]">{t.askCoachTip}</p></div>;
                      })()}
                    </>);
                  })() : (<>
                    {/* Group analysis */}
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-pink-500" />
                      <h3 className="font-semibold">{t.groupAnalysis} ({selectedMembers.length})</h3>
                    </div>
                    {(() => {
                      const analyzed = selectedMembers.filter((m) => affByMember[m.id]?.heat100);
                      const avg = analyzed.length > 0 ? Math.round(analyzed.reduce((sum, m) => sum + (affByMember[m.id]?.heat100 || 0), 0) / analyzed.length) : 0;
                      const avgLevel = levelFromHeat135((avg * 135) / 100);
                      return (
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 mb-4 text-center">
                          <div className="text-3xl font-bold" style={{ color: avgLevel.color }}>{avg}%</div>
                          <div className="text-sm text-[var(--rowi-muted)]">{t.avgAffinity}</div>
                          <div className="text-xs mt-1" style={{ color: avgLevel.color }}>{avgLevel.level}</div>
                          <div className="text-[10px] text-[var(--rowi-muted)] mt-2">{analyzed.length} / {selectedMembers.length} {t.analyzed}</div>
                        </div>
                      );
                    })()}
                    <div className="space-y-2">
                      {selectedMembers.map((member) => {
                        const aff = affByMember[member.id];
                        if (!aff) return (
                          <div key={member.id} className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-[var(--rowi-muted)]">{member.name.charAt(0)}</div>
                              <span className="text-sm">{member.name}</span>
                            </div>
                            <span className="text-xs text-[var(--rowi-muted)]">{t.notCalculated}</span>
                          </div>
                        );
                        const heat = aff.heat100 ?? 0;
                        const lvl = levelFromHeat135((heat * 135) / 100);
                        return (
                          <div key={member.id} className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium" style={{ background: lvl.color }}>{member.name.charAt(0)}</div>
                                <div>
                                  <span className="text-sm font-medium">{member.name}</span>
                                  <div className="text-[10px] text-[var(--rowi-muted)]">{member.brainStyle || "—"}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold" style={{ color: lvl.color }}>{heat}%</div>
                                <div className="text-[10px] text-[var(--rowi-muted)]">{aff.affinityLevel}</div>
                              </div>
                            </div>
                            {aff.parts && (
                              <div className="flex gap-2 mt-2">
                                <div className="flex-1 text-center"><div className="text-xs font-medium text-green-500">{Math.round((aff.parts.growth || 0) / 135 * 100)}%</div><div className="text-[8px] text-[var(--rowi-muted)]">{t.growth}</div></div>
                                <div className="flex-1 text-center"><div className="text-xs font-medium text-blue-500">{Math.round((aff.parts.collaboration || 0) / 135 * 100)}%</div><div className="text-[8px] text-[var(--rowi-muted)]">{t.collaboration}</div></div>
                                <div className="flex-1 text-center"><div className="text-xs font-medium text-purple-500">{Math.round((aff.parts.understanding || 0) / 135 * 100)}%</div><div className="text-[8px] text-[var(--rowi-muted)]">{t.understanding}</div></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-pink-500/5 rounded-xl p-3 border border-pink-500/10 mt-3"><p className="text-xs text-[var(--rowi-muted)]">{t.groupTip}</p></div>
                  </>)}
                </motion.div>
              )}

              {/* Affinity Coach Chat */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 flex flex-col shadow-sm" style={{ minHeight: "400px" }}>
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Affinity Coach</h3>
                      <p className="text-xs text-[var(--rowi-muted)]">{t.coachSubtitle}</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px]">
                  {chat.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[85%] px-4 py-2.5 text-sm rounded-2xl ${
                        m.role === "assistant" ? "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700" : "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {rowiTyping && (
                    <div className="flex justify-start">
                      <div className="px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={2}
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askRowi(); } }}
                      placeholder={t.askRowi}
                      className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-2.5 text-sm placeholder:text-[var(--rowi-muted)] focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                    />
                    <button
                      onClick={askRowi}
                      disabled={!coachInput.trim() || rowiTyping}
                      className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         ── Compare Tab ──
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "compare" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-pink-500" /> {t.compareTitle}
            </h2>
            <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.compareDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t.compareMemberA}</label>
              <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30">
                <option value="">{t.compareSelect}</option>
                {communityMembers.map((m) => <option key={m.id} value={m.id}>{m.name} {m.brainStyle ? `(${m.brainStyle})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--rowi-muted)] mb-1 block">{t.compareMemberB}</label>
              <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30">
                <option value="">{t.compareSelect}</option>
                {communityMembers.filter((m) => m.id !== compareA).map((m) => <option key={m.id} value={m.id}>{m.name} {m.brainStyle ? `(${m.brainStyle})` : ""}</option>)}
              </select>
            </div>
            <button onClick={runCompare} disabled={!compareA || !compareB || compareLoading} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:opacity-90 disabled:opacity-50">
              {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeftRight className="w-4 h-4" />}
              {t.compareRun}
            </button>
          </div>
          {compareResult && (() => {
            const memberA = communityMembers.find((m) => m.id === compareA);
            const memberB = communityMembers.find((m) => m.id === compareB);
            if (!memberA || !memberB) return null;
            const heat = compareResult.heat100 ?? 0;
            const lvl = levelFromHeat135((heat * 135) / 100);
            return (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm space-y-6">
                {/* Header: A vs B */}
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="w-14 h-14 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 font-bold text-lg mx-auto mb-2">{memberA.name.charAt(0)}</div>
                    <div className="font-semibold text-sm">{memberA.name}</div>
                    <div className="text-xs text-[var(--rowi-muted)]">{memberA.brainStyle || "—"}</div>
                  </div>
                  <div className="text-center px-6">
                    <div className="text-3xl font-bold" style={{ color: lvl.color }}>{heat}%</div>
                    <div className="text-xs" style={{ color: lvl.color }}>{compareResult.affinityLevel}</div>
                    <div className="text-sm text-[var(--rowi-muted)] mt-1">{t.compareVs}</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold text-lg mx-auto mb-2">{memberB.name.charAt(0)}</div>
                    <div className="font-semibold text-sm">{memberB.name}</div>
                    <div className="text-xs text-[var(--rowi-muted)]">{memberB.brainStyle || "—"}</div>
                  </div>
                </div>
                {/* Parts */}
                {compareResult.parts && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">{t.compareParts}</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-green-500">{Math.round((compareResult.parts.growth || 0) / 135 * 100)}%</div>
                        <div className="text-xs text-[var(--rowi-muted)]">{t.growth}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-blue-500">{Math.round((compareResult.parts.collaboration || 0) / 135 * 100)}%</div>
                        <div className="text-xs text-[var(--rowi-muted)]">{t.collaboration}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-purple-500">{Math.round((compareResult.parts.understanding || 0) / 135 * 100)}%</div>
                        <div className="text-xs text-[var(--rowi-muted)]">{t.understanding}</div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Brain styles */}
                {compareResult.brainStyles && (
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Brain className="w-4 h-4 text-pink-500" />{t.compareBrainStyles}</h3>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-500 text-sm">{compareResult.brainStyles.yours || "—"}</span>
                      <span className="text-[var(--rowi-muted)]">↔</span>
                      <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-500 text-sm">{compareResult.brainStyles.theirs || "—"}</span>
                      <span className="text-sm font-semibold">{compareResult.brainStyles.compatibility}%</span>
                    </div>
                  </div>
                )}
                {/* Shared Talents */}
                {compareResult.sharedTalents && compareResult.sharedTalents.length > 0 && (
                  <div className="bg-green-500/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-700 dark:text-green-300"><Sparkles className="w-4 h-4 text-green-500" />{t.compareTalents} ({compareResult.sharedTalents.length})</h3>
                    <div className="flex flex-wrap gap-2">{compareResult.sharedTalents.map((tal: string) => <span key={tal} className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-300">{tal}</span>)}</div>
                  </div>
                )}
                {/* Strong Competencies */}
                {compareResult.strongCompetencies && compareResult.strongCompetencies.length > 0 && (
                  <div className="bg-blue-500/10 rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300"><TrendingUp className="w-4 h-4 text-blue-500" />{t.compareCompetencies}</h3>
                    <div className="flex flex-wrap gap-2">{compareResult.strongCompetencies.map((c: string) => <span key={c} className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">{c}</span>)}</div>
                  </div>
                )}
                {/* AI Summary */}
                {compareResult.ai_summary && !compareResult.ai_summary.includes("modo ahorro") && (
                  <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2 mb-2"><MessageCircle className="w-4 h-4 text-[var(--rowi-muted)]" /><span className="text-xs text-[var(--rowi-muted)]">{t.insightLabel}</span></div>
                    <p className="text-sm italic">{compareResult.ai_summary}</p>
                  </div>
                )}
              </div>
            );
          })()}
          {!compareResult && !compareLoading && (
            <div className="text-center py-16"><ArrowLeftRight className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-3" /><p className="text-[var(--rowi-muted)]">{t.compareNoData}</p></div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         ── Multi-Context Tab ──
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "multicontext" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Table2 className="w-5 h-5 text-pink-500" /> {t.multiTitle}</h2>
              <p className="text-sm text-[var(--rowi-muted)]">{t.multiDesc}</p>
            </div>
            <button onClick={runMultiContext} disabled={selectedMembers.length === 0 || multiLoading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:opacity-90 disabled:opacity-50">
              {multiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {t.multiRunAll}
            </button>
          </div>
          {selectedMembers.length === 0 ? (
            <div className="text-center py-16"><Users className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-3" /><p className="text-[var(--rowi-muted)]">{t.multiSelectMembers}</p></div>
          ) : multiLoading ? (
            <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-3" /><p className="text-sm text-[var(--rowi-muted)]">{t.multiCalculating}</p></div>
          ) : Object.keys(multiContextData).length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-zinc-800">
                      <th className="text-left p-4 text-xs text-[var(--rowi-muted)] font-medium">{t.multiMember}</th>
                      {ALL_CONTEXTS.map((ctx) => (
                        <th key={ctx} className="text-center p-4 text-xs font-medium" style={{ color: PROJECT_COLORS[ctx] }}>
                          {t[ctx === "relationship" ? "relationships" : ctx === "conversation" ? "conversation" : ctx] || ctx}
                        </th>
                      ))}
                      <th className="text-center p-4 text-xs text-[var(--rowi-muted)] font-medium">{t.multiAvg}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMembers.map((member) => {
                      const data = multiContextData[member.id];
                      if (!data) return null;
                      const values = ALL_CONTEXTS.map((ctx) => data[ctx]?.heat100 ?? 0);
                      const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
                      const avgLvl = levelFromHeat135((avg * 135) / 100);
                      return (
                        <tr key={member.id} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 text-xs font-medium">{member.name.charAt(0)}</div>
                              <div>
                                <div className="font-medium text-sm">{member.name}</div>
                                <div className="text-[10px] text-[var(--rowi-muted)]">{member.brainStyle || "—"}</div>
                              </div>
                            </div>
                          </td>
                          {ALL_CONTEXTS.map((ctx) => {
                            const aff = data[ctx];
                            const val = aff?.heat100 ?? 0;
                            const lvl = levelFromHeat135((val * 135) / 100);
                            return (
                              <td key={ctx} className="text-center p-4">
                                <div className="text-lg font-bold" style={{ color: lvl.color }}>{val}%</div>
                                <div className="text-[10px]" style={{ color: lvl.color }}>{lvl.level}</div>
                              </td>
                            );
                          })}
                          <td className="text-center p-4">
                            <div className="text-lg font-bold" style={{ color: avgLvl.color }}>{avg}%</div>
                            <div className="text-[10px]" style={{ color: avgLvl.color }}>{avgLvl.level}</div>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Averages row */}
                    <tr className="bg-gray-50 dark:bg-zinc-800/50 font-semibold">
                      <td className="p-4 text-xs text-[var(--rowi-muted)]">{t.multiAvg}</td>
                      {ALL_CONTEXTS.map((ctx) => {
                        const vals = selectedMembers.map((m) => multiContextData[m.id]?.[ctx]?.heat100 ?? 0);
                        const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                        const lvl = levelFromHeat135((avg * 135) / 100);
                        return <td key={ctx} className="text-center p-4"><div className="text-lg font-bold" style={{ color: lvl.color }}>{avg}%</div></td>;
                      })}
                      <td className="text-center p-4">
                        {(() => {
                          const allVals = selectedMembers.flatMap((m) => ALL_CONTEXTS.map((ctx) => multiContextData[m.id]?.[ctx]?.heat100 ?? 0));
                          const total = allVals.length > 0 ? Math.round(allVals.reduce((a, b) => a + b, 0) / allVals.length) : 0;
                          const lvl = levelFromHeat135((total * 135) / 100);
                          return <div className="text-lg font-bold" style={{ color: lvl.color }}>{total}%</div>;
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16"><Table2 className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-3" /><p className="text-[var(--rowi-muted)]">{t.multiRunAll}</p></div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         ── Config Tab ──
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "config" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-pink-500" /> {t.configTitle}</h2>
              <p className="text-sm text-[var(--rowi-muted)]">{t.configDesc}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={async () => { await recalculateAll(); }} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-sm text-[var(--rowi-muted)] hover:text-pink-500 transition-colors">
                <RefreshCw className="w-4 h-4" /> {t.configRecalculate}
              </button>
              <button onClick={saveConfig} disabled={configSaving || !affinityConfig} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium text-sm hover:opacity-90 disabled:opacity-50">
                {configSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : configSaved ? <Award className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {configSaving ? t.configSaving : configSaved ? t.configSaved : t.configSave}
              </button>
            </div>
          </div>
          {configLoading ? (
            <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-3" /><p className="text-sm text-[var(--rowi-muted)]">{t.loading}</p></div>
          ) : !affinityConfig ? (
            <div className="text-center py-16"><AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" /><p className="text-[var(--rowi-muted)]">{t.configLoadError}</p></div>
          ) : (
            <div className="space-y-6">
              {/* Context Weights */}
              <div>
                <h3 className="text-lg font-semibold mb-2">{t.configWeights}</h3>
                <p className="text-xs text-[var(--rowi-muted)] mb-4">{t.configWeightsDesc}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_CONTEXTS.map((ctx) => {
                    const weights = affinityConfig.contextWeights?.[ctx] || { growth: 0.33, collab: 0.34, understand: 0.33 };
                    const total = (weights.growth || 0) + (weights.collab || 0) + (weights.understand || 0);
                    const isValid = Math.abs(total - 1) < 0.02;
                    return (
                      <div key={ctx} className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 rounded-full" style={{ background: PROJECT_COLORS[ctx] }} />
                          <span className="text-sm font-semibold capitalize">{t[ctx === "relationship" ? "relationships" : ctx === "conversation" ? "conversation" : ctx] || ctx}</span>
                          {!isValid && <span className="text-[10px] text-red-500 ml-auto">≠ 100%</span>}
                        </div>
                        {[
                          { key: "growth", label: t.growth, color: "text-green-500" },
                          { key: "collab", label: t.collaboration, color: "text-blue-500" },
                          { key: "understand", label: t.understanding, color: "text-purple-500" },
                        ].map(({ key, label, color }) => (
                          <div key={key} className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${color}`}>{label}</span>
                              <span className="text-xs font-mono">{Math.round((weights[key] || 0) * 100)}%</span>
                            </div>
                            <input
                              type="range" min="0" max="100" step="5"
                              value={Math.round((weights[key] || 0) * 100)}
                              onChange={(e) => {
                                const newVal = Number(e.target.value) / 100;
                                setAffinityConfig((prev: any) => ({
                                  ...prev,
                                  contextWeights: { ...prev.contextWeights, [ctx]: { ...prev.contextWeights?.[ctx], [key]: newVal } },
                                }));
                              }}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-pink-500"
                              style={{ background: `linear-gradient(to right, ${PROJECT_COLORS[ctx]} ${Math.round((weights[key] || 0) * 100)}%, #e5e7eb ${Math.round((weights[key] || 0) * 100)}%)` }}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Bands */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-semibold mb-3">{t.configBands}</h3>
                  <p className="text-xs text-[var(--rowi-muted)] mb-3">{t.configBandsDesc}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{t.configHot} (≥)</span>
                      <input type="number" min="0" max="100" value={affinityConfig.bands?.hotThreshold ?? 70}
                        onChange={(e) => setAffinityConfig((p: any) => ({ ...p, bands: { ...p.bands, hotThreshold: Number(e.target.value) } }))}
                        className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-center" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{t.configWarm} (≥)</span>
                      <input type="number" min="0" max="100" value={affinityConfig.bands?.warmThreshold ?? 45}
                        onChange={(e) => setAffinityConfig((p: any) => ({ ...p, bands: { ...p.bands, warmThreshold: Number(e.target.value) } }))}
                        className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-center" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{t.configCold} (&lt;)</span>
                      <span className="text-sm text-[var(--rowi-muted)]">&lt; {affinityConfig.bands?.warmThreshold ?? 45}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-sm font-semibold mb-3">{t.configCloseness}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{t.configClose}</span>
                      <span className="text-sm font-mono font-bold text-green-500">{affinityConfig.closeness?.cercano ?? 1.0}x</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{t.configNeutral}</span>
                      <span className="text-sm font-mono font-bold text-yellow-500">{affinityConfig.closeness?.neutral ?? 0.9}x</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{t.configFar}</span>
                      <span className="text-sm font-mono font-bold text-red-500">{affinityConfig.closeness?.lejano ?? 0.75}x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         ── Benchmark Tab ──
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "benchmark" && (<>
      {/* ── TP-wide Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[var(--rowi-muted)]" />
            <span className="text-xs text-[var(--rowi-muted)]">{t.overallAffinity}</span>
          </div>
          <div className="flex items-baseline gap-2">
            {(() => {
              const avgSim = affinityMatrix.length > 0 ? Math.round(affinityMatrix.reduce((s, p) => s + p.similarity, 0) / affinityMatrix.length * 10) / 10 : 0;
              const pct = Math.round(((avgSim - 98) / 2) * 100);
              const normPct = Math.max(0, Math.min(100, pct));
              const lvl = levelFromHeat135(Math.round((normPct * 135) / 100));
              return (<>
                <span className="text-2xl font-bold" style={{ color: lvl.color }}>{avgSim.toFixed(1)}%</span>
                <span className="text-xs text-[var(--rowi-muted)]">{lang === "en" ? "Avg Similarity" : "Similitud Prom."}</span>
              </>);
            })()}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[var(--rowi-muted)]" />
            <span className="text-xs text-[var(--rowi-muted)]">{t.members}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{totalAssessments.toLocaleString()}</span>
            <span className="text-xs text-[var(--rowi-muted)]">{t.employees}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-[var(--rowi-muted)]" />
            <span className="text-xs text-[var(--rowi-muted)]">{lang === "en" ? "Brain Styles" : "Estilos Cerebrales"}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-500">{brainStyleGroups.length}</span>
            <span className="text-xs text-[var(--rowi-muted)]">{lang === "en" ? "identified" : "identificados"}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-[var(--rowi-muted)]" />
            <span className="text-xs text-[var(--rowi-muted)]">{lang === "en" ? "Regions" : "Regiones"}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-500">{regionGroups.length}</span>
            <span className="text-xs text-[var(--rowi-muted)]">{lang === "en" ? "global" : "globales"}</span>
          </div>
        </div>
      </div>

      {/* ── Brain Style Distribution as Community Cards ── */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" /> {t.brainDistTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.brainDistDesc}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sortedBrainStyles.map((group, i) => {
            const pct = totalAssessments > 0 ? ((group.count / totalAssessments) * 100).toFixed(1) : "0";
            const avgEQ = group.metrics.eqTotal?.mean ?? 0;
            const eqLevel = getEqLevel(avgEQ);
            const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
            const topComps = COMP_KEYS
              .map((k) => ({ key: k, val: group.metrics[k]?.mean ?? 0 }))
              .sort((a, b) => b.val - a.val)
              .slice(0, 3);
            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-zinc-700 hover:border-pink-500/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${getBrainStyleColor(group.name)}15` }}
                  >
                    {getBrainStyleEmoji(group.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm truncate" style={{ color: getBrainStyleColor(group.name) }}>
                        {getBrainStyleLabel(group.name, lang)}
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-medium">{pct}%</span>
                    </div>
                    <div className="text-xs text-[var(--rowi-muted)]">{group.count.toLocaleString()} {t.employees}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1.5 rounded-full flex-1 bg-gray-200 dark:bg-zinc-700" style={{ maxWidth: "80px" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${parseFloat(pct) * 4}%`, background: getBrainStyleColor(group.name) }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: eqLevel.color }}>{avgEQ.toFixed(1)} EQ</span>
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {topComps.map((c) => (
                        <span key={c.key} className="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-500">{c.key}: {c.val.toFixed(0)}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── EQ by Brain Style (bars) ── */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" /> {t.eqByStyleTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.eqByStyleDesc}</p>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="space-y-3">
            {[...sortedBrainStyles]
              .sort((a, b) => (b.metrics.eqTotal?.mean ?? 0) - (a.metrics.eqTotal?.mean ?? 0))
              .map((group, i) => {
                const avgEQ = group.metrics.eqTotal?.mean ?? 0;
                const minEQ = 90;
                const maxEQ = 115;
                const barWidth = Math.max(0, Math.min(100, ((avgEQ - minEQ) / (maxEQ - minEQ)) * 100));
                return (
                  <motion.div
                    key={group.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-lg w-8">{getBrainStyleEmoji(group.name)}</span>
                    <span className="text-sm font-medium w-28 truncate" style={{ color: getBrainStyleColor(group.name) }}>
                      {getBrainStyleLabel(group.name, lang)}
                    </span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: getBrainStyleColor(group.name) }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 }}
                      />
                    </div>
                    <span className="text-sm font-mono font-bold w-14 text-right text-purple-600">
                      {avgEQ.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-[var(--rowi-muted)] w-16 text-right">
                      {group.count.toLocaleString()}
                    </span>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ── Affinity Matrix ── */}
      {affinityMatrix.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" /> {t.affinityMatrixTitle}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.affinityMatrixDesc}</p>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            {/* Full NxN Heat Map Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-[var(--rowi-muted)]"></th>
                    {brainStyleGroups.map((g) => (
                      <th key={g.name} className="p-2 text-center" style={{ color: getBrainStyleColor(g.name) }}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-base">{getBrainStyleEmoji(g.name)}</span>
                          <span className="text-[9px] font-medium leading-tight">{getBrainStyleLabel(g.name, lang).slice(0, 6)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {brainStyleGroups.map((rowGroup) => (
                    <tr key={rowGroup.name}>
                      <td className="p-2 font-medium whitespace-nowrap" style={{ color: getBrainStyleColor(rowGroup.name) }}>
                        <div className="flex items-center gap-1">
                          <span>{getBrainStyleEmoji(rowGroup.name)}</span>
                          <span className="text-[10px]">{getBrainStyleLabel(rowGroup.name, lang).slice(0, 8)}</span>
                        </div>
                      </td>
                      {brainStyleGroups.map((colGroup) => {
                        if (rowGroup.name === colGroup.name) {
                          return (
                            <td key={colGroup.name} className="p-1 text-center">
                              <div className="w-full h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-[var(--rowi-muted)]">—</div>
                            </td>
                          );
                        }
                        const pair = affinityMatrix.find(
                          (p) => (p.styleA === rowGroup.name && p.styleB === colGroup.name) ||
                                 (p.styleA === colGroup.name && p.styleB === rowGroup.name)
                        );
                        const sim = pair?.similarity ?? 0;
                        const affinityLevel = sim > 99.5 ? "high" : sim > 99 ? "medium" : "low";
                        const bg = affinityLevel === "high" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : affinityLevel === "medium" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)]";
                        return (
                          <td key={colGroup.name} className="p-1 text-center">
                            <div className={`w-full h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${bg}`}>
                              {sim.toFixed(1)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Top pairs list */}
            <h3 className="text-sm font-semibold mb-3">{lang === "en" ? "Top Affinity Pairs" : "Pares de Mayor Afinidad"}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {affinityMatrix.slice(0, 8).map((pair, i) => {
                const affinityLevel = pair.similarity > 99.5 ? "high" : pair.similarity > 99 ? "medium" : "low";
                const bgColor = affinityLevel === "high"
                  ? "bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800"
                  : affinityLevel === "medium"
                  ? "bg-blue-50 dark:bg-blue-900/15 border-blue-200 dark:border-blue-800"
                  : "bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700";
                return (
                  <motion.div
                    key={`${pair.styleA}-${pair.styleB}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-xl p-4 border ${bgColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getBrainStyleEmoji(pair.styleA)}</span>
                        <span className="text-xs font-medium" style={{ color: getBrainStyleColor(pair.styleA) }}>
                          {getBrainStyleLabel(pair.styleA, lang)}
                        </span>
                      </div>
                      <span className="text-[var(--rowi-muted)]">×</span>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getBrainStyleEmoji(pair.styleB)}</span>
                        <span className="text-xs font-medium" style={{ color: getBrainStyleColor(pair.styleB) }}>
                          {getBrainStyleLabel(pair.styleB, lang)}
                        </span>
                      </div>
                      <span className="ml-auto text-sm font-bold text-pink-600">
                        {pair.similarity.toFixed(1)}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 justify-center mt-4 text-xs text-[var(--rowi-muted)]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400" /> {t.highAffinity}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400" /> {t.mediumAffinity}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400" /> {t.lowAffinity}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Complementary Pairs ── */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> {t.complementaryTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.complementaryDesc}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {COMPLEMENTARY_PAIRS.map((pair, i) => (
            <motion.div
              key={`${pair.a}-${pair.b}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-2xl p-5 border border-pink-500/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{getBrainStyleEmoji(pair.a)}</span>
                  <span className="text-sm font-bold" style={{ color: getBrainStyleColor(pair.a) }}>
                    {getBrainStyleLabel(pair.a, lang)}
                  </span>
                </div>
                <span className="text-pink-500 font-bold">+</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{getBrainStyleEmoji(pair.b)}</span>
                  <span className="text-sm font-bold" style={{ color: getBrainStyleColor(pair.b) }}>
                    {getBrainStyleLabel(pair.b, lang)}
                  </span>
                </div>
                <span className="ml-auto text-lg font-bold text-pink-600">{pair.score}%</span>
              </div>
              <p className="text-xs text-[var(--rowi-muted)]">
                {lang === "en" ? pair.reasonEn : pair.reasonEs}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Brain Styles by Region (REAL DATA) ── */}
      {regionGroups.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> {t.regionalTitle}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.regionalDesc}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {regionGroups
              .filter(r => r.brainStyleDist && Object.keys(r.brainStyleDist).length > 0)
              .slice(0, 6)
              .map((region, i) => {
                const total = Object.values(region.brainStyleDist!).reduce((s, v) => s + v, 0);
                const entries = Object.entries(region.brainStyleDist!)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                const avgEQ = region.metrics.eqTotal?.mean ?? 0;
                return (
                  <motion.div
                    key={region.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-sm">{region.name}</span>
                      <span className="text-xs text-purple-500 font-mono ml-auto">EQ {avgEQ.toFixed(1)}</span>
                      <span className="text-[10px] text-[var(--rowi-muted)]">
                        {region.count.toLocaleString()} {t.employees}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entries.map(([style, count]) => {
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
                        return (
                          <div key={style} className="flex items-center gap-2">
                            <span className="text-sm">{getBrainStyleEmoji(style)}</span>
                            <span className="text-xs w-20 truncate" style={{ color: getBrainStyleColor(style) }}>
                              {getBrainStyleLabel(style, lang)}
                            </span>
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ backgroundColor: getBrainStyleColor(style), width: `${parseFloat(pct) * 4}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold w-12 text-right">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Cross-Region Affinity Matrix ── */}
      {regionGroups.length > 1 && (
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" /> {t.crossRegionTitle}
          </h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.crossRegionDesc}</p>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-[var(--rowi-muted)]">{lang === "en" ? "Region" : "Region"}</th>
                    {regionGroups.filter(r => r.count > 50).slice(0, 8).map((r) => (
                      <th key={r.name} className="p-2 text-center text-blue-600 font-medium">
                        <span className="text-[10px]">{r.name.slice(0, 12)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regionGroups.filter(r => r.count > 50).slice(0, 8).map((rowRegion) => {
                    const COMP_KEYS = ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"];
                    const rowVec = COMP_KEYS.map(k => rowRegion.metrics[k]?.mean ?? 100);
                    return (
                      <tr key={rowRegion.name} className="border-t border-gray-50 dark:border-zinc-800/50">
                        <td className="p-2 font-medium text-blue-600 whitespace-nowrap">{rowRegion.name.slice(0, 12)}</td>
                        {regionGroups.filter(r => r.count > 50).slice(0, 8).map((colRegion) => {
                          if (rowRegion.name === colRegion.name) {
                            return <td key={colRegion.name} className="p-1 text-center"><div className="w-full h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-[var(--rowi-muted)]">—</div></td>;
                          }
                          const colVec = COMP_KEYS.map(k => colRegion.metrics[k]?.mean ?? 100);
                          const dot = rowVec.reduce((s, v, i) => s + v * colVec[i], 0);
                          const magA = Math.sqrt(rowVec.reduce((s, v) => s + v * v, 0));
                          const magB = Math.sqrt(colVec.reduce((s, v) => s + v * v, 0));
                          const sim = magA && magB ? Math.round((dot / (magA * magB)) * 1000) / 10 : 0;
                          const lvl = sim > 99.5 ? "high" : sim > 99 ? "medium" : "low";
                          const bg = lvl === "high" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : lvl === "medium" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "bg-gray-100 dark:bg-zinc-800 text-[var(--rowi-muted)]";
                          return (
                            <td key={colRegion.name} className="p-1 text-center">
                              <div className={`w-full h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${bg}`}>{sim.toFixed(1)}</div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Brain Style Profiles ── */}
      <div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-500" /> {t.profilesTitle}
        </h2>
        <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.profilesDesc}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {sortedBrainStyles.slice(0, 8).map((group, i) => {
            const styleKey = group.name.toLowerCase() as BrainStyleKey;
            const styleData = BRAIN_STYLE_DATA[styleKey];
            if (!styleData) return null;
            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getBrainStyleEmoji(group.name)}</span>
                  <div>
                    <h3 className="font-bold" style={{ color: getBrainStyleColor(group.name) }}>
                      {getBrainStyleLabel(group.name, lang)}
                    </h3>
                    <p className="text-[10px] text-[var(--rowi-muted)]">
                      {group.count.toLocaleString()} {t.employees} · EQ {(group.metrics.eqTotal?.mean ?? 0).toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-[var(--rowi-muted)]">{t.traits}: </span>
                    <span>{styleData.traits.join(", ")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-600">{t.strengths}: </span>
                    <span>{styleData.strengths.join(", ")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-600">{t.risks}: </span>
                    <span>{styleData.risks.join(", ")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-500">{t.facilitation}: </span>
                    <span>{styleData.facilitation}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-pink-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-1">{t.infoTitle}</h3>
          <p className="text-sm text-pink-700 dark:text-pink-300">{t.infoDesc}</p>
        </div>
      </motion.div>

      </>)}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/benchmark" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-pink-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.navBenchmark}
        </Link>
        <Link href="/hub/admin/tp/eco" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.navEco} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
