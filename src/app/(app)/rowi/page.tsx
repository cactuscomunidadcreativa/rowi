"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Brain,
  Users,
  Heart,
  Satellite,
  Zap,
  MessageCircle,
  ChevronDown,
  Info,
  User,
  Mic,
  Paperclip,
  RefreshCw,
  Clock,
  BarChart3,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* =========================================================
   🤖 Rowi Coach - Tu asistente de inteligencia emocional
   =========================================================
*/

type Scope = "super" | "eq" | "community" | "affinity" | "eco";
type Msg = { role: "user" | "rowi"; text: string; timestamp: Date };

// Agentes disponibles
const AGENTS: { key: Scope; icon: React.ElementType; color: string }[] = [
  { key: "super", icon: Sparkles, color: "from-purple-500 to-pink-500" },
  { key: "eq", icon: Brain, color: "from-blue-500 to-cyan-500" },
  { key: "community", icon: Users, color: "from-green-500 to-emerald-500" },
  { key: "affinity", icon: Heart, color: "from-rose-500 to-orange-500" },
  { key: "eco", icon: Satellite, color: "from-indigo-500 to-violet-500" },
];

export default function RowiCoachPage() {
  const { lang } = useI18n();

  // Estados
  const [scope, setScope] = useState<Scope>("super");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [aiInfo, setAiInfo] = useState<{ model?: string; access?: string } | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Traducciones
  const tr = useMemo(() => {
    const t: Record<string, Record<string, string>> = {
      es: {
        title: "Rowi Coach",
        subtitle: "Tu asistente de inteligencia emocional",
        selectAgent: "Selecciona un agente",
        agentSuper: "Super Rowi",
        agentSuperDesc: "Asistente general para cualquier tema",
        agentEq: "Rowi IE",
        agentEqDesc: "Especialista en inteligencia emocional",
        agentCommunity: "Rowi Comunidad",
        agentCommunityDesc: "Ayuda con tu equipo y comunidad",
        agentAffinity: "Rowi Afinidad",
        agentAffinityDesc: "Mejora tus relaciones personales",
        agentEco: "Rowi ECO",
        agentEcoDesc: "Comunicación emocional efectiva",
        online: "En línea",
        offline: "Desconectado",
        thinking: "Rowi está pensando...",
        inputPlaceholder: "Escribe tu mensaje aquí...",
        send: "Enviar",
        you: "Tú",
        rowi: "Rowi",
        suggestions: "Sugerencias",
        clearChat: "Limpiar chat",
        model: "Modelo",
        level: "Nivel",
        quickActions: "Acciones rápidas",
        // Sugerencias por agente
        sugSuper1: "¿Cómo puedo mejorar mi día?",
        sugSuper2: "Ayúdame a reflexionar",
        sugSuper3: "Dame un consejo motivacional",
        sugEq1: "¿Cómo manejar el estrés?",
        sugEq2: "Quiero entender mis emociones",
        sugEq3: "¿Qué es la inteligencia emocional?",
        sugCommunity1: "¿Cómo mejorar la comunicación en mi equipo?",
        sugCommunity2: "Estrategias para resolver conflictos",
        sugCommunity3: "¿Cómo dar feedback constructivo?",
        sugAffinity1: "¿Cómo conectar mejor con otros?",
        sugAffinity2: "Mejorar mis relaciones personales",
        sugAffinity3: "¿Cómo desarrollar empatía?",
        sugEco1: "¿Cómo comunicar de forma asertiva?",
        sugEco2: "Redactar un mensaje difícil",
        sugEco3: "Mejorar mi comunicación escrita",
        welcomeSuper: "¡Hola! Soy Super Rowi, tu asistente de inteligencia emocional. ¿En qué puedo ayudarte hoy?",
        welcomeEq: "¡Hola! Soy Rowi IE, especialista en inteligencia emocional. Estoy aquí para ayudarte a entender y gestionar tus emociones.",
        welcomeCommunity: "¡Hola! Soy Rowi Comunidad. Te ayudo a mejorar la dinámica de tu equipo y comunidad.",
        welcomeAffinity: "¡Hola! Soy Rowi Afinidad. Juntos podemos trabajar en mejorar tus relaciones personales.",
        welcomeEco: "¡Hola! Soy Rowi ECO. Te ayudo a comunicarte de forma más efectiva y empática.",
      },
      en: {
        title: "Rowi Coach",
        subtitle: "Your emotional intelligence assistant",
        selectAgent: "Select an agent",
        agentSuper: "Super Rowi",
        agentSuperDesc: "General assistant for any topic",
        agentEq: "Rowi EI",
        agentEqDesc: "Emotional intelligence specialist",
        agentCommunity: "Rowi Community",
        agentCommunityDesc: "Help with your team and community",
        agentAffinity: "Rowi Affinity",
        agentAffinityDesc: "Improve your personal relationships",
        agentEco: "Rowi ECO",
        agentEcoDesc: "Effective emotional communication",
        online: "Online",
        offline: "Offline",
        thinking: "Rowi is thinking...",
        inputPlaceholder: "Type your message here...",
        send: "Send",
        you: "You",
        rowi: "Rowi",
        suggestions: "Suggestions",
        clearChat: "Clear chat",
        model: "Model",
        level: "Level",
        quickActions: "Quick actions",
        // Suggestions by agent
        sugSuper1: "How can I improve my day?",
        sugSuper2: "Help me reflect",
        sugSuper3: "Give me motivational advice",
        sugEq1: "How to manage stress?",
        sugEq2: "I want to understand my emotions",
        sugEq3: "What is emotional intelligence?",
        sugCommunity1: "How to improve team communication?",
        sugCommunity2: "Conflict resolution strategies",
        sugCommunity3: "How to give constructive feedback?",
        sugAffinity1: "How to connect better with others?",
        sugAffinity2: "Improve my personal relationships",
        sugAffinity3: "How to develop empathy?",
        sugEco1: "How to communicate assertively?",
        sugEco2: "Write a difficult message",
        sugEco3: "Improve my written communication",
        welcomeSuper: "Hi! I'm Super Rowi, your emotional intelligence assistant. How can I help you today?",
        welcomeEq: "Hi! I'm Rowi EI, emotional intelligence specialist. I'm here to help you understand and manage your emotions.",
        welcomeCommunity: "Hi! I'm Rowi Community. I help you improve your team and community dynamics.",
        welcomeAffinity: "Hi! I'm Rowi Affinity. Together we can work on improving your personal relationships.",
        welcomeEco: "Hi! I'm Rowi ECO. I help you communicate more effectively and empathetically.",
      },
    };
    return t[lang] || t.es;
  }, [lang]);

  // Obtener sugerencias según el agente
  const suggestions = useMemo(() => {
    const map: Record<Scope, string[]> = {
      super: [tr.sugSuper1, tr.sugSuper2, tr.sugSuper3],
      eq: [tr.sugEq1, tr.sugEq2, tr.sugEq3],
      community: [tr.sugCommunity1, tr.sugCommunity2, tr.sugCommunity3],
      affinity: [tr.sugAffinity1, tr.sugAffinity2, tr.sugAffinity3],
      eco: [tr.sugEco1, tr.sugEco2, tr.sugEco3],
    };
    return map[scope];
  }, [scope, tr]);

  // Obtener mensaje de bienvenida
  const getWelcomeMessage = (s: Scope): string => {
    const map: Record<Scope, string> = {
      super: tr.welcomeSuper,
      eq: tr.welcomeEq,
      community: tr.welcomeCommunity,
      affinity: tr.welcomeAffinity,
      eco: tr.welcomeEco,
    };
    return map[s];
  };

  // Auto-scroll
  useEffect(() => {
    boxRef.current?.scrollTo({
      top: boxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs]);

  // Saludo inicial al cambiar de agente
  useEffect(() => {
    setMsgs([
      {
        role: "rowi",
        text: getWelcomeMessage(scope),
        timestamp: new Date(),
      },
    ]);
    setAiInfo(null);
  }, [scope]);

  // Enviar mensaje
  async function send(override?: string) {
    const ask = (override ?? input).trim();
    if (!ask || loading) return;

    setMsgs((m) => [...m, { role: "user", text: ask, timestamp: new Date() }]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/rowi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent: scope, ask, locale: lang }),
      });
      const j = await r.json();

      if (j?.text) {
        setMsgs((m) => [...m, { role: "rowi", text: j.text, timestamp: new Date() }]);
      }
      if (j?.model || j?.access) {
        setAiInfo({ model: j.model, access: j.access });
      }
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: "rowi", text: "Lo siento, hubo un error. Intenta de nuevo.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Limpiar chat
  function clearChat() {
    setMsgs([
      {
        role: "rowi",
        text: getWelcomeMessage(scope),
        timestamp: new Date(),
      },
    ]);
  }

  // Obtener info del agente actual
  const currentAgent = AGENTS.find((a) => a.key === scope) || AGENTS[0];
  const agentName = tr[`agent${scope.charAt(0).toUpperCase()}${scope.slice(1)}` as keyof typeof tr] || "Rowi";
  const agentDesc = tr[`agent${scope.charAt(0).toUpperCase()}${scope.slice(1)}Desc` as keyof typeof tr] || "";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-6 h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            {/* Avatar del agente */}
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentAgent.color} flex items-center justify-center shadow-lg`}
            >
              <currentAgent.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{agentName}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {tr.online}
                </span>
                {aiInfo?.model && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs">{aiInfo.model}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            {/* Selector de agente */}
            <div className="relative">
              <button
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <Bot className="w-4 h-4 text-[var(--rowi-g2)]" />
                <span className="hidden sm:inline">{tr.selectAgent}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAgentSelector ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showAgentSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl z-50 overflow-hidden"
                  >
                    {AGENTS.map((agent) => {
                      const name = tr[`agent${agent.key.charAt(0).toUpperCase()}${agent.key.slice(1)}` as keyof typeof tr];
                      const desc = tr[`agent${agent.key.charAt(0).toUpperCase()}${agent.key.slice(1)}Desc` as keyof typeof tr];
                      const isActive = scope === agent.key;
                      return (
                        <button
                          key={agent.key}
                          onClick={() => {
                            setScope(agent.key);
                            setShowAgentSelector(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                            isActive
                              ? "bg-[var(--rowi-g2)]/10"
                              : "hover:bg-gray-50 dark:hover:bg-zinc-700"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center`}
                          >
                            <agent.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{name}</p>
                            <p className="text-xs text-gray-500 truncate">{desc}</p>
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-[var(--rowi-g2)]" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Limpiar chat */}
            <button
              onClick={clearChat}
              className="p-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 hover:text-[var(--rowi-g2)] hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              title={tr.clearChat}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </motion.header>

        {/* Chat container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm overflow-hidden"
        >
          {/* Messages */}
          <div
            ref={boxRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            <AnimatePresence>
              {msgs.map((m, i) => (
                <MessageBubble
                  key={i}
                  role={m.role}
                  text={m.text}
                  timestamp={m.timestamp}
                  agentColor={currentAgent.color}
                  AgentIcon={currentAgent.icon}
                  tr={tr}
                  lang={lang}
                />
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${currentAgent.color} flex items-center justify-center flex-shrink-0`}
                >
                  <currentAgent.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-zinc-800">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-sm text-gray-500 ml-2">{tr.thinking}</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Suggestions */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="flex-shrink-0 px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:border-[var(--rowi-g2)] hover:text-[var(--rowi-g2)] transition-colors whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus-within:ring-2 focus-within:ring-[var(--rowi-g2)]/20 focus-within:border-[var(--rowi-g2)] transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={tr.inputPlaceholder}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                />
              </div>
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className={`flex items-center justify-center w-12 h-12 rounded-xl font-medium text-white transition-all ${
                  loading || !input.trim()
                    ? "bg-gray-300 dark:bg-zinc-700 cursor-not-allowed"
                    : `bg-gradient-to-r ${currentAgent.color} hover:shadow-lg hover:scale-105`
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* AI Info footer */}
        {aiInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-400"
          >
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {tr.model}: {aiInfo.model}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {tr.level}: {aiInfo.access}
            </span>
          </motion.div>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   💬 Message Bubble Component
   =========================================================
*/
function MessageBubble({
  role,
  text,
  timestamp,
  agentColor,
  AgentIcon,
  tr,
  lang,
}: {
  role: "user" | "rowi";
  text: string;
  timestamp: Date;
  agentColor: string;
  AgentIcon: React.ElementType;
  tr: Record<string, string>;
  lang: string;
}) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>
      ) : (
        <div
          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${agentColor} flex items-center justify-center flex-shrink-0`}
        >
          <AgentIcon className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white"
            : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
        }`}
      >
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{text}</div>
        <div
          className={`mt-1 text-[10px] ${
            isUser ? "text-white/60" : "text-gray-400"
          }`}
        >
          {timestamp.toLocaleTimeString(lang === "es" ? "es-ES" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
