"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, MessageSquare, Mail, MessageCircle, Phone,
  Sparkles, Send, RefreshCw, Copy, Check, Shield, Brain, Globe, Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   TP ECO — Emotional Communication Optimizer
========================================================= */

/* Main Page */
export default function TPEcoPage() {
  const { t } = useI18n();

  const [selectedRecipient, setSelectedRecipient] = useState("sarah");
  const [selectedChannel, setSelectedChannel] = useState("email");
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  /* --- Translated data objects --- */
  const TP_RECIPIENTS = [
    { id: "sarah", name: "Sarah Chen", role: t("tpEco.roleSarah", "Líder de Equipo — Ventas NA"), avatar: "/rowivectors/Rowi-05.webp", brainStyle: t("tpEco.brainStrategist", "Estratega"), emoji: "♟️", region: t("tpEco.regionNA", "Norteamérica") },
    { id: "marcus", name: "Marcus Rivera", role: t("tpEco.roleMarcus", "Éxito del Cliente — LATAM"), avatar: "/rowivectors/Rowi-04.webp", brainStyle: t("tpEco.brainDeliverer", "Ejecutor"), emoji: "📦", region: t("tpEco.regionLATAM", "Latinoamérica") },
    { id: "aiko", name: "Aiko Tanaka", role: t("tpEco.roleAiko", "Operaciones — APAC"), avatar: "/rowivectors/Rowi-03.webp", brainStyle: t("tpEco.brainScientist", "Científico"), emoji: "🔬", region: t("tpEco.regionAPAC", "Asia Pacífico") },
    { id: "emma", name: "Emma Schmidt", role: t("tpEco.roleEmma", "Directora de RRHH — EMEA"), avatar: "/rowivectors/Rowi-02.webp", brainStyle: t("tpEco.brainVisionary", "Visionario"), emoji: "🔮", region: t("tpEco.regionEMEA", "EMEA") },
  ];

  const CHANNELS = [
    { key: "email", icon: Mail, label: t("tpEco.channelEmail", "Email") },
    { key: "whatsapp", icon: MessageCircle, label: t("tpEco.channelWhatsApp", "WhatsApp") },
    { key: "sms", icon: Phone, label: t("tpEco.channelSMS", "SMS") },
    { key: "chat", icon: MessageSquare, label: t("tpEco.channelTeams", "Teams") },
  ];

  const MESSAGES: Record<string, Record<string, string>> = {
    sarah: {
      email: t("tpEco.msgSarahEmail", `Hola Sarah,

Espero que estés teniendo una semana productiva. He estado analizando los datos de rendimiento de ventas del Q4 junto con nuestros benchmarks de IE, y encontré algunos patrones fascinantes que me encantaría compartir contigo.

Los mejores desempeños de tu equipo obtienen consistentemente puntajes altos en Pensamiento Consecuente — lo cual se alinea perfectamente con tu perfil de Estratega. Creo que podríamos construir un programa de coaching dirigido en torno a esto.

¿Te gustaría agendar una llamada de 30 minutos esta semana para explorar la estrategia? Creo que tu perspectiva sobre escalar esto en NA sería invaluable.

Saludos cordiales`),
      whatsapp: t("tpEco.msgSarahWhatsApp", `Hola Sarah! 👋

Encontré algunos patrones geniales en los datos del Q4 + benchmarks de IE que podrían ayudar a escalar el rendimiento de tu equipo 📊

Los mejores desempeños de tu equipo se alinean con el perfil Estratega. ¿Quieres hacer una llamada rápida para discutir una estrategia de coaching? ♟️`),
      sms: t("tpEco.msgSarahSMS", `Hola Sarah! Encontré patrones interesantes Q4+IE para tu equipo. Los mejores desempeños coinciden con el perfil Estratega. ¿Llamada rápida esta semana?`),
      chat: t("tpEco.msgSarahChat", `Hola Sarah! Tengo algunos insights emocionantes de datos que vinculan el rendimiento de ventas de tu equipo con sus perfiles de IE. ¡Tus Estrategas están superando las expectativas! ¿Tienes 15 min para discutir una estrategia de coaching? ♟️📈`),
    },
    marcus: {
      email: t("tpEco.msgMarcusEmail", `Hola Marcus,

Quería contactarte sobre las métricas de éxito del cliente que hemos estado rastreando en LATAM. Los resultados son impresionantes — la entrega consistente de tu equipo se alinea perfectamente con el perfil cerebral Ejecutor que predomina en tu región.

Me encantaría colaborar en la creación de una guía de mejores prácticas que podamos compartir entre regiones. Tu experiencia práctica con la implementación sería clave.

¿Cuándo sería un buen momento para conectar?

Saludos`),
      whatsapp: t("tpEco.msgMarcusWhatsApp", `Hola Marcus! 👋

¡Las métricas de CS de tu equipo LATAM se ven geniales! 📦 El perfil Ejecutor realmente se refleja en los resultados.

¿Quieres colaborar en una guía de mejores prácticas? Tu experiencia en implementación sería perfecta para esto 🚀`),
      sms: t("tpEco.msgMarcusSMS", `Hola Marcus! Las métricas de CS en LATAM son excelentes - se nota el perfil Ejecutor. ¿Colaboramos en una guía de mejores prácticas?`),
      chat: t("tpEco.msgMarcusChat", `Hola Marcus! Tus números en LATAM son sólidos 💪 Veo el perfil Ejecutor reflejándose claramente en la ejecución. ¿Quieres asociarte en un documento de mejores prácticas inter-regional? Tus insights de implementación serían oro 📦`),
    },
    aiko: {
      email: t("tpEco.msgAikoEmail", `Estimada Aiko,

He estado revisando los datos de eficiencia operativa en APAC, y apreciaría tu perspectiva analítica sobre algunos hallazgos.

Los datos muestran una fuerte correlación entre los perfiles cerebrales Científico y la excelencia en QA en tu región. He preparado un análisis detallado con notas metodológicas que creo serían de tu interés.

¿Podríamos programar una reunión para revisar los datos juntos? Valoraría mucho tu enfoque científico para validar estos patrones.

Saludos cordiales`),
      whatsapp: t("tpEco.msgAikoWhatsApp", `Hola Aiko! 🔬

Tengo datos operativos detallados de APAC que muestran correlaciones interesantes entre QA + perfiles cerebrales. Preparé un análisis con notas metodológicas.

¿Te gustaría revisar los datos juntos? Tu perspectiva analítica sería de gran ayuda 📊`),
      sms: t("tpEco.msgAikoSMS", `Hola Aiko! Tengo datos de correlación QA + perfil cerebral en APAC para revisar. Valoraría tu aporte analítico. ¿Reunión esta semana?`),
      chat: t("tpEco.msgAikoChat", `Hola Aiko! He preparado un análisis de datos sobre el rendimiento de QA en APAC correlacionado con perfiles cerebrales Científico. La metodología está documentada. ¿Te gustaría revisarlo juntos? 🔬📋`),
    },
    emma: {
      email: t("tpEco.msgEmmaEmail", `Hola Emma,

He estado pensando en cómo podríamos aprovechar nuestros datos de IE para transformar la estrategia de desarrollo de talento de TP en EMEA. Dada tu visión de liderazgo centrado en las personas, creo que te emocionará lo que revelan los datos.

Los datos de la evaluación muestran que los empleados que mejoran sus puntajes de IE en solo un 10% ven mejoras medibles tanto en rendimiento como en métricas de bienestar. Imagina lo que un programa dirigido podría lograr en EMEA.

Me encantaría hacer una lluvia de ideas juntos sobre una hoja de ruta que podría establecer un nuevo estándar para el desarrollo de talento en la industria.

Un abrazo`),
      whatsapp: t("tpEco.msgEmmaWhatsApp", `Hola Emma! 🔮

Tengo una visión emocionante para compartir — nuestros datos de IE podrían transformar el desarrollo de talento en EMEA. ¡Un 10% de mejora en IE = mejoras medibles en rendimiento + bienestar!

¿Quieres hacer lluvia de ideas sobre una hoja de ruta juntas? Creo que esto podría ser líder en la industria ✨`),
      sms: t("tpEco.msgEmmaSMS", `Hola Emma! Los datos de IE muestran que 10% de mejora = ganancia en rendimiento + bienestar. ¿Quieres idear un programa transformador de talento para EMEA?`),
      chat: t("tpEco.msgEmmaChat", `Hola Emma! 🔮 He estado pensando en grande — ¿qué tal si usamos nuestros insights de IE para construir un programa de desarrollo de talento de primer nivel para EMEA? Los datos muestran un potencial increíble. ¿Lista para soñar en grande juntas? ✨`),
    },
  };

  const OPTIMIZATION_TIPS: Record<string, string[]> = {
    sarah: [
      t("tpEco.tipSarah1", "Lenguaje enfocado en estrategia para el perfil Estratega"),
      t("tpEco.tipSarah2", "Enfoque basado en datos con resultados claros"),
      t("tpEco.tipSarah3", "Invitación a co-crear soluciones"),
      t("tpEco.tipSarah4", "Respeta su perspectiva de liderazgo"),
    ],
    marcus: [
      t("tpEco.tipMarcus1", "Orientado a la acción para el perfil Ejecutor"),
      t("tpEco.tipMarcus2", "Reconoce su experiencia práctica"),
      t("tpEco.tipMarcus3", "Enfoque en implementación práctica"),
      t("tpEco.tipMarcus4", "Tono colaborativo y cálido"),
    ],
    aiko: [
      t("tpEco.tipAiko1", "Enfoque analítico para el perfil Científico"),
      t("tpEco.tipAiko2", "Metodología y enfoque centrado en datos"),
      t("tpEco.tipAiko3", "Respeto por el pensamiento sistemático"),
      t("tpEco.tipAiko4", "Tono formal pero colegial"),
    ],
    emma: [
      t("tpEco.tipEmma1", "Lenguaje visionario para pensador global"),
      t("tpEco.tipEmma2", "Enfoque aspiracional e inspirador"),
      t("tpEco.tipEmma3", "Enfoque en impacto y transformación"),
      t("tpEco.tipEmma4", "Comunicación orientada por valores"),
    ],
  };

  const recipient = TP_RECIPIENTS.find((r) => r.id === selectedRecipient)!;
  const currentMessage = MESSAGES[selectedRecipient]?.[selectedChannel] || "";
  const tips = OPTIMIZATION_TIPS[selectedRecipient] || [];

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/hub/admin/tp" className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-purple-500 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("tpEco.backToHub", "TP Hub")}
        </Link>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-500 mb-3">
          <Sparkles className="w-3 h-3" /> {t("tpEco.badgeEco", "ECO")}
        </span>
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-emerald-500" /> {t("tpEco.title", "ECO — Comunicación TP")}
        </h1>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">{t("tpEco.subtitle", "Optimizador de Comunicación Emocional")}</p>
        <p className="text-[var(--rowi-muted)]">{t("tpEco.description", "Mensajería adaptada por IA para la fuerza laboral global de TP — consciente del estilo cerebral, culturalmente sensible")}</p>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Recipient Selector */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /> {t("tpEco.recipientTitle", "Destinatario")}</h2>
            <div className="space-y-2">
              {TP_RECIPIENTS.map((r) => (
                <button key={r.id} onClick={() => setSelectedRecipient(r.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${selectedRecipient === r.id ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500" : "border-2 border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800"}`}>
                  <div className="relative w-10 h-10 shrink-0"><Image src={r.avatar} alt={r.name} fill className="object-contain" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{r.name}</div>
                    <div className="text-[10px] text-[var(--rowi-muted)] truncate">{r.role}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 shrink-0">{r.emoji}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Channel Selector */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold mb-4">{t("tpEco.channelTitle", "Canal")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {CHANNELS.map((channel) => {
                const Icon = channel.icon;
                const isSelected = selectedChannel === channel.key;
                return (
                  <button key={channel.key} onClick={() => setSelectedChannel(channel.key)}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-transparent bg-gray-50 dark:bg-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700"}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-500" : "text-[var(--rowi-muted)]"}`} />
                    <span className={`text-xs font-medium ${isSelected ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{channel.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Brain Style Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> {t("tpEco.optimizationsFor", "Optimizaciones para")} {recipient.brainStyle}
            </h3>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />{tip}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Right Column — Message */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{t("tpEco.optimizedMessage", "Mensaje Optimizado")}</h2>
                <p className="text-sm text-[var(--rowi-muted)]">
                  {t("tpEco.adaptedFor", "Adaptado para el perfil")} {recipient.brainStyle} {t("tpEco.profileOf", "de")} {recipient.name} ({recipient.region})
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleRegenerate} disabled={isRegenerating} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                  <RefreshCw className={`w-5 h-5 ${isRegenerating ? "animate-spin" : ""}`} />
                </button>
                <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 dark:bg-zinc-800 rounded-xl p-6 mb-4 overflow-auto min-h-[300px]">
              <motion.pre key={`${selectedRecipient}-${selectedChannel}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {currentMessage}
              </motion.pre>
            </div>

            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Send className="w-5 h-5" /> {t("tpEco.sendVia", "Enviar vía")} {CHANNELS.find((c) => c.key === selectedChannel)?.label}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 flex gap-4">
        <Shield className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">{t("tpEco.infoCommunicationTitle", "Comunicación ECO de TP")}</h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {t("tpEco.infoCommunicationDesc", "Los mensajes se adaptan según el perfil cerebral SEI del destinatario, el contexto cultural y las preferencias de comunicación. Impulsado por Rowi AI × Six Seconds.")}
          </p>
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200 dark:border-zinc-800">
        <Link href="/hub/admin/tp/affinity" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-gray-200 dark:border-zinc-700 hover:border-emerald-500 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> {t("tpEco.navAffinity", "Afinidad")}
        </Link>
        <Link href="/hub/admin/tp/coach" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:opacity-90 transition-opacity">
          {t("tpEco.navCoach", "Coach")} <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
