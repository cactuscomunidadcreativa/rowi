"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mic, Paperclip, MessageCircle, Sparkles, Heart, ArrowRight } from "lucide-react";
import { registerUsage } from "@/ai/client/registerUsage";
import { useSession } from "next-auth/react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   📦 Tipos
========================================================= */
type Message = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  audioUrl?: string;
};

type Attachment = { name: string; type: string; data: string };

const uid = () => Math.random().toString(36).slice(2, 9);

/* =========================================================
   🌍 Contenido Demo por idioma
========================================================= */
const DEMO_CONTENT = {
  es: {
    greeting: "¡Hola! Soy Rowi, tu compañero de inteligencia emocional.",
    intro: "Las emociones son el motor de nuestras decisiones, relaciones y bienestar. Comprenderlas es el primer paso para vivir una vida más plena.",
    question: "¿Sabías que desarrollar tu inteligencia emocional puede mejorar tu comunicación, reducir el estrés y fortalecer tus relaciones?",
    invitation: "Me encantaría acompañarte en este viaje. Crea tu cuenta gratuita y juntos exploraremos tu mundo emocional.",
    cta: "Comenzar mi viaje",
    ctaLogin: "Ya tengo cuenta",
    placeholder: "Escribe un mensaje...",
    typingText: "Rowi está escribiendo...",
  },
  en: {
    greeting: "Hi! I'm Rowi, your emotional intelligence companion.",
    intro: "Emotions are the engine of our decisions, relationships, and wellbeing. Understanding them is the first step to living a fuller life.",
    question: "Did you know that developing your emotional intelligence can improve your communication, reduce stress, and strengthen your relationships?",
    invitation: "I'd love to accompany you on this journey. Create your free account and together we'll explore your emotional world.",
    cta: "Start my journey",
    ctaLogin: "I have an account",
    placeholder: "Type a message...",
    typingText: "Rowi is typing...",
  },
};

/* =========================================================
   💬 COMPONENTE PRINCIPAL
========================================================= */
export default function RowiCoach() {
  const { data: session } = useSession();
  const { lang } = useI18n();
  const content = DEMO_CONTENT[lang as keyof typeof DEMO_CONTENT] || DEMO_CONTENT.es;

  /* =========================================================
     🔥 ESTADOS
  ========================================================== */
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [recording, setRecording] = React.useState(false);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [typing, setTyping] = React.useState(false);
  const [playing, setPlaying] = React.useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = React.useState<HTMLAudioElement | null>(null);
  const [demoStep, setDemoStep] = React.useState(0);
  const [showDemoTyping, setShowDemoTyping] = React.useState(false);

  const isLoggedIn = !!session?.user?.email;
  const userName = session?.user?.name || "Usuario";
  const tenantId = session?.user?.primaryTenantId || "rowi-master";
  const ENABLED = process.env.NEXT_PUBLIC_ROWICOACH_ENABLED === "true";
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  /* =========================================================
     🔁 EFFECTS
  ========================================================== */

  // Auto-scroll a nuevos mensajes
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showDemoTyping]);

  // Persistencia para usuarios logueados
  React.useEffect(() => {
    if (isLoggedIn) {
      const saved = localStorage.getItem("rowiCoachHistory");
      if (saved) setMessages(JSON.parse(saved));
    }
  }, [isLoggedIn]);

  React.useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem("rowiCoachHistory", JSON.stringify(messages));
    }
  }, [messages, isLoggedIn]);

  // Simulación de conversación demo
  React.useEffect(() => {
    if (!isLoggedIn && open && demoStep === 0) {
      // Iniciar secuencia demo
      simulateDemoConversation();
    }
  }, [open, isLoggedIn]);

  async function simulateDemoConversation() {
    // Paso 1: Saludo
    setShowDemoTyping(true);
    await delay(1500);
    setShowDemoTyping(false);
    setMessages([{ id: uid(), role: "assistant", text: content.greeting }]);
    setDemoStep(1);

    // Paso 2: Introducción sobre emociones
    await delay(2000);
    setShowDemoTyping(true);
    await delay(2000);
    setShowDemoTyping(false);
    setMessages(prev => [...prev, { id: uid(), role: "assistant", text: content.intro }]);
    setDemoStep(2);

    // Paso 3: Pregunta reflexiva
    await delay(2500);
    setShowDemoTyping(true);
    await delay(1500);
    setShowDemoTyping(false);
    setMessages(prev => [...prev, { id: uid(), role: "assistant", text: content.question }]);
    setDemoStep(3);

    // Paso 4: Invitación
    await delay(3000);
    setShowDemoTyping(true);
    await delay(2000);
    setShowDemoTyping(false);
    setMessages(prev => [...prev, { id: uid(), role: "assistant", text: content.invitation }]);
    setDemoStep(4);
  }

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* =========================================================
     🎙️ AUDIO — START / STOP
  ========================================================== */
  async function startRecording() {
    if (!isLoggedIn) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/mp3" });
        const buf = new Uint8Array(await blob.arrayBuffer());
        const base64 = btoa(String.fromCharCode(...buf));

        setMessages((m) => [...m, { id: uid(), role: "user", audioUrl: `data:audio/mp3;base64,${base64}` }]);
        await sendMessage({ audio: base64 });
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch {
      alert(lang === "en" ? "Could not access the microphone." : "No se pudo acceder al micrófono.");
    }
  }

  function stopRecording() {
    mediaRecorder?.stop();
    setRecording(false);
  }

  /* =========================================================
     📎 ARCHIVOS
  ========================================================== */
  function handleAttachFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isLoggedIn) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachments((prev) => [...prev, { name: file.name, type: file.type, data: reader.result as string }]);
    };
    reader.readAsDataURL(file);
  }

  /* =========================================================
     🚀 ENVIAR MENSAJE
  ========================================================== */
  async function sendMessage(extra?: { audio?: string }) {
    if (!isLoggedIn) return;

    const text = input.trim();
    if (!text && !extra?.audio) return;

    if (text) setMessages((m) => [...m, { id: uid(), role: "user", text }]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/rowi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "super",
          ask: text,
          audio: extra?.audio || null,
          tenantId,
          locale: lang,
          a: userName,
          attachments,
        }),
      });

      const json = await res.json();

      const reply: Message = {
        id: uid(),
        role: "assistant",
        text: json?.text || "...",
        audioUrl: json?.audioUrl || undefined,
      };

      setMessages((m) => [...m, reply]);
      setAttachments([]);

      await registerUsage({
        tenantId,
        feature: "ROWI_COACH",
        model: json.model || "gpt-4o-mini",
        tokensInput: 0,
        tokensOutput: 0,
      });
    } catch (e) {
      console.error("[RowiCoach] Error:", e);
      setMessages((m) => [...m, { id: uid(), role: "assistant", text: "Error procesando tu mensaje." }]);
    } finally {
      setTyping(false);
    }
  }

  /* =========================================================
     🎧 AUDIO — PLAYBACK
  ========================================================== */
  function playAudio(url?: string, id?: string) {
    if (!url) return;

    if (audioPlayer && playing === id) {
      audioPlayer.pause();
      setPlaying(null);
      return;
    }

    if (audioPlayer) audioPlayer.pause();

    const audio = new Audio(url);
    setAudioPlayer(audio);
    setPlaying(id || null);
    audio.play();

    audio.onended = () => {
      setAudioPlayer(null);
      setPlaying(null);
    };
  }

  /* =========================================================
     💬 UI
  ========================================================== */

  // Botón flotante
  const FloatingButton = (
    <motion.button
      onClick={() => setOpen(!open)}
      className="fixed bottom-5 right-5 z-50 group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />

        {/* Button */}
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center shadow-xl overflow-hidden">
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Image
              src="/rowivectors/Rowi-06.png"
              alt="Rowi"
              width={48}
              height={48}
              className="object-contain"
            />
          )}
        </div>

        {/* Notification dot for demo */}
        {!isLoggedIn && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>
    </motion.button>
  );

  if (!open) return FloatingButton;

  return (
    <>
      {FloatingButton}

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-5 w-[380px] max-w-[92vw] rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shadow-2xl z-50 overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)]">
            <div className="relative w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              <Image
                src="/rowivectors/Rowi-06.png"
                alt="Rowi"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white">Rowi Coach</h3>
              <p className="text-xs text-white/80">
                {isLoggedIn
                  ? (lang === "en" ? "Your EI companion" : "Tu compañero de IE")
                  : (lang === "en" ? "Emotional Intelligence" : "Inteligencia Emocional")}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* MENSAJES */}
          <div className="flex-1 max-h-[350px] overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-zinc-950">
            {messages.length === 0 && !showDemoTyping && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-[var(--rowi-g1)]/20 to-[var(--rowi-g2)]/20 flex items-center justify-center">
                  <Image
                    src="/rowivectors/Rowi-06.png"
                    alt="Rowi"
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {lang === "en"
                    ? "Start a conversation with Rowi"
                    : "Inicia una conversación con Rowi"}
                </p>
              </div>
            )}

            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center mr-2 flex-shrink-0">
                    <Image
                      src="/rowivectors/Rowi-06.png"
                      alt="Rowi"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white"
                      : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 shadow-sm"
                  }`}
                >
                  {m.text}
                  {m.audioUrl && (
                    <button
                      onClick={() => playAudio(m.audioUrl!, m.id)}
                      className={`mt-2 text-xs flex items-center gap-1 ${playing === m.id ? "text-[var(--rowi-g2)]" : "opacity-70 hover:opacity-100"}`}
                    >
                      {playing === m.id ? "Pause" : "Play"}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {(typing || showDemoTyping) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center">
                  <Image
                    src="/rowivectors/Rowi-06.png"
                    alt="Rowi"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* CTA para usuarios no logueados */}
          {!isLoggedIn && demoStep >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-[var(--rowi-g1)]/10 to-[var(--rowi-g2)]/10 border-t border-gray-200 dark:border-zinc-800"
            >
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-5 h-5" />
                {content.cta}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full mt-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[var(--rowi-g2)] transition-colors"
              >
                {content.ctaLogin}
              </Link>
            </motion.div>
          )}

          {/* INPUT (solo para usuarios logueados) */}
          {isLoggedIn && (
            <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`p-2.5 rounded-full transition-all ${
                  recording
                    ? "bg-red-500 text-white animate-pulse"
                    : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>

              <label className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 cursor-pointer">
                <Paperclip className="w-5 h-5" />
                <input type="file" className="hidden" onChange={handleAttachFile} />
              </label>

              <input
                type="text"
                placeholder={content.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--rowi-g2)] transition-all"
              />

              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="p-2.5 rounded-full bg-gradient-to-r from-[var(--rowi-g2)] to-[var(--rowi-g1)] text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Input deshabilitado para demo */}
          {!isLoggedIn && demoStep < 4 && (
            <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950">
              <input
                type="text"
                placeholder={content.placeholder}
                disabled
                className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded-xl px-4 py-2.5 text-sm outline-none opacity-50 cursor-not-allowed"
              />
              <button
                disabled
                className="p-2.5 rounded-full bg-gray-300 dark:bg-zinc-700 text-gray-500 cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
