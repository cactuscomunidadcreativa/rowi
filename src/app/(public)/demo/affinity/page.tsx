"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Users,
  Sparkles,
  Info,
  Brain,
  Zap,
  Target,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/* =========================================================
   Datos de ejemplo
========================================================= */
const DEMO_TEAM = [
  {
    id: "1",
    name: "Carlos Ruiz",
    role: "Product Manager",
    avatar: "/rowivectors/Rowi-05.png",
    compatibility: 92,
    brainStyle: "Innovator",
    brainStyleEs: "Innovador",
  },
  {
    id: "2",
    name: "Ana Torres",
    role: "UX Designer",
    avatar: "/rowivectors/Rowi-04.png",
    compatibility: 87,
    brainStyle: "Sentinel",
    brainStyleEs: "Centinela",
  },
  {
    id: "3",
    name: "Luis Méndez",
    role: "Developer",
    avatar: "/rowivectors/Rowi-03.png",
    compatibility: 78,
    brainStyle: "Realist",
    brainStyleEs: "Realista",
  },
  {
    id: "4",
    name: "Sofia García",
    role: "Marketing Lead",
    avatar: "/rowivectors/Rowi-02.png",
    compatibility: 85,
    brainStyle: "Visionary",
    brainStyleEs: "Visionario",
  },
];

const BRAIN_STYLES = [
  { key: "innovator", name: "Innovator", nameEs: "Innovador", color: "#8b5cf6", icon: Zap },
  { key: "sentinel", name: "Sentinel", nameEs: "Centinela", color: "#3b82f6", icon: Target },
  { key: "realist", name: "Realist", nameEs: "Realista", color: "#10b981", icon: Brain },
  { key: "visionary", name: "Visionary", nameEs: "Visionario", color: "#f59e0b", icon: Sparkles },
];

/* =========================================================
   Traducciones
========================================================= */
const translations = {
  es: {
    badge: "Demo Interactivo",
    title: "Affinity",
    subtitle: "Descubre tu compatibilidad emocional con tu equipo y mejora tus relaciones",
    back: "Volver al tour",
    prev: "Anterior: Dashboard",
    next: "Siguiente: ECO",

    teamTitle: "Tu Equipo",
    teamDesc: "Miembros con los que tienes mayor afinidad emocional",

    compatibility: "Compatibilidad",
    brainStyle: "Estilo Cerebral",

    stylesTitle: "Estilos Cerebrales",
    stylesDesc: "El modelo Six Seconds identifica 4 estilos cerebrales basados en tus patrones emocionales",

    insightTitle: "Insights de Afinidad",
    insightDesc: "Basado en tu perfil SEI y el de tu equipo",
    insight1: "Tu mayor afinidad es con perfiles Innovadores y Centinelas",
    insight2: "Podrías fortalecer la comunicación con perfiles Realistas",
    insight3: "Tu estilo de liderazgo es colaborativo y empático",

    tipTitle: "Esto es un demo",
    tipDesc: "En tu cuenta real, verás la compatibilidad real con los miembros de tu equipo basada en sus perfiles SEI.",

    createAccount: "Crear mi cuenta",
  },
  en: {
    badge: "Interactive Demo",
    title: "Affinity",
    subtitle: "Discover your emotional compatibility with your team and improve your relationships",
    back: "Back to tour",
    prev: "Previous: Dashboard",
    next: "Next: ECO",

    teamTitle: "Your Team",
    teamDesc: "Members with whom you have the highest emotional affinity",

    compatibility: "Compatibility",
    brainStyle: "Brain Style",

    stylesTitle: "Brain Styles",
    stylesDesc: "The Six Seconds model identifies 4 brain styles based on your emotional patterns",

    insightTitle: "Affinity Insights",
    insightDesc: "Based on your SEI profile and your team's",
    insight1: "Your highest affinity is with Innovator and Sentinel profiles",
    insight2: "You could strengthen communication with Realist profiles",
    insight3: "Your leadership style is collaborative and empathetic",

    tipTitle: "This is a demo",
    tipDesc: "In your real account, you'll see actual compatibility with your team members based on their SEI profiles.",

    createAccount: "Create my account",
  },
};

/* =========================================================
   Componentes
========================================================= */
function TeamMemberCard({ member, lang }: { member: typeof DEMO_TEAM[0]; lang: string }) {
  const t = translations[lang as keyof typeof translations] || translations.es;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <Image
            src={member.avatar}
            alt={member.name}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{member.name}</h3>
          <p className="text-sm text-[var(--rowi-muted)]">{member.role}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Compatibility */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--rowi-muted)]">{t.compatibility}</span>
            <span className="font-bold text-[var(--rowi-primary)]">{member.compatibility}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
              initial={{ width: 0 }}
              animate={{ width: `${member.compatibility}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Brain Style */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--rowi-muted)]">{t.brainStyle}</span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            {lang === "es" ? member.brainStyleEs : member.brainStyle}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function BrainStyleCard({ style, lang }: { style: typeof BRAIN_STYLES[0]; lang: string }) {
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm text-center"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: `${style.color}20` }}
      >
        <Icon className="w-6 h-6" style={{ color: style.color }} />
      </div>
      <h3 className="font-semibold">{lang === "es" ? style.nameEs : style.name}</h3>
    </motion.div>
  );
}

/* =========================================================
   Página principal
========================================================= */
export default function DemoAffinityPage() {
  const { lang } = useI18n();
  const t = translations[lang as keyof typeof translations] || translations.es;

  return (
    <div className="min-h-screen pt-16 pb-24 bg-[var(--rowi-background)]">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent py-12 px-4">
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

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-600 dark:text-pink-400 mb-4">
            <Sparkles className="w-3 h-3" />
            {t.badge}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-500" />
            {t.title}
          </h1>
          <p className="text-[var(--rowi-muted)] max-w-2xl">{t.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Team Grid */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Users className="w-6 h-6 text-pink-500" />
              {t.teamTitle}
            </h2>
            <p className="text-[var(--rowi-muted)]">{t.teamDesc}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEMO_TEAM.map((member) => (
              <TeamMemberCard key={member.id} member={member} lang={lang} />
            ))}
          </div>
        </div>

        {/* Brain Styles */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-500" />
              {t.stylesTitle}
            </h2>
            <p className="text-[var(--rowi-muted)]">{t.stylesDesc}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BRAIN_STYLES.map((style) => (
              <BrainStyleCard key={style.key} style={style} lang={lang} />
            ))}
          </div>
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl p-8"
        >
          <h2 className="text-xl font-bold mb-2">{t.insightTitle}</h2>
          <p className="text-sm text-[var(--rowi-muted)] mb-6">{t.insightDesc}</p>
          <div className="space-y-3">
            {[t.insight1, t.insight2, t.insight3].map((insight, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/50 dark:bg-zinc-900/50 rounded-xl p-4"
              >
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500 font-bold text-sm">
                  {i + 1}
                </div>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl p-6 flex gap-4"
        >
          <Info className="w-6 h-6 text-pink-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-pink-900 dark:text-pink-100 mb-1">{t.tipTitle}</h3>
            <p className="text-sm text-pink-700 dark:text-pink-300">{t.tipDesc}</p>
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-8 border-t border-[var(--rowi-border)]">
          <Link
            href="/demo/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[var(--rowi-border)] hover:border-[var(--rowi-primary)] transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.prev}
          </Link>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              {t.createAccount}
            </Link>
            <Link
              href="/demo/eco"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-colors font-medium"
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
