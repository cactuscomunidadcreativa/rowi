"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Users,
  Search,
  RefreshCw,
  Send,
  Bot,
  Sparkles,
  TrendingUp,
  UserCheck,
  Loader2,
  Filter,
  ChevronDown,
  MessageCircle,
  Zap,
  Target,
  Eye,
  BarChart3,
  ArrowUpRight,
  X,
  Brain,
  Lightbulb,
} from "lucide-react";
import AffinityMonitor from "@/components/affinity/AffinityMonitor";

/* =========================================================
   🎯 Affinity Page — Rowi SIA
   ---------------------------------------------------------
   Mide y mejora la conexión emocional con tu comunidad
   usando el modelo Six Seconds de inteligencia emocional.

   Funcionalidades:
   - Calcular afinidad con miembros de la comunidad
   - Chat con Rowi para insights de relaciones
   - Monitor de afinidad del equipo
   - Filtros por contexto (relaciones, equipo, trabajo, liderazgo)
========================================================= */

type Member = {
  id: string;
  name: string;
  email?: string;
  country?: string;
  brainStyle?: string;
  group?: string;
  closeness?: "Cercano" | "Neutral" | "Lejano" | string;
  avatar?: string;
  affinityHeat135?: number | null;
  affinityPercent?: number | null;
};

type AffPiece = {
  heat135?: number;
  heat?: number;
  heat100?: number;
  affinityLevel?: string;
  interpretation?: string;
  fade?: boolean;
  parts?: { growth?: number; collaboration?: number; understanding?: number };
  brainStyles?: { yours?: string; theirs?: string; compatibility?: number };
  sharedTalents?: string[];
  complementaryTalents?: { yours: string; theirs: string }[];
  strongCompetencies?: string[];
  closeness?: string;
  ai_summary?: string;
};

type ProjectType = "relationship" | "leadership" | "execution" | "innovation" | "decision" | "conversation";

const PROJECT_MAP: Record<string, ProjectType> = {
  relationship: "relationship",
  relaciones: "relationship",
  leadership: "leadership",
  liderazgo: "leadership",
  equipo: "leadership",
  execution: "execution",
  trabajo: "execution",
  innovation: "innovation",
  innovacion: "innovation",
  creatividad: "innovation",
  decision: "decision",
  decisiones: "decision",
  conversation: "conversation",
  comunicacion: "conversation",
};

const PROJECT_COLORS: Record<ProjectType, string> = {
  relationship: "#E53935",    // Rojo - conexión emocional
  leadership: "#7B1FA2",      // Púrpura - influencia
  execution: "#43A047",       // Verde - acción
  innovation: "#FF9800",      // Naranja - creatividad
  decision: "#1E88E5",        // Azul - análisis
  conversation: "#00ACC1",    // Cyan - comunicación
};

const PROJECT_ICONS: Record<ProjectType, React.ElementType> = {
  relationship: Heart,
  leadership: Zap,
  execution: Target,
  innovation: Sparkles,
  decision: Brain,
  conversation: MessageCircle,
};

export default function AffinityPage() {
  const { t, lang } = useI18n();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [affByMember, setAffByMember] = useState<Record<string, AffPiece>>({});
  const [loadingByMember, setLoadingByMember] = useState<Record<string, boolean>>({});
  const [project, setProject] = useState<ProjectType>("relationship");
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);

  // Chat con Rowi
  const [chat, setChat] = useState<{ role: "assistant" | "user"; content: string }[]>([
    {
      role: "assistant",
      content: t("affinity.rowiWelcome") || "Hola, soy Rowi. ¿Con quién te gustaría conectar mejor hoy?",
    },
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [rowiTyping, setRowiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const normalizedProject = PROJECT_MAP[project] ?? "execution";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* =========================================================
     📦 Cargar miembros
  ========================================================= */
  async function loadMembers() {
    try {
      const r = await fetch("/api/community/members", { cache: "no-store" });
      const j = await r.json();
      setMembers(Array.isArray(j?.members) ? j.members : []);
    } catch (err) {
      console.error("Error cargando miembros:", err);
      setMembers([]);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [lang]);

  /* =========================================================
     ⚖️ Nivel textual por heat135
  ========================================================= */
  function levelFromHeat135(h: number) {
    if (h >= 118) return { level: "Experto", color: "#22c55e" };
    if (h >= 108) return { level: "Diestro", color: "#84cc16" };
    if (h >= 92) return { level: "Funcional", color: "#eab308" };
    if (h >= 82) return { level: "Emergente", color: "#f97316" };
    return { level: "Desafío", color: "#ef4444" };
  }

  /* =========================================================
     🚀 Calcular afinidad de toda la comunidad
  ========================================================= */
  async function loadAffinityAll(force = false) {
    if (!members.length) return;

    const cacheKey = `affinity-cache-${normalizedProject}`;

    // Always recalculate if affByMember is empty (first load or context change)
    const hasData = Object.keys(affByMember).length > 0;
    if (!force && hasData) {
      // Only skip if we already have data AND not forcing
      const last = Number(localStorage.getItem(cacheKey) || 0);
      const expired = Date.now() - last > 24 * 60 * 60 * 1000;
      if (!expired) {
        return;
      }
    }

    setLoadingAll(true);
    const batchSize = 10;
    const nextAff: Record<string, AffPiece> = {};

    for (let i = 0; i < (members?.length || 0); i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (member) => {
          try {
            const r = await fetch(`/api/affinity?project=${normalizedProject}&memberId=${member.id}`, {
              cache: "no-store",
            });
            const j = await r.json();
            // Handle both items array and direct response format
            const aff = j?.items?.[0] ?? (j?.ok && (j?.heat || j?.heat135) ? j : null);
            if (!aff) return;
            const heat135 = aff?.heat135 ?? (aff?.heat ? Math.round((aff.heat * 135) / 100) : 0);
            const heat100 = aff?.heat100 ?? aff?.heat ?? Math.round((heat135 / 135) * 100);
            const { level } = levelFromHeat135(heat135);
            nextAff[member.id] = {
              ...aff,
              heat135,
              heat100,
              affinityLevel: level,
            };
          } catch (e) {
            console.warn("Error batch recalc:", member.name, e);
          }
        })
      );
      await new Promise((res) => setTimeout(res, 350));
    }

    setAffByMember(nextAff);
    localStorage.setItem(cacheKey, String(Date.now()));
    setLoadingAll(false);
  }

  useEffect(() => {
    if (members.length > 0) {
      // Clear previous affinity data when changing context (different context = different affinity scores)
      setAffByMember({});
      // Always load affinity data automatically when page opens or context changes
      // This ensures the "Overall Affinity" metric always shows a value
      loadAffinityAll(false);
    }
  }, [normalizedProject, members.length]);

  /* =========================================================
     💎 Calcular afinidad individual + Interpretación IA
  ========================================================= */
  async function loadAffinityFor(member: Member): Promise<AffPiece | null> {
    if (!member?.id) {
      console.warn("loadAffinityFor: member.id is missing");
      return null;
    }
    try {
      setLoadingByMember((s) => ({ ...s, [member.id]: true }));

      const url = `/api/affinity?project=${normalizedProject}&memberId=${member.id}`;
      console.log("[Affinity] Loading:", url);

      const r = await fetch(url, {
        cache: "no-store",
      });

      if (!r.ok) {
        console.error("[Affinity] API error:", r.status, r.statusText);
        return null;
      }

      const j = await r.json();
      console.log("[Affinity] Response for", member.name, ":", j?.ok, "heat:", j?.items?.[0]?.heat || j?.heat);

      // Handle both direct response and items array format
      const aff = j?.items?.[0] ?? (j?.ok && (j?.heat || j?.heat135) ? j : null);
      if (!aff) {
        console.warn("[Affinity] No affinity data in response for", member.name);
        return null;
      }

      const heat135 = aff?.heat135 ?? (aff?.heat ? Math.round((aff.heat * 135) / 100) : 0);
      const heat100 = aff?.heat100 ?? aff?.heat ?? Math.round((heat135 / 135) * 100);
      const { level } = levelFromHeat135(heat135);

      // Build the complete affinity piece
      const affPiece: AffPiece = {
        ...aff,
        heat135,
        heat100,
        affinityLevel: level,
        interpretation: aff?.ai_summary || null,
        fade: true,
      };

      return affPiece;
    } catch (err) {
      console.error("[Affinity] Error loading affinity for", member.name, ":", err);
      return null;
    } finally {
      setLoadingByMember((s) => ({ ...s, [member.id]: false }));
    }
  }

  /* =========================================================
     💎 Calcular afinidad para múltiples miembros (secuencial con batches)
  ========================================================= */
  async function loadAffinityForMultiple(membersToLoad: Member[]) {
    if (!membersToLoad.length) return;

    console.log(`[Affinity] Loading ${membersToLoad.length} members...`);

    // Mark all as loading
    const loadingState: Record<string, boolean> = {};
    membersToLoad.forEach((m) => (loadingState[m.id] = true));
    setLoadingByMember((s) => ({ ...s, ...loadingState }));

    // Collect all results first, then update state once
    const results: Record<string, AffPiece> = {};

    // Process in batches of 3 to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < membersToLoad.length; i += batchSize) {
      const batch = membersToLoad.slice(i, i + batchSize);

      // Process batch in parallel and collect results
      const batchResults = await Promise.all(
        batch.map(async (member) => {
          const result = await loadAffinityFor(member);
          return { memberId: member.id, result };
        })
      );

      // Collect successful results
      batchResults.forEach(({ memberId, result }) => {
        if (result) {
          results[memberId] = result;
        }
      });

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < membersToLoad.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Update state with all results at once to avoid race conditions
    console.log(`[Affinity] Updating state with ${Object.keys(results).length} results`);
    setAffByMember((prev) => ({
      ...prev,
      ...results,
    }));

    console.log(`[Affinity] Finished loading ${membersToLoad.length} members`);
  }

  /* =========================================================
     💬 Chat con Affinity Coach
  ========================================================= */
  async function askRowiAffinity() {
    const seed = coachInput.trim();
    if (!seed) return;
    setChat((c) => [...c, { role: "user", content: seed }]);
    setCoachInput("");
    setRowiTyping(true);

    try {
      // Build context about selected members for personalized responses
      const memberContext = selectedMembers.length > 0
        ? selectedMembers.map((m) => {
            const aff = affByMember[m.id];
            const heat = aff?.heat100 ?? m.affinityPercent ?? null;
            return `- ${m.name}: ${m.brainStyle || "estilo no definido"}, afinidad ${heat !== null ? heat + "%" : "sin calcular"}, cercanía: ${m.closeness || "neutral"}`;
          }).join("\n")
        : "";

      const contextualAsk = selectedMembers.length
        ? `Contexto de afinidad (proyecto: ${normalizedProject}):\n${memberContext}\n\nPregunta del usuario: ${seed}`
        : seed;

      console.log("[AffinityCoach] Sending:", { intent: "affinity", locale: lang, ask: contextualAsk.substring(0, 100) + "..." });

      const res = await fetch("/api/rowi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "affinity",
          locale: lang,
          ask: contextualAsk,
        }),
      });

      if (!res.ok) {
        console.error("[AffinityCoach] API error:", res.status, res.statusText);
        setChat((c) => [...c, { role: "assistant", content: `Error del servidor: ${res.status}` }]);
        return;
      }

      const j = await res.json();
      console.log("[AffinityCoach] Response:", j);
      setChat((c) => [...c, { role: "assistant", content: j?.text || "No pude generar respuesta ahora." }]);
    } catch (err) {
      console.error("[AffinityCoach] Error:", err);
      setChat((c) => [...c, { role: "assistant", content: "Hubo un error de conexión." }]);
    } finally {
      setRowiTyping(false);
    }
  }

  /* =========================================================
     🔍 Filtro
  ========================================================= */
  const filteredMembers = useMemo(() => {
    const term = q.toLowerCase().trim();
    const seen = new Set<string>();
    return members.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      const match = !term
        ? true
        : [m.name, m.email, m.group, m.country, m.brainStyle]
            .filter(Boolean)
            .some((v) => (v || "").toLowerCase().includes(term));
      return match;
    });
  }, [q, members]);

  /* =========================================================
     🧮 Promedio general
     Combina datos de affByMember con los precalculados de members
  ========================================================= */
  const overallAffinity = useMemo(() => {
    // Combinar todas las fuentes de datos de afinidad
    const allValues: number[] = [];

    members.forEach((m) => {
      // Primero intentar con datos calculados en tiempo real (affByMember)
      const realtimeVal = affByMember[m.id]?.heat100;
      if (typeof realtimeVal === "number" && realtimeVal > 0) {
        allValues.push(realtimeVal);
      } else if (typeof m.affinityPercent === "number" && m.affinityPercent > 0) {
        // Sino usar los datos precalculados del miembro
        allValues.push(m.affinityPercent);
      }
    });

    if (allValues.length > 0) {
      return Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length);
    }

    return 0;
  }, [affByMember, members]);

  const overallLevel = useMemo(() => {
    const h135 = Math.round((overallAffinity * 135) / 100);
    return levelFromHeat135(h135);
  }, [overallAffinity]);

  const ProjectIcon = PROJECT_ICONS[project];

  /* =========================================================
     UI
  ========================================================= */
  return (
    <main className="min-h-screen bg-[var(--rowi-background)] pt-20 pb-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--rowi-foreground)] flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${PROJECT_COLORS[project]}15` }}
              >
                <Heart className="w-6 h-6" style={{ color: PROJECT_COLORS[project] }} />
              </div>
              {t("affinity.title") || "Afinidad"}
            </h1>
            <p className="text-[var(--rowi-muted)] mt-1">
              {t("affinity.subtitle") || "Mide y mejora tu conexión emocional con tu comunidad"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMonitor(!showMonitor)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--rowi-surface)] border border-[var(--rowi-border)] text-[var(--rowi-foreground)] hover:bg-[var(--rowi-border)] transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{t("affinity.monitor") || "Monitor"}</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {/* Overall Affinity */}
          <div className="bg-[var(--rowi-surface)] rounded-2xl p-4 border border-[var(--rowi-border)]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[var(--rowi-muted)]" />
              <span className="text-xs text-[var(--rowi-muted)]">{t("affinity.overallAffinity") || "Afinidad General"}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold" style={{ color: overallLevel.color }}>
                {overallAffinity}%
              </span>
              <span className="text-xs text-[var(--rowi-muted)]">{overallLevel.level}</span>
            </div>
          </div>

          {/* Members */}
          <div className="bg-[var(--rowi-surface)] rounded-2xl p-4 border border-[var(--rowi-border)]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[var(--rowi-muted)]" />
              <span className="text-xs text-[var(--rowi-muted)]">{t("affinity.members") || "Miembros"}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--rowi-foreground)]">{members.length}</span>
              <span className="text-xs text-[var(--rowi-muted)]">{t("affinity.inCommunity") || "en tu comunidad"}</span>
            </div>
          </div>

          {/* Selected */}
          <div className="bg-[var(--rowi-surface)] rounded-2xl p-4 border border-[var(--rowi-border)]">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-[var(--rowi-muted)]" />
              <span className="text-xs text-[var(--rowi-muted)]">{t("affinity.selected") || "Seleccionados"}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--rowi-primary)]">{selectedMembers.length}</span>
              <span className="text-xs text-[var(--rowi-muted)]">{t("affinity.forAnalysis") || "para analizar"}</span>
            </div>
          </div>

          {/* Context */}
          <div className="bg-[var(--rowi-surface)] rounded-2xl p-4 border border-[var(--rowi-border)]">
            <div className="flex items-center gap-2 mb-2">
              <ProjectIcon className="w-4 h-4" style={{ color: PROJECT_COLORS[project] }} />
              <span className="text-xs text-[var(--rowi-muted)]">{t("affinity.context") || "Contexto"}</span>
            </div>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value as ProjectType)}
              className="w-full bg-transparent text-lg font-semibold text-[var(--rowi-foreground)] cursor-pointer focus:outline-none"
              style={{ color: PROJECT_COLORS[project] }}
            >
              <option value="relationship">{t("affinity.relationships") || "Relaciones"}</option>
              <option value="leadership">{t("affinity.leadership") || "Liderazgo"}</option>
              <option value="execution">{t("affinity.execution") || "Ejecución"}</option>
              <option value="innovation">{t("affinity.innovation") || "Innovación"}</option>
              <option value="decision">{t("affinity.decision") || "Decisiones"}</option>
              <option value="conversation">{t("affinity.conversation") || "Comunicación"}</option>
            </select>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch">
          {/* Members List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] overflow-hidden flex flex-col"
          >
            {/* List Header */}
            <div className="p-4 border-b border-[var(--rowi-border)]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold text-[var(--rowi-foreground)]">
                  {t("affinity.myCommunity") || "Mi Comunidad"}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem(`affinity-cache-${normalizedProject}`);
                      loadAffinityAll(true);
                    }}
                    disabled={loadingAll}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-[var(--rowi-background)] border border-[var(--rowi-border)] text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingAll ? "animate-spin" : ""}`} />
                    {t("affinity.recalculate") || "Recalcular"}
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("affinity.searchPlaceholder") || "Buscar por nombre, grupo o país..."}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--rowi-background)] border border-[var(--rowi-border)] text-sm text-[var(--rowi-foreground)] placeholder:text-[var(--rowi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/30"
                />
              </div>
            </div>

            {/* Members Grid */}
            <div className="p-4 flex-1 overflow-y-auto min-h-[400px]">
              {loadingAll ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-primary)] mb-3" />
                  <p className="text-sm text-[var(--rowi-muted)]">{t("affinity.calculating") || "Calculando afinidad..."}</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-[var(--rowi-muted)] mx-auto mb-3" />
                  <p className="text-[var(--rowi-muted)]">{t("affinity.noMembers") || "No se encontraron miembros"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMembers.map((m) => {
                    const selected = selectedMembers.some((x) => x.id === m.id);
                    const aff = affByMember[m.id];
                    // Use affByMember if available, otherwise fallback to member's preloaded affinity data
                    const affinityPct = aff?.heat100 ?? m.affinityPercent ?? null;
                    const interp = aff?.interpretation;
                    const isLoading = loadingByMember[m.id];
                    const levelInfo = affinityPct !== null ? levelFromHeat135((affinityPct * 135) / 100) : null;

                    return (
                      <motion.div
                        key={m.id}
                        layout
                        onClick={() =>
                          setSelectedMembers((prev) =>
                            selected ? prev.filter((x) => x.id !== m.id) : [...prev, m]
                          )
                        }
                        className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                          selected
                            ? "border-[var(--rowi-primary)] bg-[var(--rowi-primary)]/5 shadow-lg shadow-[var(--rowi-primary)]/10"
                            : "border-[var(--rowi-border)] hover:border-[var(--rowi-primary)]/50 bg-[var(--rowi-background)]"
                        }`}
                      >
                        {/* Selection indicator */}
                        {selected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--rowi-primary)] flex items-center justify-center">
                            <UserCheck className="w-3 h-3 text-white" />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0"
                            style={{
                              background: levelInfo
                                ? `linear-gradient(135deg, ${levelInfo.color}, ${levelInfo.color}99)`
                                : "linear-gradient(135deg, var(--rowi-primary), var(--rowi-secondary))",
                            }}
                          >
                            {m.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-sm text-[var(--rowi-foreground)] truncate">
                                {m.name}
                              </div>
                              {m.brainStyle && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] font-medium">
                                  {m.brainStyle}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--rowi-muted)] truncate">
                              {m.group || m.country || "—"}
                            </div>

                            {/* Affinity Score */}
                            <div className="flex items-center gap-2 mt-2">
                              {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin text-[var(--rowi-muted)]" />
                              ) : affinityPct !== null ? (
                                <>
                                  <div
                                    className="h-1.5 rounded-full flex-1 bg-[var(--rowi-border)]"
                                    style={{ maxWidth: "80px" }}
                                  >
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${affinityPct}%`,
                                        background: levelInfo?.color,
                                      }}
                                    />
                                  </div>
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ color: levelInfo?.color }}
                                  >
                                    {affinityPct}%
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-[var(--rowi-muted)]">Sin calcular</span>
                              )}
                            </div>

                            {/* AI Interpretation */}
                            {interp && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-2 text-xs text-[var(--rowi-muted)] italic line-clamp-2"
                              >
                                <MessageCircle className="w-3 h-3 inline mr-1" />
                                {interp}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Footer */}
            {selectedMembers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border-t border-[var(--rowi-border)] bg-[var(--rowi-background)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--rowi-muted)]">
                      {selectedMembers.length} {t("affinity.selectedMembers") || "seleccionados"}
                    </span>
                    <button
                      onClick={() => setSelectedMembers([])}
                      className="text-xs text-[var(--rowi-primary)] hover:underline"
                    >
                      {t("affinity.clearSelection") || "Limpiar"}
                    </button>
                  </div>
                  <button
                    onClick={() => loadAffinityForMultiple(selectedMembers)}
                    disabled={Object.values(loadingByMember).some(Boolean)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {Object.values(loadingByMember).some(Boolean) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {t("affinity.analyzeSelected") || "Analizar Seleccionados"}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right Column: Detail Panel + Chat */}
          <div className="flex flex-col gap-4">
            {/* Affinity Detail Panel - Shows when members selected with calculated affinity */}
            {selectedMembers.length > 0 && selectedMembers.some(m => affByMember[m.id]) && (
              <motion.div
                key={`panel-${selectedMembers.length}-${selectedMembers.map(m => m.id).join('-')}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-4 max-h-[450px] overflow-y-auto"
              >
              {(() => {
                // Debug log
                console.log('[Affinity Panel] selectedMembers:', selectedMembers.length, selectedMembers.map(m => m.name));
                return null;
              })()}
              {selectedMembers.length === 1 ? (
                // Single member detail view
                (() => {
                  const member = selectedMembers[0];
                  const aff = affByMember[member.id];
                  if (!aff) return null;
                  const heat = aff?.heat100 ?? member.affinityPercent ?? 0;

                return (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center text-white font-bold">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--rowi-foreground)]">{member.name}</h3>
                          <p className="text-xs text-[var(--rowi-muted)]">
                            {member.brainStyle || aff?.brainStyles?.theirs || "—"} · {member.group}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[var(--rowi-primary)]">{heat}%</div>
                        <div className="text-xs text-[var(--rowi-muted)]">{aff?.affinityLevel || "—"}</div>
                      </div>
                    </div>

                    {/* Parts breakdown */}
                    {aff?.parts && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-[var(--rowi-background)] rounded-xl p-3 text-center">
                          <div className="text-lg font-semibold text-green-500">
                            {Math.round((aff.parts.growth || 0) / 135 * 100)}%
                          </div>
                          <div className="text-[10px] text-[var(--rowi-muted)]">{t("affinity.detail.growth") || "Crecimiento"}</div>
                        </div>
                        <div className="bg-[var(--rowi-background)] rounded-xl p-3 text-center">
                          <div className="text-lg font-semibold text-blue-500">
                            {Math.round((aff.parts.collaboration || 0) / 135 * 100)}%
                          </div>
                          <div className="text-[10px] text-[var(--rowi-muted)]">{t("affinity.detail.collaboration") || "Colaboración"}</div>
                        </div>
                        <div className="bg-[var(--rowi-background)] rounded-xl p-3 text-center">
                          <div className="text-lg font-semibold text-purple-500">
                            {Math.round((aff.parts.understanding || 0) / 135 * 100)}%
                          </div>
                          <div className="text-[10px] text-[var(--rowi-muted)]">{t("affinity.detail.understanding") || "Entendimiento"}</div>
                        </div>
                      </div>
                    )}

                    {/* Affinity Note - explains why total may differ from parts */}
                    {aff?.parts && (
                      <div className="text-[10px] text-[var(--rowi-muted)] text-center mb-3 italic">
                        {t("affinity.detail.affinityNote") || "La afinidad total considera ponderaciones por contexto, cercanía y calibración adicional."}
                      </div>
                    )}

                    {/* Brain Styles Compatibility */}
                    {aff?.brainStyles && (
                      <div className="bg-[var(--rowi-background)] rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-[var(--rowi-primary)]" />
                          <span className="text-xs font-medium text-[var(--rowi-foreground)]">{t("affinity.detail.brainStyles") || "Estilos de Pensamiento"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="px-2 py-1 rounded-lg bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)]">
                            {aff.brainStyles.yours || t("affinity.detail.yourStyle") || "Tu estilo"}
                          </span>
                          <span className="text-[var(--rowi-muted)]">↔</span>
                          <span className="px-2 py-1 rounded-lg bg-[var(--rowi-secondary)]/10 text-[var(--rowi-secondary)]">
                            {aff.brainStyles.theirs || member.brainStyle || t("affinity.detail.theirStyle") || "Su estilo"}
                          </span>
                          <span className="text-xs text-[var(--rowi-muted)]">
                            {aff.brainStyles.compatibility}% {t("affinity.detail.compatible") || "compatible"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Shared Talents */}
                    {aff?.sharedTalents && aff.sharedTalents.length > 0 && (
                      <div className="bg-green-500/10 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            {t("affinity.detail.sharedTalents") || "Talentos en Común"} ({aff.sharedTalents.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {aff.sharedTalents.slice(0, 6).map((talent) => (
                            <span
                              key={talent}
                              className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-300 cursor-help"
                              title={talent}
                            >
                              {t(`talents.${talent}`) || talent}
                            </span>
                          ))}
                          {aff.sharedTalents.length > 6 && (
                            <span className="text-xs text-green-600">+{aff.sharedTalents.length - 6} {t("affinity.detail.more") || "más"}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Strong Competencies */}
                    {aff?.strongCompetencies && aff.strongCompetencies.length > 0 && (
                      <div className="bg-blue-500/10 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            {t("affinity.detail.strongCompetencies") || "Competencias Fuertes Compartidas"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {aff.strongCompetencies.map((c) => (
                            <span
                              key={c}
                              className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 cursor-help"
                              title={`${t(`competencies.${c}`) || c}: ${t(`competencies.${c}.desc`) || ""}`}
                            >
                              {t(`competencies.${c}`) || c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Summary - Only show real insights, not the "savings mode" message */}
                    {(() => {
                      const summary = aff?.ai_summary || aff?.interpretation;
                      const isRealInsight = summary && !summary.includes("modo ahorro") && !summary.includes("ℹ️");

                      if (isRealInsight) {
                        return (
                          <div className="bg-[var(--rowi-background)] rounded-xl p-3 border border-[var(--rowi-border)]">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageCircle className="w-4 h-4 text-[var(--rowi-muted)]" />
                              <span className="text-xs font-medium text-[var(--rowi-muted)]">{t("affinity.detail.insight") || "Insight"}</span>
                            </div>
                            <p className="text-sm text-[var(--rowi-foreground)] italic">{summary}</p>
                          </div>
                        );
                      }

                      // Show a tip to use chat instead
                      return (
                        <div className="bg-[var(--rowi-primary)]/5 rounded-xl p-3 border border-[var(--rowi-primary)]/20">
                          <p className="text-xs text-[var(--rowi-muted)]">
                            💡 {t("affinity.detail.askCoach") || "Pregunta al Affinity Coach abajo para obtener consejos personalizados sobre esta relación."}
                          </p>
                        </div>
                      );
                    })()}
                  </>
                );
              })()
              ) : (
                // Multiple members view - Group analysis
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-[var(--rowi-primary)]" />
                    <h3 className="font-semibold text-[var(--rowi-foreground)]">
                      {t("affinity.detail.groupAnalysis") || "Análisis de Grupo"} ({selectedMembers.length})
                    </h3>
                  </div>

                  {/* Group average */}
                  {(() => {
                    const analyzedMembers = selectedMembers.filter(m => affByMember[m.id]?.heat100);
                    const avgHeat = analyzedMembers.length > 0
                      ? Math.round(analyzedMembers.reduce((sum, m) => sum + (affByMember[m.id]?.heat100 || 0), 0) / analyzedMembers.length)
                      : 0;
                    const avgLevel = levelFromHeat135((avgHeat * 135) / 100);

                    return (
                      <div className="bg-[var(--rowi-background)] rounded-xl p-4 mb-4 text-center">
                        <div className="text-3xl font-bold" style={{ color: avgLevel.color }}>{avgHeat}%</div>
                        <div className="text-sm text-[var(--rowi-muted)]">{t("affinity.detail.avgAffinity") || "Afinidad Promedio"}</div>
                        <div className="text-xs mt-1" style={{ color: avgLevel.color }}>{avgLevel.level}</div>
                        <div className="text-[10px] text-[var(--rowi-muted)] mt-2">
                          {analyzedMembers.length} / {selectedMembers.length} {t("affinity.detail.analyzed") || "analizados"}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Individual member cards */}
                  <div className="space-y-2">
                    {selectedMembers.map((member) => {
                      const aff = affByMember[member.id];
                      if (!aff) return (
                        <div key={member.id} className="bg-[var(--rowi-background)] rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--rowi-muted)]/20 flex items-center justify-center text-xs font-medium text-[var(--rowi-muted)]">
                              {member.name.charAt(0)}
                            </div>
                            <span className="text-sm text-[var(--rowi-foreground)]">{member.name}</span>
                          </div>
                          <span className="text-xs text-[var(--rowi-muted)]">{t("affinity.detail.notCalculated") || "Sin calcular"}</span>
                        </div>
                      );

                      const heat = aff.heat100 ?? 0;
                      const levelInfo = levelFromHeat135((heat * 135) / 100);

                      return (
                        <div key={member.id} className="bg-[var(--rowi-background)] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                                style={{ background: levelInfo.color }}
                              >
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-[var(--rowi-foreground)]">{member.name}</span>
                                <div className="text-[10px] text-[var(--rowi-muted)]">
                                  {aff.brainStyles?.theirs || member.brainStyle || "—"}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold" style={{ color: levelInfo.color }}>{heat}%</div>
                              <div className="text-[10px] text-[var(--rowi-muted)]">{aff.affinityLevel}</div>
                            </div>
                          </div>

                          {/* Mini parts breakdown */}
                          {aff.parts && (
                            <div className="flex gap-2 mt-2">
                              <div className="flex-1 text-center">
                                <div className="text-xs font-medium text-green-500">{Math.round((aff.parts.growth || 0) / 135 * 100)}%</div>
                                <div className="text-[8px] text-[var(--rowi-muted)]">{t("affinity.detail.growth") || "Crec."}</div>
                              </div>
                              <div className="flex-1 text-center">
                                <div className="text-xs font-medium text-blue-500">{Math.round((aff.parts.collaboration || 0) / 135 * 100)}%</div>
                                <div className="text-[8px] text-[var(--rowi-muted)]">{t("affinity.detail.collaboration") || "Colab."}</div>
                              </div>
                              <div className="flex-1 text-center">
                                <div className="text-xs font-medium text-purple-500">{Math.round((aff.parts.understanding || 0) / 135 * 100)}%</div>
                                <div className="text-[8px] text-[var(--rowi-muted)]">{t("affinity.detail.understanding") || "Entend."}</div>
                              </div>
                            </div>
                          )}

                          {/* Shared talents count */}
                          {aff.sharedTalents && aff.sharedTalents.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Sparkles className="w-3 h-3 text-green-500" />
                              <span className="text-[10px] text-green-600">
                                {aff.sharedTalents.length} {t("affinity.detail.sharedTalents") || "talentos en común"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Group tip */}
                  <div className="bg-[var(--rowi-primary)]/5 rounded-xl p-3 border border-[var(--rowi-primary)]/20 mt-4">
                    <p className="text-xs text-[var(--rowi-muted)]">
                      💡 {t("affinity.detail.groupTip") || "Pregunta al Affinity Coach para obtener recomendaciones sobre cómo trabajar mejor con este grupo."}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
            )}

            {/* Affinity Coach Chat */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] flex flex-col flex-1"
              style={{ minHeight: selectedMembers.length > 0 && selectedMembers.some(m => affByMember[m.id]) ? "300px" : "500px" }}
            >
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--rowi-border)] bg-gradient-to-r from-[var(--rowi-primary)]/10 to-[var(--rowi-secondary)]/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--rowi-foreground)]">Affinity Coach</h3>
                  <p className="text-xs text-[var(--rowi-muted)]">
                    {t("affinity.coachSubtitle") || "Your relationship coach"}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-sm rounded-2xl ${
                      m.role === "assistant"
                        ? "bg-[var(--rowi-background)] border border-[var(--rowi-border)] text-[var(--rowi-foreground)]"
                        : "bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {rowiTyping && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl bg-[var(--rowi-background)] border border-[var(--rowi-border)]">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-[var(--rowi-muted)] animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-[var(--rowi-muted)] animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 rounded-full bg-[var(--rowi-muted)] animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-[var(--rowi-border)]">
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      askRowiAffinity();
                    }
                  }}
                  placeholder={t("affinity.askRowi") || "Pregunta sobre tus relaciones..."}
                  className="flex-1 resize-none rounded-xl border border-[var(--rowi-border)] bg-[var(--rowi-background)] px-4 py-2.5 text-sm text-[var(--rowi-foreground)] placeholder:text-[var(--rowi-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--rowi-primary)]/30"
                />
                <button
                  onClick={askRowiAffinity}
                  disabled={!coachInput.trim() || rowiTyping}
                  className="p-3 rounded-xl bg-gradient-to-r from-[var(--rowi-primary)] to-[var(--rowi-secondary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        </div>

        {/* Affinity Monitor Section */}
        <AnimatePresence>
          {showMonitor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[var(--rowi-surface)] rounded-2xl border border-[var(--rowi-border)] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[var(--rowi-foreground)]">
                    {t("affinity.monitorTitle") || "Affinity Monitor"}
                  </h2>
                  <button
                    onClick={() => setShowMonitor(false)}
                    className="p-2 rounded-lg hover:bg-[var(--rowi-background)]"
                  >
                    <X className="w-5 h-5 text-[var(--rowi-muted)]" />
                  </button>
                </div>
                <AffinityMonitor />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
