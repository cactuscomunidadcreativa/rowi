"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Bot, Send, Sparkles, User, Heart, Brain,
  Target, Lightbulb, Shield, TrendingUp, Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   TP Coach — AI-Powered EQ Coach with TP Context
   Uses TP benchmark data for personalized coaching
========================================================= */

type Translate = (key: string, fallback: string) => string;

function buildDemoConversation(t: Translate): { role: string; content: string }[] {
  return [
    {
      role: "assistant",
      content: t(
        "tpCoach.demoWelcome",
        "¡Bienvenido a Rowi Coach para Teleperformance! 👋 Soy tu coach de inteligencia emocional con IA, entrenado con los datos SEI de TP. Puedo ayudarte a desarrollar tus competencias de IE, navegar los desafíos del entorno laboral y alcanzar tus metas de crecimiento.\n\nComo miembro del equipo TP, tengo acceso a los benchmarks de IE de tu organización (IE promedio: 98.7 en 14,886 evaluaciones) para darte coaching contextualizado.\n\n¿Cómo puedo ayudarte hoy?",
      ),
    },
  ];
}

function buildDemoResponses(t: Translate): string[] {
  return [
    t(
      "tpCoach.demoResponse1",
      "¡Gran pregunta! Según los datos benchmark de TP, Navegar Emociones (NE) es la competencia con mayor margen de crecimiento a nivel global (promedio 96.8 vs. norma 100). Aquí tienes un ejercicio práctico:\n\n**La Pausa de 6 Segundos de TP:**\n1. Cuando sientas una emoción fuerte durante una interacción con un cliente, haz una pausa de 6 segundos\n2. Nombra la emoción (¿frustración? ¿ansiedad? ¿entusiasmo?)\n3. Pregúntate: '¿Qué me dice esta emoción sobre lo que es importante aquí?'\n4. Elige tu respuesta de forma intencional\n\nLos empleados de TP que practican esta técnica muestran una mejora del 15% en Navegar Emociones en 8 semanas. ¿Te gustaría que configure un recordatorio diario?",
    ),
    t(
      "tpCoach.demoResponse2",
      "¡El perfil Estratega de tu equipo es una verdadera fortaleza! Los Estrategas se destacan en ver el panorama general y tomar decisiones basadas en datos. Así puedes aprovecharlo:\n\n**Fortalezas a maximizar:**\n• Pensamiento Consecuente (ACT: 119.5 para los top performers)\n• Reconocer Patrones (RP: 116.8)\n\n**Oportunidad de crecimiento:**\nLos Estrategas a veces pasan por alto los matices emocionales. Practica la Empatía (EMP) dedicando 2 minutos antes de cada reunión a imaginar la perspectiva de la otra persona.\n\nLos datos de TP muestran que los Estrategas que desarrollan Empatía ven un aumento del 23% en las puntuaciones de satisfacción del equipo. ¿Quieres que cree un plan de crecimiento personalizado?",
    ),
    t(
      "tpCoach.demoResponse3",
      "¡Por supuesto! La inteligencia emocional intercultural es clave en TP con equipos en 42 países. Estos son los hallazgos principales de nuestros datos:\n\n**Patrones de IE por Región:**\n🇺🇸 Equipos NA: Los más altos en Pensamiento Consecuente (enfoque estructurado)\n🇵🇭 Equipos APAC: Fuertes en Empatía (cultura de relaciones primero)\n🇬🇧 Equipos EMEA: Equilibrados en todas las competencias\n🇲🇽 Equipos LATAM: Los más altos en Motivación Intrínseca (impulsados por la pasión)\n\n**Tip práctico:** Al comunicarte entre regiones, lidera con la competencia que más resuena en esa cultura. Por ejemplo, comienza con datos al hablar con NA, y comienza construyendo la relación con APAC.\n\n¿Quieres que analice un desafío específico de comunicación intercultural?",
    ),
    t(
      "tpCoach.demoResponse4",
      "Aquí tienes un ejercicio específico para TP basado en la competencia más fuerte de tu organización — Motivación Intrínseca (IM: 100.2):\n\n**El Ejercicio de Conexión con el Propósito de TP (10 min diarios):**\n\n1. **Reflexiona (3 min):** Escribe una interacción con un cliente de hoy que se sintió significativa. ¿Qué la hizo importar?\n\n2. **Conecta (3 min):** ¿Cómo se conecta esto con la misión de TP de ofrecer experiencias excepcionales al cliente? ¿Cómo se conecta con TUS valores personales?\n\n3. **Amplifica (4 min):** Identifica una acción que puedas tomar mañana para crear más de estos momentos significativos.\n\nLas investigaciones muestran que los empleados de TP que puntúan por encima de 105 en IM tienen tasas de retención 28% más altas y puntuaciones de satisfacción del cliente 19% superiores. ¡Este ejercicio fortalece ese músculo! 💪\n\n¿Listo para intentarlo ahora?",
    ),
  ];
}

function buildSuggestedPrompts(t: Translate): { icon: typeof Heart; text: string }[] {
  return [
    { icon: Heart, text: t("tpCoach.prompt1", "¿Cómo puedo manejar el estrés en roles de atención al cliente?") },
    { icon: Brain, text: t("tpCoach.prompt2", "Explícame la distribución de estilos cerebrales de TP") },
    { icon: Target, text: t("tpCoach.prompt3", "Ayúdame a crear un plan de desarrollo de IE para mi equipo") },
    { icon: Lightbulb, text: t("tpCoach.prompt4", "Dame un ejercicio de IE específico para TP") },
    { icon: TrendingUp, text: t("tpCoach.prompt5", "¿Cómo se diferencian los top performers en IE?") },
    { icon: Zap, text: t("tpCoach.prompt6", "Tips para la comunicación intercultural en TP") },
  ];
}

/* Components */
function ChatMessage({ message, isUser }: { message: { role: string; content: string }; isUser: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-purple-500/20" : "bg-gradient-to-br from-blue-500 to-cyan-500"}`}>
        {isUser ? <User className="w-5 h-5 text-purple-500" /> : <Image src="/rowivectors/Rowi-06.webp" alt="Rowi" width={32} height={32} className="object-contain" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "bg-purple-500 text-white rounded-tr-sm" : "bg-gray-100 dark:bg-zinc-800 rounded-tl-sm"}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}

/* Main Page */
export default function TPCoachPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState(() => buildDemoConversation(t));
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const responses = buildDemoResponses(t);
  const prompts = buildSuggestedPrompts(t);
  const [responseIndex, setResponseIndex] = useState(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: responses[responseIndex % responses.length] }]);
      setResponseIndex((prev) => prev + 1);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("tpCoach.back", "TP Hub")}
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500 mb-3">
          <Sparkles className="w-3 h-3" /> {t("tpCoach.badge", "Guía")}
        </span>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-500" /> {t("tpCoach.title", "Rowi Coach — Edición TP")}
        </h1>
        <p className="text-[var(--rowi-muted)]">{t("tpCoach.subtitle", "Tu coach de inteligencia emocional con IA, contextualizado con datos benchmark de Teleperformance de 14,886 evaluaciones SEI")}</p>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-800 overflow-hidden flex flex-col" style={{ height: "650px" }}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Image src="/rowivectors/Rowi-06.webp" alt="Rowi" width={40} height={40} className="object-contain" />
              </div>
              <div className="text-white">
                <h3 className="font-bold">{t("tpCoach.chatTitle", "Rowi Coach — TP")}</h3>
                <p className="text-sm text-white/80 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" /> {t("tpCoach.chatStatus", "En línea • 14,886 evaluaciones cargadas")}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <ChatMessage key={i} message={msg} isUser={msg.role === "user"} />
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Image src="/rowivectors/Rowi-06.webp" alt="Rowi" width={32} height={32} />
                  </div>
                  <div className="bg-gray-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Prompts */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-[var(--rowi-muted)] mb-2">{t("tpCoach.suggestedTitle", "Prueba preguntando...")}</p>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((prompt, i) => {
                    const Icon = prompt.icon;
                    return (
                      <button key={i} onClick={() => handleSend(prompt.text)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                        <Icon className="w-3 h-3" />{prompt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder={t("tpCoach.inputPlaceholder", "Pregúntale a Rowi Coach lo que quieras...")}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500 outline-none" />
                <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Features */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold mb-4">{t("tpCoach.featuresTitle", "Capacidades del Coach")}</h2>
            <ul className="space-y-3">
              {[
                t("tpCoach.feature1", "Coaching personalizado basado en tu perfil SEI y benchmarks de TP"),
                t("tpCoach.feature2", "Acceso a insights de 14,886 evaluaciones para asesoría contextualizada"),
                t("tpCoach.feature3", "Guía de IE intercultural en 42 países"),
                t("tpCoach.feature4", "Ejercicios y técnicas de crecimiento específicos por estilo cerebral"),
                t("tpCoach.feature5", "Seguimiento de progreso en tiempo real contra los top performers de TP"),
                t("tpCoach.feature6", "Disponible 24/7 con conversaciones de coaching ilimitadas"),
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
            <div className="flex gap-4">
              <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">{t("tpCoach.infoTitle", "Coaching Contextualizado para TP")}</h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t("tpCoach.infoDesc", "Rowi Coach utiliza datos benchmark agregados de TP (14,886 evaluaciones, 42 países) para proporcionar coaching de IE contextualizado y específico para tu organización.")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">{t("tpCoach.statsTitle", "Datos Rápidos de TP")}</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-white/80 text-sm">{t("tpCoach.statsGlobalEQ", "IE Promedio Global")}</span><span className="font-bold">98.7</span></div>
              <div className="flex justify-between"><span className="text-white/80 text-sm">{t("tpCoach.statsTopComp", "Competencia Top")}</span><span className="font-bold">IM (100.2)</span></div>
              <div className="flex justify-between"><span className="text-white/80 text-sm">{t("tpCoach.statsGrowthArea", "Área de Crecimiento")}</span><span className="font-bold">NE (96.8)</span></div>
              <div className="flex justify-between"><span className="text-white/80 text-sm">{t("tpCoach.statsTopBrain", "Estilo Cerebral Top")}</span><span className="font-bold">Scientist (19%)</span></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/eco" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-blue-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t("tpCoach.prevNav", "ECO")}
        </Link>
        <Link href="/hub/admin/tp/community" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t("tpCoach.nextNav", "Comunidad")} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
