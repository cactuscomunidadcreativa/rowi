"use client";

import { useEffect, useState } from "react";
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
  Zap,
  Brain,
  Target,
  AlertTriangle,
  Slack,
  Globe,
  Link2,
  ChevronDown,
  User,
  ArrowRight,
  Radio,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   📡 ECO - Emotional Communication Optimizer
   ---------------------------------------------------------
   Diseña mensajes emocionalmente inteligentes usando tu perfil
   cognitivo y el de tus destinatarios.
   =========================================================
*/

type Member = { id: string; name: string; brainStyle?: string };
type Free = { name: string; brainStyle?: string; bio?: string };
type Channel = "email" | "whatsapp" | "sms" | "call" | "speech";

const CHANNELS: { value: Channel; icon: React.ElementType; label: { es: string; en: string }; color: string }[] = [
  { value: "email", icon: Mail, label: { es: "Email", en: "Email" }, color: "from-blue-500 to-blue-600" },
  { value: "whatsapp", icon: MessageSquare, label: { es: "WhatsApp", en: "WhatsApp" }, color: "from-green-500 to-green-600" },
  { value: "sms", icon: MessageCircle, label: { es: "SMS", en: "SMS" }, color: "from-purple-500 to-purple-600" },
  { value: "call", icon: Phone, label: { es: "Llamada", en: "Call Script" }, color: "from-amber-500 to-amber-600" },
  { value: "speech", icon: Mic, label: { es: "Discurso", en: "Speech" }, color: "from-pink-500 to-pink-600" },
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

const INTEGRATIONS = [
  { id: "slack", name: "Slack", icon: Slack, connected: false },
  { id: "gmail", name: "Gmail", icon: Mail, connected: false },
  { id: "outlook", name: "Outlook", icon: Mail, connected: false },
  { id: "teams", name: "Teams", icon: MessageSquare, connected: false },
];

export default function EcoPage() {
  const { t, lang } = useI18n();

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
  const [copied, setCopied] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [loadingDash, setLoadingDash] = useState(true);

  const tr = {
    es: {
      title: "ECO",
      subtitle: "Emotional Communication Optimizer",
      description: "Diseña mensajes emocionalmente inteligentes basados en tu perfil cognitivo y emocional",
      yourProfile: "Tu Perfil",
      brainStyle: "Brain Style",
      commPattern: "Patrón Comunicativo",
      commRisk: "Riesgo Comunicativo",
      eqStatus: "Estado EQ",
      selectRecipients: "Destinatarios",
      communityMembers: "Miembros de tu Comunidad",
      externalContacts: "Contactos Externos",
      addExternal: "Agregar Contacto",
      namePlaceholder: "Nombre del contacto",
      bioPlaceholder: "Contexto o notas sobre esta persona",
      composeMessage: "Componer Mensaje",
      goalLabel: "Objetivo de tu mensaje",
      goalPlaceholder: "Describe qué quieres comunicar y qué resultado esperas...",
      selectChannel: "Canal",
      refineWithAI: "Refinar con IA",
      refineDescription: "Mejora el mensaje con sugerencias inteligentes",
      additionalContext: "Contexto adicional",
      refinePlaceholder: "Instrucciones específicas para personalizar...",
      generate: "Generar Mensaje",
      generating: "Generando...",
      result: "Tu Mensaje",
      modePro: "Generado con IA Pro",
      modeBase: "Generado con IA Base",
      modeSmartLocal: "Generado con análisis de perfil",
      copy: "Copiar",
      copied: "Copiado",
      subject: "Asunto",
      noRecipients: "Selecciona al menos un destinatario",
      noGoal: "Escribe el objetivo de tu mensaje",
      integrations: "Integraciones",
      integrationsDesc: "Conecta tus apps para enviar directamente",
      comingSoon: "Pronto",
      connect: "Conectar",
      connected: "Conectado",
      unknown: "Desconocido",
      selected: "seleccionados",
      noMembers: "No hay miembros en tu comunidad",
      loadingProfile: "Cargando perfil...",
      errorLoading: "Error cargando datos",
      recipientAnalysis: "Análisis del Destinatario",
      prefers: "Prefiere:",
      idealTone: "Tono ideal:",
      howToApproach: "Cómo abordar:",
      avoid: "Evitar:",
      sharedTalents: "Talentos en Común",
      styleCompatibility: "Compatibilidad de Estilos",
      advantage: "Ventaja:",
      caution: "Cuidado:",
      heroText: "Comunica con inteligencia emocional. Analiza perfiles, adapta tu mensaje y conecta mejor.",
    },
    en: {
      title: "ECO",
      subtitle: "Emotional Communication Optimizer",
      description: "Design emotionally intelligent messages based on your cognitive and emotional profile",
      yourProfile: "Your Profile",
      brainStyle: "Brain Style",
      commPattern: "Communication Pattern",
      commRisk: "Communication Risk",
      eqStatus: "EQ Status",
      selectRecipients: "Recipients",
      communityMembers: "Your Community Members",
      externalContacts: "External Contacts",
      addExternal: "Add Contact",
      namePlaceholder: "Contact name",
      bioPlaceholder: "Context or notes about this person",
      composeMessage: "Compose Message",
      goalLabel: "Your message goal",
      goalPlaceholder: "Describe what you want to communicate and the expected outcome...",
      selectChannel: "Channel",
      refineWithAI: "Refine with AI",
      refineDescription: "Enhance the message with smart suggestions",
      additionalContext: "Additional context",
      refinePlaceholder: "Specific instructions to personalize...",
      generate: "Generate Message",
      generating: "Generating...",
      result: "Your Message",
      modePro: "Generated with Pro AI",
      modeBase: "Generated with Base AI",
      modeSmartLocal: "Generated with profile analysis",
      copy: "Copy",
      copied: "Copied",
      subject: "Subject",
      noRecipients: "Select at least one recipient",
      noGoal: "Write your message goal",
      integrations: "Integrations",
      integrationsDesc: "Connect your apps to send directly",
      comingSoon: "Soon",
      connect: "Connect",
      connected: "Connected",
      unknown: "Unknown",
      selected: "selected",
      noMembers: "No members in your community",
      loadingProfile: "Loading profile...",
      errorLoading: "Error loading data",
      recipientAnalysis: "Recipient Analysis",
      prefers: "Prefers:",
      idealTone: "Ideal tone:",
      howToApproach: "How to approach:",
      avoid: "Avoid:",
      sharedTalents: "Shared Talents",
      styleCompatibility: "Style Compatibility",
      advantage: "Advantage:",
      caution: "Caution:",
      heroText: "Communicate with emotional intelligence. Analyze profiles, adapt your message, and connect better.",
    },
  };

  const tt = tr[lang as keyof typeof tr] || tr.es;

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

  async function compose() {
    if (!goal.trim()) return;
    if (picked.length === 0 && free.filter((f) => f.name.trim()).length === 0) return;
    setLoading(true);
    setOut(null);
    try {
      const body = {
        goal,
        channel,
        memberIds: picked,
        freeTargets: free.filter((f) => f.name.trim()),
        refine,
        ask,
      };
      const r = await fetch("/api/eco/compose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      setOut(j);
    } catch {
      setOut({ ok: false, error: tt.errorLoading });
    } finally {
      setLoading(false);
    }
  }

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-start md:justify-between gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shadow-lg shadow-[var(--rowi-g2)]/25 flex-shrink-0">
              <Radio className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tt.title}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)] font-medium">
                  {tt.subtitle}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg">
                {tt.heroText}
              </p>
            </div>
          </div>

          {/* Recipients counter */}
          {totalRecipients > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--rowi-g2)]/10 rounded-xl border border-[var(--rowi-g2)]/20"
            >
              <Users className="w-4 h-4 text-[var(--rowi-g2)]" />
              <span className="text-sm font-medium text-[var(--rowi-g2)]">
                {totalRecipients} {tt.selected}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Columna izquierda — Perfil ── */}
          <div className="lg:col-span-1 space-y-5">
            {/* Perfil Cognitivo */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 overflow-hidden shadow-sm"
            >
              <div className="p-4 bg-gradient-to-r from-[var(--rowi-g1)]/5 to-[var(--rowi-g2)]/5 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Brain className="w-5 h-5 text-[var(--rowi-g2)]" />
                  {tt.yourProfile}
                </h2>
              </div>

              <div className="p-4">
                {loadingDash ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
                    <span className="ml-2 text-sm text-gray-500">{tt.loadingProfile}</span>
                  </div>
                ) : dashboard?.ok ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {(dashboard.user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {dashboard.user.name}
                        </p>
                        <p className="text-sm text-[var(--rowi-g2)] font-medium">{dashboard.user.brainStyle}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {dashboard.user.commPattern && (
                        <div className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800">
                          <span className="text-gray-500 dark:text-gray-400">{tt.commPattern}</span>
                          <span className="font-medium text-gray-900 dark:text-white text-right max-w-[150px] truncate">
                            {dashboard.user.commPattern}
                          </span>
                        </div>
                      )}
                      {dashboard.user.commRisk && (
                        <div className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            {tt.commRisk}
                          </span>
                          <span className="font-medium text-amber-600 dark:text-amber-400 text-right max-w-[150px] truncate">
                            {dashboard.user.commRisk}
                          </span>
                        </div>
                      )}
                    </div>

                    {dashboard.eqStatus && (
                      <div className="pt-3 border-t border-gray-100 dark:border-zinc-700">
                        <p className="text-xs font-medium text-gray-500 mb-2">{tt.eqStatus}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(dashboard.eqStatus).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                            >
                              {k}: <span className="font-semibold">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    {tt.errorLoading}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Integraciones */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setShowIntegrations(!showIntegrations)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[var(--rowi-g2)]" />
                  <span className="font-semibold text-gray-900 dark:text-white">{tt.integrations}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showIntegrations ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showIntegrations && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      <p className="text-xs text-gray-500 mb-2">{tt.integrationsDesc}</p>
                      {INTEGRATIONS.map((int) => (
                        <div
                          key={int.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center shadow-sm">
                              <int.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {int.name}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400">
                            {tt.comingSoon}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>

          {/* ── Columna central y derecha — Compositor ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Selección de destinatarios */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--rowi-g2)]" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{tt.selectRecipients}</h3>
                </div>
                {totalRecipients > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)] font-medium">
                    {totalRecipients} {tt.selected}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Community members */}
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{tt.communityMembers}</p>
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">{tt.noMembers}</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {members.map((m) => {
                        const isSelected = picked.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            onClick={() => toggleMember(m.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-[var(--rowi-g2)] bg-[var(--rowi-g2)]/5 ring-1 ring-[var(--rowi-g2)]/20"
                                : "border-gray-200 dark:border-zinc-700 hover:border-[var(--rowi-g2)]/40 bg-white dark:bg-zinc-800/50"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                isSelected
                                  ? "bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-md"
                                  : "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {(m.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{m.name}</p>
                              <p className="text-xs text-gray-500 truncate">{m.brainStyle || tt.unknown}</p>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[var(--rowi-g2)] flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* External contacts */}
                <div className="pt-3 border-t border-gray-100 dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{tt.externalContacts}</p>
                    <button
                      onClick={addExternal}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashed border-gray-300 dark:border-zinc-600 text-gray-500 hover:border-[var(--rowi-g2)] hover:text-[var(--rowi-g2)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {tt.addExternal}
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
                            className="flex items-start gap-2 p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50"
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                placeholder={tt.namePlaceholder}
                                value={f.name}
                                onChange={(e) =>
                                  setFree((v) =>
                                    v.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                                  )
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all"
                              />
                              <select
                                value={f.brainStyle}
                                onChange={(e) =>
                                  setFree((v) =>
                                    v.map((x, j) => (j === i ? { ...x, brainStyle: e.target.value } : x))
                                  )
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none"
                              >
                                {BRAIN_STYLES.map((b) => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                              <input
                                type="text"
                                placeholder={tt.bioPlaceholder}
                                value={f.bio || ""}
                                onChange={(e) =>
                                  setFree((v) =>
                                    v.map((x, j) => (j === i ? { ...x, bio: e.target.value } : x))
                                  )
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none"
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
              </div>
            </motion.section>

            {/* Compositor */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-100 dark:border-zinc-700">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--rowi-g2)]" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{tt.composeMessage}</h3>
                </div>
              </div>

              <div className="p-4 space-y-5">
                {/* Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tt.goalLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder={tt.goalPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all resize-none"
                  />
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {tt.selectChannel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((ch) => {
                      const isSelected = channel === ch.value;
                      const Icon = ch.icon;
                      return (
                        <button
                          key={ch.value}
                          onClick={() => setChannel(ch.value)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            isSelected
                              ? `border-transparent bg-gradient-to-r ${ch.color} text-white shadow-md`
                              : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {lang === "es" ? ch.label.es : ch.label.en}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Refine */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--rowi-g1)]/5 to-[var(--rowi-g2)]/5 border border-[var(--rowi-g2)]/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={refine}
                        onChange={(e) => setRefine(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-[var(--rowi-g1)] peer-checked:to-[var(--rowi-g2)] transition-all" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-all" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[var(--rowi-g2)]" />
                        {tt.refineWithAI}
                      </span>
                      <span className="text-xs text-gray-500">{tt.refineDescription}</span>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {tt.additionalContext}
                        </label>
                        <textarea
                          rows={2}
                          value={ask}
                          onChange={(e) => setAsk(e.target.value)}
                          placeholder={tt.refinePlaceholder}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Generate button */}
                <button
                  onClick={compose}
                  disabled={!canGenerate}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all ${
                    canGenerate
                      ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] hover:shadow-lg hover:shadow-[var(--rowi-g2)]/25 hover:scale-[1.01] active:scale-[0.99]"
                      : "bg-gray-300 dark:bg-zinc-700 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {tt.generating}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {tt.generate}
                    </>
                  )}
                </button>
              </div>
            </motion.section>

            {/* Result */}
            <AnimatePresence>
              {out?.ok && (
                <motion.section
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  className="space-y-4"
                >
                  {/* Recipient Analysis */}
                  {out.analysis && (
                    <div className="rounded-2xl border border-purple-200 dark:border-purple-800/40 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/15 dark:to-zinc-900 p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white flex-1">{tt.recipientAnalysis}</h4>
                        <span className="px-2.5 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                          {out.analysis.targetBrainStyle}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-white/60 dark:bg-zinc-800/50">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{tt.prefers}</span>
                            <p className="text-gray-800 dark:text-gray-200 mt-0.5">{out.analysis.targetPrefs?.prefers}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/60 dark:bg-zinc-800/50">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{tt.idealTone}</span>
                            <p className="text-gray-800 dark:text-gray-200 mt-0.5">{out.analysis.targetPrefs?.tone}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-white/60 dark:bg-zinc-800/50">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{tt.howToApproach}</span>
                            <p className="text-gray-800 dark:text-gray-200 mt-0.5">{out.analysis.targetPrefs?.approach}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-900/10">
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {tt.avoid}
                            </span>
                            <p className="text-amber-700 dark:text-amber-400 mt-0.5">{out.analysis.targetPrefs?.avoid}</p>
                          </div>
                        </div>
                      </div>

                      {out.analysis.sharedTalents?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-800/40">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {tt.sharedTalents}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {out.analysis.sharedTalents.map((talent: string) => (
                              <span key={talent} className="px-2.5 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                                {talent}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {out.analysis.compatibility && (
                        <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-800/40">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{tt.styleCompatibility}</p>
                          <div className="grid sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/15 text-green-700 dark:text-green-400">
                              <strong>{tt.advantage}</strong> {out.analysis.compatibility.tip}
                            </div>
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/15 text-amber-700 dark:text-amber-400">
                              <strong>{tt.caution}</strong> {out.analysis.compatibility.challenge}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generated Message */}
                  <div className="rounded-2xl border border-[var(--rowi-g2)]/25 bg-white dark:bg-zinc-800/80 overflow-hidden shadow-lg shadow-[var(--rowi-g2)]/10">
                    <div className="p-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between bg-gradient-to-r from-[var(--rowi-g1)]/5 to-[var(--rowi-g2)]/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shadow-sm">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{tt.result}</h3>
                          <p className="text-xs text-gray-500">
                            {out.mode === "ai-refined" ? tt.modePro : out.mode === "smart-local" ? tt.modeSmartLocal : tt.modeBase}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyText(out.refined?.text || out.base.text)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          copied
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600"
                        }`}
                      >
                        {copied ? <><Check className="w-4 h-4" />{tt.copied}</> : <><Copy className="w-4 h-4" />{tt.copy}</>}
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      {(out.refined?.subject || out.base?.subject) && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">{tt.subject}</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {out.refined?.subject || out.base.subject}
                          </p>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {out.refined?.text || out.base.text}
                        </p>
                      </div>
                    </div>
                  </div>
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
                {out.error || tt.errorLoading}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
