"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Bot, Send, Sparkles, User, Heart, Brain,
  Target, Lightbulb, Shield, Building2, TrendingUp, Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   TP Coach — AI-Powered EQ Coach with TP Context
   Uses TP benchmark data for personalized coaching
========================================================= */

const DEMO_CONVERSATION = {
  es: [
    {
      role: "assistant",
      content: "¡Bienvenido a Rowi Coach para Teleperformance! 👋 Soy tu coach de inteligencia emocional con IA, entrenado con los datos SEI de TP. Puedo ayudarte a desarrollar tus competencias de IE, navegar los desafíos del entorno laboral y alcanzar tus metas de crecimiento.\n\nComo miembro del equipo TP, tengo acceso a los benchmarks de IE de tu organización (IE promedio: 98.7 en 14,886 evaluaciones) para darte coaching contextualizado.\n\n¿Cómo puedo ayudarte hoy?",
    },
  ],
  en: [
    {
      role: "assistant",
      content: "Welcome to Rowi Coach for Teleperformance! 👋 I'm your AI emotional intelligence coach, trained on TP's SEI data. I can help you develop your EQ competencies, navigate workplace challenges, and achieve your growth goals.\n\nAs a TP team member, I have access to your organization's EQ benchmarks (avg EQ: 98.7 across 14,886 assessments) so I can give you contextual coaching.\n\nHow can I help you today?",
    },
  ],
};

const DEMO_RESPONSES = {
  es: [
    "¡Gran pregunta! Según los datos benchmark de TP, Navegar Emociones (NE) es la competencia con mayor margen de crecimiento a nivel global (promedio 96.8 vs. norma 100). Aquí tienes un ejercicio práctico:\n\n**La Pausa de 6 Segundos de TP:**\n1. Cuando sientas una emoción fuerte durante una interacción con un cliente, haz una pausa de 6 segundos\n2. Nombra la emoción (¿frustración? ¿ansiedad? ¿entusiasmo?)\n3. Pregúntate: '¿Qué me dice esta emoción sobre lo que es importante aquí?'\n4. Elige tu respuesta de forma intencional\n\nLos empleados de TP que practican esta técnica muestran una mejora del 15% en Navegar Emociones en 8 semanas. ¿Te gustaría que configure un recordatorio diario?",

    "¡El perfil Estratega de tu equipo es una verdadera fortaleza! Los Estrategas se destacan en ver el panorama general y tomar decisiones basadas en datos. Así puedes aprovecharlo:\n\n**Fortalezas a maximizar:**\n• Pensamiento Consecuente (ACT: 119.5 para los top performers)\n• Reconocer Patrones (RP: 116.8)\n\n**Oportunidad de crecimiento:**\nLos Estrategas a veces pasan por alto los matices emocionales. Practica la Empatía (EMP) dedicando 2 minutos antes de cada reunión a imaginar la perspectiva de la otra persona.\n\nLos datos de TP muestran que los Estrategas que desarrollan Empatía ven un aumento del 23% en las puntuaciones de satisfacción del equipo. ¿Quieres que cree un plan de crecimiento personalizado?",

    "¡Por supuesto! La inteligencia emocional intercultural es clave en TP con equipos en 42 países. Estos son los hallazgos principales de nuestros datos:\n\n**Patrones de IE por Región:**\n🇺🇸 Equipos NA: Los más altos en Pensamiento Consecuente (enfoque estructurado)\n🇵🇭 Equipos APAC: Fuertes en Empatía (cultura de relaciones primero)\n🇬🇧 Equipos EMEA: Equilibrados en todas las competencias\n🇲🇽 Equipos LATAM: Los más altos en Motivación Intrínseca (impulsados por la pasión)\n\n**Tip práctico:** Al comunicarte entre regiones, lidera con la competencia que más resuena en esa cultura. Por ejemplo, comienza con datos al hablar con NA, y comienza construyendo la relación con APAC.\n\n¿Quieres que analice un desafío específico de comunicación intercultural?",

    "Aquí tienes un ejercicio específico para TP basado en la competencia más fuerte de tu organización — Motivación Intrínseca (IM: 100.2):\n\n**El Ejercicio de Conexión con el Propósito de TP (10 min diarios):**\n\n1. **Reflexiona (3 min):** Escribe una interacción con un cliente de hoy que se sintió significativa. ¿Qué la hizo importar?\n\n2. **Conecta (3 min):** ¿Cómo se conecta esto con la misión de TP de ofrecer experiencias excepcionales al cliente? ¿Cómo se conecta con TUS valores personales?\n\n3. **Amplifica (4 min):** Identifica una acción que puedas tomar mañana para crear más de estos momentos significativos.\n\nLas investigaciones muestran que los empleados de TP que puntúan por encima de 105 en IM tienen tasas de retención 28% más altas y puntuaciones de satisfacción del cliente 19% superiores. ¡Este ejercicio fortalece ese músculo! 💪\n\n¿Listo para intentarlo ahora?",
  ],
  en: [
    "Great question! Based on TP's benchmark data, Navigate Emotions (NE) is actually the competency with the most room for growth globally (avg 96.8 vs. 100 norm). Here's a practical exercise:\n\n**The TP 6-Second Pause:**\n1. When you feel a strong emotion during a customer interaction, pause for 6 seconds\n2. Name the emotion (frustrated? anxious? excited?)\n3. Consider: 'What does this emotion tell me about what's important here?'\n4. Choose your response intentionally\n\nTP employees who practice this technique show 15% improvement in Navigate Emotions within 8 weeks. Would you like me to set up a daily reminder?",

    "Your team's Strategist profile is a real strength! Strategists excel at seeing the big picture and making data-driven decisions. Here's how to leverage it:\n\n**Strengths to maximize:**\n• Consequential Thinking (ACT: 119.5 for top performers)\n• Pattern Recognition (RP: 116.8)\n\n**Growth opportunity:**\nStrategists can sometimes overlook emotional nuances. Try practicing Empathy (EMP) by spending 2 minutes before each meeting imagining the other person's perspective.\n\nTP data shows that Strategists who develop Empathy see a 23% boost in team satisfaction scores. Shall I create a personalized growth plan?",

    "Absolutely! Cross-cultural emotional intelligence is crucial at TP with teams across 42 countries. Here are the key insights from our data:\n\n**Regional EQ Patterns:**\n🇺🇸 NA teams: Highest in Consequential Thinking (structured approach)\n🇵🇭 APAC teams: Strong in Empathy (relationship-first culture)\n🇬🇧 EMEA teams: Balanced across all competencies\n🇲🇽 LATAM teams: Highest in Intrinsic Motivation (passion-driven)\n\n**Practical tip:** When communicating across regions, lead with the competency that resonates most in that culture. For example, start with data when talking to NA, and start with relationship-building for APAC.\n\nWant me to analyze a specific cross-cultural communication challenge?",

    "Here's a TP-specific exercise based on your organization's strongest competency — Intrinsic Motivation (IM: 100.2):\n\n**The TP Purpose Connection Exercise (10 min daily):**\n\n1. **Reflect (3 min):** Write down one customer interaction from today that felt meaningful. What made it matter?\n\n2. **Connect (3 min):** How does this connect to TP's mission of delivering exceptional customer experiences? How does it connect to YOUR personal values?\n\n3. **Amplify (4 min):** Identify one action you can take tomorrow to create more of these meaningful moments.\n\nResearch shows that TP employees who score above 105 in IM have 28% higher retention rates and 19% higher customer satisfaction scores. This exercise builds that muscle! 💪\n\nReady to try it now?",
  ],
};

const SUGGESTED_PROMPTS = {
  es: [
    { icon: Heart, text: "¿Cómo puedo manejar el estrés en roles de atención al cliente?" },
    { icon: Brain, text: "Explícame la distribución de estilos cerebrales de TP" },
    { icon: Target, text: "Ayúdame a crear un plan de desarrollo de IE para mi equipo" },
    { icon: Lightbulb, text: "Dame un ejercicio de IE específico para TP" },
    { icon: TrendingUp, text: "¿Cómo se diferencian los top performers en IE?" },
    { icon: Zap, text: "Tips para la comunicación intercultural en TP" },
  ],
  en: [
    { icon: Heart, text: "How can I manage stress in customer-facing roles?" },
    { icon: Brain, text: "Explain TP's brain style distribution" },
    { icon: Target, text: "Help me build a team EQ development plan" },
    { icon: Lightbulb, text: "Give me a TP-specific EQ exercise" },
    { icon: TrendingUp, text: "How do top performers differ in EQ?" },
    { icon: Zap, text: "Tips for cross-cultural communication at TP" },
  ],
};

/* =========================================================
   Translations
========================================================= */
const translations = {
  es: {
    back: "TP Hub",
    badge: "AI Coach",
    title: "Rowi Coach — Edición TP",
    subtitle: "Tu coach de inteligencia emocional con IA, contextualizado con datos benchmark de Teleperformance de 14,886 evaluaciones SEI",

    chatTitle: "Rowi Coach — TP",
    chatStatus: "En línea • 14,886 evaluaciones cargadas",
    suggestedTitle: "Prueba preguntando...",
    inputPlaceholder: "Pregúntale a Rowi Coach lo que quieras...",

    featuresTitle: "Capacidades del Coach",
    feature1: "Coaching personalizado basado en tu perfil SEI y benchmarks de TP",
    feature2: "Acceso a insights de 14,886 evaluaciones para asesoría contextualizada",
    feature3: "Guía de IE intercultural en 42 países",
    feature4: "Ejercicios y técnicas de crecimiento específicos por estilo cerebral",
    feature5: "Seguimiento de progreso en tiempo real contra los top performers de TP",
    feature6: "Disponible 24/7 con conversaciones de coaching ilimitadas",

    infoTitle: "Coaching Contextualizado para TP",
    infoDesc: "Rowi Coach utiliza datos benchmark agregados de TP (14,886 evaluaciones, 42 países) para proporcionar coaching de IE contextualizado y específico para tu organización.",

    statsTitle: "Datos Rápidos de TP",
    statsGlobalEQ: "IE Promedio Global",
    statsTopComp: "Competencia Top",
    statsGrowthArea: "Área de Crecimiento",
    statsTopBrain: "Estilo Cerebral Top",

    prevNav: "ECO",
    nextNav: "Comunidad",
  },
  en: {
    back: "TP Hub",
    badge: "AI Coach",
    title: "Rowi Coach — TP Edition",
    subtitle: "Your AI emotional intelligence coach, contextualized with Teleperformance benchmark data from 14,886 SEI assessments",

    chatTitle: "Rowi Coach — TP",
    chatStatus: "Online • 14,886 assessments loaded",
    suggestedTitle: "Try asking...",
    inputPlaceholder: "Ask Rowi Coach anything...",

    featuresTitle: "Coach Capabilities",
    feature1: "Personalized coaching based on your SEI profile and TP benchmarks",
    feature2: "Access to 14,886 assessment insights for contextualized advice",
    feature3: "Cross-cultural EQ guidance across 42 countries",
    feature4: "Brain style-specific growth exercises and techniques",
    feature5: "Real-time progress tracking against TP top performers",
    feature6: "Available 24/7 with unlimited coaching conversations",

    infoTitle: "TP-Contextualized Coaching",
    infoDesc: "Rowi Coach uses aggregated TP benchmark data (14,886 assessments, 42 countries) to provide contextual EQ coaching specific to your organization.",

    statsTitle: "TP Quick Stats",
    statsGlobalEQ: "Global EQ Avg",
    statsTopComp: "Top Competency",
    statsGrowthArea: "Growth Area",
    statsTopBrain: "Top Brain Style",

    prevNav: "ECO",
    nextNav: "Community",
  },
};

/* Components */
function ChatMessage({ message, isUser }: { message: { role: string; content: string }; isUser: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-purple-500/20" : "bg-gradient-to-br from-blue-500 to-cyan-500"}`}>
        {isUser ? <User className="w-5 h-5 text-purple-500" /> : <Image src="/rowivectors/Rowi-06.png" alt="Rowi" width={32} height={32} className="object-contain" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "bg-purple-500 text-white rounded-tr-sm" : "bg-gray-100 dark:bg-zinc-800 rounded-tl-sm"}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}

/* Main Page */
export default function TPCoachPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const [messages, setMessages] = useState(DEMO_CONVERSATION[lang as keyof typeof DEMO_CONVERSATION] || DEMO_CONVERSATION.es);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const responses = DEMO_RESPONSES[lang as keyof typeof DEMO_RESPONSES] || DEMO_RESPONSES.es;
  const prompts = SUGGESTED_PROMPTS[lang as keyof typeof SUGGESTED_PROMPTS] || SUGGESTED_PROMPTS.es;
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
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500 mb-3">
          <Sparkles className="w-3 h-3" /> {t.badge}
        </span>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-500" /> {t.title}
        </h1>
        <p className="text-[var(--rowi-muted)]">{t.subtitle}</p>
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
                <Image src="/rowivectors/Rowi-06.png" alt="Rowi" width={40} height={40} className="object-contain" />
              </div>
              <div className="text-white">
                <h3 className="font-bold">{t.chatTitle}</h3>
                <p className="text-sm text-white/80 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" /> {t.chatStatus}
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
                    <Image src="/rowivectors/Rowi-06.png" alt="Rowi" width={32} height={32} />
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
                <p className="text-xs text-[var(--rowi-muted)] mb-2">{t.suggestedTitle}</p>
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
                  onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder={t.inputPlaceholder}
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
            <h2 className="text-lg font-bold mb-4">{t.featuresTitle}</h2>
            <ul className="space-y-3">
              {[t.feature1, t.feature2, t.feature3, t.feature4, t.feature5, t.feature6].map((feature, i) => (
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
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">{t.infoTitle}</h3>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t.infoDesc}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">{t.statsTitle}</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-white/80 text-sm">{t.statsGlobalEQ}</span><span className="font-bold">98.7</span></div>
              <div className="flex justify-between"><span className="text-white/80 text-sm">{t.statsTopComp}</span><span className="font-bold">IM (100.2)</span></div>
              <div className="flex justify-between"><span className="text-white/80 text-sm">{t.statsGrowthArea}</span><span className="font-bold">NE (96.8)</span></div>
              <div className="flex justify-between"><span className="text-white/80 text-sm">{t.statsTopBrain}</span><span className="font-bold">Scientist (19%)</span></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/eco" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-blue-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t.prevNav}
        </Link>
        <Link href="/hub/admin/tp/community" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t.nextNav} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
