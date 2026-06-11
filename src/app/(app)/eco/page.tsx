"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Sparkles,
  Send,
  Users,
  MessageCircle,
  Mail,
  MessageSquare,
  Phone,
  Mic,
  Copy,
  Check,
  Plus,
  X,
  Brain,
  Target,
  AlertTriangle,
  Slack,
  Link2,
  ChevronDown,
  User,
  RefreshCw,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";
import SendMessageActions from "@/components/eco/SendMessageActions";

/* =========================================================
   📡 ECO - Emotional Communication Optimizer
   ---------------------------------------------------------
   Mismo look & flujo que /demo/eco, sobre datos reales:
   destinatarios múltiples, refinar con IA y versiones
   personalizadas cuando el grupo es heterogéneo.
   =========================================================
*/

type Member = { id: string; name: string; brainStyle?: string };
type Free = { name: string; brainStyle?: string; bio?: string };
type Channel = "email" | "whatsapp" | "sms" | "call" | "speech";
type PersonalizedMessage = { name: string; subject: string | null; text: string };

const CHANNELS: { value: Channel; icon: React.ElementType; labelEs: string }[] = [
  { value: "email", icon: Mail, labelEs: "Email" },
  { value: "whatsapp", icon: MessageSquare, labelEs: "WhatsApp" },
  { value: "sms", icon: MessageCircle, labelEs: "SMS" },
  { value: "call", icon: Phone, labelEs: "Llamada" },
  { value: "speech", icon: Mic, labelEs: "Discurso" },
];

const BRAIN_STYLES = [
  "Strategist",
  "Scientist",
  "Guardian",
  "Deliverer",
  "Inventor",
  "Energizer",
  "Sage",
];

// El estado real de conexión viene de /api/eco/deliver (gmail/whatsapp ya
// tienen envío directo implementado); el resto sigue "Pronto" de verdad.
const INTEGRATIONS = [
  { id: "gmail", name: "Gmail", icon: Mail },
  { id: "whatsapp", name: "WhatsApp", icon: MessageSquare },
  { id: "slack", name: "Slack", icon: Slack },
  { id: "outlook", name: "Outlook", icon: Mail },
  { id: "teams", name: "Teams", icon: MessageSquare },
];

// Fallbacks ES de patrón/riesgo por brain style (mismos textos que el API).
const PATTERN_FALLBACK: Record<string, { pattern: string; risk: string }> = {
  Strategist: { pattern: "preciso y enfocado en lógica", risk: "puede sonar distante" },
  Guardian: { pattern: "estructurado y seguro", risk: "evita riesgo o espontaneidad" },
  Energizer: { pattern: "entusiasta y directo", risk: "puede saturar o distraer" },
  Sage: { pattern: "profundo y reflexivo", risk: "puede extenderse o abstraerse" },
  Deliverer: { pattern: "orientado a resultados", risk: "puede omitir lo emocional" },
  Scientist: { pattern: "basado en evidencia", risk: "puede ser demasiado técnico" },
  Inventor: { pattern: "creativo e inspirador", risk: "puede dispersarse" },
};

function EcoPageInner() {
  const { t, lang } = useI18n();
  // El puente Affinity→ECO: /eco?dyadId=... activa buildDyadBridge en compose
  // y permite registrar sent/outcome sobre la díada (el foso de datos).
  const searchParams = useSearchParams();
  const dyadId = searchParams.get("dyadId");

  const [dashboard, setDashboard] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [free, setFree] = useState<Free[]>([]);
  const [goal, setGoal] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [refine, setRefine] = useState(false);
  const [ask, setAsk] = useState("");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // Regenerar = pedir una variación real (rompe el cache del compose).
  const [variant, setVariant] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [loadingDash, setLoadingDash] = useState(true);
  // Versiones personalizadas (grupo heterogéneo): un mensaje por persona.
  const [pers, setPers] = useState<{ messages: PersonalizedMessage[]; insight: string | null } | null>(null);
  const [loadingPers, setLoadingPers] = useState(false);
  // Estado REAL de los canales de envío directo.
  const [deliverChannels, setDeliverChannels] = useState<{
    gmail?: { connected: boolean };
    whatsapp?: { connected: boolean };
  } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/eco/deliver")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.ok) {
          setDeliverChannels({ gmail: data.gmail, whatsapp: data.whatsapp });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // El loop de outcome (el foso): ¿funcionó el último mensaje enviado?
  const [pendingOutcome, setPendingOutcome] = useState<{
    dyadId: string;
    otherName: string | null;
  } | null>(null);
  const [outcomeSaved, setOutcomeSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/eco/send")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.ok && data.pending) setPendingOutcome(data.pending);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function submitOutcome(worked: boolean) {
    if (!pendingOutcome) return;
    try {
      await fetch("/api/eco/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feedback", dyadId: pendingOutcome.dyadId, worked }),
      });
    } catch {
      /* el banner se cierra igual; el cron volverá a preguntar si hace falta */
    }
    setPendingOutcome(null);
    setOutcomeSaved(true);
    setTimeout(() => setOutcomeSaved(false), 4000);
  }

  useEffect(() => {
    (async () => {
      setLoadingDash(true);
      try {
        const [dashRes, membersRes] = await Promise.all([
          fetch("/api/eco/dashboard", { cache: "no-store" }).catch(() => null),
          fetch("/api/community/members", { cache: "no-store" }).catch(() => null),
        ]);
        const dash = dashRes?.ok ? await dashRes.json() : null;
        setDashboard(dash);
        const membersData = membersRes?.ok ? await membersRes.json() : { members: [] };
        setMembers(Array.isArray(membersData.members) ? membersData.members : []);
      } catch {
        /* silent */
      } finally {
        setLoadingDash(false);
      }
    })();
  }, []);

  function composeBody(extra?: Record<string, unknown>) {
    return {
      goal,
      channel,
      memberIds: picked,
      freeTargets: free.filter((f) => f.name.trim()),
      refine,
      ask,
      locale: lang,
      // Con dyadId, compose usa la BRECHA real de la díada (buildDyadBridge).
      dyadId: dyadId || undefined,
      ...extra,
    };
  }

  async function compose(nextVariant?: number) {
    if (!goal.trim()) return;
    if (picked.length === 0 && free.filter((f) => f.name.trim()).length === 0) return;
    setLoading(true);
    setOut(null);
    setPers(null);
    const v = nextVariant ?? variant;
    try {
      const r = await fetch("/api/eco/compose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          composeBody(
            v > 0
              ? { ask: `${ask ? ask + ". " : ""}Variación ${v + 1}: escribe una versión distinta.` }
              : undefined
          )
        ),
      });
      const j = await r.json();
      setOut(j);
    } catch {
      setOut({ ok: false, error: t("eco.page.errorLoading", "Error cargando datos") });
    } finally {
      setLoading(false);
    }
  }

  function regenerate() {
    const v = variant + 1;
    setVariant(v);
    compose(v);
  }

  async function composePersonalized() {
    setLoadingPers(true);
    try {
      const r = await fetch("/api/eco/compose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(composeBody({ personalized: true })),
      });
      const j = await r.json();
      if (j?.ok && Array.isArray(j.personalized)) {
        setPers({ messages: j.personalized, insight: j.refined?.insight ?? null });
      }
    } catch {
      /* el banner sigue disponible para reintentar */
    } finally {
      setLoadingPers(false);
    }
  }

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyPersonalized = (txt: string, idx: number) => {
    navigator.clipboard.writeText(txt).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const toggleMember = (id: string) => {
    setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  };

  const addExternal = () => {
    setFree((v) => [...v, { name: "", brainStyle: "Strategist", bio: "" }]);
  };

  const removeExternal = (idx: number) => {
    setFree((v) => v.filter((_, i) => i !== idx));
  };

  const totalRecipients = picked.length + free.filter((f) => f.name.trim()).length;
  const canGenerate = goal.trim() && totalRecipients > 0 && !loading;

  const styleCount = out?.analysis?.styleDistribution
    ? Object.keys(out.analysis.styleDistribution).length
    : 0;
  const offerPersonalized = !!out?.ok && !!out?.analysis?.isGroup && styleCount >= 2;

  // Traducción client-side del análisis por brain style (el API manda ES).
  const prefsFor = (style: string | undefined | null, field: "prefers" | "tone" | "approach" | "avoid", apiValue?: string) => {
    if (!style) return apiValue || "";
    return t(`eco.prefs.${style}.${field}`, apiValue || "");
  };

  const modeLabel =
    out?.mode === "ai-refined" || out?.mode === "ai-personalized"
      ? t("eco.page.modePro", "Generado con IA Pro")
      : out?.mode === "smart-local"
        ? t("eco.page.modeSmartLocal", "Generado con análisis de perfil")
        : t("eco.page.modeBase", "Generado con IA Base");

  return (
    <main className="min-h-screen pb-24 bg-[var(--rowi-background)]">
      {/* Header — mismo banner que /demo/eco */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-1 flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-emerald-500" />
                {t("eco.page.title", "ECO")}
              </h1>
              <p className="text-lg text-emerald-600 dark:text-emerald-400 mb-2">
                Emotional Communication Optimizer
              </p>
              <p className="text-[var(--rowi-muted)] max-w-2xl">
                {t(
                  "eco.page.heroText",
                  "Comunica con inteligencia emocional. Analiza perfiles, adapta tu mensaje y conecta mejor."
                )}
              </p>
            </div>
            {totalRecipients > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 self-start"
              >
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {totalRecipients} {t("eco.page.selected", "seleccionados")}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Outcome del último envío — el dato que calibra la brecha (foso) */}
        {pendingOutcome && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/30 p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-[var(--rowi-fg)]">
              {t("eco.outcome.question", "¿Funcionó tu último mensaje{name}?").replace(
                "{name}",
                pendingOutcome.otherName ? ` a ${pendingOutcome.otherName}` : ""
              )}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => submitOutcome(true)} className="rowi-btn-primary px-4 py-1.5 text-sm">
                {t("eco.outcome.yes", "Sí, ayudó")}
              </button>
              <button
                onClick={() => submitOutcome(false)}
                className="px-4 py-1.5 text-sm rounded-full border border-[var(--rowi-card-border)] text-[var(--rowi-muted)]"
              >
                {t("eco.outcome.no", "No mucho")}
              </button>
            </div>
          </motion.div>
        )}
        {outcomeSaved && (
          <p className="mb-6 text-sm text-emerald-600 dark:text-emerald-400">
            {t("eco.outcome.thanks", "Gracias — esto afina los próximos mensajes.")}
          </p>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Columna izquierda — Perfil, canal e integraciones ── */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tu perfil */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-500" />
                {t("eco.page.yourProfile", "Tu perfil")}
              </h2>
              {loadingDash ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-sm text-[var(--rowi-muted)]">
                    {t("eco.loadingProfile", "Cargando perfil...")}
                  </span>
                </div>
              ) : dashboard?.ok ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                      {(dashboard.user.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{dashboard.user.name}</h3>
                      {dashboard.user.brainStyle && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          {dashboard.user.brainStyle}
                        </span>
                      )}
                    </div>
                  </div>

                  {dashboard.user.brainStyle && PATTERN_FALLBACK[dashboard.user.brainStyle] && (
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2 text-sm p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <span className="text-[var(--rowi-muted)]">
                          {t("eco.page.commPattern", "Patrón comunicativo")}
                        </span>
                        <span className="font-medium text-right">
                          {t(
                            `eco.profile.pattern.${dashboard.user.brainStyle}`,
                            PATTERN_FALLBACK[dashboard.user.brainStyle].pattern
                          )}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-2 text-sm p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                        <span className="text-[var(--rowi-muted)] flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          {t("eco.page.commRisk", "Riesgo comunicativo")}
                        </span>
                        <span className="font-medium text-amber-600 dark:text-amber-400 text-right">
                          {t(
                            `eco.profile.risk.${dashboard.user.brainStyle}`,
                            PATTERN_FALLBACK[dashboard.user.brainStyle].risk
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {dashboard.eqStatus && (
                    <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                      <p className="text-xs font-medium text-[var(--rowi-muted)] mb-2">
                        {t("eco.page.eqStatus", "Estado EQ")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(dashboard.eqStatus).map(([k, v]) =>
                          v ? (
                            <span
                              key={k}
                              className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
                            >
                              {k}:{" "}
                              <span className="font-semibold">
                                {t(`eco.profile.band.${String(v)}`, String(v))}
                              </span>
                            </span>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-[var(--rowi-muted)] text-sm">
                  {t("eco.page.errorLoading", "Error cargando datos")}
                </div>
              )}
            </motion.section>

            {/* Canal — selector tipo demo */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-2">{t("eco.page.channel", "Canal")}</h2>
              <p className="text-sm text-[var(--rowi-muted)] mb-4">
                {t("eco.page.channelDesc", "Selecciona el canal y Rowi adapta el mensaje")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const isSelected = channel === ch.value;
                  return (
                    <button
                      key={ch.value}
                      onClick={() => setChannel(ch.value)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-transparent bg-gray-50 dark:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isSelected ? "text-emerald-500" : "text-[var(--rowi-muted)]"}`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? "text-emerald-600 dark:text-emerald-400" : ""
                        }`}
                      >
                        {t(`eco.channels.${ch.value}`, ch.labelEs)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            {/* Integraciones */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden"
            >
              <button
                onClick={() => setShowIntegrations(!showIntegrations)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-bold">{t("eco.page.integrations", "Integraciones")}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${showIntegrations ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {showIntegrations && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-2">
                      <p className="text-xs text-[var(--rowi-muted)] mb-2">
                        {t("eco.page.integrationsDesc", "Conecta tus apps para enviar directamente")}
                      </p>
                      {INTEGRATIONS.map((int) => {
                        const isConnected =
                          int.id === "gmail"
                            ? !!deliverChannels?.gmail?.connected
                            : int.id === "whatsapp"
                              ? !!deliverChannels?.whatsapp?.connected
                              : false;
                        return (
                          <div
                            key={int.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm">
                                <int.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                              </div>
                              <span className="text-sm font-medium">{int.name}</span>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                isConnected
                                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                                  : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {isConnected
                                ? t("eco.page.connected", "Conectado")
                                : t("eco.page.comingSoon", "Pronto")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>

          {/* ── Columna derecha — Destinatarios + compositor + resultado ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Destinatarios (multi-selección) */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  {t("eco.page.recipients", "Destinatarios")}
                </h2>
                {totalRecipients > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                    {totalRecipients} {t("eco.page.selected", "seleccionados")}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--rowi-muted)] mb-4">
                {t(
                  "eco.page.recipientsDesc",
                  "El mensaje se adapta al estilo cerebral y preferencias de cada persona"
                )}
              </p>

              {/* Miembros de la comunidad */}
              <p className="text-sm font-medium text-[var(--rowi-muted)] mb-3">
                {t("eco.page.communityMembers", "Miembros de tu comunidad")}
              </p>
              {members.length === 0 ? (
                <div className="py-4 text-center space-y-2">
                  <p className="text-sm text-gray-400">
                    {t("eco.page.noMembers", "No hay miembros en tu comunidad")}
                  </p>
                  {/* El vacío guía al siguiente paso, no abandona */}
                  <a
                    href="/community?tab=relationships"
                    className="inline-block text-xs rowi-btn-primary px-4 py-2"
                  >
                    {t("relationships.empty.cta", "Invita a tu primera persona")}
                  </a>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const isSelected = picked.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleMember(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-transparent bg-gray-50 dark:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isSelected
                              ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-md"
                              : "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {(m.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{m.name}</p>
                          <p className="text-xs text-[var(--rowi-muted)] truncate">
                            {m.brainStyle || t("eco.page.unknown", "Desconocido")}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Contactos externos */}
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[var(--rowi-muted)]">
                    {t("eco.page.externalContacts", "Contactos externos")}
                  </p>
                  <button
                    onClick={addExternal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashed border-gray-300 dark:border-zinc-600 text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("eco.page.addExternal", "Agregar contacto")}
                  </button>
                </div>

                <AnimatePresence>
                  {free.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {free.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-400 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              placeholder={t("eco.page.namePlaceholder", "Nombre del contacto")}
                              value={f.name}
                              onChange={(e) =>
                                setFree((v) =>
                                  v.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                                )
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                            <select
                              value={f.brainStyle}
                              onChange={(e) =>
                                setFree((v) =>
                                  v.map((x, j) => (j === i ? { ...x, brainStyle: e.target.value } : x))
                                )
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            >
                              {BRAIN_STYLES.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder={t(
                                "eco.page.bioPlaceholder",
                                "Contexto o notas sobre esta persona"
                              )}
                              value={f.bio || ""}
                              onChange={(e) =>
                                setFree((v) =>
                                  v.map((x, j) => (j === i ? { ...x, bio: e.target.value } : x))
                                )
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                            />
                          </div>
                          <button
                            onClick={() => removeExternal(i)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>

            {/* Compositor */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl space-y-5"
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                {t("eco.page.composeMessage", "Componer mensaje")}
              </h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("eco.page.goalLabel", "Objetivo de tu mensaje")}
                </label>
                <textarea
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder={t(
                    "eco.page.goalPlaceholder",
                    "Describe qué quieres comunicar y qué resultado esperas..."
                  )}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Refinar con IA */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={refine}
                      onChange={(e) => setRefine(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-500 transition-all" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-all" />
                  </div>
                  <div>
                    <span className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      {t("eco.page.refineWithAI", "Refinar con IA")}
                    </span>
                    <span className="text-xs text-[var(--rowi-muted)]">
                      {t("eco.page.refineDescription", "Mejora el mensaje con sugerencias inteligentes")}
                    </span>
                  </div>
                </label>

                <AnimatePresence>
                  {refine && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <label className="block text-sm font-medium mb-2">
                        {t("eco.page.additionalContext", "Contexto adicional")}
                      </label>
                      <textarea
                        rows={2}
                        value={ask}
                        onChange={(e) => setAsk(e.target.value)}
                        placeholder={t(
                          "eco.page.refinePlaceholder",
                          "Instrucciones específicas para personalizar..."
                        )}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => compose()}
                disabled={!canGenerate}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all ${
                  canGenerate
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                    : "bg-gray-300 dark:bg-zinc-700 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("eco.page.generating", "Generando...")}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t("eco.page.generate", "Generar mensaje")}
                  </>
                )}
              </button>
            </motion.section>

            {/* Resultado */}
            <AnimatePresence>
              {out?.ok && (
                <motion.section
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  className="space-y-4"
                >
                  {/* Optimizaciones aplicadas — estilo demo, 1 destinatario */}
                  {out.analysis && !out.analysis.isGroup && out.analysis.targetBrainStyle && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-emerald-800 dark:text-emerald-200">
                          {t("eco.page.tipsTitle", "Optimizaciones aplicadas")}
                        </h3>
                        <span className="px-2.5 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                          {out.analysis.targetBrainStyle}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {[
                          `${t("eco.page.idealTone", "Tono ideal")}: ${prefsFor(out.analysis.targetBrainStyle, "tone", out.analysis.targetPrefs?.tone)}`,
                          `${t("eco.page.prefers", "Prefiere")}: ${prefsFor(out.analysis.targetBrainStyle, "prefers", out.analysis.targetPrefs?.prefers)}`,
                          `${t("eco.page.howToApproach", "Cómo abordar")}: ${prefsFor(out.analysis.targetBrainStyle, "approach", out.analysis.targetPrefs?.approach)}`,
                          `${t("eco.page.avoid", "Evitar")}: ${prefsFor(out.analysis.targetBrainStyle, "avoid", out.analysis.targetPrefs?.avoid)}`,
                        ].map((tip, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300"
                          >
                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                      {out.analysis.sharedTalents?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                            {t("eco.page.sharedTalents", "Talentos en común")}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {out.analysis.sharedTalents.map((talent: string) => (
                              <span
                                key={talent}
                                className="px-2.5 py-1 text-xs rounded-full bg-white/70 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium"
                              >
                                {talent}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Análisis del grupo — 2+ destinatarios */}
                  {out.analysis?.isGroup && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <div className="flex-1">
                          <h4 className="font-bold text-emerald-800 dark:text-emerald-200">
                            {t("eco.groupAnalysis.title", "Análisis del grupo")}
                          </h4>
                          <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">
                            {out.analysis.recipients?.length}{" "}
                            {t("eco.groupAnalysis.recipientsLabel", "destinatarios")}
                          </p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 mb-4">
                        {out.analysis.recipients?.map((r: any) => (
                          <div
                            key={r.name}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-white/70 dark:bg-zinc-800/50"
                          >
                            <span className="text-sm font-medium truncate">{r.name}</span>
                            <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium whitespace-nowrap ml-2">
                              {r.brainStyle}
                            </span>
                          </div>
                        ))}
                      </div>

                      {out.analysis.styleDistribution &&
                        Object.keys(out.analysis.styleDistribution).length > 1 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                              {t("eco.groupAnalysis.styleMix", "Mezcla de estilos")}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(out.analysis.styleDistribution).map(([style, count]) => (
                                <span
                                  key={style}
                                  className="px-2.5 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                >
                                  {style} × {count as number}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {out.analysis.commonAcrossAll?.length > 0 && (
                        <div className="pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                            {t("eco.groupAnalysis.commonTalents", "Talentos que compartes con TODOS")}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {out.analysis.commonAcrossAll.map((talent: string) => (
                              <span
                                key={talent}
                                className="px-2.5 py-1 text-xs rounded-full bg-white/70 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium"
                              >
                                {talent}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {out.refined?.insight && !pers && (
                        <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                              {t("eco.groupAnalysis.aiInsight", "Para ti")}
                            </p>
                          </div>
                          <p className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">
                            {out.refined.insight}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mensaje optimizado — estilo demo con Regenerar + Copiar */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-bold">
                          {t("eco.page.result", "Mensaje optimizado")}
                        </h2>
                        <p className="text-sm text-[var(--rowi-muted)]">{modeLabel}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={regenerate}
                          disabled={loading}
                          title={t("eco.page.regenerate", "Regenerar")}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          onClick={() => copyText(out.refined?.text || out.base.text)}
                          title={t("eco.send.copy", "Copiar")}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {copied ? (
                            <Check className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {(out.refined?.subject || out.base?.subject) && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-[var(--rowi-muted)] mb-1">
                          {t("eco.page.subject", "Asunto")}
                        </p>
                        <p className="text-lg font-semibold">
                          {out.refined?.subject || out.base.subject}
                        </p>
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-6 mb-4">
                      <motion.pre
                        key={out.refined?.text || out.base?.text}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
                      >
                        {out.refined?.text || out.base.text}
                      </motion.pre>
                    </div>

                    {/* Acciones de envío */}
                    <SendMessageActions
                      subject={out.refined?.subject || out.base?.subject || undefined}
                      body={out.refined?.text || out.base?.text || ""}
                      recipientName={
                        out.analysis && !out.analysis.isGroup
                          ? out.analysis.recipients?.[0]?.name
                          : undefined
                      }
                      dyadId={dyadId || undefined}
                    />
                  </div>

                  {/* Grupo heterogéneo → ofrecer versiones personalizadas */}
                  {offerPersonalized && !pers && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-5"
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            {t("eco.personalized.suggestTitle", "Tus destinatarios son muy distintos")}
                          </h4>
                          <p className="text-sm text-[var(--rowi-muted)] mb-3">
                            {t(
                              "eco.personalized.suggestDesc",
                              "Hay {styles} estilos diferentes en este grupo. Rowi puede escribir una versión adaptada a cada persona."
                            ).replace("{styles}", String(styleCount))}
                          </p>
                          <button
                            onClick={composePersonalized}
                            disabled={loadingPers}
                            className="rowi-btn-primary px-5 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-60"
                          >
                            {loadingPers ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t("eco.personalized.generating", "Personalizando para cada persona...")}
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                {t("eco.personalized.suggestCta", "Generar versiones personalizadas")}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Versiones personalizadas — una tarjeta por persona */}
                  {pers && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-violet-500" />
                          {t("eco.personalized.title", "Versiones personalizadas")}
                        </h3>
                        <p className="text-sm text-[var(--rowi-muted)]">
                          {t(
                            "eco.personalized.desc",
                            "Cada mensaje está adaptado a cómo esa persona recibe mejor la comunicación."
                          )}
                        </p>
                      </div>

                      {pers.insight && (
                        <div className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
                              {t("eco.groupAnalysis.aiInsight", "Para ti")}
                            </p>
                          </div>
                          <p className="text-sm leading-relaxed">{pers.insight}</p>
                        </div>
                      )}

                      {pers.messages.map((pm, i) => (
                        <div
                          key={`${pm.name}-${i}`}
                          className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                                {(pm.name || "?").charAt(0).toUpperCase()}
                              </div>
                              <p className="font-semibold">
                                {t("eco.personalized.for", "Para {name}").replace("{name}", pm.name)}
                              </p>
                            </div>
                            <button
                              onClick={() => copyPersonalized(pm.text, i)}
                              title={t("eco.send.copy", "Copiar")}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              {copiedIdx === i ? (
                                <Check className="w-5 h-5 text-emerald-500" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          {pm.subject && (
                            <p className="text-sm font-semibold mb-2">{pm.subject}</p>
                          )}
                          <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                              {pm.text}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.section>
              )}
            </AnimatePresence>

            {/* Error */}
            {out && !out.ok && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
              >
                {out.error || t("eco.page.errorLoading", "Error cargando datos")}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function EcoPage() {
  // useSearchParams exige un boundary de Suspense en App Router.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      }
    >
      <EcoPageInner />
    </Suspense>
  );
}
