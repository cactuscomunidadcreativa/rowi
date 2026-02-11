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

const CHANNELS: { value: Channel; icon: React.ElementType; color: string }[] = [
  { value: "email", icon: Mail, color: "from-blue-500 to-blue-600" },
  { value: "whatsapp", icon: MessageSquare, color: "from-green-500 to-green-600" },
  { value: "sms", icon: MessageCircle, color: "from-purple-500 to-purple-600" },
  { value: "call", icon: Phone, color: "from-amber-500 to-amber-600" },
  { value: "speech", icon: Mic, color: "from-pink-500 to-pink-600" },
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

// Integraciones futuras (solo visual por ahora)
const INTEGRATIONS = [
  { id: "slack", name: "Slack", icon: Slack, connected: false },
  { id: "gmail", name: "Gmail", icon: Mail, connected: false },
  { id: "outlook", name: "Outlook", icon: Mail, connected: false },
  { id: "teams", name: "Teams", icon: MessageSquare, connected: false },
];

export default function EcoPage() {
  const { t, lang } = useI18n();

  // Estados principales
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

  // Traducciones inline para esta página
  const translations: Record<string, Record<string, string>> = {
    es: {
      title: "ECO",
      subtitle: "Emotional Communication Optimizer",
      description: "Diseña mensajes emocionalmente inteligentes basados en tu perfil Rowi",
      yourProfile: "Tu Perfil Rowi + SEI",
      brainStyle: "Brain Style",
      commPattern: "Patrón de Comunicación",
      commRisk: "Riesgo Comunicativo",
      eqStatus: "Estado EQ",
      selectRecipients: "Selecciona Destinatarios",
      communityMembers: "Miembros de tu Comunidad",
      externalContacts: "Contactos Externos",
      addExternal: "Agregar Contacto Externo",
      namePlaceholder: "Nombre del contacto",
      bioPlaceholder: "Contexto o notas sobre esta persona",
      composeMessage: "Componer Mensaje",
      goalLabel: "Objetivo de tu mensaje",
      goalPlaceholder: "Describe qué quieres comunicar y qué resultado esperas...",
      selectChannel: "Canal de Comunicación",
      channelEmail: "Email",
      channelWhatsapp: "WhatsApp",
      channelSms: "SMS",
      channelCall: "Guión de llamada",
      channelSpeech: "Discurso",
      refineWithAI: "Refinar con IA",
      refineDescription: "Mejora el mensaje con sugerencias de la IA",
      additionalContext: "Contexto adicional para la IA",
      refinePlaceholder: "Agrega instrucciones específicas para personalizar el mensaje...",
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
      integrationsDesc: "Conecta tus apps para enviar mensajes directamente",
      comingSoon: "Próximamente",
      connect: "Conectar",
      connected: "Conectado",
      unknown: "Desconocido",
      selected: "seleccionados",
      noMembers: "No hay miembros en tu comunidad",
      loadingProfile: "Cargando perfil...",
      errorLoading: "Error cargando datos",
      tips: "Tips de Comunicación",
      tipBrainStyle: "Tu estilo cerebral influye en cómo otros perciben tus mensajes",
      tipEQ: "Un EQ equilibrado mejora la efectividad de tu comunicación",
      // Análisis del destinatario
      recipientAnalysis: "Análisis del Destinatario",
      prefers: "Prefiere:",
      idealTone: "Tono ideal:",
      howToApproach: "Cómo abordar:",
      avoid: "Evitar:",
      sharedTalents: "Talentos en Común (puntos de conexión)",
      styleCompatibility: "Compatibilidad de Estilos",
      advantage: "Ventaja:",
      caution: "Cuidado:",
      aiPromptTitle: "Prompt para IA",
      aiPromptDesc: "Copia este prompt en ChatGPT o Claude",
      copyPrompt: "Copiar Prompt",
    },
    en: {
      title: "ECO",
      subtitle: "Emotional Communication Optimizer",
      description: "Design emotionally intelligent messages based on your Rowi profile",
      yourProfile: "Your Rowi + SEI Profile",
      brainStyle: "Brain Style",
      commPattern: "Communication Pattern",
      commRisk: "Communication Risk",
      eqStatus: "EQ Status",
      selectRecipients: "Select Recipients",
      communityMembers: "Your Community Members",
      externalContacts: "External Contacts",
      addExternal: "Add External Contact",
      namePlaceholder: "Contact name",
      bioPlaceholder: "Context or notes about this person",
      composeMessage: "Compose Message",
      goalLabel: "Your message goal",
      goalPlaceholder: "Describe what you want to communicate and the expected outcome...",
      selectChannel: "Communication Channel",
      channelEmail: "Email",
      channelWhatsapp: "WhatsApp",
      channelSms: "SMS",
      channelCall: "Call Script",
      channelSpeech: "Speech",
      refineWithAI: "Refine with AI",
      refineDescription: "Enhance the message with AI suggestions",
      additionalContext: "Additional context for AI",
      refinePlaceholder: "Add specific instructions to personalize the message...",
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
      integrationsDesc: "Connect your apps to send messages directly",
      comingSoon: "Coming Soon",
      connect: "Connect",
      connected: "Connected",
      unknown: "Unknown",
      selected: "selected",
      noMembers: "No members in your community",
      loadingProfile: "Loading profile...",
      errorLoading: "Error loading data",
      tips: "Communication Tips",
      tipBrainStyle: "Your brain style influences how others perceive your messages",
      tipEQ: "A balanced EQ improves your communication effectiveness",
      // Recipient analysis
      recipientAnalysis: "Recipient Analysis",
      prefers: "Prefers:",
      idealTone: "Ideal tone:",
      howToApproach: "How to approach:",
      avoid: "Avoid:",
      sharedTalents: "Shared Talents (connection points)",
      styleCompatibility: "Style Compatibility",
      advantage: "Advantage:",
      caution: "Caution:",
      aiPromptTitle: "AI Prompt",
      aiPromptDesc: "Copy this prompt to ChatGPT or Claude",
      copyPrompt: "Copy Prompt",
    },
  };

  const tr = translations[lang] || translations.es;

  // Cargar datos iniciales
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
        // Error silencioso
      } finally {
        setLoadingDash(false);
      }
    })();
  }, []);

  // Componer mensaje
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
      setOut({ ok: false, error: tr.errorLoading });
    } finally {
      setLoading(false);
    }
  }

  // Copiar texto
  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Toggle miembro
  const toggleMember = (id: string) => {
    setPicked((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  };

  // Agregar contacto externo
  const addExternal = () => {
    setFree((v) => [...v, { name: "", brainStyle: "Strategist", bio: "" }]);
  };

  // Eliminar contacto externo
  const removeExternal = (idx: number) => {
    setFree((v) => v.filter((_, i) => i !== idx));
  };

  // Total de destinatarios
  const totalRecipients = picked.length + free.filter((f) => f.name.trim()).length;

  // Validación del formulario
  const canGenerate = goal.trim() && totalRecipients > 0 && !loading;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 border border-[var(--rowi-g1)]/20">
            <Zap className="w-4 h-4 text-[var(--rowi-g2)]" />
            <span className="text-sm font-medium text-[var(--rowi-g2)]">{tr.subtitle}</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] bg-clip-text text-transparent">
            {tr.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
            {tr.description}
          </p>
        </motion.header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Perfil y destinatarios */}
          <div className="lg:col-span-1 space-y-6">
            {/* Perfil Cognitivo */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gradient-to-r from-[var(--rowi-g1)]/5 to-[var(--rowi-g2)]/5">
                <h2 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Brain className="w-5 h-5 text-[var(--rowi-g2)]" />
                  {tr.yourProfile}
                </h2>
              </div>

              <div className="p-4">
                {loadingDash ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-g2)]" />
                    <span className="ml-2 text-sm text-gray-500">{tr.loadingProfile}</span>
                  </div>
                ) : dashboard?.ok ? (
                  <div className="space-y-4">
                    {/* Info del usuario */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-bold text-lg">
                        {(dashboard.user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {dashboard.user.name}
                        </p>
                        <p className="text-sm text-gray-500">{dashboard.user.brainStyle}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{tr.commPattern}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {dashboard.user.commPattern || tr.unknown}
                        </span>
                      </div>

                      {dashboard.user.commRisk && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {tr.commRisk}
                          </span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {dashboard.user.commRisk}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* EQ Status */}
                    {dashboard.eqStatus && (
                      <div className="pt-3 border-t border-gray-200 dark:border-zinc-800">
                        <p className="text-xs font-medium text-gray-500 mb-2">{tr.eqStatus}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(dashboard.eqStatus).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
                            >
                              {k}: <span className="font-medium">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    {tr.errorLoading}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Integraciones (futuras) */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden"
            >
              <button
                onClick={() => setShowIntegrations(!showIntegrations)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[var(--rowi-g2)]" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {tr.integrations}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    showIntegrations ? "rotate-180" : ""
                  }`}
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
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-xs text-gray-500">{tr.integrationsDesc}</p>
                      {INTEGRATIONS.map((int) => (
                        <div
                          key={int.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center">
                              <int.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {int.name}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400">
                            {tr.comingSoon}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>

          {/* Columna central y derecha - Compositor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selección de destinatarios */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--rowi-g2)]" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {tr.selectRecipients}
                  </h3>
                </div>
                {totalRecipients > 0 && (
                  <span className="text-sm px-3 py-1 rounded-full bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)] font-medium">
                    {totalRecipients} {tr.selected}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Miembros de la comunidad */}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {tr.communityMembers}
                  </p>
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center">{tr.noMembers}</p>
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
                                : "border-gray-200 dark:border-zinc-700 hover:border-[var(--rowi-g2)]/50 bg-white dark:bg-zinc-800/50"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                isSelected
                                  ? "bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white"
                                  : "bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {(m.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {m.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {m.brainStyle || tr.unknown}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-[var(--rowi-g2)] flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Contactos externos */}
                <div className="pt-4 border-t border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {tr.externalContacts}
                    </p>
                    <button
                      onClick={addExternal}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-dashed border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-gray-400 hover:border-[var(--rowi-g2)] hover:text-[var(--rowi-g2)] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {tr.addExternal}
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
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                placeholder={tr.namePlaceholder}
                                value={f.name}
                                onChange={(e) =>
                                  setFree((v) =>
                                    v.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                                  )
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all"
                              />
                              <div className="flex gap-2">
                                <select
                                  value={f.brainStyle}
                                  onChange={(e) =>
                                    setFree((v) =>
                                      v.map((x, j) =>
                                        j === i ? { ...x, brainStyle: e.target.value } : x
                                      )
                                    )
                                  }
                                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all"
                                >
                                  {BRAIN_STYLES.map((b) => (
                                    <option key={b} value={b}>
                                      {b}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <input
                                type="text"
                                placeholder={tr.bioPlaceholder}
                                value={f.bio || ""}
                                onChange={(e) =>
                                  setFree((v) =>
                                    v.map((x, j) => (j === i ? { ...x, bio: e.target.value } : x))
                                  )
                                }
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all"
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

            {/* Compositor de mensaje */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--rowi-g2)]" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {tr.composeMessage}
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-5">
                {/* Objetivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tr.goalLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder={tr.goalPlaceholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all resize-none"
                  />
                </div>

                {/* Canal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {tr.selectChannel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((ch) => {
                      const isSelected = channel === ch.value;
                      const Icon = ch.icon;
                      const labelKey = `channel${ch.value.charAt(0).toUpperCase()}${ch.value.slice(1)}` as keyof typeof tr;
                      return (
                        <button
                          key={ch.value}
                          onClick={() => setChannel(ch.value)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            isSelected
                              ? `border-transparent bg-gradient-to-r ${ch.color} text-white shadow-md`
                              : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tr[labelKey] || ch.value}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Refinar con IA */}
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
                        {tr.refineWithAI}
                      </span>
                      <span className="text-xs text-gray-500">{tr.refineDescription}</span>
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
                          {tr.additionalContext}
                        </label>
                        <textarea
                          rows={2}
                          value={ask}
                          onChange={(e) => setAsk(e.target.value)}
                          placeholder={tr.refinePlaceholder}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-[var(--rowi-g2)]/20 focus:border-[var(--rowi-g2)] outline-none transition-all resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Botón generar */}
                <button
                  onClick={compose}
                  disabled={!canGenerate}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all ${
                    canGenerate
                      ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] hover:shadow-lg hover:shadow-[var(--rowi-g2)]/25 hover:scale-[1.02]"
                      : "bg-gray-300 dark:bg-zinc-700 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {tr.generating}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {tr.generate}
                    </>
                  )}
                </button>
              </div>
            </motion.section>

            {/* Resultado */}
            <AnimatePresence>
              {out?.ok && (
                <motion.section
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="space-y-4"
                >
                  {/* Análisis del Destinatario */}
                  {out.analysis && (
                    <div className="rounded-2xl border border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-zinc-900 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {tr.recipientAnalysis}
                        </h4>
                        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium">
                          {out.analysis.targetBrainStyle}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">{tr.prefers}</span>
                            <p className="text-gray-800 dark:text-gray-200">{out.analysis.targetPrefs?.prefers}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">{tr.idealTone}</span>
                            <p className="text-gray-800 dark:text-gray-200">{out.analysis.targetPrefs?.tone}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">{tr.howToApproach}</span>
                            <p className="text-gray-800 dark:text-gray-200">{out.analysis.targetPrefs?.approach}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {tr.avoid}
                            </span>
                            <p className="text-amber-700 dark:text-amber-400">{out.analysis.targetPrefs?.avoid}</p>
                          </div>
                        </div>
                      </div>

                      {/* Talentos compartidos */}
                      {out.analysis.sharedTalents?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800/50">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            ✨ {tr.sharedTalents}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {out.analysis.sharedTalents.map((t: string) => (
                              <span key={t} className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Compatibilidad */}
                      {out.analysis.compatibility && (
                        <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800/50">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            🤝 {tr.styleCompatibility}
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              <strong>{tr.advantage}</strong> {out.analysis.compatibility.tip}
                            </div>
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                              <strong>{tr.caution}</strong> {out.analysis.compatibility.challenge}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mensaje Generado */}
                  <div className="rounded-2xl border border-[var(--rowi-g2)]/30 bg-gradient-to-br from-white to-[var(--rowi-g2)]/5 dark:from-zinc-900 dark:to-[var(--rowi-g2)]/10 overflow-hidden shadow-lg shadow-[var(--rowi-g2)]/10">
                    <div className="p-4 border-b border-[var(--rowi-g2)]/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {tr.result}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {out.mode === "ai-refined" ? tr.modePro : out.mode === "smart-local" ? tr.modeSmartLocal : tr.modeBase}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyText(out.refined?.text || out.base.text)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          copied
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            {tr.copied}
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            {tr.copy}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      {(out.refined?.subject || out.base?.subject) && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">{tr.subject}</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {out.refined?.subject || out.base.subject}
                          </p>
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                          {out.refined?.text || out.base.text}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ECO ahora genera mensajes directamente — sección de prompt eliminada */}
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
                {out.error || tr.errorLoading}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
