"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Send,
  Loader2,
  Sparkles,
  Brain,
  Users,
  Heart,
  Satellite,
  Zap,
  ChevronDown,
  User,
  RefreshCw,
  BarChart3,
  Bot,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

/* ================================================================
   🤖 Rowi Coach — Chat de inteligencia emocional con agentes
   ================================================================ */

type Scope = "super" | "eq" | "community" | "affinity" | "eco";
type Msg = { role: "user" | "rowi"; text: string; timestamp: Date };

const AGENTS: { key: Scope; icon: React.ElementType; color: string; bg: string }[] = [
  { key: "super", icon: Sparkles, color: "from-purple-500 to-pink-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { key: "eq", icon: Brain, color: "from-blue-500 to-cyan-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { key: "community", icon: Users, color: "from-green-500 to-emerald-500", bg: "bg-green-100 dark:bg-green-900/30" },
  { key: "affinity", icon: Heart, color: "from-rose-500 to-orange-500", bg: "bg-rose-100 dark:bg-rose-900/30" },
  { key: "eco", icon: Satellite, color: "from-indigo-500 to-violet-500", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
];

export default function RowiCoachPage() {
  const { lang } = useI18n();

  const [scope, setScope] = useState<Scope>("super");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [aiInfo, setAiInfo] = useState<{ model?: string; access?: string } | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---- i18n ---- */
  const tr = useMemo(() => {
    const t: Record<string, Record<string, string>> = {
      es: {
        title: "Rowi Coach",
        subtitle: "Tu asistente de inteligencia emocional",
        selectAgent: "Cambiar agente",
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
        thinking: "Rowi está pensando…",
        inputPlaceholder: "Escribe tu mensaje aquí…",
        send: "Enviar",
        clearChat: "Limpiar chat",
        model: "Modelo",
        level: "Nivel",
        greeting: "¡Hola! ¿En qué te puedo ayudar hoy?",
        poweredBy: "Potenciado por IA",
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
        welcomeSuper:
          "¡Hola! Soy Super Rowi, tu asistente de inteligencia emocional. ¿En qué puedo ayudarte hoy?",
        welcomeEq:
          "¡Hola! Soy Rowi IE, especialista en inteligencia emocional. Estoy aquí para ayudarte a entender y gestionar tus emociones.",
        welcomeCommunity:
          "¡Hola! Soy Rowi Comunidad. Te ayudo a mejorar la dinámica de tu equipo y comunidad.",
        welcomeAffinity:
          "¡Hola! Soy Rowi Afinidad. Juntos podemos trabajar en mejorar tus relaciones personales.",
        welcomeEco:
          "¡Hola! Soy Rowi ECO. Te ayudo a comunicarte de forma más efectiva y empática.",
      },
      en: {
        title: "Rowi Coach",
        subtitle: "Your emotional intelligence assistant",
        selectAgent: "Switch agent",
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
        thinking: "Rowi is thinking…",
        inputPlaceholder: "Type your message here…",
        send: "Send",
        clearChat: "Clear chat",
        model: "Model",
        level: "Level",
        greeting: "Hi! How can I help you today?",
        poweredBy: "Powered by AI",
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
        welcomeSuper:
          "Hi! I'm Super Rowi, your emotional intelligence assistant. How can I help you today?",
        welcomeEq:
          "Hi! I'm Rowi EI, emotional intelligence specialist. I'm here to help you understand and manage your emotions.",
        welcomeCommunity:
          "Hi! I'm Rowi Community. I help you improve your team and community dynamics.",
        welcomeAffinity:
          "Hi! I'm Rowi Affinity. Together we can work on improving your personal relationships.",
        welcomeEco:
          "Hi! I'm Rowi ECO. I help you communicate more effectively and empathetically.",
      },
    };
    return t[lang] || t.es;
  }, [lang]);

  /* ---- helpers ---- */
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

  const getWelcome = (s: Scope) => {
    const map: Record<Scope, string> = {
      super: tr.welcomeSuper,
      eq: tr.welcomeEq,
      community: tr.welcomeCommunity,
      affinity: tr.welcomeAffinity,
      eco: tr.welcomeEco,
    };
    return map[s];
  };

  const currentAgent = AGENTS.find((a) => a.key === scope) || AGENTS[0];
  const agentName =
    tr[`agent${scope.charAt(0).toUpperCase()}${scope.slice(1)}` as keyof typeof tr] || "Rowi";

  /* ---- effects ---- */
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    setMsgs([{ role: "rowi", text: getWelcome(scope), timestamp: new Date() }]);
    setAiInfo(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  /* ---- send ---- */
  async function send(override?: string) {
    const ask = (override ?? input).trim();
    if (!ask || loading) return;

    setMsgs((m) => [...m, { role: "user", text: ask, timestamp: new Date() }]);
    setInput("");
    setLoading(true);
    inputRef.current?.focus();

    try {
      const r = await fetch("/api/rowi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent: scope, ask, locale: lang }),
      });
      const j = await r.json();
      if (j?.text)
        setMsgs((m) => [...m, { role: "rowi", text: j.text, timestamp: new Date() }]);
      if (j?.model || j?.access) setAiInfo({ model: j.model, access: j.access });
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "rowi", text: "Lo siento, hubo un error. Intenta de nuevo.", timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMsgs([{ role: "rowi", text: getWelcome(scope), timestamp: new Date() }]);
  }

  /* ---- hasConversation (more than just the welcome message) ---- */
  const hasConversation = msgs.length > 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col" style={{ height: "calc(100vh - 4rem - var(--banner-height, 0px))" }}>
      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image
              src="/rowi-logo.png"
              alt="Rowi"
              width={48}
              height={48}
              className="w-12 h-12 rounded-2xl object-cover shadow-md"
            />
            {/* online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {agentName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {tr.online}
              {aiInfo?.model && (
                <>
                  <span className="mx-1 text-gray-300 dark:text-zinc-600">·</span>
                  {aiInfo.model}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Agent selector */}
          <div className="relative">
            <button
              onClick={() => setShowAgentSelector(!showAgentSelector)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors shadow-sm"
            >
              <div
                className={`w-5 h-5 rounded-md bg-gradient-to-br ${currentAgent.color} flex items-center justify-center`}
              >
                <currentAgent.icon className="w-3 h-3 text-white" />
              </div>
              <span className="hidden sm:inline text-gray-700 dark:text-gray-300">
                {tr.selectAgent}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showAgentSelector ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showAgentSelector && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAgentSelector(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-2 space-y-0.5">
                      {AGENTS.map((agent) => {
                        const name =
                          tr[`agent${agent.key.charAt(0).toUpperCase()}${agent.key.slice(1)}` as keyof typeof tr];
                        const desc =
                          tr[`agent${agent.key.charAt(0).toUpperCase()}${agent.key.slice(1)}Desc` as keyof typeof tr];
                        const isActive = scope === agent.key;
                        return (
                          <button
                            key={agent.key}
                            onClick={() => {
                              setScope(agent.key);
                              setShowAgentSelector(false);
                            }}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                              isActive
                                ? `${agent.bg} ring-1 ring-inset ring-gray-200 dark:ring-zinc-600`
                                : "hover:bg-gray-50 dark:hover:bg-zinc-700/60"
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-sm`}
                            >
                              <agent.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                {name}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {desc}
                              </p>
                            </div>
                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Clear */}
          <button
            onClick={clearChat}
            className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shadow-sm"
            title={tr.clearChat}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        {/* Messages */}
        <div ref={boxRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Welcome state — show before any user message */}
          {!hasConversation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <Image
                src="/rowi-logo.png"
                alt="Rowi"
                width={120}
                height={120}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-lg mb-5"
              />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {agentName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                {msgs[0]?.text}
              </p>

              {/* Suggestion cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full max-w-lg">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="group px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/60 text-left text-sm text-gray-700 dark:text-gray-300 hover:border-[var(--rowi-g2)] hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm hover:shadow"
                  >
                    <span className="text-[var(--rowi-g2)] mr-1.5">›</span>
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message bubbles — skip welcome msg when showing the welcome hero */}
          {hasConversation && (
            <AnimatePresence>
              {msgs.map((m, i) => (
                <RowiMessage
                  key={i}
                  role={m.role}
                  text={m.text}
                  timestamp={m.timestamp}
                  agentColor={currentAgent.color}
                  lang={lang}
                />
              ))}
            </AnimatePresence>
          )}

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5"
            >
              <Image
                src="/rowi-logo.png"
                alt="Rowi"
                width={32}
                height={32}
                className="w-8 h-8 rounded-xl object-cover shadow-sm flex-shrink-0"
              />
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-md bg-gray-100 dark:bg-zinc-800">
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-1">{tr.thinking}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Inline suggestions (only visible after conversation starts) */}
        {hasConversation && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <Zap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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
        )}

        {/* Input bar */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus-within:ring-2 focus-within:ring-[var(--rowi-g2)]/20 focus-within:border-[var(--rowi-g2)] focus-within:bg-white dark:focus-within:bg-zinc-800 transition-all">
              <input
                ref={inputRef}
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
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className={`flex items-center justify-center w-11 h-11 rounded-xl font-medium text-white transition-all ${
                loading || !input.trim()
                  ? "bg-gray-200 dark:bg-zinc-700 cursor-not-allowed text-gray-400"
                  : "bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] hover:shadow-lg hover:scale-[1.04] active:scale-[0.97]"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI footer */}
      {aiInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center justify-center gap-4 text-[11px] text-gray-400 dark:text-gray-500"
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
  );
}

/* ================================================================
   💬 Message Bubble
   ================================================================ */
function RowiMessage({
  role,
  text,
  timestamp,
  agentColor,
  lang,
}: {
  role: "user" | "rowi";
  text: string;
  timestamp: Date;
  agentColor: string;
  lang: string;
}) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>
      ) : (
        <Image
          src="/rowi-logo.png"
          alt="Rowi"
          width={32}
          height={32}
          className="w-8 h-8 rounded-xl object-cover shadow-sm flex-shrink-0"
        />
      )}

      {/* Bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 ${
          isUser
            ? "rounded-2xl rounded-br-md bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white shadow-sm"
            : "rounded-2xl rounded-bl-md bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
        }`}
      >
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{text}</div>
        <div className={`mt-1.5 text-[10px] ${isUser ? "text-white/50" : "text-gray-400 dark:text-gray-500"}`}>
          {timestamp.toLocaleTimeString(lang === "es" ? "es-ES" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
