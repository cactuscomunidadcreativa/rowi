"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Info,
  Send,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Datos de ejemplo
========================================================= */
const DEMO_RECIPIENT = {
  name: "Carlos Ruiz",
  avatar: "/rowivectors/Rowi-05.png",
  brainStyle: "Innovator",
  brainStyleEs: "Innovador",
  preferredChannel: "email",
};

const DEMO_CHANNELS = [
  { key: "email", icon: Mail, label: "Email", labelEs: "Email" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp", labelEs: "WhatsApp" },
  { key: "sms", icon: Phone, label: "SMS", labelEs: "SMS" },
  { key: "chat", icon: MessageSquare, label: "Chat", labelEs: "Chat" },
];

const DEMO_MESSAGES = {
  es: {
    email: `Hola Carlos,

Espero que estés teniendo un excelente día. Me gustaría compartir contigo algunas ideas innovadoras sobre el nuevo proyecto que podrían emocionarte.

He estado pensando en cómo podríamos incorporar nuevas tecnologías que se alinean con tu visión de innovación. ¿Te gustaría agendar una llamada esta semana para explorar estas posibilidades juntos?

Creo que tu perspectiva creativa sería invaluable para dar forma a estas ideas.

¡Espero tu respuesta!`,
    whatsapp: `¡Hola Carlos! 👋

Tengo unas ideas geniales sobre el proyecto que creo te van a encantar 💡

¿Tienes un momento esta semana para una llamada rápida? Me encantaría conocer tu opinión como innovador del equipo 🚀`,
    sms: `Hola Carlos! Tengo ideas para el proyecto que te gustarán. ¿Hablamos esta semana?`,
    chat: `Hey Carlos! 🙌 Tengo algunas ideas innovadoras para el proyecto. Como siempre estás pensando en nuevas formas de hacer las cosas, creo que te va a interesar. ¿Tienes 15 min para hacer un call?`,
  },
  en: {
    email: `Hi Carlos,

I hope you're having a great day. I'd like to share some innovative ideas about the new project that might excite you.

I've been thinking about how we could incorporate new technologies that align with your vision for innovation. Would you like to schedule a call this week to explore these possibilities together?

I think your creative perspective would be invaluable in shaping these ideas.

Looking forward to your response!`,
    whatsapp: `Hi Carlos! 👋

I have some great ideas about the project that I think you'll love 💡

Do you have a moment this week for a quick call? I'd love to hear your opinion as the team's innovator 🚀`,
    sms: `Hi Carlos! I have project ideas you'll like. Can we talk this week?`,
    chat: `Hey Carlos! 🙌 I have some innovative ideas for the project. Since you're always thinking of new ways to do things, I think you'll be interested. Do you have 15 min for a call?`,
  },
};

/* =========================================================
   Traducciones
========================================================= */
const translations = {
  es: {
    badge: "Demo Interactivo",
    title: "ECO",
    titleFull: "Emotional Communication Optimizer",
    subtitle: "Optimiza tu comunicación emocional con mensajes adaptados a cada persona",
    back: "Volver al tour",
    prev: "Anterior: Affinity",
    next: "Siguiente: Rowi Coach",

    recipientTitle: "Destinatario",
    recipientDesc: "El mensaje se adapta al estilo cerebral y preferencias de comunicación",
    brainStyle: "Estilo Cerebral",

    channelTitle: "Canal de Comunicación",
    channelDesc: "Selecciona el canal para ver cómo Rowi adapta el mensaje",

    messageTitle: "Mensaje Optimizado",
    messageDesc: "Generado por IA adaptado al perfil emocional de Carlos",

    regenerate: "Regenerar",
    copy: "Copiar",
    copied: "Copiado",
    send: "Enviar",

    tipsTitle: "Optimizaciones aplicadas",
    tip1: "Tono entusiasta para perfil Innovador",
    tip2: "Enfoque en nuevas ideas y posibilidades",
    tip3: "Invitación a colaborar creativamente",
    tip4: "Lenguaje que valora su perspectiva única",

    tipTitle: "Esto es un demo",
    tipDesc: "En tu cuenta real, ECO analizará el perfil SEI real de tus contactos para generar mensajes verdaderamente personalizados.",

    createAccount: "Crear mi cuenta",
  },
  en: {
    badge: "Interactive Demo",
    title: "ECO",
    titleFull: "Emotional Communication Optimizer",
    subtitle: "Optimize your emotional communication with messages adapted to each person",
    back: "Back to tour",
    prev: "Previous: Affinity",
    next: "Next: Rowi Coach",

    recipientTitle: "Recipient",
    recipientDesc: "The message adapts to the brain style and communication preferences",
    brainStyle: "Brain Style",

    channelTitle: "Communication Channel",
    channelDesc: "Select the channel to see how Rowi adapts the message",

    messageTitle: "Optimized Message",
    messageDesc: "AI-generated adapted to Carlos's emotional profile",

    regenerate: "Regenerate",
    copy: "Copy",
    copied: "Copied",
    send: "Send",

    tipsTitle: "Optimizations applied",
    tip1: "Enthusiastic tone for Innovator profile",
    tip2: "Focus on new ideas and possibilities",
    tip3: "Invitation to collaborate creatively",
    tip4: "Language that values their unique perspective",

    tipTitle: "This is a demo",
    tipDesc: "In your real account, ECO will analyze the actual SEI profile of your contacts to generate truly personalized messages.",

    createAccount: "Create my account",
  },
};

/* =========================================================
   Página principal
========================================================= */
export default function DemoEcoPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const messages = DEMO_MESSAGES[lang as keyof typeof DEMO_MESSAGES] || DEMO_MESSAGES.es;
  const currentMessage = messages[selectedChannel as keyof typeof messages];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 1500);
  };

  return (
    <div className="min-h-screen pt-16 pb-24 bg-[var(--rowi-background)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent py-12 px-4">
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

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4">
            <Sparkles className="w-3 h-3" />
            {t.badge}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-1 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-emerald-500" />
            {t.title}
          </h1>
          <p className="text-lg text-emerald-600 dark:text-emerald-400 mb-2">{t.titleFull}</p>
          <p className="text-[var(--rowi-muted)] max-w-2xl">{t.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Recipient & Channels */}
          <div className="space-y-6">
            {/* Recipient Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-2">{t.recipientTitle}</h2>
              <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.recipientDesc}</p>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                <div className="relative w-14 h-14">
                  <Image
                    src={DEMO_RECIPIENT.avatar}
                    alt={DEMO_RECIPIENT.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-bold">{DEMO_RECIPIENT.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--rowi-muted)]">{t.brainStyle}:</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      {lang === "es" ? DEMO_RECIPIENT.brainStyleEs : DEMO_RECIPIENT.brainStyle}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Channel Selector */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold mb-2">{t.channelTitle}</h2>
              <p className="text-sm text-[var(--rowi-muted)] mb-4">{t.channelDesc}</p>

              <div className="grid grid-cols-2 gap-3">
                {DEMO_CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  const isSelected = selectedChannel === channel.key;

                  return (
                    <button
                      key={channel.key}
                      onClick={() => setSelectedChannel(channel.key)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-transparent bg-gray-50 dark:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isSelected ? "text-emerald-500" : "text-[var(--rowi-muted)]"
                        }`}
                      />
                      <span className={`text-sm font-medium ${isSelected ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {lang === "es" ? channel.labelEs : channel.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6"
            >
              <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3">{t.tipsTitle}</h3>
              <ul className="space-y-2">
                {[t.tip1, t.tip2, t.tip3, t.tip4].map((tip, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Right Column - Message */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{t.messageTitle}</h2>
                  <p className="text-sm text-[var(--rowi-muted)]">{t.messageDesc}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRegenerating ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-gray-50 dark:bg-zinc-800 rounded-xl p-6 mb-4 overflow-auto">
                <motion.pre
                  key={selectedChannel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre-wrap font-sans text-sm leading-relaxed"
                >
                  {currentMessage}
                </motion.pre>
              </div>

              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Send className="w-5 h-5" />
                {t.send}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Info Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 flex gap-4"
        >
          <Info className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">{t.tipTitle}</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{t.tipDesc}</p>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t border-[var(--rowi-border)]">
          <Link
            href="/demo/affinity"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.prev}
          </Link>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t.createAccount}
            </Link>
            <Link
              href="/demo/coach"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors font-medium"
            >
              {t.next}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
