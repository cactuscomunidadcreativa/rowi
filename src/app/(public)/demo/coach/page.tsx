"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  Info,
  User,
  Heart,
  Brain,
  Target,
  Lightbulb,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Mensajes de ejemplo del chat
========================================================= */
const DEMO_CONVERSATION = {
  es: [
    {
      role: "assistant",
      content: "¡Hola! Soy Rowi, tu coach de inteligencia emocional. Estoy aquí para ayudarte a desarrollar tus habilidades emocionales y alcanzar tus metas. ¿Cómo te sientes hoy?",
    },
  ],
  en: [
    {
      role: "assistant",
      content: "Hi! I'm Rowi, your emotional intelligence coach. I'm here to help you develop your emotional skills and achieve your goals. How are you feeling today?",
    },
  ],
};

const DEMO_RESPONSES = {
  es: [
    "Entiendo lo que sientes. Es completamente normal experimentar esas emociones. Basándome en tu perfil SEI, veo que tienes fortaleza en la empatía. ¿Te gustaría explorar cómo usar esa habilidad para manejar esta situación?",
    "¡Excelente pregunta! Tu puntuación en 'Navegar Emociones' muestra que tienes buenas herramientas para esto. Te sugiero practicar la técnica de pausa de 6 segundos antes de reaccionar. ¿Quieres que te guíe?",
    "Veo que tu competencia en 'Pensamiento Consecuente' está en desarrollo. Esto es una oportunidad de crecimiento. Te propongo un ejercicio: antes de tomar decisiones, pregúntate '¿Cuáles son las posibles consecuencias de esto?' ¿Lo intentamos juntos?",
    "Tu progreso en las últimas semanas ha sido impresionante. Has mejorado un 12% en 'Ejercitar Optimismo'. ¡Sigue así! ¿Qué te gustaría trabajar hoy?",
  ],
  en: [
    "I understand what you're feeling. It's completely normal to experience those emotions. Based on your SEI profile, I see you have strength in empathy. Would you like to explore how to use that skill to handle this situation?",
    "Great question! Your 'Navigate Emotions' score shows you have good tools for this. I suggest practicing the 6-second pause technique before reacting. Would you like me to guide you?",
    "I see that your 'Consequential Thinking' competency is developing. This is a growth opportunity. I propose an exercise: before making decisions, ask yourself 'What are the possible consequences of this?' Shall we try it together?",
    "Your progress in the last few weeks has been impressive. You've improved 12% in 'Exercise Optimism'. Keep it up! What would you like to work on today?",
  ],
};

const SUGGESTED_PROMPTS = {
  es: [
    { icon: Heart, text: "¿Cómo puedo manejar mejor el estrés?" },
    { icon: Brain, text: "Explícame mis competencias SEI" },
    { icon: Target, text: "Ayúdame a establecer una meta emocional" },
    { icon: Lightbulb, text: "Dame un ejercicio de inteligencia emocional" },
  ],
  en: [
    { icon: Heart, text: "How can I manage stress better?" },
    { icon: Brain, text: "Explain my SEI competencies" },
    { icon: Target, text: "Help me set an emotional goal" },
    { icon: Lightbulb, text: "Give me an emotional intelligence exercise" },
  ],
};

/* =========================================================
   Traducciones
========================================================= */
const translations = {
  es: {
    badge: "Demo Interactivo",
    title: "Rowi Coach",
    subtitle: "Tu coach de inteligencia emocional disponible 24/7 para guiarte en tu crecimiento personal",
    back: "Volver al tour",
    prev: "Anterior: ECO",

    suggestedTitle: "Prueba preguntando...",
    inputPlaceholder: "Escribe tu mensaje...",
    send: "Enviar",

    featuresTitle: "Capacidades del Coach",
    feature1: "Respuestas personalizadas basadas en tu perfil SEI",
    feature2: "Ejercicios y técnicas de inteligencia emocional",
    feature3: "Seguimiento de tu progreso y evolución",
    feature4: "Disponible 24/7 sin límites de conversación",

    tipTitle: "Esto es un demo",
    tipDesc: "En tu cuenta real, Rowi conocerá tu perfil SEI completo y te dará recomendaciones verdaderamente personalizadas basadas en tus competencias y áreas de mejora.",

    createAccount: "Crear mi cuenta",
    finishTour: "Finalizar tour",
  },
  en: {
    badge: "Interactive Demo",
    title: "Rowi Coach",
    subtitle: "Your emotional intelligence coach available 24/7 to guide you in your personal growth",
    back: "Back to tour",
    prev: "Previous: ECO",

    suggestedTitle: "Try asking...",
    inputPlaceholder: "Type your message...",
    send: "Send",

    featuresTitle: "Coach Capabilities",
    feature1: "Personalized responses based on your SEI profile",
    feature2: "Emotional intelligence exercises and techniques",
    feature3: "Tracking of your progress and evolution",
    feature4: "Available 24/7 with no conversation limits",

    tipTitle: "This is a demo",
    tipDesc: "In your real account, Rowi will know your complete SEI profile and give you truly personalized recommendations based on your competencies and areas for improvement.",

    createAccount: "Create my account",
    finishTour: "Finish tour",
  },
};

/* =========================================================
   Componentes
========================================================= */
function ChatMessage({ message, isUser }: { message: { role: string; content: string }; isUser: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-[var(--rowi-primary)]/20"
            : "bg-gradient-to-br from-blue-500 to-cyan-500"
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-[var(--rowi-primary)]" />
        ) : (
          <Image
            src="/rowivectors/Rowi-06.png"
            alt="Rowi"
            width={32}
            height={32}
            className="object-contain"
          />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[var(--rowi-primary)] text-white rounded-tr-sm"
            : "bg-gray-100 dark:bg-zinc-800 rounded-tl-sm"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </motion.div>
  );
}

/* =========================================================
   Página principal
========================================================= */
export default function DemoCoachPage() {
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

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responses[responseIndex % responses.length] },
      ]);
      setResponseIndex((prev) => prev + 1);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen pt-16 pb-24 bg-[var(--rowi-background)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.back}
            </Link>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400 mb-4">
            <Sparkles className="w-3 h-3" />
            {t.badge}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-500" />
            {t.title}
          </h1>
          <p className="text-[var(--rowi-muted)] max-w-2xl">{t.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden flex flex-col"
              style={{ height: "600px" }}
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Image
                    src="/rowivectors/Rowi-06.png"
                    alt="Rowi"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div className="text-white">
                  <h3 className="font-bold">Rowi Coach</h3>
                  <p className="text-sm text-white/80">
                    {lang === "es" ? "En línea" : "Online"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <ChatMessage
                      key={i}
                      message={msg}
                      isUser={msg.role === "user"}
                    />
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Image
                        src="/rowivectors/Rowi-06.png"
                        alt="Rowi"
                        width={32}
                        height={32}
                      />
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
                        <button
                          key={i}
                          onClick={() => handleSend(prompt.text)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Icon className="w-3 h-3" />
                          {prompt.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-[var(--rowi-border)]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={t.inputPlaceholder}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Features */}
          <div className="space-y-6">
            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-4">{t.featuresTitle}</h2>
              <ul className="space-y-3">
                {[t.feature1, t.feature2, t.feature3, t.feature4].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Info Tip */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6"
            >
              <div className="flex gap-4">
                <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">{t.tipTitle}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{t.tipDesc}</p>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"
            >
              <h3 className="font-bold text-lg mb-2">
                {lang === "es" ? "¿Listo para comenzar?" : "Ready to start?"}
              </h3>
              <p className="text-sm text-white/80 mb-4">
                {lang === "es"
                  ? "Crea tu cuenta gratis y conoce a tu Rowi personal"
                  : "Create your free account and meet your personal Rowi"}
              </p>
              <Link
                href="/register"
                className="block w-full py-3 rounded-xl bg-white text-blue-500 font-semibold text-center hover:bg-opacity-90 transition-opacity"
              >
                {t.createAccount}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 mt-8 border-t border-[var(--rowi-border)]">
          <Link
            href="/demo/eco"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.prev}
          </Link>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t.createAccount}
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors font-medium"
            >
              {t.finishTour}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
